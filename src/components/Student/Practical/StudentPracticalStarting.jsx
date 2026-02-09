import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";
import "./practical.css";

const STEPS = [
  "Allocating exam VM…",
  "Booting Rocky Linux…",
  "Configuring network…",
  "Preparing terminal…",
  "Almost ready…"
];

const MOTIVATION = [
  "Stay calm. You got this 💪",
  "Think like a sysadmin 🧠",
  "Accuracy > Speed ⏳",
  "Trust your practice 🚀"
];

export default function StudentPracticalStarting() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const startedRef = useRef(false); // 🔒 HARD GUARD

  useEffect(() => {
    if (!taskId) return;

    // 🔥 PREVENT DOUBLE EXECUTION (React StrictMode)
    if (startedRef.current) return;
    startedRef.current = true;

    const timer = setInterval(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1));
    }, 1500);

    practicalService.startPractical(taskId)
      .then(res => {
        clearInterval(timer);

        if (!res?.session_id) {
          throw new Error("Session ID missing");
        }

        navigate(`/student/practical/session/${res.session_id}`, {
          replace: true
        });
      })
      .catch(err => {
        clearInterval(timer);
        console.error(err);
        navigate("/student/practicals", { replace: true });
      });

    return () => clearInterval(timer);
  }, [taskId, navigate]);

  return (
    <div className="starting-page">
      <h2>Preparing Your Exam Environment</h2>
      <div className="loader" />
      <div className="step">{STEPS[step]}</div>
      <div className="motivation">
        {MOTIVATION[step % MOTIVATION.length]}
      </div>
    </div>
  );
}
