import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";
import "../../../styles/CSS/Result.css";

export default function AdminResultDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    authGet(`/mcq/results/session/${sessionId}/`)
      .then(setResult);
  }, [sessionId]);

  if (!result) {
    return <div className="result-loading">Loading result…</div>;
  }

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>{result.exam_title}</h1>
        <p className="submitted-date">
          Submitted: {new Date(result.submitted_at).toLocaleString()}
        </p>
      </div>

      <div className="score-card">
        <div className="score-percentage">
          {Math.round((result.score / result.total_marks) * 100)}%
        </div>

        <div className="score-details">
          <p><strong>Score:</strong> {result.score}/{result.total_marks}</p>
          <p><strong>Student:</strong> {result.student_name}</p>
          <p><strong>Email:</strong> {result.student_email}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={`status-badge ${
                result.pass_fail === "Pass" ? "correct" : "incorrect"
              }`}
            >
              {result.pass_fail}
            </span>
          </p>
        </div>
      </div>

      <h2 className="section-title">Question Review</h2>

      {Object.entries(result.details).map(([qid, q], index) => (
        <div
          key={qid}
          className={`question-review ${
            q.is_correct ? "correct" : "incorrect"
          }`}
        >
          <h3>
            Q{index + 1}. {q.question_text}
          </h3>

          <p>
            <strong>Correct Answer:</strong>{" "}
            <span className="correct-text">
              {q.correct.join(", ")}
            </span>
          </p>

          <p>
            <strong>Student Answer:</strong>{" "}
            <span className={q.is_correct ? "correct-text" : "wrong-text"}>
              {q.selected.join(", ") || "—"}
            </span>
          </p>

          <p>
            <strong>Marks:</strong> {q.earned}/{q.marks}
          </p>

          {!q.is_correct && q.explanation && (
            <div className="explanation-box">
              <strong>Why wrong?</strong>
              <p>{q.explanation}</p>
            </div>
          )}
        </div>
      ))}

      <div className="result-footer">
        <button className="dashboard-btn" onClick={() => navigate("/admin/results")}>
          Back to Results
        </button>
      </div>
    </div>
  );
}
