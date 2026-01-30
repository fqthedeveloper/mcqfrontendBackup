import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPost } from "../../../services/api";

/* ================= HELPERS ================= */
const normalize = (r) =>
  Array.isArray(r) ? r : Array.isArray(r?.results) ? r.results : [];

/* ================= COMPONENT ================= */
export default function CreateExam() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [available, setAvailable] = useState([]);
  const [selected, setSelected] = useState([]);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingQ, setLoadingQ] = useState(false);

  const [questionSubject, setQuestionSubject] = useState("");
  const [search, setSearch] = useState("");

  const [exam, setExam] = useState({
    title: "",
    subject: "",
    duration: 60,
    mode: "practice",
  });

  /* ================= LOAD SUBJECTS ================= */
  useEffect(() => {
    authGet("/mcq/subjects/").then((r) => setSubjects(normalize(r)));
  }, []);

  /* ================= LOAD QUESTIONS ================= */
  const loadQuestions = useCallback(
    async (pg, reset = false) => {
      setLoadingQ(true);

      let url = `/mcq/questions/?page=${pg}`;
      if (questionSubject) url += `&subject=${questionSubject}`;

      const res = await authGet(url);
      const data = normalize(res);

      setAvailable((p) => (reset ? data : [...p, ...data]));
      setHasMore(Boolean(res.next));
      setLoadingQ(false);
    },
    [questionSubject]
  );

  const resetQuestions = useCallback(() => {
    setAvailable([]);
    setPage(1);
    loadQuestions(1, true);
  }, [loadQuestions]);

  useEffect(() => {
    resetQuestions();
  }, [resetQuestions]);

  /* ================= FILTER ================= */
  const filteredAvailable = available.filter(
    (q) =>
      !selected.some((s) => s.id === q.id) &&
      q.text.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= SELECT ================= */
  const addQuestion = (q) => {
    if (selected.length >= 100) {
      return Swal.fire(
        "Limit Reached",
        "Maximum 100 questions allowed",
        "warning"
      );
    }
    setSelected((p) => [...p, q]);
  };

  const removeQuestion = (id) => {
    setSelected((p) => p.filter((x) => x.id !== id));
  };

  /* ================= SUBMIT ================= */
  const submit = async (publish) => {
    if (!exam.title || !exam.subject)
      return Swal.fire("Error", "Title & Subject required", "error");

    if (!selected.length)
      return Swal.fire("Error", "Select at least one question", "error");

    const res = await authPost("/mcq/exams/", {
      ...exam,
      questions: selected.map((q) => q.id),
    });

    if (publish) {
      await authPost(`/mcq/exams/${res.id}/publish/`);
    }

    Swal.fire("Success", "Exam created successfully", "success");
    navigate("/admin/exam-list");
  };

  /* ================= PAGE TITLE ================= */
  useEffect(() => {
    document.title = "Create Exam - Admin";
  }, []);

  /* optional: loading indicator now that loadingQ is used */
  if (loadingQ && page === 1) {
    return <div className="page-center">Loading questions…</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="exam-wrapper">
      <div className="exam-card">
        <h2>Create Exam</h2>

        {/* FORM */}
        <div className="form-grid">
          <input
            placeholder="Exam Title"
            value={exam.title}
            onChange={(e) => setExam({ ...exam, title: e.target.value })}
          />

          <select
            value={exam.subject}
            onChange={(e) =>
              setExam({ ...exam, subject: Number(e.target.value) })
            }
          >
            <option value="">Select Exam Subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            value={exam.duration}
            onChange={(e) =>
              setExam({ ...exam, duration: Number(e.target.value) })
            }
          />

          <select
            value={exam.mode}
            onChange={(e) =>
              setExam({ ...exam, mode: e.target.value })
            }
          >
            <option value="practice">Practice</option>
            <option value="strict">Strict</option>
          </select>
        </div>

        {/* FILTER */}
        <div className="toolbar">
          <select
            value={questionSubject}
            onChange={(e) =>
              setQuestionSubject(e.target.value ? Number(e.target.value) : "")
            }
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <span className="counter">{selected.length} / 100 selected</span>
        </div>

        {/* COLUMNS */}
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

            {hasMore && (
              <button
                className="load-more"
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  loadQuestions(next);
                }}
              >
                Load more ({page * 100 + 1} – {(page + 1) * 100})
              </button>
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
                    onClick={() => removeQuestion(q.id)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}

            {!selected.length && (
              <p className="empty">No questions selected</p>
            )}
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
  display: grid;
  grid-template-columns: 1.5fr 3fr auto;
  gap: 12px;
  align-items: center;
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
  color: #fff;
  border-radius: 50%;
  align-items: center;
  display: flex;
  justify-content: center;
  border: none;
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

@media (max-width: 900px) {
  .columns {
    grid-template-columns: 1fr;
  }
}
`;
