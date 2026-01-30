import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    authGet("/mcq/admin-dashboard/")
      .then(setStats)
      .catch(() => setStats({}));
    document.title = "Admin Dashboard - MCQ Admin";
  }, []);

  if (!stats) return <p style={{ padding: 24 }}>Loading...</p>;

  return (
    <div className="admin-dashboard">
      {/* ================= HERO ================= */}
      <header className="dashboard-hero">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Overview of exams & practice system at a glance</p>
        </div>
        <span className="hero-badge">Administration</span>
      </header>

      {/* ================= STATS ================= */}
      <section className="stats-grid">
        <StatCard title="Students" value={stats.total_students ?? 0} icon={<Icon.Users />} />
        <StatCard title="Subjects" value={stats.total_subjects ?? 0} icon={<Icon.Book />} />
        <StatCard title="Questions" value={stats.total_questions ?? 0} icon={<Icon.Question />} />
        <StatCard title="Exams" value={stats.total_exams ?? 0} icon={<Icon.Exam />} />
        <StatCard title="Active Exams" value={stats.active_exams ?? 0} icon={<Icon.Live />} />
        <StatCard title="Results" value={stats.total_results ?? 0} icon={<Icon.Star />} />
        <StatCard title="Practice Questions" value={stats.total_practice_questions ?? 0} icon={<Icon.Practice />} />
        <StatCard title="Practice Runs" value={stats.total_practice_runs ?? 0} icon={<Icon.Timer />} />
      </section>

      <h2 className="manage-title">Manage</h2>

      {/* ================= ACTIONS ================= */}
      <section className="actions-grid">
        <Action title="Add Student" icon={<Icon.Plus />} onClick={() => navigate("/admin/add-student")} />
        <Action title="Student List" icon={<Icon.List />} onClick={() => navigate("/admin/student-list")} />
        <Action title="Upload Questions" icon={<Icon.Question />} onClick={() => navigate("/admin/upload-questions")} />
        <Action title="Question List" icon={<Icon.List />} onClick={() => navigate("/admin/question-list")} />
        <Action title="Add Exam" icon={<Icon.Exam />} onClick={() => navigate("/admin/add-exam")} />
        <Action title="Exam List" icon={<Icon.List />} onClick={() => navigate("/admin/exam-list")} />
        <Action title="Results" icon={<Icon.Star />} onClick={() => navigate("/admin/results")} />
        <Action title="Map Practice Questions" icon={<Icon.Practice />} onClick={() => navigate("/admin/practice-map")} />
        <Action title="Practice Runs" icon={<Icon.Timer />} onClick={() => navigate("/admin/practice-runs")} />
        {/* <Action title="Add Practical Task" icon={<Icon.Plus />} onClick={() => navigate("/admin/add-practical")} />
        <Action title="Practical Tasks" icon={<Icon.Exam />} onClick={() => navigate("/admin/list-practicals")} /> */}
      </section>

      {/* ================= STYLES ================= */}
      <style>{`
        .admin-dashboard { padding: 24px; background:#f8fafc; }

        .dashboard-hero {
          background: linear-gradient(90deg,#e0ecff,#f0f7ff);
          padding: 20px;
          border-radius: 14px;
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .dashboard-hero h1 { margin:0; font-size:28px; }
        .dashboard-hero p { margin:6px 0 0; color:#475569; }

        .hero-badge {
          background:#fff;
          padding:10px 16px;
          border-radius:999px;
          font-weight:600;
          box-shadow:0 8px 24px rgba(0,0,0,.06);
        }

        .stats-grid {
          margin-top:20px;
          display:grid;
          grid-template-columns: repeat(auto-fit,minmax(190px,1fr));
          gap:16px;
        }

        .stat-card {
          background:#fff;
          padding:18px;
          border-radius:14px;
          display:flex;
          align-items:center;
          gap:14px;
          box-shadow:0 10px 30px rgba(15,23,42,.06);
        }

        .icon-box {
          width:52px;
          height:52px;
          border-radius:12px;
          display:flex;
          align-items:center;
          justify-content:center;
          background:#eef4ff;
          color:#2563eb;
          flex-shrink:0;
        }

        .stat-body h4 {
          margin:0;
          font-size:14px;
          color:#475569;
        }

        .stat-body p {
          margin:6px 0 0;
          font-size:22px;
          font-weight:700;
        }

        .manage-title {
          margin:30px 0 12px;
          text-align:center;
          font-size:22px;
        }

        .actions-grid {
          display:grid;
          grid-template-columns: repeat(auto-fit,minmax(220px,1fr));
          gap:16px;
        }

        .action-card {
          background:#fff;
          padding:18px;
          border-radius:14px;
          display:flex;
          align-items:center;
          gap:14px;
          cursor:pointer;
          box-shadow:0 10px 30px rgba(15,23,42,.06);
          transition:.2s ease;
        }

        .action-card:hover {
          transform: translateY(-6px);
          box-shadow:0 18px 44px rgba(15,23,42,.12);
        }

        .action-label {
          font-weight:600;
          font-size:16px;
        }

        @media(max-width:600px){
          .dashboard-hero h1 { font-size:22px; }
        }
      `}</style>
    </div>
  );
}

/* ================= REUSABLE COMPONENTS ================= */

const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div className="icon-box">{icon}</div>
    <div className="stat-body">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

const Action = ({ title, icon, onClick }) => (
  <div className="action-card" onClick={onClick}>
    <div className="icon-box">{icon}</div>
    <div className="action-label">{title}</div>
  </div>
);

/* ================= ICON SET (CONSISTENT SIZE) ================= */

const Icon = {
  Users: () => svg("M16 11c1.7 0 3-1.6 3-3.5S17.7 4 16 4s-3 1.6-3 3.5S14.3 11 16 11zM8 11c1.7 0 3-1.6 3-3.5S9.7 4 8 4 5 5.6 5 7.5 6.3 11 8 11zM2 19v-2c0-2.3 4.7-3.5 6-3.5s6 1.2 6 3.5v2"),
  Book: () => svg("M4 4h14a2 2 0 012 2v14H6a2 2 0 01-2-2z"),
  Question: () => svg("M12 2a10 10 0 100 20 10 10 0 000-20zm0 14h.01M12 7a3 3 0 012 5"),
  Exam: () => svg("M4 3h16v18H4z"),
  Live: () => svg("M12 6v6l4 2"),
  Star: () => svg("M12 2l3 7h7l-6 4 3 7-7-5-7 5 3-7-6-4h7z"),
  Practice: () => svg("M4 4h16v16H4z"),
  Timer: () => svg("M12 6v6l4 2"),
  Plus: () => svg("M12 5v14M5 12h14"),
  List: () => svg("M8 6h13M8 12h13M8 18h13"),
};

function svg(path) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}
