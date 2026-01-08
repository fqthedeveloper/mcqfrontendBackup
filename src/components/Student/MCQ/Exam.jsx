import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { authGet, authPost } from "../../../services/api";
import QuestionCard from "./QuestionCard";

/* ================= HELPERS ================= */

const shuffleArray = (arr) => {
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

/* ================= EXAM ================= */

export default function Exam() {
  const { sessionId } = useParams();          // ✅ FIXED
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
  const screenRef = useRef({
    w: window.innerWidth,
    h: window.innerHeight,
  });

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

      // ✅ correct API (NO /api/api)
      const sessionData = await authGet(`/mcq/sessions/${sessionId}/`);

      if (sessionData.is_completed) {
        Swal.fire("Already Submitted", "", "info");
        navigate("/student/exams");
        return;
      }

      const examData = sessionData.exam;

      setSession(sessionData);
      setExam(examData);
      setRemaining(examData.duration * 60);

      let qList = shuffleArray(
        examData.questions.map((q) => ({
          ...q,
          options: shuffleArray(["A", "B", "C", "D"]),
        }))
      );

      setQuestions(qList);

      const init = {};
      qList.forEach((q) => (init[q.id] = ""));
      setAnswers(init);

    } catch (err) {
      console.error(err);
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
          autoSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [started]);

  /* ================= STRICT MODE ================= */

  useEffect(() => {
    if (!started || exam?.mode !== "strict") return;

    const onBlur = () => addWarning("Tab switch detected");
    const onResize = () => {
      const dw = Math.abs(window.innerWidth - screenRef.current.w);
      const dh = Math.abs(window.innerHeight - screenRef.current.h);
      if (dw > 100 || dh > 100) addWarning("Screen resize detected");
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
    };
  }, [started, exam]);

  const addWarning = (reason) => {
    setWarnings((w) => {
      const next = w + 1;
      if (next >= 3) {
        Swal.fire("Exam Auto Submitted", "3 warnings reached", "error")
          .then(autoSubmit);
      } else {
        Swal.fire(`Warning ${next}/3`, reason, "warning");
      }
      return next;
    });
  };

  /* ================= SUBMIT ================= */

  const autoSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    clearInterval(timerRef.current);

    const payload = Object.entries(answers).map(([q, a]) => ({
      question: Number(q),
      selected_answers: a,
    }));

    await authPost(`/mcq/sessions/${session.id}/submit/`, {
      answers: payload,
    });

    navigate(`/student/results/${session.id}`);
  };

  /* ================= START ================= */

  const startExam = () => {
    Swal.fire({
      title: "Exam Instructions",
      html: `
        <ul style="text-align:left">
          <li>One question per screen</li>
          <li>Questions are shuffled</li>
          <li>No tab switching</li>
          <li>3 warnings = auto submit</li>
        </ul>
      `,
      showCancelButton: true,
      confirmButtonText: "Start Exam",
      allowOutsideClick: false,
    }).then((r) => {
      if (r.isConfirmed) {
        screenRef.current = {
          w: window.innerWidth,
          h: window.innerHeight,
        };
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
          <p>Duration: {exam.duration} min</p>
          <p>Questions: {questions.length}</p>
          <p>Mode: {exam.mode}</p>
          <button onClick={startExam}>Start Exam</button>
        </div>

        <style>{`
          .exam-start {
            display:flex;
            justify-content:center;
            align-items:center;
            height:80vh;
          }
          .start-card {
            background:#fff;
            padding:24px;
            border-radius:18px;
            text-align:center;
            max-width:420px;
            width:100%;
          }
          .start-card button {
            margin-top:16px;
            padding:12px;
            width:100%;
            background:#2563eb;
            border:none;
            border-radius:10px;
            color:#fff;
            font-size:16px;
          }
        `}</style>
      </div>
    );
  }

  const q = questions[currentIndex];
  const answeredCount = Object.values(answers).filter(Boolean).length;

  return (
    <div className="exam-container">
      <div className="exam-header">
        <h2>{exam.title}</h2>
        <div className="exam-meta">
          <span>{formatTime(remaining)}</span>
          <span>{answeredCount}/{questions.length}</span>
          {exam.mode === "strict" && (
            <span className="warning">Warnings: {warnings}/3</span>
          )}
        </div>
      </div>

      <QuestionCard
        question={q}
        index={currentIndex}
        selectedAnswers={answers[q.id]}
        onChange={(qid, val) =>
          setAnswers((prev) => ({ ...prev, [qid]: val }))
        }
      />

      <div className="nav-buttons">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          ← Previous
        </button>

        {currentIndex < questions.length - 1 ? (
          <button onClick={() => setCurrentIndex((i) => i + 1)}>
            Next →
          </button>
        ) : (
          <button className="submit-btn" onClick={autoSubmit}>
            Submit Exam
          </button>
        )}
      </div>

      <style>{`
        .exam-container {
          max-width:900px;
          margin:auto;
          padding:16px;
        }
        .exam-header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:16px;
        }
        .exam-meta span {
          margin-left:12px;
        }
        .warning {
          color:#dc2626;
          font-weight:bold;
        }
        .nav-buttons {
          display:flex;
          justify-content:space-between;
          margin-top:24px;
        }
        .nav-buttons button {
          padding:12px 18px;
          border-radius:10px;
          border:none;
          background:#2563eb;
          color:#fff;
          font-size:14px;
        }
        .submit-btn {
          background:#dc2626;
        }
      `}</style>
    </div>
  );
}
