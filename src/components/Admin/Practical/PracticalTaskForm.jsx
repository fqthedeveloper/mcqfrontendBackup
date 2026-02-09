import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../../services/api";
import "./practical.css";

const PracticalTaskForm = ({ selectedTask, onSuccess = () => {} }) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    snapshot_name: "",
    init_script: "",
    verify_script: "",
    total_marks: 10,
    duration_minutes: 60,
    is_published: false,
    is_active: true,
  });

  // ================= LOAD SUBJECTS =================
  useEffect(() => {
    api.get("/mcq/subjects/")
      .then((res) => setSubjects(res.results || res || []))
      .catch(() => {
        Swal.fire("Error", "Failed to load subjects", "error");
      });
  }, []);

  // ================= EDIT MODE =================
  useEffect(() => {
    if (selectedTask) {
      Swal.fire({
        icon: "info",
        title: "Edit Mode",
        text: "You are editing a practical task",
        timer: 1500,
        showConfirmButton: false,
      });

      setForm({
        title: selectedTask.title || "",
        description: selectedTask.description || "",
        subject: selectedTask.subject || "",
        snapshot_name: selectedTask.snapshot_name || "",
        init_script: selectedTask.init_script || "",
        verify_script: selectedTask.verify_script || "",
        total_marks: selectedTask.total_marks || 10,
        duration_minutes: selectedTask.duration_minutes || 60,
        is_published: selectedTask.is_published || false,
        is_active: selectedTask.is_active ?? true,
      });
    }
  }, [selectedTask]);

  // ================= HANDLE CHANGE =================
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
      if (selectedTask && selectedTask.id) {
        await api.put(`/practical/tasks/${selectedTask.id}/`, form);
        Swal.fire("Updated", "Practical task updated successfully", "success");
      } else {
        await api.post("/practical/tasks/", form);
        Swal.fire("Created", "Practical task created successfully", "success");
      }

      onSuccess();
      setForm({
        title: "",
        description: "",
        subject: "",
        snapshot_name: "",
        init_script: "",
        verify_script: "",
        total_marks: 10,
        duration_minutes: 60,
        is_published: false,
        is_active: true,
      });
    } catch {
      Swal.fire("Error", "Failed to save practical task", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = selectedTask
      ? "Edit Practical Task - Admin"
      : "Add Practical Task - Admin";
  }, [selectedTask]);

  return (
    <div className="card">
      <h3 className="card-title">
        {selectedTask ? "Edit Practical Task" : "Add Practical Task"}
      </h3>

      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          name="title"
          placeholder="Task Title"
          value={form.title}
          onChange={handleChange}
          required
        />

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
          name="description"
          placeholder="Task Description (shown to student)"
          value={form.description}
          onChange={handleChange}
          required
        />

        <input
          name="snapshot_name"
          placeholder="Vagrant Box / Base Name"
          value={form.snapshot_name}
          onChange={handleChange}
          required
        />

        <textarea
          name="init_script"
          placeholder="INIT SCRIPT (runs at VM boot)"
          value={form.init_script}
          onChange={handleChange}
          rows={8}
          required
        />

        <textarea
          name="verify_script"
          placeholder="VERIFY SCRIPT (must echo SCORE=number)"
          value={form.verify_script}
          onChange={handleChange}
          rows={8}
          required
        />

        <input
          type="number"
          name="total_marks"
          value={form.total_marks}
          onChange={handleChange}
          min="1"
        />

        <input
          type="number"
          name="duration_minutes"
          value={form.duration_minutes}
          onChange={handleChange}
          min="1"
        />

        <div className="checkbox-row">
          <label>
            <input
              type="checkbox"
              name="is_published"
              checked={form.is_published}
              onChange={handleChange}
            />
            Published
          </label>

          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? "Saving..." : selectedTask ? "Update Task" : "Create Task"}
        </button>
      </form>
    </div>
  );
};

export default PracticalTaskForm;
