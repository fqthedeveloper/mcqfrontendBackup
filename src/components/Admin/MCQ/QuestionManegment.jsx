import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { authGet, authPut } from "../../../services/api";

/* ================= HELPERS ================= */

const normalizeArray = (data) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
    ? data.results
    : [];

const toApiPath = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/api/, "") + u.search;
  } catch {
    return url.replace(/^\/api/, "");
  }
};

/* ================= COMPONENT ================= */

export default function QuestionManagement() {
  /* ---------- SUBJECTS ---------- */
  const [subjects, setSubjects] = useState([]);

  /* ---------- QUESTIONS ---------- */
  const [questions, setQuestions] = useState([]);
  const [count, setCount] = useState(0);
  const [next, setNext] = useState(null);
  const [previous, setPrevious] = useState(null);

  /* ---------- FILTERS ---------- */
  const [subjectFilter, setSubjectFilter] = useState("");
  const [search, setSearch] = useState("");
  const [pageUrl, setPageUrl] = useState("/mcq/questions/");

  /* ---------- UI ---------- */
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [answerMode, setAnswerMode] = useState("single"); // single | multiple

  /* ================= LOAD SUBJECTS ================= */
  useEffect(() => {
    authGet("/mcq/subjects/")
      .then((res) => setSubjects(normalizeArray(res)))
      .catch(() =>
        Swal.fire("Error", "Failed to load subjects", "error")
      );
  }, []);

  /* ================= LOAD QUESTIONS ================= */
  useEffect(() => {
    loadQuestions(pageUrl);
    document.title = "Question Management - MCQ Admin";
  }, [pageUrl]);

  const loadQuestions = async (url) => {
    setLoading(true);
    try {
      const res = await authGet(url);
      setQuestions(normalizeArray(res));
      setCount(res?.count || 0);
      setNext(toApiPath(res?.next));
      setPrevious(toApiPath(res?.previous));
    } catch {
      Swal.fire("Error", "Failed to load questions", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBJECT MAP ================= */
  const subjectMap = {};
  subjects.forEach((s) => (subjectMap[s.id] = s.name));

  /* ================= FILTER ================= */
  const applyFilter = (sub, txt = search) => {
    let url = "/mcq/questions/?";
    if (sub) url += `subject=${sub}&`;
    if (txt) url += `search=${txt}&`;
    setPageUrl(url);
  };

  /* ================= EDIT ================= */
  const openEdit = (q) => {
    const answers = q.correct_option
      ? q.correct_option.split(",")
      : [];

    setAnswerMode(answers.length > 1 ? "multiple" : "single");

    setEditing({
      ...q,
      correct_answers: answers,
    });
  };

  const toggleCheckbox = (key) => {
    setEditing((p) => ({
      ...p,
      correct_answers: p.correct_answers.includes(key)
        ? p.correct_answers.filter((x) => x !== key)
        : [...p.correct_answers, key],
    }));
  };

  const selectRadio = (key) => {
    setEditing((p) => ({
      ...p,
      correct_answers: [key],
    }));
  };

  const saveEdit = async () => {
    if (!editing.correct_answers.length) {
      return Swal.fire(
        "Error",
        "Select at least one correct answer",
        "error"
      );
    }

    try {
      await authPut(`/mcq/questions/${editing.id}/`, {
        subject: editing.subject,
        text: editing.text,
        option_a: editing.option_a,
        option_b: editing.option_b,
        option_c: editing.option_c,
        option_d: editing.option_d,
        correct_answers: editing.correct_answers,
        marks: editing.marks,
        explanation: editing.explanation,
      });

      Swal.fire("Success", "Question updated", "success");
      setEditing(null);
      loadQuestions(pageUrl);
    } catch {
      Swal.fire("Error", "Failed to update question", "error");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="qm-page">
      <h1>Question Management</h1>

      {/* FILTER BAR */}
      <div className="qm-toolbar">
        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            applyFilter(e.target.value);
          }}
        >
          <option value="">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Search question..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            applyFilter(subjectFilter, e.target.value);
          }}
        />

        <span>
          {questions.length} / {count}
        </span>
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        <table className="qm-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Question</th>
              <th>Subject</th>
              <th>Marks</th>
              <th>Correct</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              questions.map((q) => (
                <tr key={q.id}>
                  <td>{q.id}</td>
                  <td className="q-text">{q.text}</td>
                  <td>{subjectMap[q.subject]}</td>
                  <td>{q.marks}</td>
                  <td>{q.correct_option}</td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => openEdit(q)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="pagination">
        <button
          disabled={!previous}
          onClick={() => setPageUrl(previous)}
        >
          ◀ Prev
        </button>
        <button
          disabled={!next}
          onClick={() => setPageUrl(next)}
        >
          Next ▶
        </button>
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editing && (
        <div className="modal-bg">
          <div className="modal-card">
            <h3>Edit Question</h3>

            <textarea
              value={editing.text}
              onChange={(e) =>
                setEditing({ ...editing, text: e.target.value })
              }
            />

            {/* ANSWER MODE */}
            <div className="answer-mode">
              <label>
                <input
                  type="radio"
                  checked={answerMode === "single"}
                  onChange={() => {
                    setAnswerMode("single");
                    setEditing((p) => ({
                      ...p,
                      correct_answers: p.correct_answers.slice(0, 1),
                    }));
                  }}
                />
                Single Answer
              </label>

              <label>
                <input
                  type="radio"
                  checked={answerMode === "multiple"}
                  onChange={() => setAnswerMode("multiple")}
                />
                Multiple Answers
              </label>
            </div>

            {/* OPTIONS */}
            {["A", "B", "C", "D"].map((k) => (
              <div key={k} className="option-row">
                {answerMode === "single" ? (
                  <input
                    type="radio"
                    checked={editing.correct_answers[0] === k}
                    onChange={() => selectRadio(k)}
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={editing.correct_answers.includes(k)}
                    onChange={() => toggleCheckbox(k)}
                  />
                )}
                <span>
                  {k}. {editing[`option_${k.toLowerCase()}`]}
                </span>
              </div>
            ))}

            <input
              type="number"
              value={editing.marks}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  marks: Number(e.target.value),
                })
              }
            />

            <textarea
              placeholder="Explanation"
              value={editing.explanation || ""}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  explanation: e.target.value,
                })
              }
            />

            <div className="modal-actions">
              <button onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="save" onClick={saveEdit}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CSS ================= */}
      <style>{`
        .qm-page {
          padding: 20px;
          max-width: 1300px;
          margin: auto;
        }

        .qm-toolbar {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .table-wrap {
          overflow-x: auto;
        }

        .qm-table {
          width: 100%;
          border-collapse: collapse;
        }

        .qm-table th,
        .qm-table td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }

        .q-text {
          max-width: 420px;
        }

        .btn-edit {
          background: #2563eb;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
        }

        .pagination {
          margin: 16px 0;
          display: flex;
          justify-content: center;
          gap: 12px;
        }

        .modal-bg {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.55);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-card {
          background: #fff;
          width: 100%;
          max-width: 600px;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        textarea,
        input,
        select {
          padding: 8px;
          border-radius: 8px;
          border: 1px solid #ccc;
          width: 100%;
        }

        .answer-mode {
          display: flex;
          gap: 16px;
        }

        .option-row {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }

        .modal-actions button {
          flex: 1;
          padding: 10px;
          border-radius: 8px;
          border: none;
        }

        .modal-actions .save {
          background: #16a34a;
          color: white;
        }

        @media (max-width: 600px) {
          .q-text {
            max-width: 240px;
          }
        }
      `}</style>
    </div>
  );
}
