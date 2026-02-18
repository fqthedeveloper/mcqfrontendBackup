import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function StudentPracticalRules() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Practical Exam Rules - Student";
  }, []);

  const confirmStart = async () => {
    const res = await Swal.fire({
      title: "Start Practical Exam?",
      text: "Once started, the timer will begin and cannot be paused.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Start Exam",
      confirmButtonColor: "#4a6cf7",
      cancelButtonColor: "#d33",
    });

    if (res.isConfirmed) {
      navigate(`/student/practical/${taskId}/start`);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.heading}>Practical Exam Rules</h2>

        <ul style={styles.rules}>
          <li style={styles.ruleItem}>No browser refresh during exam</li>
          <li style={styles.ruleItem}>Internet access is allowed</li>
          <li style={styles.ruleItem}>Only terminal access is provided</li>
          <li style={styles.ruleItem}>Root privilege is allowed via sudo</li>
          <li style={styles.ruleItem}>Exam auto-submits on timeout</li>
          <li style={styles.ruleItem}><b>Minimum Passing Score: 80%</b></li>
        </ul>

        <button style={styles.button} onClick={confirmStart}>
          Confirm & Start Exam
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    background: "linear-gradient(135deg, #eef2ff, #f8f9ff)",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    background: "#fff",
    width: "100%",
    maxWidth: "600px",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },

  heading: {
    marginBottom: "25px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#222",
  },

  rules: {
    listStyleType: "disc",
    textAlign: "left",
    paddingLeft: "20px",
    marginBottom: "30px",
    lineHeight: "1.8",
    fontSize: "15px",
    color: "#444",
  },

  ruleItem: {
    marginBottom: "8px",
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "#4a6cf7",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "0.3s ease",
  },
};
