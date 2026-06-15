import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

export default function StudentDashboard() {

  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ================= HELPERS ================= */

  const todayKey = () => {
    const d = new Date();

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  /* ================= TOAST ================= */

  const showToast = (title, text) => {

    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title,
      text,
      showConfirmButton: false,
      timer: 3500,
      timerProgressBar: true,
      background: "#ffffff",
      iconColor: "#4f46e5",
    });

  };

  /* ================= LOAD PROFILE ================= */

  const loadProfile = useCallback(async () => {

    try {

      const data = await authGet("/mcq/my-profile/");

      setProfile(data);

      const firstKey =
        `student_first_login_${data.username}`;

      const dayKey =
        `student_last_welcome_date_${data.username}`;

      const today = todayKey();

      const isFirstLoginEver =
        !localStorage.getItem(firstKey);

      const lastWelcomeDate =
        localStorage.getItem(dayKey);

      // FIRST LOGIN
      if (isFirstLoginEver) {

        showToast(
          `Welcome, ${data.first_name} ${data.last_name}`,
          "We’re glad to have you here 🎉"
        );

        localStorage.setItem(firstKey, "true");
        localStorage.setItem(dayKey, today);

      }

      // NEW DAY LOGIN
      else if (lastWelcomeDate !== today) {

        showToast(
          `Welcome back, ${data.first_name} ${data.last_name}`,
          "Nice to see you again 👋"
        );

        localStorage.setItem(dayKey, today);

      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  }, []);

  /* ================= INIT ================= */

  useEffect(() => {

    loadProfile();
    document.title = "Student Dashboard";

  }, [loadProfile]);

  /* ================= CYBER SECURITY CHECK ================= */

  const hasCyberSecurity = profile?.subjects?.some(
    (subject) =>
      subject.name
        .toLowerCase()
        .includes("cybersecurity") ||

      subject.name
        .toLowerCase()
        .includes("cyber security")
  );

    /* ================= LINUX CHECK ================= */

    const hasLinux = profile?.subjects?.some(
    (subject) =>
      subject.name
        .toLowerCase()
        .includes("linux") ||

      subject.name
        .toLowerCase()
        .includes("Linux")
  );
  /* ================= LOADING ================= */

  if (loading) {

    return (
      <div className="student-bg center">
        <p className="loading">
          Loading dashboard...
        </p>
      </div>
    );

  }

  return (

    <div className="student-bg">

      <motion.div
        className="student-dashboard"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >

        {/* HEADER */}

        <div className="header">

          <h1>
            Student Dashboard
          </h1>

          <p className="welcome">

            Hello,&nbsp;

            <strong>
              {profile.first_name} {profile.last_name}
            </strong>

          </p>

        </div>

        {/* PROFILE CARD */}

        <motion.div
          className="profile-card"
          whileHover={{ scale: 1.02 }}
        >

          <h2>
            My Profile
          </h2>

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

              <p
                className={
                  profile.is_verified
                    ? "verified"
                    : "not-verified"
                }
              >
                {profile.is_verified
                  ? "Verified"
                  : "Not Verified"}
              </p>

            </div>

          </div>

          {/* SUBJECTS */}

          <div className="subject-section">

            <h3>
              Enrolled Subjects
            </h3>

            <div className="subject-list">

              {profile.subjects?.map((subject) => (

                <div
                  key={subject.id}
                  className="subject-badge"
                >
                  {subject.name}
                </div>

              ))}

            </div>

          </div>

          {/* VERIFY */}

          {!profile.is_verified && (

            <div className="verify-box">

              <p className="verify-warning">
                ⚠ Your email is not verified.
                Please verify to continue securely.
              </p>

              <button
                className="verify-btn"
                onClick={() =>
                  navigate("/email-verify")
                }
              >
                Verify Now
              </button>

            </div>

          )}

        </motion.div>

        {/* ACTION CARDS */}

        <div className="card-grid">

          {[
            {
              icon: "📘",
              title: "Exams",
              desc: "View & start exams",
              path: "/student/exams",
            },

            {
              icon: "📊",
              title: "Results",
              desc: "Check exam scores",
              path: "/student/results",
            },

            {
              icon: "📘",
              title: "Practice Exams",
              desc: "View & start exams",
              path: "/student/practice",
            },

    ...(hasLinux
              ? [
            {
              icon: "📘",
              title: "Practical",
              desc: "View practical tasks",
              path: "/student/practicals",
            },

            {
              icon: "📊",
              title: "Practical Results",
              desc: "View practical results",
              path: "/student/practical/results/",
            },
              ]
              : []),

           // ================= CYBER SECURITY =================

            ...(hasCyberSecurity
              ? [

                  {
                    icon: "🛡️",
                    title: "Cyber Security Exams",
                    desc: "MCQ + scenario based cyber security examinations",
                    path: "/student/cyber/exams",

                    color: "danger",
                    badge: "EXAM",
                  },

                  {
                    icon: "💻",
                    title: "Cyber Security Labs",
                    desc: "Launch isolated attacker & victim practical labs",
                    path: "/student/cyber/labs",

                    color: "dark",
                    badge: "LAB",
                  },

                  // {
                  //   icon: "🔴",
                  //   title: "Red Team Arena",
                  //   desc: "Attack simulation and exploitation challenges",
                  //   path: "/student/cybersecurity/redteam",

                  //   color: "warning",
                  //   badge: "RED",
                  // },

                  // {
                  //   icon: "🔵",
                  //   title: "Blue Team Defense",
                  //   desc: "SOC investigation and defense operations",
                  //   path: "/student/cybersecurity/blueteam",

                  //   color: "primary",
                  //   badge: "BLUE",
                  // },

                  // {
                  //   icon: "🧪",
                  //   title: "Practice Cyber Labs",
                  //   desc: "Unlimited practice environments and walkthrough labs",
                  //   path: "/student/cybersecurity/practice",

                  //   color: "success",
                  //   badge: "PRACTICE",
                  // },

                  {
                    icon: "📊",
                    title: "Cyber Security Results",
                    desc: "View lab scores, reports and performance analytics",
                    path: "/student/cyber/results",

                    color: "info",
                    badge: "REPORT",
                  },

                  // {
                  //   icon: "📡",
                  //   title: "Live Cyber Range",
                  //   desc: "Real-time monitored cyber range infrastructure",
                  //   path: "/student/cybersecurity/live-range",

                  //   color: "secondary",
                  //   badge: "LIVE",
                  // },

                ]
              : []),
            // ================= PROFILE =================

            {
              icon: "👤",
              title: "Profile",
              desc: "Account details",
              path: "/student/profile",
            },

          ].map((card, i) => (

            <motion.div
              key={i}
              className="action-card"
              whileHover={{ y: -8 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                navigate(card.path)
              }
            >

              <div className="icon">
                {card.icon}
              </div>

              <h3>
                {card.title}
              </h3>

              <p>
                {card.desc}
              </p>

            </motion.div>

          ))}

        </div>

      </motion.div>

      {/* ================= STYLES ================= */}

      <style>{`

        * {
          box-sizing: border-box;
        }

        .student-bg {
          min-height: 100vh;
          background:
            linear-gradient(
              135deg,
              #2575fc,
              #6a11cb
            );

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

          background: #fff;

          border-radius: 18px;

          padding: 28px;

          box-shadow:
            0 25px 60px
            rgba(0,0,0,0.2);

        }

        .header {
          margin-bottom: 24px;
        }

        h1 {
          margin: 0;
          font-size: 28px;
        }

        .welcome {
          margin-top: 6px;
          color: #555;
        }

        .profile-card {

          background: #f9fafb;

          border-radius: 14px;

          padding: 20px;

          margin-bottom: 28px;

        }

        .profile-grid {

          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(200px, 1fr)
            );

          gap: 16px;
        }

        .subject-section {
          margin-top: 20px;
        }

        .subject-list {

          display: flex;

          flex-wrap: wrap;

          gap: 10px;

          margin-top: 10px;

        }

        .subject-badge {

          background: #4f46e5;

          color: white;

          padding: 8px 14px;

          border-radius: 30px;

          font-size: 14px;

          font-weight: 600;

        }

        .verified {
          color: #16a34a;
        }

        .not-verified {
          color: #dc2626;
        }

        .verify-box {

          margin-top: 18px;

          padding: 14px;

          background: #fff7ed;

          border-radius: 10px;

          border:
            1px solid #fed7aa;

        }

        .verify-warning {

          color: #9a3412;

          font-size: 14px;

          margin-bottom: 10px;

        }

        .verify-btn {

          background: #f97316;

          color: white;

          border: none;

          padding: 10px 16px;

          border-radius: 8px;

          cursor: pointer;

          font-weight: 600;

        }

        .verify-btn:hover {
          background: #ea580c;
        }

        .card-grid {

          display: grid;

          grid-template-columns:
            repeat(
              auto-fit,
              minmax(220px, 1fr)
            );

          gap: 20px;

        }

        .action-card {

          background:
            linear-gradient(
              135deg,
              #eef2ff,
              #f8fafc
            );

          border-radius: 16px;

          padding: 26px;

          cursor: pointer;

          text-align: center;

          box-shadow:
            0 10px 25px
            rgba(0,0,0,0.12);

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

        .loading {

          color: #fff;

          font-size: 18px;

        }

      `}</style>

    </div>

  );

}