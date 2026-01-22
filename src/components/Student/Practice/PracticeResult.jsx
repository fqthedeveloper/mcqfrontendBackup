// src/components/Student/Practice/PracticeResult.jsx

import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import practiceService from "../../../services/practiceService";
import "./Practice.css";

export default function PracticeResult() {
  const [params] = useSearchParams();
  const runId = params.get("run");
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    practiceService.finishPractice(runId).then(setResult);
  }, []);

  if (!result) return <div>Loading...</div>;

  return (
    <div className="practice-container">
      <h2>Practice Result</h2>
      <p>Total Questions: {result.total}</p>
      <p>Correct: {result.correct}</p>
      <p>Wrong: {result.wrong}</p>
      <p>Accuracy: {result.accuracy}%</p>

      <button onClick={() => navigate("/student")}>Back to Dashboard</button>
    </div>
  );
}
