import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { authPost, authGet } from "../../../services/api";

export default function AddStudent() {
  useEffect(() => {
    document.title = "Add Student - Admin";
  }, []);

  const [form, setForm] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    subject_ids: [],
  });

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      const res = await authGet("/mcq/subjects/");
      setSubjects(res.results || []);
    } catch {
      Swal.fire("Error", "Unable to load subjects", "error");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubjectChange = (e) => {
    setForm({
      ...form,
      subject_ids: Array.from(e.target.selectedOptions).map((o) =>
        Number(o.value)
      ),
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authPost("/mcq/students/", form);
      Swal.fire(
        "Success",
        "Student created & credentials sent via email",
        "success"
      );
      setForm({
        email: "",
        username: "",
        first_name: "",
        last_name: "",
        subject_ids: [],
      });
    } catch (err) {
      Swal.fire("Error", err?.detail || "Failed to add student", "error");
    }
    setLoading(false);
  };

  return (
    <div className="page-bg">
      <div className="card">
        <h2>Add New Student</h2>

        <form onSubmit={submit}>
          <div className="grid">
            <input
              name="email"
              placeholder="Email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="username"
              placeholder="Username"
              required
              value={form.username}
              onChange={handleChange}
            />
            <input
              name="first_name"
              placeholder="First Name"
              required
              value={form.first_name}
              onChange={handleChange}
            />
            <input
              name="last_name"
              placeholder="Last Name"
              required
              value={form.last_name}
              onChange={handleChange}
            />
          </div>

          <label>Subjects</label>
          <select multiple value={form.subject_ids} onChange={handleSubjectChange}>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button disabled={loading}>
            {loading ? "Creating..." : "Add Student"}
          </button>
        </form>
      </div>

      {/* STYLES */}
      <style>{`
        .page-bg {
          min-height: 100vh;
          background: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
        }

        .card {
          background: #fff;
          width: 100%;
          max-width: 600px;
          padding: 24px;
          border-radius: 14px;
          box-shadow: 0 20px 40px rgba(0,0,0,.15);
        }

        h2 {
          text-align: center;
          margin-bottom: 20px;
        }

        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }

        input, select {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        select {
          height: 120px;
          margin-top: 8px;
        }

        button {
          margin-top: 16px;
          width: 100%;
          padding: 12px;
          background: #2575fc;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.7;
        }

        @media (min-width: 768px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
