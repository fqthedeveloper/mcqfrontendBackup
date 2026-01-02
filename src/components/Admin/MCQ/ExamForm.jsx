import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { mcqService } from "../../../services/mcqService";
import Swal from "sweetalert2";

export default function ExamForm({ isEdit = false }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState({
    title: "",
    subject: "",
    duration: 60,
    mode: "practice",
    is_published: false,
    selected_questions: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const subjectsData = await mcqService.getSubjects();
    const questionsData = await mcqService.getQuestions();
    setSubjects(subjectsData);
    setQuestions(questionsData);

    if (isEdit && id) {
      const e = await mcqService.getExam(id);
      setExam({
        title: e.title,
        subject: e.subject,
        duration: e.duration,
        mode: e.mode,
        is_published: e.is_published,
        selected_questions: e.questions || [],
      });
    }
  };

  const toggleQuestion = (qid) => {
    setExam((prev) => ({
      ...prev,
      selected_questions: prev.selected_questions.includes(qid)
        ? prev.selected_questions.filter((i) => i !== qid)
        : [...prev.selected_questions, qid],
    }));
  };

  const handleSubmit = async (publish = false) => {
    if (exam.selected_questions.length === 0) {
      return Swal.fire("Error", "Select at least one question", "error");
    }

    const payload = {
      title: exam.title,
      subject: exam.subject,
      duration: exam.duration,
      mode: exam.mode,
      is_published: publish,
    };

    let res;
    if (isEdit) {
      res = await mcqService.updateExam(id, payload);
    } else {
      res = await mcqService.createExam(payload);
    }

    if (publish) {
      await mcqService.publishExam(res.id);
    }

    Swal.fire("Success", "Exam saved successfully", "success");
    navigate("/admin/exam-list");
  };

  return (
    <div className="container">
      <h2>{isEdit ? "Edit MCQ Exam" : "Create MCQ Exam"}</h2>

      <input
        placeholder="Exam Title"
        value={exam.title}
        onChange={(e) => setExam({ ...exam, title: e.target.value })}
      />

      <select
        value={exam.subject}
        onChange={(e) => setExam({ ...exam, subject: e.target.value })}
      >
        <option value="">Select Subject</option>
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={exam.duration}
        onChange={(e) => setExam({ ...exam, duration: e.target.value })}
      />

      <h4>Select Questions</h4>
      {questions.map((q) => (
        <div key={q.id}>
          <input
            type="checkbox"
            checked={exam.selected_questions.includes(q.id)}
            onChange={() => toggleQuestion(q.id)}
          />
          {q.text}
        </div>
      ))}

      <button onClick={() => handleSubmit(false)}>Save</button>
      <button onClick={() => handleSubmit(true)}>Publish</button>
    </div>
  );
}
