import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { api } from "../../../services/api";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const PracticalTaskForm = ({ selectedTask, onSuccess }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    init_script: "",
    verify_script: "",
    total_marks: 10,
    duration_minutes: 60,
    is_published: false,
    is_active: true,
  });

  useEffect(() => {
    api.get("/mcq/subjects/")
      .then((res) => setSubjects(res.results || res || []));
  }, []);

  useEffect(() => {
    if (!editorRef.current || quillRef.current) return;

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
  }, []);

  useEffect(() => {
    if (!selectedTask) return;
    setForm(selectedTask);
    if (quillRef.current) {
      quillRef.current.root.innerHTML =
        selectedTask.description || "";
    }
  }, [selectedTask]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedTask?.id) {
        await api.put(`/practical/tasks/${selectedTask.id}/`, form);
        Swal.fire("Updated", "Task updated successfully", "success");
      } else {
        await api.post("/practical/tasks/", form);
        Swal.fire("Created", "Task created successfully", "success");
      }
      onSuccess();
    } catch {
      Swal.fire("Error", "Failed to save task", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* This outer div ensures the dashboard area allows scrolling */
    <div style={scrollContainer}>
      <div style={wrapperStyle}>
        <div style={cardStyle}>
          <h2 style={headingStyle}>
            {selectedTask ? "Edit Practical Task" : "Add Practical Task"}
          </h2>

          <form onSubmit={handleSubmit} style={formStyle}>
            {/* Title and Subject */}
            <div style={gridResponsive}>
              <div style={inputGroup}>
                <label style={labelStyle}>Task Title</label>
                <input
                  name="title"
                  placeholder="Enter title..."
                  value={form.title}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Editor */}
            <div style={{ marginBottom: 25 }}>
              <label style={labelStyle}>Task Description</label>
              <div ref={editorRef} style={editorStyle} />
            </div>

            {/* Marks and Duration */}
            <div style={gridResponsive}>
              <div style={inputGroup}>
                <label style={labelStyle}>Total Marks</label>
                <input
                  type="number"
                  name="total_marks"
                  value={form.total_marks}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Duration (Minutes)</label>
                <input
                  type="number"
                  name="duration_minutes"
                  value={form.duration_minutes}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Scripts Row */}
            <div style={gridResponsive}>
              <div style={inputGroup}>
                <label style={labelStyle}>Init Script (Setup)</label>
                <textarea
                  name="init_script"
                  placeholder="Bash script to setup the environment..."
                  value={form.init_script}
                  onChange={handleChange}
                  style={textareaStyle}
                  rows={6}
                />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>Verify Script (Grading)</label>
                <textarea
                  name="verify_script"
                  placeholder="Bash script to check the solution..."
                  value={form.verify_script}
                  onChange={handleChange}
                  style={textareaStyle}
                  rows={6}
                />
              </div>
            </div>

            {/* Status Checkboxes */}
            <div style={checkboxContainer}>
              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_published"
                  checked={form.is_published}
                  onChange={handleChange}
                />
                Published
              </label>

              <label style={checkboxLabel}>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                />
                Active
              </label>
            </div>

            {/* Submit Button - Now visible at bottom */}
            <div style={buttonWrapper}>
              <button type="submit" style={submitStyle} disabled={loading}>
                {loading ? "Saving..." : "Save Task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ================= UPDATED CSS TO FIX SCROLLING ================= */

const scrollContainer = {
  width: "100%",
  height: "100%",      // Take full height of parent
  overflowY: "auto",   // IMPORTANT: Force this container to scroll
  display: "block",
};

const wrapperStyle = {
  width: "100%",
  minHeight: "100%",
  padding: "40px 20px 100px 20px", // Large bottom padding for extra space
  background: "#f1f5f9",
  boxSizing: "border-box",
};

const cardStyle = {
  background: "#ffffff",
  padding: "40px",
  borderRadius: 16,
  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
  maxWidth: 1000,
  margin: "0 auto",
  width: "100%",
  boxSizing: "border-box",
};

const headingStyle = {
  marginBottom: 30,
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center",
  color: "#1e293b",
};

const formStyle = {
  width: "100%",
};

const gridResponsive = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: 24,
  marginBottom: 24,
};

const inputGroup = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const labelStyle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#475569",
};

const inputStyle = {
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  width: "100%",
  fontSize: "15px",
  boxSizing: "border-box",
};

const textareaStyle = {
  padding: "12px",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  resize: "vertical",
  width: "100%",
  fontSize: "14px",
  fontFamily: "monospace",
  boxSizing: "border-box",
};

const editorStyle = {
  background: "white",
  borderRadius: "0 0 8px 8px",
  minHeight: "200px",
  width: "100%",
};

const checkboxContainer = {
  display: "flex",
  gap: 30,
  marginTop: 10,
  padding: "10px 0",
};

const checkboxLabel = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: "15px",
  cursor: "pointer",
  color: "#334155",
};

const buttonWrapper = {
  marginTop: 30,
  borderTop: "1px solid #e2e8f0",
  paddingTop: 30,
};

const submitStyle = {
  padding: "16px",
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  width: "100%",
  fontSize: "16px",
  fontWeight: "600",
};

export default PracticalTaskForm;