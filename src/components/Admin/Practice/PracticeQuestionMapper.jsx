import React, { use, useEffect, useState } from "react";
import mcqService from "../../../services/mcqService";
import practiceAdminService from "../../../services/practiceAdminService";
import Swal from "sweetalert2";
import "./PracticeQuestionMapper.css";

export default function PracticeQuestionMapper() {
  const [subjects, setSubjects] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("easy");

  const [stats, setStats] = useState({ easy: 0, medium: 0, hard: 0 });
  const [selected, setSelected] = useState([]);

  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 100;



  useEffect(() => {
    mcqService.getSubjects().then((res) => {
      setSubjects(Array.isArray(res) ? res : res.results || []);
    });
  }, []);

  const loadStats = async (sid) => {
    const res = await practiceAdminService.getStats(sid);
    setStats(res);
  };

  const loadQuestions = async (sid, p = 1) => {
    setSubjectId(sid);
    setPage(p);
    setSelected([]);

    if (!sid) return;

    await loadStats(sid);

    const res = await mcqService.getQuestions(
      `?subject=${sid}&page=${p}`
    );

    setQuestions(res.results || []);
    setCount(res.count || 0);
  };

  const toggleQuestion = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const mapQuestions = async () => {
    if (!subjectId || selected.length === 0) {
      Swal.fire("Warning", "Select subject and questions", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Confirm Mapping",
      text: `Map ${selected.length} questions to ${difficulty.toUpperCase()}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await practiceAdminService.mapQuestions(
        subjectId,
        difficulty,
        selected
      );

      Swal.fire(
        "Success",
        `${res.mapped} mapped, ${res.skipped} skipped`,
        "success"
      );

      setSelected([]);
      loadQuestions(subjectId, page);
    } catch {
      Swal.fire("Error", "Mapping failed", "error");
    }
  };

  useEffect(() => {
    document.title = "Practice Question Mapper - Admin";
  }, []);

  const totalPages = Math.ceil(count / pageSize);

  
  return (
    <div className="practice-admin-page">
      <h1 className="page-title">Practice Question Mapping</h1>

      <div className="stats-bar">
        <div className="stat easy">Easy Applied: {stats.easy}</div>
        <div className="stat medium">Medium Applied: {stats.medium}</div>
        <div className="stat hard">Hard Applied: {stats.hard}</div>
      </div>

      <div className="control-bar">
        <select onChange={(e) => loadQuestions(e.target.value, 1)}>
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <button onClick={mapQuestions}>Map ({selected.length})</button>
      </div>

      <div className="question-list">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`question-row ${selected.includes(q.id) ? "selected" : ""}`}
            onClick={() => toggleQuestion(q.id)}
          >
            <input
              type="checkbox"
              checked={selected.includes(q.id)}
              onChange={() => toggleQuestion(q.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <p className="question-text">{q.text}</p>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={n === page ? "active" : ""}
              onClick={() => loadQuestions(subjectId, n)}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
