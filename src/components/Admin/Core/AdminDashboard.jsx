import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authGet } from "../../../services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    authGet("/mcq/admin-dashboard/").then(setStats).catch(() => setStats({}));
    document.title = "Admin Dashboard - MCQ Admin";
  }, []);

  if (!stats) return <p style={{ padding: 24 }}>Loading...</p>;


  return (
    <div className="admin-dashboard">
      <header className="dashboard-hero">
        <div className="hero-left">
          <h1>Admin Dashboard</h1>
          <p className="hero-sub">Overview of your exam system at a glance</p>
        </div>
        <div className="hero-right">
          <div className="hero-badge">Administration</div>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard
          title="Students"
          value={stats.total_students ?? 0}
          icon={<PeopleIcon />}
        />
        <StatCard title="Subjects" value={stats.total_subjects ?? 0} icon={<BookIcon />} />
        <StatCard title="Questions" value={stats.total_questions ?? 0} icon={<QuestionIcon />} />
        <StatCard title="Exams" value={stats.total_exams ?? 0} icon={<ExamIcon />} />
        <StatCard title="Active Exams" value={stats.active_exams ?? 0} icon={<LiveIcon />} />
        <StatCard title="Results" value={stats.total_results ?? 0} icon={<ResultIcon />} />
      </section>

      <h2 className="manage-title">Manage</h2>

      <section className="actions-grid">
        <Action title="Add Student" onClick={() => navigate("/admin/add-student")} icon={<PlusIcon />} />
        <Action title="Student List" onClick={() => navigate("/admin/student-list")} icon={<ListIcon />} />
        <Action title="Questions" onClick={() => navigate("/admin/upload-questions")} icon={<QuestionIcon />} />
        <Action title="Questions List" onClick={() => navigate("/admin/question-list")} icon={<QuestionIcon />} />
        <Action title="Exams" onClick={() => navigate("/admin/add-exam")} icon={<ExamIcon />} />
        <Action title="Exams List" onClick={() => navigate("/admin/exam-list")} icon={<ExamListIcon />} />
        <Action title="Results List" onClick={() => navigate("/admin/results")} icon={<ExamListIcon />} />
        <Action title="Add Practical Task" onClick={() => navigate("/admin/add-practical")} icon={<PlusIcon />} />
        <Action title="Practical Tasks List" onClick={() => navigate("/admin/list-practicals")} icon={<ExamListIcon />} />
      </section>

      <style>{`
        .admin-dashboard { padding: 24px; }
        .dashboard-hero { display:flex; align-items:center; justify-content:space-between; gap:16px; background: linear-gradient(90deg,#6a9cff22,#9ae6ff22); padding:18px; border-radius:12px; margin-bottom:18px; }
        .hero-left h1 { margin:0; font-size:28px; }
        .hero-sub { margin:4px 0 0; color:#556; }
        .hero-badge { background:#fff; padding:8px 12px; border-radius:20px; box-shadow:0 4px 12px rgba(0,0,0,0.06); font-weight:600; }

        .stats-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:16px; margin-top:18px; }

        .stat-card { display:flex; align-items:center; gap:12px; background:#fff; padding:16px; border-radius:12px; box-shadow:0 8px 24px rgba(15,23,42,0.04); }
        .stat-icon { width:56px; height:56px; border-radius:10px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#eef6ff,#f8fbff); }
        .stat-body h4 { margin:0; font-size:14px; color:#334; }
        .stat-body p { margin:6px 0 0; font-size:22px; font-weight:700; }

        .manage-title { margin-top:28px; text-align:center; color:#223; }

        .actions-grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(200px,1fr)); gap:14px; margin-top:12px; }
        .action-card { background:#fff; padding:18px; border-radius:12px; box-shadow:0 8px 24px rgba(15,23,42,0.04); display:flex; align-items:center; gap:12px; cursor:pointer; transition:transform .15s ease, box-shadow .15s ease; }
        .action-card:hover { transform: translateY(-6px); box-shadow:0 14px 40px rgba(15,23,42,0.08); }
        .action-label { font-size:16px; font-weight:600; }

        @media (max-width:600px){ .hero-left h1{font-size:20px;} .stat-icon{width:48px;height:48px;} }
      `}</style>
    </div>
  );
}

const StatCard = ({ title, value, icon }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-body">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  </div>
);

const Action = ({ title, onClick, icon }) => (
  <div className="action-card" onClick={onClick}>
    <div style={{ width:44, height:44, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'#f4f8ff' }}>{icon}</div>
    <div className="action-label">{title}</div>
  </div>
);

// Simple inline SVG icons
const PeopleIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11c1.657 0 3-1.567 3-3.5S17.657 4 16 4s-3 1.567-3 3.5S14.343 11 16 11zM8 11c1.657 0 3-1.567 3-3.5S9.657 4 8 4 5 5.567 5 7.5 6.343 11 8 11zM8 13c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13zm8 0c-.29 0-.62.02-.97.06 1.16.84 1.97 1.92 1.97 2.94V19h6v-2.5c0-2.33-4.67-3.5-6-3.5z" fill="#2b6cb0"/></svg>
);

const BookIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 2H9a2 2 0 00-2 2v14a2 2 0 002 2h10" stroke="#2b6cb0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 6h10v12" stroke="#2b6cb0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const QuestionIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zM12 17h.01M12 7.5c1.5 0 2.5 1 2.5 2s-1 1.5-1.5 2c-.5.5-1 1-1 2" stroke="#2b6cb0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const ExamIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M7 3v4M17 3v4M21 21H3V7h18v14z" stroke="#2b6cb0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

const LiveIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 6v6l4 2" stroke="#e53e3e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="9" stroke="#e53e3e" strokeWidth="1.2"/></svg>
);

const ResultIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3 7h7l-6 4 3 7-7-5-7 5 3-7-6-4h7z" fill="#2b6cb0"/></svg>
);

const PlusIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#2b6cb0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const ListIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="#2b6cb0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const TagIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20.59 13.41L13.41 6.23a2 2 0 00-2.83 0L3 14v7h7l7.59-7.59a2 2 0 000-2.83z" stroke="#2b6cb0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>);
const EnrollIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#2b6cb0" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#2b6cb0" strokeWidth="1.2"/></svg>);
const ExamListIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18M7 3v4M17 3v4M21 21H3V7h18v14z" stroke="#2b6cb0" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
);