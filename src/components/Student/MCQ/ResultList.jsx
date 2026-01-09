import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { authGet } from "../../../services/api";
import "../../../styles/CSS/Result.css";

export default function StudentExamList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await authGet("/mcq/results/");
      setResults(data.results || data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="result-loading">Loading…</div>;

  return (
    <div className="result-container">
      <h1>My Exam History</h1>

      <table className="result-table">
        <thead>
          <tr>
            <th>Exam Title</th>
            <th>Date</th>
            <th>Score</th>
            <th>Marks Obtained</th>
            <th>Result</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => {
            const percent = r.total_marks
              ? Math.round((r.score / r.total_marks) * 100)
              : 0;

            return (
              <tr key={r.id}>
                <td>{r.exam_title}</td>
                <td>{new Date(r.date).toLocaleString()}</td>
                <td>{r.score}/{r.total_marks}</td>
                <td>{percent}%</td>
                <td>
                  <span className={`status-badge ${r.pass_fail === "Pass" ? "correct" : "incorrect"}`}>
                    {r.pass_fail}
                  </span>
                </td>
                <td>
                  <Link to={`/student/results/${r.session_id}`}>
                    View Details
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
