import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { api } from "../../../services/api";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const emptyForm = {
  title: "",
  description: "",
  subject: "",
  init_script: "",
  verify_script: "",
  total_marks: 10,
  duration_minutes: 60,
  is_published: false,
  is_active: true,
};

const PracticalTaskForm = ({ selectedTask, onSuccess }) => {

  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  // ================= LOAD SUBJECTS =================
  useEffect(() => {
    api.get("/mcq/subjects/")
      .then((res) => setSubjects(res.results || res || []))
      .catch(() => setSubjects([]));
  }, []);

  // ================= INIT QUILL (ONLY ONCE) =================
  useEffect(() => {
    if (!editorRef.current) return;

    // Prevent double toolbar
    if (!quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write task instructions...",
      });

      quillRef.current.on("text-change", () => {
        setForm((prev) => ({
          ...prev,
          description: quillRef.current.root.innerHTML,
        }));
      });
    }

  }, []);

  // ================= HANDLE EDIT =================
  useEffect(() => {

    if (selectedTask) {

      const normalized = {
        ...emptyForm,
        ...selectedTask,
        subject:
          typeof selectedTask.subject === "object"
            ? selectedTask.subject.id
            : selectedTask.subject,
      };

      setForm(normalized);

      if (quillRef.current) {
        quillRef.current.root.innerHTML =
          selectedTask.description || "";
      }

    } else {

      setForm(emptyForm);

      if (quillRef.current) {
        quillRef.current.root.innerHTML = "";
      }
    }

  }, [selectedTask]);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {

      if (selectedTask?.id) {
        // UPDATE
        await api.patch(`/practical/tasks/${selectedTask.id}/`, form);
        Swal.fire("Updated", "Task updated successfully", "success");
      } else {
        // CREATE
        await api.post("/practical/tasks/", form);
        Swal.fire("Created", "Task created successfully", "success");

        setForm(emptyForm);
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
      }

      if (onSuccess) onSuccess();

    } catch (err) {
      Swal.fire("Error", "Failed to save task", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = selectedTask ? "Edit Practical Task" : "Add Practical Task";
  }, [selectedTask]);

  return (
    <div style={mainContainer}>
      <div style={cardStyle}>

        <h2 style={headingStyle}>
          {selectedTask ? "Edit Practical Task" : "Add Practical Task"}
        </h2>

        <form onSubmit={handleSubmit}>

          {/* Title + Subject */}
          <div style={grid}>
            <div style={group}>
              <label style={label}>Task Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                style={input}
                required
              />
            </div>

            <div style={group}>
              <label style={label}>Subject</label>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                style={input}
                required
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 30 }}>
            <label style={label}>Task Description</label>
            <div ref={editorRef} style={editor} />
          </div>

          {/* Marks + Duration */}
          <div style={grid}>
            <div style={group}>
              <label style={label}>Total Marks</label>
              <input
                type="number"
                name="total_marks"
                value={form.total_marks}
                onChange={handleChange}
                style={input}
              />
            </div>

            <div style={group}>
              <label style={label}>Duration (Minutes)</label>
              <input
                type="number"
                name="duration_minutes"
                value={form.duration_minutes}
                onChange={handleChange}
                style={input}
              />
            </div>
          </div>

          {/* Scripts */}
          <div style={grid}>
            <div style={group}>
              <label style={label}>Init Script</label>
              <textarea
                name="init_script"
                value={form.init_script}
                onChange={handleChange}
                rows={8}
                style={textarea}
              />
            </div>

            <div style={group}>
              <label style={label}>Verify Script</label>
              <textarea
                name="verify_script"
                value={form.verify_script}
                onChange={handleChange}
                rows={8}
                style={textarea}
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div style={checkboxRow}>
            <label>
              <input
                type="checkbox"
                name="is_published"
                checked={form.is_published}
                onChange={handleChange}
              /> Published
            </label>

            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
              /> Active
            </label>
          </div>

          <button type="submit" style={button} disabled={loading}>
            {loading ? "Saving..." : "Save Task"}
          </button>

        </form>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const mainContainer = {
  minHeight: "100vh",
  width: "100%",
  background: "#f1f5f9",
  padding: "40px 20px 120px 20px",
  overflowY: "auto",
};

const cardStyle = {
  background: "#fff",
  maxWidth: 1000,
  margin: "0 auto",
  padding: 40,
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const headingStyle = {
  textAlign: "center",
  marginBottom: 30,
  fontSize: 24,
  fontWeight: "bold",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 24,
  marginBottom: 24,
};

const group = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const label = {
  fontWeight: 600,
  fontSize: 14,
};

const input = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
};

const textarea = {
  padding: 12,
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  fontFamily: "monospace",
};

const editor = {
  minHeight: 220,
  background: "#fff",
};

const checkboxRow = {
  display: "flex",
  gap: 30,
  marginBottom: 30,
};

const button = {
  width: "100%",
  padding: 16,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  cursor: "pointer",
};

export default PracticalTaskForm;