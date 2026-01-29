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

const enterFullscreenSafe = async () => {
  try {
    if (isFullscreen()) return;
    if (!document.documentElement.requestFullscreen) return;
    await document.documentElement.requestFullscreen();
  } catch {}
};

const exitFullscreenSafe = () => {
  try {
    if (!document.hasFocus()) return;
    if (!isFullscreen()) return;
    if (document.exitFullscreen) document.exitFullscreen();
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

  /* ================= FORCE HIDE GLOBAL HEADER ================= */

  useEffect(() => {
    if (started) {
      document.body.classList.add("exam-mode");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("exam-mode");
      document.body.style.overflow = "";
    }

    return () => {
      document.body.classList.remove("exam-mode");
      document.body.style.overflow = "";
    };
  }, [started]);

  /* ================= LOAD SESSION ================= */

  useEffect(() => {
    if (!sessionId) return navigate("/student/exams");
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await authGet(`/mcq/sessions/${sessionId}/`);

      if (data.is_completed) {
        navigate(`/student/results/${data.id}`);
        return;
      }

      setSession(data);
      setExam(data.exam);
      setRemaining(data.exam.duration * 60);

      const q = shuffleArray(data.exam.question_details || []);
      setQuestions(q);

      const init = {};
      q.forEach((x) => (init[x.id] = ""));
      setAnswers(init);
      answersRef.current = init;
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
          Swal.fire("5 Minutes Remaining", "", "warning");
        }

        if (t === 60 && !oneMinWarned.current) {
          oneMinWarned.current = true;
          Swal.fire("1 Minute Remaining", "", "warning");
        }

        if (t <= 1) {
          if (!submittedRef.current) handleSubmit("time_up");
          return 0;
        }

        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started]);

  /* ================= RIGHT CLICK + COPY BLOCK ================= */

  useEffect(() => {
    if (!started) return;

    const blockContext = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const blockMouse = (e) => {
      if (e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("contextmenu", blockContext, true);
    document.addEventListener("mousedown", blockMouse, true);

    return () => {
      document.removeEventListener("contextmenu", blockContext, true);
      document.removeEventListener("mousedown", blockMouse, true);
    };
  }, [started]);

    /* ================= DEVTOOLS / SHORTCUT BLOCK ================= */

useEffect(() => {
  if (!started) return;

  const blockKeys = (e) => {
    const key = e.key.toLowerCase();

    // F12
    if (e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      addWarning("Developer tools are not allowed.");
      return false;
    }

    // Ctrl + Shift + I / J / C
    if (
      e.ctrlKey &&
      e.shiftKey &&
      (key === "i" || key === "j" || key === "c")
    ) {
      e.preventDefault();
      e.stopPropagation();
      addWarning("Developer tools are not allowed.");
      return false;
    }

    // Ctrl + U (view source)
    if (e.ctrlKey && key === "u") {
      e.preventDefault();
      e.stopPropagation();
      addWarning("Viewing source is not allowed.");
      return false;
    }
  };

  document.addEventListener("keydown", blockKeys, true);

  return () => {
    document.removeEventListener("keydown", blockKeys, true);
  };
}, [started]);

  /* ================= WARNINGS ================= */

  const addWarning = (msg) => {
    if (warningLock.current || submittedRef.current) return;
    warningLock.current = true;

    setWarnings((w) => {
      const next = w + 1;
      if (next >= 3) {
        Swal.fire("Exam Auto Submitted", msg, "error").then(() =>
          handleSubmit("warnings"),
        );
      } else {
        Swal.fire(`Warning ${next}/3`, msg, "warning").then(() =>
          enterFullscreenSafe(),
        );
      }
      return next;
    });

    setTimeout(() => (warningLock.current = false), 1200);
  };

  /* ================= FULLSCREEN EXIT ================= */

  useEffect(() => {
    if (!started) return;

    const onFsExit = () => {
      if (!isFullscreen()) {
        addWarning("Fullscreen exit detected.");
      }
    };

    document.addEventListener("fullscreenchange", onFsExit);
    return () =>
      document.removeEventListener("fullscreenchange", onFsExit);
  }, [started]);

  /* ================= TAB SWITCH ================= */

  useEffect(() => {
    if (!started) return;

    const onHide = () => {
      if (document.hidden) {
        addWarning("Tab switching is not allowed.");
      }
    };

    document.addEventListener("visibilitychange", onHide);
    return () =>
      document.removeEventListener("visibilitychange", onHide);
  }, [started]);

  /* ================= SUBMIT ================= */

  const handleSubmit = async (reason) => {
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
    } finally {
      navigate(`/student/results/${session.id}`);
    }
  };

  /* ================= START ================= */

  const startExam = async () => {
    const r = await Swal.fire({
      title: "Exam Instructions",
      text: "1) Fullscreen required. Right click & tab switch disabled. 3 warnings allowed. 80% About to Pass Exam",
      showCancelButton: true,
      allowOutsideClick: false,
    });

    if (!r.isConfirmed) return navigate("/student/exams");

    await enterFullscreenSafe();
    setStarted(true);
  };

  if (loading) return <div className="exam-loading">Loading…</div>;

  if (!started)
    return (
      <div className="exam-start">
        <div className="start-card">
        <h1>{exam.title}</h1>
        <p>Subject Name: {exam.subject_name}</p>
        <p>Duration: {exam.duration} minutes</p>
        <p>Total Questions: {questions.length}</p>
        <h1>Exam Instructions:</h1>
        <p>1) Fullscreen required. Right click & tab switch disabled.</p>
        <p>2) 3 warnings allowed.</p>
        <p>3) 80% About to Pass Exam</p>

        <button onClick={startExam}>Start Exam</button>
        </div>
      </div>
    );

  const q = questions[currentIndex];


  return (
    <div className={`exam-wrapper ${submitting ? "locked" : ""}`}>
      <div className="exam-header">
        <h2>{exam.title}</h2>
        <div>
          {formatTime(remaining)} | {currentIndex + 1}/{questions.length} | ⚠{" "}
          {warnings}/3
        </div>
      </div>

      <QuestionCard
        question={q}
        selectedAnswers={answers[q.id]}
        onChange={(id, v) =>
          setAnswers((p) => ({ ...p, [id]: v }))
        }
      />

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
