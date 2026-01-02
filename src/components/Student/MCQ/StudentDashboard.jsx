import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authGet("/mcq/my-profile/");
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="student-bg"><p className="loading">Loading...</p></div>;
  }

  return (
    <div className="student-bg">
      <div className="student-dashboard">
        <h1>Student Dashboard</h1>
        <p className="welcome">
          Welcome, <strong>{profile.first_name || profile.username}</strong>
        </p>

        {/* PROFILE CARD */}
        <div className="card">
          <h2>My Profile</h2>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Username:</strong> {profile.username}</p>
          <p>
            <strong>Status:</strong>{" "}
            <span className={profile.is_verified ? "verified" : "not-verified"}>
              {profile.is_verified ? "Verified" : "Not Verified"}
            </span>
          </p>
        </div>

        {/* ACTION CARDS */}
        <div className="card-grid">
          <div className="action-card" onClick={() => navigate("/student/exams")}>
            📘
            <h3>Exam List</h3>
            <p>View & start your exams</p>
          </div>

          <div className="action-card" onClick={() => navigate("/student/results")}>
            📊
            <h3>Exam Results</h3>
            <p>Check your scores</p>
          </div>

          <div className="action-card" onClick={() => navigate("/student/profile")}>
            👤
            <h3>Profile</h3>
            <p>View account details</p>
          </div>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .student-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #2575fc, #6a11cb);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 40px 16px;
        }

        .student-dashboard {
          width: 100%;
          max-width: 900px;
          background: rgba(255,255,255,0.95);
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }

        h1 {
          margin-top: 0;
          font-size: 28px;
        }

        .welcome {
          color: #555;
          margin-bottom: 24px;
        }

        .card {
          background: #fff;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 8px 20px rgba(0,0,0,0.06);
          margin-bottom: 24px;
        }

        .verified {
          color: green;
          font-weight: 600;
        }

        .not-verified {
          color: red;
          font-weight: 600;
        }

        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .action-card {
          background: linear-gradient(135deg, #f8fafc, #eef2ff);
          border-radius: 14px;
          padding: 24px;
          cursor: pointer;
          text-align: center;
          font-size: 32px;
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        .action-card h3 {
          margin: 12px 0 6px;
          font-size: 18px;
        }

        .action-card p {
          font-size: 14px;
          color: #555;
        }

        .action-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 14px 30px rgba(0,0,0,0.15);
        }

        .loading {
          color: #fff;
          font-size: 18px;
        }
      `}</style>
    </div>
  );
}
