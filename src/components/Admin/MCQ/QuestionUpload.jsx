import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import {
  FaCloudUploadAlt,
  FaPlus,
  FaCheckCircle,
  FaFileExcel,
  FaDownload,
} from "react-icons/fa";
import { authGet, authPost, authPostFormData } from "../../../services/api";

/* ================= SAFE NORMALIZER ================= */
const normalizeArray = (data) =>
  Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];

export default function AdminQuestionManager() {
  const [subjects, setSubjects] = useState([]);
  const [mode, setMode] = useState("bulk");
  const [loading, setLoading] = useState(false);

  /* BULK */
  const [file, setFile] = useState(null);
  const [bulkSubject, setBulkSubject] = useState("");

  /* SINGLE */
  const [multi, setMulti] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_answers: [],
    correct_answer: "A",
    marks: 1,
    explanation: "",
  });

  /* ================= LOAD SUBJECTS ================= */
  useEffect(() => {
    loadSubjects();
    document.title = "Question Upload - Admin";
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await authGet("/mcq/subjects/");
      setSubjects(normalizeArray(res));
    } catch {
      Swal.fire("Error", "Failed to load subjects", "error");
    }
  };

  /* ================= HELPERS ================= */

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const toggleCorrect = (opt) => {
    setForm((p) => ({
      ...p,
      correct_answers: p.correct_answers.includes(opt)
        ? p.correct_answers.filter((x) => x !== opt)
        : [...p.correct_answers, opt],
    }));
  };

  /* ================= SINGLE SUBMIT ================= */

  const submitSingle = async (e) => {
    e.preventDefault();

    if (!form.subject || !form.text) {
      return Swal.fire("Error", "Subject & Question required", "error");
    }

    if (multi && form.correct_answers.length === 0) {
      return Swal.fire("Error", "Select correct answers", "error");
    }

    const payload = {
      subject: Number(form.subject), // ✅ FIX
      text: form.text.trim(),
      option_a: form.option_a.trim(),
      option_b: form.option_b.trim(),
      option_c: form.option_c.trim(),
      option_d: form.option_d.trim(),
      correct_answers: multi
        ? form.correct_answers
        : [form.correct_answer],
      marks: Number(form.marks),
      explanation: form.explanation,
    };

    try {
      setLoading(true);
      await authPost("/mcq/questions/", payload);
      Swal.fire("Success", "Question added", "success");

      setForm({
        subject: "",
        text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_answers: [],
        correct_answer: "A",
        marks: 1,
        explanation: "",
      });
      setMulti(false);
    } catch (err) {
      console.error(err);
      Swal.fire(
        "Error",
        err?.detail || err?.non_field_errors?.[0] || "Invalid data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  /* ================= BULK UPLOAD ================= */

  const uploadExcel = async (e) => {
    e.preventDefault();

    if (!file || !bulkSubject) {
      return Swal.fire("Error", "File & subject required", "error");
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("subject", Number(bulkSubject)); // ✅ FIX

    try {
      setLoading(true);
      await authPostFormData("/mcq/questions/upload-excel/", fd);
      Swal.fire("Success", "Questions uploaded", "success");
      setFile(null);
      setBulkSubject("");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className="qm-bg">
      <div className="qm-card">
        <h1>Question Management</h1>

        {/* MODE SWITCH */}
        <div className="qm-switch">
          <button
            className={mode === "bulk" ? "active" : ""}
            onClick={() => setMode("bulk")}
          >
            <FaFileExcel /> Bulk Upload
          </button>
          <button
            className={mode === "single" ? "active" : ""}
            onClick={() => setMode("single")}
          >
            <FaPlus /> Add Single
          </button>
        </div>

        {/* ================= BULK ================= */}
        {mode === "bulk" && (
          <form className="qm-box" onSubmit={uploadExcel}>
            <select
              value={bulkSubject}
              onChange={(e) => setBulkSubject(e.target.value)}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <div className="bulk-actions">
              <button disabled={loading}>
                <FaCloudUploadAlt /> Upload Excel
              </button>
              
              <a
                href="http://localhost:8000/api/mcq/questions/download-template/"
                target="_blank"
                rel="noreferrer"
                className="download"
              >
                <FaDownload /> Download Template
              </a>
            </div>
          </form>
        )}

        {/* ================= SINGLE ================= */}
        {mode === "single" && (
          <form className="qm-box" onSubmit={submitSingle}>
            <select
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
            >
              <option value="">Select Subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <textarea
              name="text"
              placeholder="Question text"
              value={form.text}
              onChange={handleChange}
              required
            />

            <div className="options">
              {["a", "b", "c", "d"].map((k) => (
                <input
                  key={k}
                  name={`option_${k}`}
                  placeholder={`Option ${k.toUpperCase()}`}
                  value={form[`option_${k}`]}
                  onChange={handleChange}
                  required
                />
              ))}
            </div>

            <div className="config">
              <input
                type="number"
                min="1"
                name="marks"
                value={form.marks}
                onChange={handleChange}
              />

              <label>
                <input
                  type="checkbox"
                  checked={multi}
                  onChange={() => setMulti(!multi)}
                />
                Multiple Correct
              </label>
            </div>

            {!multi ? (
              <select
                name="correct_answer"
                value={form.correct_answer}
                onChange={handleChange}
              >
                {["A", "B", "C", "D"].map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <div className="multi">
                {["A", "B", "C", "D"].map((o) => (
                  <label key={o}>
                    <input
                      type="checkbox"
                      checked={form.correct_answers.includes(o)}
                      onChange={() => toggleCorrect(o)}
                    />
                    {o}
                  </label>
                ))}
              </div>
            )}

            <textarea
              name="explanation"
              placeholder="Explanation (optional)"
              value={form.explanation}
              onChange={handleChange}
            />

            <button disabled={loading}>
              <FaCheckCircle /> Save Question
            </button>
          </form>
        )}
      </div>


      {/* ================= STYLES ================= */}
      <style>{`
        * { box-sizing: border-box; }

        .qm-bg {
          min-height: 100vh;
          background: linear-gradient(135deg,#2563eb,#7c3aed);
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .qm-card {
          width: 100%;
          max-width: 900px;
          background: #fff;
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,.2);
        }

        h1 {
          margin-bottom: 20px;
        }

        .qm-switch {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .qm-switch button {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          border: none;
          background: #e5e7eb;
          cursor: pointer;
        }

        .qm-switch .active {
          background: #2563eb;
          color: #fff;
        }

        .qm-box {
          display: grid;
          gap: 14px;
        }

        input, textarea, select {
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #ccc;
          width: 100%;
        }

        textarea {
          min-height: 90px;
        }

        .options {
          display: grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap: 10px;
        }

        .config {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .multi {
          display: flex;
          gap: 14px;
        }

        button {
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: #0d6efd;
          color: #fff;
          font-size: 15px;
          cursor: pointer;
        }
        
        .download {
          padding: 14px;
          border-radius: 12px;
          border: none;
          background: #0adb5aff;
          color: #fff;
          font-size: 15px;
          cursor: pointer;
        }

        button:disabled {
          opacity: .6;
        }

        @media(max-width:600px) {
          .config {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
