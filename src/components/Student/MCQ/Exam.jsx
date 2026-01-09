import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPost } from "../../../services/api";
import QuestionCard from "./QuestionCard";

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

/* ================= SAFE FULLSCREEN HELPERS ================= */

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

  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const warningLock = useRef(false);

  /* 🔥 NEW: LIVE ANSWER REF (CRITICAL FIX) */
  const answersRef = useRef({});

  /* 🔥 NEW: KEEP REF IN SYNC */
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  /* ================= LOAD SESSION ================= */

  useEffect(() => {
    if (!sessionId || sessionId === "undefined") {
      navigate("/student/exams");
      return;
    }
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionData = await authGet(`/mcq/sessions/${sessionId}/`);

      if (sessionData.is_completed) {
        Swal.fire("Already Submitted", "", "info");
        navigate("/student/exams");
        return;
      }

      setSession(sessionData);
      setExam(sessionData.exam);
      setRemaining(sessionData.exam.duration * 60);

      const qList = shuffleArray(sessionData.exam.question_details || []);
      setQuestions(qList);

      const init = {};
      qList.forEach((q) => (init[q.id] = ""));
      setAnswers(init);
      answersRef.current = init; // 🔥 sync initial
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
        if (t <= 1) {
          handleSubmit("time_up");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started]);

  /* ================= WARNING HANDLER ================= */

  const addWarning = (reason) => {
    if (warningLock.current || submittedRef.current) return;
    warningLock.current = true;

    setWarnings((w) => {
      const next = w + 1;
      if (next >= 3) {
        Swal.fire("Exam Auto Submitted", reason, "error")
          .then(() => handleSubmit("anti_cheat"));
      } else {
        Swal.fire(`Warning ${next}/3`, reason, "warning")
          .then(() => enterFullscreenSafe());
      }
      return next;
    });

    setTimeout(() => (warningLock.current = false), 1500);
  };

  /* ================= STRICT MODE ================= */

  useEffect(() => {
    if (!started || exam?.mode !== "strict") return;
    const onBlur = () => addWarning("Tab switch detected");
    const onResize = () => addWarning("Screen resize detected");
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
    };
  }, [started, exam]);

  /* ================= FULLSCREEN ================= */

  useEffect(() => {
    if (!started || exam?.mode !== "strict") return;
    const onFsChange = () => {
      if (!isFullscreen() && !submittedRef.current) {
        addWarning("Fullscreen exited");
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [started, exam]);

  /* ================= SUBMIT (FIXED) ================= */

  const handleSubmit = async (reason = "manual") => {
    if (submittedRef.current) return;
    submittedRef.current = true;

    clearInterval(timerRef.current);
    exitFullscreenSafe();

    try {
      /* 🔥 USE REF — ALWAYS LATEST ANSWERS */
      const payload = Object.entries(answersRef.current).map(([q, a]) => ({
        question: Number(q),
        selected_answers: a,
      }));

      await authPost(`/mcq/sessions/${session.id}/submit/`, {
        terminate_reason: reason,
        answers: payload,
      });

      navigate(`/student/results/${session.id}`);
    } catch {
      Swal.fire("Submission Failed", "Please contact admin", "error");
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

  if (loading) return <div className="exam-loading">Loading Exam…</div>;
  if (!started) {
    return (
      <div className="exam-start">
        <div className="start-card">
          <h1>{exam.title}</h1>
          <p>⏱ Duration: {exam.duration} min</p>
          <p>📝 Questions: {questions.length}</p>
          <p>🔒 Mode: {exam.mode}</p>
          <button className="start-card-button" onClick={startExam}>
            Start Exam
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="exam-wrapper">
      <div className="exam-header">
        <h2>{exam.title}</h2>
        <div className="exam-meta">
          <span className="timer">{formatTime(remaining)}</span>
          <span>{currentIndex + 1}/{questions.length}</span>
          {exam.mode === "strict" && (
            <span className="warning">⚠ {warnings}/3</span>
          )}
        </div>
      </div>

      <div className="question-box">
        <QuestionCard
          question={q}
          index={currentIndex}
          selectedAnswers={answers[q.id]}
          onChange={(qid, val) =>
            setAnswers((prev) => {
              const updated = { ...prev, [qid]: val };
              answersRef.current = updated; // 🔥 INSTANT UPDATE
              return updated;
            })
          }
        />
      </div>

      <div className="nav-buttons">
        <button disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}>← Previous</button>
        {currentIndex < questions.length - 1 ? (
          <button onClick={() => setCurrentIndex((i) => i + 1)}>Next →</button>
        ) : (
          <button className="submit-btn"
            onClick={() => handleSubmit("manual")}>
            Submit Exam
          </button>
        )}
      </div>

      {/* ================= CSS ================= */}
      <style>{`
        *{box-sizing:border-box}
        body{background:#f4f6fb}
        .exam-loading{text-align:center;padding:60px;font-size:18px}
        .exam-start{min-height:85vh;display:flex;align-items:center;justify-content:center}
        .start-card{background:#fff;padding:32px;border-radius:20px;width:100%;max-width:420px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.1)}
        .start-card p{color:#475569}
        .start-card-button{margin-top:20px;padding:14px;width:100%;border-radius:12px;border:none;background:#2563eb;color:#fff;font-size:16px}
        .exam-wrapper{max-width:900px;margin:auto;padding:16px}
        .exam-header{background:#fff;padding:16px 20px;border-radius:14px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .exam-meta span{margin-left:12px;font-weight:600}
        .timer{color:#16a34a}
        .warning{color:#dc2626}
        .question-box{background:#fff;padding:24px;border-radius:16px;margin-top:16px;box-shadow:0 6px 20px rgba(0,0,0,.08)}
        .nav-buttons{display:flex;gap:12px;margin-top:20px}
        .nav-buttons button{flex:1;padding:14px;border-radius:12px;border:none;background:#2563eb;color:#fff}
        .nav-buttons button:disabled{background:#94a3b8}
        .submit-btn{background:#dc2626}
        @media(max-width:600px){
          .exam-header{flex-direction:column;align-items:flex-start;gap:8px}
          .nav-buttons{flex-direction:column}
        }
      `}</style>
    </div>
  );
}
