import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [welcomeText, setWelcomeText] = useState("");

  useEffect(() => {
    loadProfile();
    document.title = "Student Dashboard";
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authGet("/mcq/my-profile/");
      setProfile(data);

      const storageKey = `student_first_login_${data.username}`;
      const isFirstLogin = !localStorage.getItem(storageKey);

      if (isFirstLogin) {
        setWelcomeText("Welcome");
        localStorage.setItem(storageKey, "true");
      } else {
        setWelcomeText("Welcome back");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="student-bg center">
        <p className="loading">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-bg">
      <div className="student-dashboard">
        {/* HEADER */}
        <div className="header">
          <h1>Student Dashboard</h1>
          <p className="welcome">
            {welcomeText},&nbsp;
            <strong>
              {profile.full_name}
            </strong>
          </p>
        </div>

        {/* PROFILE CARD */}
        <div className="profile-card">
          <h2>My Profile</h2>

          <div className="profile-grid">
            <div>
              <span>Email</span>
              <p>{profile.email}</p>
            </div>

            <div>
              <span>Username</span>
              <p>{profile.username}</p>
            </div>

            <div>
              <span>Status</span>
              <p className={profile.is_verified ? "verified" : "not-verified"}>
                {profile.is_verified ? "Verified" : "Not Verified"}
              </p>
            </div>
          </div>
        </div>

        {/* ACTION CARDS */}
        <div className="card-grid">
          <div
            className="action-card"
            onClick={() => navigate("/student/exams")}
          >
            <div className="icon">📘</div>
            <h3>Exams</h3>
            <p>View & start your exams</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/student/results")}
          >
            <div className="icon">📊</div>
            <h3>Results</h3>
            <p>Check exam scores</p>
          </div>

          <div
            className="action-card"
            onClick={() => navigate("/student/profile")}
          >
            <div className="icon">👤</div>
            <h3>Profile</h3>
            <p>Account details</p>
          </div>
        </div>
      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        .student-bg {
          min-height: 100vh;
          background: linear-gradient(135deg, #2575fc, #6a11cb);
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .student-bg.center {
          align-items: center;
        }

        .student-dashboard {
          width: 100%;
          max-width: 1100px;
          background: rgba(255, 255, 255, 0.97);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.18);
        }

        /* HEADER */
        .header {
          margin-bottom: 24px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        .welcome {
          margin-top: 6px;
          color: #444;
          font-size: 16px;
        }

        /* PROFILE CARD */
        .profile-card {
          background: #fff;
          border-radius: 14px;
          padding: 20px;
          margin-bottom: 28px;
          box-shadow: 0 10px 25px rgba(0,0,0,.08);
        }

        .profile-card h2 {
          margin-top: 0;
          font-size: 20px;
          margin-bottom: 14px;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .profile-grid span {
          font-size: 13px;
          color: #777;
        }

        .profile-grid p {
          margin: 4px 0 0;
          font-weight: 600;
          color: #222;
        }

        .verified {
          color: #16a34a;
        }

        .not-verified {
          color: #dc2626;
        }

        /* ACTION CARDS */
        .card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
        }

        .action-card {
          background: linear-gradient(135deg, #f8fafc, #eef2ff);
          border-radius: 16px;
          padding: 26px;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .action-card .icon {
          font-size: 36px;
        }

        .action-card h3 {
          margin: 14px 0 6px;
          font-size: 18px;
        }

        .action-card p {
          font-size: 14px;
          color: #555;
        }

        .action-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 18px 40px rgba(0,0,0,0.18);
        }

        /* LOADING */
        .loading {
          font-size: 18px;
          color: #fff;
        }

        /* MOBILE */
        @media (max-width: 600px) {
          .student-dashboard {
            padding: 20px;
          }

          h1 {
            font-size: 24px;
          }

          .action-card {
            padding: 20px;
          }

          .action-card .icon {
            font-size: 30px;
          }
        }
      `}</style>
    </div>
  );
}
