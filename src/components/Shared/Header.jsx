import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/components/shared.css";

export default function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin";

  return (
    <>
      <header className={`app-header ${scrolled ? "scrolled" : ""}`}>
        <div className="header-inner">

          {/* LEFT */}
          <div className="header-left">
            <button
              className="menu-btn"
              onClick={() => setMobileOpen(true)}
            >
              <i className="fas fa-bars" />
            </button>

            <Link to={user ? (isAdmin ? "/admin" : "/student") : "/"} className="brand">
              <span className="brand-icon">
                <i className="fas fa-graduation-cap" />
              </span>
              <div>
                <h1>Exam System</h1>
                <small>{isAdmin ? "Administration" : "Student Portal"}</small>
              </div>
            </Link>
          </div>

          {/* CENTER (Desktop only) */}
          <div className="header-center">
            <h2>
              {location.pathname.includes("admin")
                ? "Admin Dashboard"
                : location.pathname.includes("student")
                ? "Student Dashboard"
                : "Exam Management System"}
            </h2>
          </div>

          {/* RIGHT */}
          <div className="header-right">
            {user ? (
              <>
                <div
                  className="profile"
                  onClick={() => setUserMenu(!userMenu)}
                >
                  <div className="avatar">
                    {user.first_name?.[0] || "U"}
                  </div>
                  <span className="role">{user.role}</span>
                  <i className="fas fa-chevron-down" />
                </div>
              </>
            ) : (
              <Link to="/login" className="login-btn">
                Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* USER DROPDOWN */}
      {userMenu && (
        <>
          <div className="overlay" onClick={() => setUserMenu(false)} />
          <div className="user-menu">
            <button onClick={handleLogout} className="logout0">
               Logout
            </button>
          </div>
        </>
      )}

      {/* MOBILE NAV */}
      {mobileOpen && (
        <>
          <div className="overlay" onClick={() => setMobileOpen(false)} />
          <aside className="mobile-nav">
            <div className="mobile-head">
              <h3>Menu</h3>
              <button onClick={() => setMobileOpen(false)}>
                <i className="fas fa-times" />
              </button>
            </div>

            <nav>
              {isAdmin && (
                <>
                  <Link to="/admin">Dashboard</Link>
                  <Link to="/admin/subjects">Subjects</Link>
                  <Link to="/admin/student-list">Students</Link>
                  <Link to="/admin/exam-list">Exams</Link>
                  <Link to="/admin/task-list">Practical</Link>
                </>
              )}

              {!isAdmin && user && (
                <>
                  <Link to="/student">Dashboard</Link>
                  <Link to="/student/exam-list">Exams</Link>
                  <Link to="/student/results">Results</Link>
                  <Link to="/student/practical">Practical</Link>
                </>
              )}

              {user && (
                <button className="logout" onClick={handleLogout}>
                  <p className="logout0">Logout</p>
                </button>
              )}
              
            </nav>
          </aside>
        </>
      )}
    </>
  );
}
