import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mcqService } from "../../../services/mcqService";
import "../../../styles/CSS/AdminStudentList.css";

export default function SubjectList() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await mcqService.getSubjects();
      setSubjects(data);
    } catch (err) {
      setError("Failed to fetch subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject? This action cannot be undone.")) {
      return;
    }

    try {
      await mcqService.deleteSubject(id);
      setSubjects(subjects.filter((subject) => subject.id !== id));
    } catch (err) {
      setError("Failed to delete subject");
    }
  };

  const handleStatusToggle = async (subject) => {
    try {
      await mcqService.updateSubject(subject.id, {
        ...subject,
        is_active: !subject.is_active,
      });
      fetchSubjects(); // Refresh list
    } catch (err) {
      setError("Failed to update subject status");
    }
  };

  // Filter subjects
  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch = subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subject.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterActive === "active") return matchesSearch && subject.is_active;
    if (filterActive === "inactive") return matchesSearch && !subject.is_active;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="subject-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Subjects Management</h1>
          <p>Create and manage subjects for exams</p>
        </div>
        <div className="header-actions">
          <Link to="/admin/add-subject" className="btn btn-primary">
            <i className="fas fa-plus"></i> Add New Subject
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterActive === "all" ? "active" : ""}`}
            onClick={() => setFilterActive("all")}
          >
            All ({subjects.length})
          </button>
          <button
            className={`filter-btn ${filterActive === "active" ? "active" : ""}`}
            onClick={() => setFilterActive("active")}
          >
            Active ({subjects.filter(s => s.is_active).length})
          </button>
          <button
            className={`filter-btn ${filterActive === "inactive" ? "active" : ""}`}
            onClick={() => setFilterActive("inactive")}
          >
            Inactive ({subjects.filter(s => !s.is_active).length})
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Subjects Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject Name</th>
              <th>Description</th>
              <th>Questions</th>
              <th>Exams</th>
              <th>Students</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.length === 0 ? (
              <tr>
                <td colSpan="9" className="empty-state">
                  <i className="fas fa-book-open"></i>
                  <p>No subjects found</p>
                </td>
              </tr>
            ) : (
              filteredSubjects.map((subject) => (
                <tr key={subject.id}>
                  <td className="subject-id">#{subject.id}</td>
                  <td className="subject-name">
                    <div className="name-cell">
                      <div className="subject-icon">
                        <i className="fas fa-book"></i>
                      </div>
                      <div>
                        <strong>{subject.name}</strong>
                        <small>Created by: {subject.created_by_name}</small>
                      </div>
                    </div>
                  </td>
                  <td className="subject-desc">
                    {subject.description || <span className="text-muted">No description</span>}
                  </td>
                  <td className="text-center">
                    <span className="badge badge-info">{subject.question_count}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-warning">{subject.exam_count}</span>
                  </td>
                  <td className="text-center">
                    <span className="badge badge-success">{subject.student_count}</span>
                  </td>
                  <td>
                    <div className="status-cell">
                      <span className={`status-badge ${subject.is_active ? "active" : "inactive"}`}>
                        {subject.is_active ? "Active" : "Inactive"}
                      </span>
                      <button
                        className="status-toggle"
                        onClick={() => handleStatusToggle(subject)}
                        title={subject.is_active ? "Deactivate" : "Activate"}
                      >
                        <i className={`fas fa-toggle-${subject.is_active ? "on" : "off"}`}></i>
                      </button>
                    </div>
                  </td>
                  <td className="text-muted">
                    {new Date(subject.created_at).toLocaleDateString()}
                  </td>
                  <td className="actions-cell">
                    <div className="action-buttons">
                      <Link
                        to={`/admin/edit-subject/${subject.id}`}
                        className="btn-action btn-edit"
                        title="Edit"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                      <Link
                        to={`/admin/subjects/${subject.id}/students`}
                        className="btn-action btn-users"
                        title="Enrolled Students"
                      >
                        <i className="fas fa-users"></i>
                      </Link>
                      <Link
                        to={`/admin/subjects/${subject.id}/exams`}
                        className="btn-action btn-exam"
                        title="Exams"
                      >
                        <i className="fas fa-file-alt"></i>
                      </Link>
                      <button
                        onClick={() => handleDelete(subject.id)}
                        className="btn-action btn-delete"
                        title="Delete"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-item">
          <h3>{subjects.length}</h3>
          <p>Total Subjects</p>
        </div>
        <div className="stat-item">
          <h3>{subjects.filter(s => s.is_active).length}</h3>
          <p>Active Subjects</p>
        </div>
        <div className="stat-item">
          <h3>
            {subjects.reduce((total, subject) => total + (subject.question_count || 0), 0)}
          </h3>
          <p>Total Questions</p>
        </div>
        <div className="stat-item">
          <h3>
            {subjects.reduce((total, subject) => total + (subject.student_count || 0), 0)}
          </h3>
          <p>Total Enrollments</p>
        </div>
      </div>
    </div>
  );
}