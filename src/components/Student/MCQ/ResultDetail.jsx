import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";
import "../../../styles/CSS/Result.css";

export default function ResultDetail() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authGet(`/mcq/results/session/${sessionId}/`)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [sessionId]);

  useEffect(() => {
    document.title = "Exam Result Detail";
  }, []);

  if (loading) return <div className="result-loading">Loading…</div>;
  if (!result) return <div>No result found</div>;

  const percentage = Math.round((result.score / result.total_marks) * 100);

  return (
    <div className="result-container">
      <h1>{result.exam_title}</h1>
      <p>
        <strong>Student:</strong> {result.student_name}
      </p>
      <p>
        <strong>Submitted:</strong>{" "}
        {new Date(result.submitted_at).toLocaleString()}
      </p>
      <p>
        <strong>Score:</strong> {result.score}/{result.total_marks} (
        {percentage}%)
      </p>
      <p>
        <strong>Status:</strong>{" "}
        {result.pass_fail}
        
      </p>

      <h2>Question Review</h2>

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
            <span className="correct-text">{q.correct.join(", ")}</span>
          </p>

          <p>
            <strong>Your Answer:</strong>{" "}
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

      
        <button onClick={() => navigate("/student/exams")}>
          Back to Dashboard
        </button>
    </div>
  );
}
