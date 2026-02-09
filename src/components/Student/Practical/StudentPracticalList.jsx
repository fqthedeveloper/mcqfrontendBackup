import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";
import "./practical.css";

export default function StudentPracticalList() {
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    practicalService.getStudentPracticals()
      .then(setPracticals)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading practical exams…</div>;

  return (
    <div className="practical-page">
      <h2>Practical Exams</h2>

      <div className="practical-grid">
        {practicals.map(p => (
          <div className="practical-card" key={p.task_id}>
            <h3>{p.title}</h3>
            <p><b>Duration:</b> {p.duration} mins</p>
            <p><b>Status:</b> {p.status}</p>

            {p.status === "not_started" && (
              <button
                className="btn-primary"
                onClick={() =>
                  navigate(`/student/practical/${p.task_id}/rules`)
                }
              >
                View Rules & Start
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
}
