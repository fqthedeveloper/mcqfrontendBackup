import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";
import "./practical.css";

const StudentPracticalList = () => {
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    practicalService
      .getStudentPracticals()
      .then(setPracticals)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading practical exams...</div>;

  return (
    <div className="practical-page">
      <h2>Practical Exams</h2>

      {practicals.length === 0 && (
        <p className="empty">No practical exams available</p>
      )}

      <div className="practical-grid">
        {practicals.map((p) => (
          <div className="practical-card" key={p.task_id}>
            <h3>{p.title}</h3>
            <p><b>Subject:</b> {p.subject}</p>
            <p><b>Duration:</b> {p.duration} mins</p>
            <p><b>Status:</b> {p.status}</p>

            {p.status === "not_started" && (
              <button
                className="btn-primary"
                onClick={async () => {
                  const res = await practicalService.startPractical(p.task_id);
                  navigate(`/student/practical/${res.session_id}`);
                }}
              >
                Start Practical
              </button>
            )}

            {p.status === "submitted" && (
              <span className="badge success">Submitted</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentPracticalList;
