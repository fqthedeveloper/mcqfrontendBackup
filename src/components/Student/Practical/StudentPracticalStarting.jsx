import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";
import "./PracticalStarting.css";

/* ============================
   STEP ANIMATION
============================ */
const STEPS = [
  "Allocating isolated exam VM…",
  "Booting Rocky Linux OS…",
  "Configuring private networking…",
  "Starting SSH & services…",
  "Preparing exam environment…",
  "Final system checks…"
];

/* ============================
   LEARNING ROTATION
============================ */
const TECH_INTROS = [
  { title: "Linux Fundamentals", text: "Everything is a file. Permissions matter." },
  { title: "DevOps Mindset", text: "Automate repeatable work." },
  { title: "Networking", text: "IP, DNS, routing, firewalls." },
  { title: "Cloud Computing", text: "Isolation, scalability, automation." },
  { title: "Security", text: "Least privilege always." },
  { title: "Troubleshooting", text: "Logs → Metrics → Fix." }
];

export default function StudentPracticalStarting() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [introIndex, setIntroIndex] = useState(
    Math.floor(Math.random() * TECH_INTROS.length)
  );
  const [sessionId, setSessionId] = useState(null);

  const startedRef = useRef(false);

  /* ============================
     START PRACTICAL (ONCE)
  ============================ */
  useEffect(() => {
    if (!taskId || startedRef.current) return;
    startedRef.current = true;

    practicalService.startPractical(taskId)
      .then(res => {
        if (!res || !res.session_id) {
          throw new Error("Session ID missing");
        }
        setSessionId(res.session_id);
      })
      .catch(() => {
        navigate("/student/practicals", { replace: true });
      });
  }, [taskId, navigate]);

  /* ============================
     STEP ANIMATION
  ============================ */
  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStep(s => (s < STEPS.length - 1 ? s + 1 : s));
    }, 2000);

    return () => clearInterval(stepTimer);
  }, []);

  /* ============================
     ELAPSED TIME COUNTER
  ============================ */
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(t => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ============================
     LEARNING ROTATION
  ============================ */
  useEffect(() => {
    const introTimer = setInterval(() => {
      setIntroIndex(i => (i + 1) % TECH_INTROS.length);
    }, 8000);

    return () => clearInterval(introTimer);
  }, []);

  /* ============================
     🔥 POLL SESSION STATUS
  ============================ */
  useEffect(() => {
    if (!sessionId) return;

    const pollTimer = setInterval(async () => {
      try {
        const res = await practicalService.getPracticalSession(sessionId);

        if (res.status === "running" && res.vm_ip) {
          clearInterval(pollTimer);
          navigate(`/student/practical/session/${sessionId}`, {
            replace: true
          });
        }

        if (res.status === "failed") {
          clearInterval(pollTimer);
          navigate("/student/practicals", { replace: true });
        }
      } catch (err) {
        // silent retry
      }
    }, 3000);

    return () => clearInterval(pollTimer);
  }, [sessionId, navigate]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  const intro = TECH_INTROS[introIndex];


  useEffect(() => {
    document.title = "Preparing Your Exam Environment...";
  } , []);

  
  return (
    <div className="starting-page">
      <div className="card">
        <h2>Preparing Your Exam Environment</h2>

        <div className="timer">
          ⏱ Waiting time: {minutes}:{seconds}
        </div>

        <div className="loader" />

        <div className="step">{STEPS[step]}</div>

        <div className="learning-box">
          <h4>{intro.title}</h4>
          <p>{intro.text}</p>
        </div>

        <div className="hint">
          Do not refresh the page. Your environment is being prepared securely.
        </div>
      </div>
    </div>
  );
}
