import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { practicalService } from "../../../services/practicalService";
import "./practical.css";

export default function StudentPracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!sessionId || sessionId === "undefined") {
      navigate("/student/practicals", { replace: true });
      return;
    }

    practicalService.getSession(sessionId)
      .then(res => {
        setSession(res);
        setTimeLeft(res.duration * 60);
      })
      .catch(() => {
        navigate("/student/practicals", { replace: true });
      });
  }, [sessionId, navigate]);

  const submitExam = useCallback(async (auto = false) => {
    if (!auto) {
      const res = await Swal.fire({
        title: "Submit Practical?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Submit",
      });
      if (!res.isConfirmed) return;
    }

    await practicalService.submitSession(sessionId);
    Swal.fire("Submitted", "Practical submitted successfully", "success");
    navigate("/student/practicals", { replace: true });
  }, [navigate, sessionId]);

  useEffect(() => {
    if (!timeLeft) return;
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          submitExam(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitExam]);

  if (!session) return <div className="loading">Loading exam...</div>;

  return (
    <div className="practical-exam">
      <div className="exam-header">
        <h2>{session.title}</h2>
        <span className="timer">
          ⏱ {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </span>
      </div>

      <div className="exam-desc">{session.description}</div>

      <button className="btn-danger" onClick={() => submitExam(false)}>
        Submit Practical
      </button>
    </div>
  );
}
