import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { practicalService } from "../../../services/practicalService";

export default function StudentPracticalList() {
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPracticals = async () => {
      try {
        const data = await practicalService.getStudentPracticals();
        setPracticals(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading practicals:", error);
        setPracticals([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPracticals();
  }, []);

  useEffect(() => {
    document.title = "Practical Exams - Student";
  }, []);

  // Inject keyframes safely
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Loading practical exams...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Practical Exams</h2>

      <div style={styles.grid}>
        {practicals.length === 0 ? (
          <p style={styles.noData}>No practical exams available.</p>
        ) : (
          practicals.map((p) => (
            <div style={styles.card} key={p.task_id}>
              <h3 style={styles.cardTitle}>{p.title}</h3>

              <div style={styles.infoRow}>
                <span style={styles.label}>Duration:</span>
                <span>{p.duration} mins</span>
              </div>

              <div style={styles.infoRow}>
                <span style={styles.label}>Status:</span>
                <span
                  style={{
                    ...styles.status,
                    ...(p.status === "submitted"
                      ? styles.statusSuccess
                      : styles.statusPending),
                  }}
                >
                  {p.status.replace("_", " ")}
                </span>
              </div>

              {p.status === "not_started" && (
                <button
                  style={styles.button}
                  onClick={() =>
                    navigate(`/student/practical/${p.task_id}/rules`)
                  }
                >
                  View Rules & Start
                </button>
              )}

              {p.status === "submitted" && (
                <div style={styles.submittedBadge}>Submitted</div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "40px 20px",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #eef2ff, #f8f9ff)",
    fontFamily: "Arial, sans-serif",
  },

  heading: {
    textAlign: "center",
    marginBottom: "40px",
    fontSize: "28px",
    fontWeight: "700",
    color: "#222",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "25px",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  card: {
    background: "#fff",
    padding: "25px",
    borderRadius: "14px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
    transition: "0.3s ease",
  },

  cardTitle: {
    marginBottom: "15px",
    fontSize: "18px",
    fontWeight: "600",
  },

  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "14px",
  },

  label: {
    fontWeight: "600",
    color: "#555",
  },

  status: {
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    textTransform: "capitalize",
  },

  statusSuccess: {
    background: "#e6f9f0",
    color: "#0c8a4b",
  },

  statusPending: {
    background: "#fff4e5",
    color: "#cc7a00",
  },

  button: {
    marginTop: "15px",
    padding: "10px",
    border: "none",
    borderRadius: "8px",
    background: "#4a6cf7",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },

  submittedBadge: {
    marginTop: "15px",
    padding: "8px",
    borderRadius: "6px",
    background: "#e6f9f0",
    color: "#0c8a4b",
    textAlign: "center",
    fontWeight: "600",
  },

  noData: {
    textAlign: "center",
    gridColumn: "1/-1",
    fontSize: "16px",
    color: "#777",
  },

  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  },

  spinner: {
    width: "45px",
    height: "45px",
    border: "5px solid #eee",
    borderTop: "5px solid #4a6cf7",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    marginBottom: "15px",
  },
};
