// src/components/Student/Practice/PracticeExam.jsx

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import practiceService from "../../../services/practiceService";
import "./Practice.css";

export default function PracticeExam() {
  const [params] = useSearchParams();
  const subjectId = params.get("subject");
  const difficulty = params.get("difficulty");
  const resume = params.get("resume") === "true";

  const STORAGE_KEY = `practice_${subjectId}_${difficulty}`;

  const [runId, setRunId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const finishedRef = useRef(false);

  /* ===== START / RESUME ===== */
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        if (resume) {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
          if (saved && !cancelled) {
            setRunId(saved.runId);
            setQuestions(saved.questions);
            setCurrent(saved.current);
            setAnswers(saved.answers);
            setTimeLeft(saved.timeLeft);
            setLoading(false);
            return;
          }
        }

        const res = await practiceService.startPractice(subjectId, difficulty);
        if (cancelled) return;

        setRunId(res.run_id);
        setQuestions(res.questions);
        setTimeLeft(res.duration * 60);
        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  /* ===== TIMER (SAFE) ===== */
  useEffect(() => {
    if (!runId || finishedRef.current) return;

    if (timeLeft <= 0) {
      finishedRef.current = true;
      finish();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, runId]);

  /* ===== AUTOSAVE ===== */
  useEffect(() => {
    if (!runId || !questions.length) return;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        runId,
        questions,
        current,
        answers,
        timeLeft,
      })
    );
  }, [runId, current, answers, timeLeft, questions]);

  const selectOption = (qid, opt) => {
    setAnswers((prev) => ({ ...prev, [qid]: opt }));
    practiceService.submitAnswer(runId, qid, opt);
  };

  const finish = async () => {
    if (!runId) return;
    try {
      await practiceService.finishPractice(runId);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem(STORAGE_KEY);
    navigate(`/student/practice/result?run=${runId}`);
  };

  if (loading) {
    return <div className="practice-loader">Loading exam…</div>;
  }

  if (!questions.length) {
    return <div className="practice-loader">No questions found</div>;
  }

  const q = questions[current];

  return (
    <div className="practice-container exam">
      <div className="exam-header">
        <div className="timer">
          ⏱ {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
        <div className="progress">
          Question {current + 1} / {questions.length}
        </div>
      </div>

      <h3 className="question-text">
        {current + 1}. {q.text}
      </h3>

      <div className="options">
        {q.options.map(([k, v]) => (
          <button
            key={k}
            className={answers[q.id] === k ? "active" : ""}
            onClick={() => selectOption(q.id, k)}
          >
            {k}. {v}
          </button>
        ))}
      </div>

      <div className="nav">
        <button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}>
          Prev
        </button>

        {current < questions.length - 1 ? (
          <button onClick={() => setCurrent((c) => c + 1)}>Next</button>
        ) : (
          <button className="finish" onClick={finish}>
            Finish
          </button>
        )}
      </div>
    </div>
  );
}
