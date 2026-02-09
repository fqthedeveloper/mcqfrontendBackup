import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./practical.css";

export default function StudentPracticalRules() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const confirmStart = async () => {
    const res = await Swal.fire({
      title: "Start Practical Exam?",
      text: "Once started, the timer will begin and cannot be paused.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Start Exam"
    });

    if (res.isConfirmed) {
      navigate(`/student/practical/${taskId}/start`);
    }
  };

  return (
    <div className="rules-page">
      <h2>Practical Exam Rules</h2>

      <ul className="rules">
        <li>No browser refresh during exam</li>
        <li>Internet access is allowed</li>
        <li>Only terminal access is provided</li>
        <li>Root privilege is allowed via sudo</li>
        <li>Exam auto-submits on timeout</li>
      </ul>

      <button className="btn-primary" onClick={confirmStart}>
        Confirm & Start Exam
      </button>
    </div>
  );
}
