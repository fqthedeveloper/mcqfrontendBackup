import React, { use, useEffect, useState } from "react";
import Swal from "sweetalert2";
import { api } from "../../../services/api";
import "./practical.css";

const PracticalTaskForm = ({
  selectedTask,
  onSuccess = () => {},
}) => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    subject: "",
    snapshot_name: "",
    verify_command: "",
    expected_output: "",
    total_marks: 10,
    duration_minutes: 60,
    is_published: false,
    is_active: true,
  });

  // ================= LOAD SUBJECTS =================
  useEffect(() => {
    api.get("/mcq/subjects/")
      .then((res) => setSubjects(res.results || []))
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
        verify_command: selectedTask.verify_command || "",
        expected_output: selectedTask.expected_output || "",
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

        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Practical task updated successfully",
        });
      } else {
        await api.post("/practical/tasks/", form);

        Swal.fire({
          icon: "success",
          title: "Created",
          text: "Practical task created successfully",
        });
      }

      onSuccess();

      setForm({
        title: "",
        description: "",
        subject: "",
        snapshot_name: "",
        verify_command: "",
        expected_output: "",
        total_marks: 10,
        duration_minutes: 60,
        is_published: false,
        is_active: true,
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Unable to save practical task",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = selectedTask ? "Edit Practical Task - Admin" : "Add Practical Task - Admin";
  }, [selectedTask]);

  return (
    <div className="card">
      <h3 className="card-title">
        {selectedTask ? "Edit Practical Task" : "Add Practical Task"}
      </h3>

      <form className="form-grid" onSubmit={handleSubmit}>
        <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />

        <select name="subject" value={form.subject} onChange={handleChange} required>
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required />

        <input name="snapshot_name" placeholder="Snapshot Name" value={form.snapshot_name} onChange={handleChange} required />

        <textarea name="verify_command" placeholder="Verify Command" value={form.verify_command} onChange={handleChange} required />

        <input name="expected_output" placeholder="Expected Output" value={form.expected_output} onChange={handleChange} required />

        <input type="number" name="total_marks" value={form.total_marks} onChange={handleChange} />
        <input type="number" name="duration_minutes" value={form.duration_minutes} onChange={handleChange} />

        <div className="checkbox-row">
          <label>
            <input type="checkbox" name="is_published" checked={form.is_published} onChange={handleChange} />
            Published
          </label>
          <label>
            <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
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
