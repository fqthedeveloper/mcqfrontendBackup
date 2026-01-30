import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPut, authPost } from "../../../services/api";

/* ================= HELPERS ================= */
const normalize = (r) =>
  Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [];

/* ================= COMPONENT ================= */
export default function EditExamForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [exam, setExam] = useState({
    title: "",
    subject: "",
    duration: 60,
    mode: "practice",
  });

  /* ================= INITIAL LOAD ================= */

  const loadInitial = useCallback(async () => {
    try {
      const [subRes, examRes] = await Promise.all([
        authGet("/mcq/subjects/"),
        authGet(`/mcq/exams/${id}/`),
      ]);

      setSubjects(normalize(subRes));

      setExam({
        title: examRes.title,
        subject: examRes.subject,
        duration: examRes.duration,
        mode: examRes.mode,
      });

      const questionRes = await authGet(
        `/mcq/questions/?subject=${examRes.subject}`,
      );

      const all = normalize(questionRes);

      const selectedQs = all.filter((q) => examRes.questions.includes(q.id));
      const availableQs = all.filter((q) => !examRes.questions.includes(q.id));

      setSelected(selectedQs);
      setAvailable(availableQs);
    } catch {
      Swal.fire("Error", "Failed to load exam data", "error");
    } finally {
      setLoading(false);
    }
  }, [id]); // ✅ dependency added

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    document.title = "Edit Exam - Admin";
  }, []);

  /* ================= SUBJECT CHANGE ================= */
  const handleSubjectChange = async (subjectId) => {
    setExam((p) => ({ ...p, subject: subjectId }));
    setSelected([]);

    const res = await authGet(`/mcq/questions/?subject=${subjectId}`);
    setAvailable(normalize(res));
  };

  /* ================= SELECT / REMOVE ================= */
  const addQuestion = (q) => {
    if (selected.length >= 100)
      return Swal.fire("Limit", "Max 100 questions allowed", "warning");

    setSelected((p) => [...p, q]);
    setAvailable((p) => p.filter((x) => x.id !== q.id));
  };

  const removeQuestion = (q) => {
    setAvailable((p) => [...p, q]);
    setSelected((p) => p.filter((x) => x.id !== q.id));
  };

  /* ================= SAVE ================= */
  const submit = async (publish) => {
    if (!exam.title || !exam.subject)
      return Swal.fire("Error", "Title & Subject required", "error");

    if (!selected.length)
      return Swal.fire("Error", "Select at least one question", "error");

    await authPut(`/mcq/exams/${id}/`, {
      title: exam.title,
      subject: exam.subject,
      duration: exam.duration,
      mode: exam.mode,
      questions: selected.map((q) => q.id),
    });

    if (publish) {
      await authPost(`/mcq/exams/${id}/publish/`);
    }

    Swal.fire("Success", "Exam updated successfully", "success");
    navigate("/admin/exam-list");
  };

  /* ================= FILTER ================= */
  const filteredAvailable = available.filter((q) =>
    q.text.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="page-center">Loading exam…</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="exam-wrapper">
      <div className="exam-card">
        <h2>Edit Exam</h2>

        {/* FORM */}
        <div className="form-grid">
          <input
            placeholder="Exam Title"
            value={exam.title}
            onChange={(e) => setExam({ ...exam, title: e.target.value })}
          />

          <select
            value={exam.subject}
            onChange={(e) => handleSubjectChange(Number(e.target.value))}
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
            onChange={(e) =>
              setExam({ ...exam, duration: Number(e.target.value) })
            }
          />

          <select
            value={exam.mode}
            onChange={(e) => setExam({ ...exam, mode: e.target.value })}
          >
            <option value="practice">Practice</option>
            <option value="strict">Strict</option>
          </select>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <input
            placeholder="Search available questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="counter">{selected.length} / 100 selected</span>
        </div>

        {/* TWO COLUMNS */}
        <div className="columns">
          {/* AVAILABLE */}
          <div className="column">
            <h4>Available Questions</h4>

            {filteredAvailable.map((q) => (
              <div
                key={q.id}
                className="question-card"
                onClick={() => addQuestion(q)}
              >
                <div className="q-text">{q.text}</div>
                <div className="q-meta">
                  <span>{q.subject_name || "Unknown"}</span>
                  <span>Marks: {q.marks}</span>
                </div>
              </div>
            ))}

            {filteredAvailable.length === 0 && (
              <p className="empty">No questions available</p>
            )}
          </div>

          {/* SELECTED */}
          <div className="column selected">
            <h4>Selected Questions</h4>

            {selected.map((q) => (
              <div key={q.id} className="question-card selected-card">
                <div className="q-text">{q.text}</div>
                <div className="q-meta">
                  <span>{q.subject_name || "Unknown"}</span>
                  <button
                    className="remove-btn"
                    onClick={() => removeQuestion(q)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {!selected.length && <p className="empty">No questions selected</p>}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="actions">
          <button onClick={() => submit(false)}>Save</button>
          <button className="publish" onClick={() => submit(true)}>
            Publish
          </button>
        </div>
      </div>

      <style>{css}</style>
    </div>
  );
}

/* ================= CSS ================= */
const css = `
* { box-sizing: border-box; }

.exam-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg,#2563eb,#7c3aed);
  padding: 20px;
  display: flex;
  justify-content: center;
}

.exam-card {
  width: 100%;
  max-width: 1400px;
  background: #fff;
  border-radius: 20px;
  padding: 28px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
  gap: 14px;
}

input, select {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
}

.toolbar {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.counter {
  font-weight: 600;
  color: #2563eb;
}

.columns {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}

.column {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  max-height: 520px;
  overflow-y: auto;
}

.column.selected {
  background: #f8fafc;
}

.question-card {
  background: #f9fafb;
  border-radius: 14px;
  padding: 12px;
  margin-bottom: 10px;
  cursor: pointer;
}

.selected-card {
  background: #e0e7ff;
}

.q-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #555;
}

.remove-btn {
  background: #2563eb;
  border: none;
  color: #fff;
  border-radius: 50%;
  align-items: center;
  display: flex;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.actions {
  margin-top: 24px;
  display: flex;
  gap: 14px;
}

button {
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-size: 15px;
}

.publish {
  background: #16a34a;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #777;
}

@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
`;
