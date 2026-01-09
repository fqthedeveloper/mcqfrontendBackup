import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authGet } from "../../../services/api";
import "../../../styles/CSS/Result.css";

export default function AdminResultList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authGet("/mcq/results/")
      .then((data) => {
        setResults(data.results || data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="result-loading">Loading results…</div>;
  }

  return (
    <div className="result-container">
      <h1 className="page-title">All Exam Results</h1>

      <table className="result-table">
        <thead>
          <tr>
            <th>Exam</th>
            <th>Student</th>
            <th>Email</th>
            <th>Score</th>
            <th>%</th>
            <th>Right</th>
            <th>Wrong</th>
            <th>Status</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
          {results.map((r) => {
            const percent = r.total_marks
              ? Math.round((r.score / r.total_marks) * 100)
              : 0;

            return (
              <tr key={r.session_id}>
                <td>{r.exam_title}</td>
                <td>{r.student_name}</td>
                <td>{r.student_email}</td>
                <td>{r.score}/{r.total_marks}</td>
                <td>{percent}%</td>
                <td>{r.right_answers}</td>
                <td>{r.wrong_answers}</td>
                <td>
                  <span
                    className={`status-badge ${
                      r.pass_fail === "Pass" ? "correct" : "incorrect"
                    }`}
                  >
                    {r.pass_fail}
                  </span>
                </td>
                <td>
                  <Link
                    className="view-link"
                    to={`/admin/results/${r.session_id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
