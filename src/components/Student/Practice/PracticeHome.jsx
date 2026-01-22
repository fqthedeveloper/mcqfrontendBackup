// src/components/Student/Practice/PracticeHome.jsx

import React, { useEffect, useState } from "react";
import mcqService from "../../../services/mcqService";
import { useNavigate } from "react-router-dom";
import "./Practice.css";

export default function PracticeHome() {
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [loading, setLoading] = useState(true);
  const [hasProgress, setHasProgress] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    mcqService.getSubjects().then((res) => {
      const data = Array.isArray(res) ? res : res.results || [];
      setSubjects(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!subjectId) return;
    const key = `practice_${subjectId}_${difficulty}`;
    setHasProgress(!!localStorage.getItem(key));
  }, [subjectId, difficulty]);

  const startPractice = (resume = false) => {
    if (!subjectId) {
      alert("Select subject");
      return;
    }

    navigate(
      `/student/practice/exam?subject=${subjectId}&difficulty=${difficulty}&resume=${resume}`
    );
  };

  useEffect(() => {
    document.title = "Practice Exam List - Student";
  }, []);

  if (loading) return <div className="practice-loader">Loading…</div>;

  return (
    <div className="practice-container">
      <h2 className="practice-title">Practice MCQ</h2>

      <div className="practice-card">
        <label>Subject</label>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Select Subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <label>Difficulty</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="easy">Easy (30 Q · 25 min)</option>
          <option value="medium">Medium (60 Q · 40 min)</option>
          <option value="hard">Hard (90 Q · 60 min)</option>
        </select>

        {!hasProgress && (
          <button className="practice-start-btn" onClick={() => startPractice(false)}>
            Start Practice
          </button>
        )}

        {hasProgress && (
          <>
            <button className="practice-start-btn" onClick={() => startPractice(true)}>
              Continue Practice
            </button>
            <button
              className="practice-secondary-btn"
              onClick={() => {
                localStorage.removeItem(`practice_${subjectId}_${difficulty}`);
                startPractice(false);
              }}
            >
              Start New
            </button>
          </>
        )}
      </div>
    </div>
  );
}
