import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPost } from "../../../services/api";
import QuestionCard from "./QuestionCard";
import "./Exam.css";

/* ================= HELPERS ================= */

const shuffleArray = (arr = []) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const formatTime = (sec) => {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

/* ================= FULLSCREEN SAFE ================= */

const isFullscreen = () =>
  document.fullscreenElement ||
  document.webkitFullscreenElement ||
  document.msFullscreenElement;

const canFullscreen = () =>
  document.fullscreenEnabled ||
  document.webkitFullscreenEnabled ||
  document.msFullscreenEnabled;

const enterFullscreenSafe = async () => {
  try {
    if (isFullscreen()) return;
    if (!canFullscreen()) return;
    const el = document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) await el.msRequestFullscreen();
  } catch {}
};

const exitFullscreenSafe = () => {
  try {
    if (!isFullscreen()) return;
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  } catch {}
};

/* ================= EXAM ================= */

export default function Exam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [remaining, setRemaining] = useState(0);
  const [started, setStarted] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  const warningLock = useRef(false);

  const fiveMinWarned = useRef(false);
  const oneMinWarned = useRef(false);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  /* ================= LOAD SESSION ================= */

  useEffect(() => {
    if (!sessionId) {
      navigate("/student/exams");
      return;
    }
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await authGet(`/mcq/sessions/${sessionId}/`);

      if (data.is_completed) {
        navigate(`/student/results/${data.id}`);
        return;
      }

      setSession(data);
      setExam(data.exam);
      setRemaining(data.exam.duration * 60);

      const qList = shuffleArray(data.exam.question_details || []);
      setQuestions(qList);

      const init = {};
      qList.forEach((q) => (init[q.id] = ""));
      setAnswers(init);
      answersRef.current = init;
    } catch {
      navigate("/student/exams");
    } finally {
      setLoading(false);
    }
  };

  /* ================= TIMER ================= */

  useEffect(() => {
    if (!started) return;

    timerRef.current = setInterval(() => {
      setRemaining((t) => {
        if (t === 300 && !fiveMinWarned.current) {
          fiveMinWarned.current = true;
          Swal.fire({
            icon: "warning",
            title: "5 Minutes Remaining",
            text: "Please review your answers.",
          });
        }

        if (t === 60 && !oneMinWarned.current) {
          oneMinWarned.current = true;
          Swal.fire({
            icon: "warning",
            title: "1 Minute Remaining",
            text: "Submit your exam soon.",
          });
        }

        if (t <= 1) {
          handleSubmit("time_up");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started]);

  /* ================= RIGHT CLICK BLOCK ================= */

  useEffect(() => {
    if (!started) return;

    const blockRightClick = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("contextmenu", blockRightClick);
    return () => document.removeEventListener("contextmenu", blockRightClick);
  }, [started]);

  /* ================= WARNINGS (STRICT MODE) ================= */

  const addWarning = (reason) => {
    if (warningLock.current || submittedRef.current) return;
    warningLock.current = true;

    setWarnings((w) => {
      const next = w + 1;
      if (next >= 3) {
        Swal.fire({
          title: "Exam Auto Submitted",
          text: reason,
          icon: "error",
          allowOutsideClick: false,
        }).then(() => handleSubmit("warnings"));
      } else {
        Swal.fire(`Warning ${next}/3`, reason, "warning").then(() =>
          enterFullscreenSafe(),
        );
      }
      return next;
    });

    setTimeout(() => (warningLock.current = false), 1000);
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (reason = "manual") => {
    if (submittedRef.current) return;

    submittedRef.current = true;
    setSubmitting(true);
    clearInterval(timerRef.current);
    exitFullscreenSafe();

    const payload = Object.entries(answersRef.current).map(([q, a]) => ({
      question: Number(q),
      selected_answers: a,
    }));

    try {
      await authPost(`/mcq/sessions/${session.id}/submit/`, {
        terminate_reason: reason,
        answers: payload,
      });
    } catch {}
    finally {
      navigate(`/student/results/${session.id}`);
    }
  };

  /* ================= START ================= */

  const startExam = () => {
    Swal.fire({
      title: "Exam Instructions",
      html: `
        <ul style="text-align:left;font-weight:bold">
          <li>Fullscreen required</li>
          <li>No tab switching</li>
          <li>80% or High passing Score</li>
          <li>3 violations = auto submit</li>
        </ul>
      `,
      showCancelButton: true,
      confirmButtonText: "Start Exam",
      allowOutsideClick: false,
    }).then(async (r) => {
      if (r.isConfirmed) {
        await enterFullscreenSafe();
        setStarted(true);
      } else {
        navigate("/student/exams");
      }
    });
  };

  /* ================= UI ================= */

  if (loading) return <div className="exam-loading">Loading…</div>;

  if (!started) {
    return (
      <div className="exam-start">
        <div className="start-card">
          <h1>{exam.title}</h1>
          <p>⏱ {exam.duration} min</p>
          <p>📝 {questions.length} Questions</p>
          <button onClick={startExam}>Start Exam</button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className={`exam-wrapper ${submitting ? "locked" : ""}`}>
      <div className="exam-header">
        <h2>{exam.title}</h2>
        <div>
          <span className="timer">{formatTime(remaining)}</span> |{" "}
          {currentIndex + 1}/{questions.length} | ⚠ {warnings}/3
        </div>
      </div>

      <div className="question-box">
        <QuestionCard
          question={q}
          selectedAnswers={answers[q.id]}
          onChange={(qid, val) => {
            if (submittedRef.current) return;
            setAnswers((p) => {
              const u = { ...p, [qid]: val };
              answersRef.current = u;
              return u;
            });
          }}
        />
      </div>

      <div className="nav-buttons">
        <button
          disabled={currentIndex === 0 || submitting}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          ← Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            disabled={submitting}
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Next →
          </button>
        ) : (
          <button
            className="submit-btn"
            disabled={submitting}
            onClick={() => handleSubmit("manual")}
          >
            Submit Exam
          </button>
        )}
      </div>
    </div>
  );
}
