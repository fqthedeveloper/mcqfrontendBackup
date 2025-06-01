// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <header className="main-header">
      <div className="container header-container">
        <div className="logo">
          <Link to="/">IRT MCQ App</Link>
        </div>

        <div className={`nav-links ${menuOpen ? 'active' : ''}`}>
          {user?.role === 'admin' && (
            <>
              <Link to="/admin">Dashboard</Link>
              <Link to="/admin/add-exam">Add Exam</Link>
              <Link to="/admin/upload">Upload Questions</Link>
              <Link to="/admin/student-list">Students</Link>
            </>
          )}

          {user?.role === 'student' && (
            <>
              <Link to="/student">Dashboard</Link>
              <Link to="/student/exam-list">Exams</Link>
              <Link to="/student/results">My Results</Link>
            </>
          )}

          {user ? (
            <div className="user-section">
              <span className="username">Hi, {user.first_name || user.username}</span>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="login-btn">Login</Link>
          )}
        </div>

        <button 
          className="menu-toggle" 
          onClick={toggleMenu} 
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          <div className={`hamburger ${menuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </button>
      </div>
      
      <style>{`
        .main-header {
          background: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
          color: white;
          padding: 15px 0;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .logo a {
          color: white;
          font-size: 1.8rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
        }
        
        .logo a:hover {
          opacity: 0.9;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 25px;
        }
        
        .nav-links a {
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          font-weight: 500;
          font-size: 1.1rem;
          transition: all 0.3s ease;
        }
        
        .nav-links a:hover {
          color: white;
          transform: translateY(-2px);
        }
        
        .login-btn, .logout-btn {
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid white;
          border-radius: 30px;
          padding: 8px 20px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .login-btn:hover, .logout-btn:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }
        
        .user-section {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .username {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .menu-toggle {
          display: none;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          padding: 10px;
          z-index: 1001;
        }
        
        .hamburger {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 21px;
          position: relative;
        }
        
        .hamburger span {
          display: block;
          height: 3px;
          width: 100%;
          background: white;
          border-radius: 3px;
          transition: all 0.3s ease;
        }
        
        .hamburger.open span:nth-child(1) {
          transform: translateY(9px) rotate(45deg);
        }
        
        .hamburger.open span:nth-child(2) {
          opacity: 0;
        }
        
        .hamburger.open span:nth-child(3) {
          transform: translateY(-9px) rotate(-45deg);
        }
        
        /* Responsive Design */
        @media (max-width: 992px) {
          .nav-links {
            gap: 15px;
          }
          
          .login-btn, .logout-btn {
            padding: 6px 15px;
          }
        }
        
        @media (max-width: 768px) {
          .header-container {
            flex-wrap: wrap;
          }
          
          .nav-links {
            position: fixed;
            top: 0;
            left: ${menuOpen ? '0' : '-100%'};
            width: 70%;
            height: 100vh;
            background: linear-gradient(135deg, #2575fc 0%, #6a11cb 100%);
            flex-direction: column;
            padding: 80px 20px 20px;
            gap: 25px;
            transition: all 0.4s ease;
            z-index: 1000;
            box-shadow: 5px 0 15px rgba(0, 0, 0, 0.2);
          }
          
          .nav-links a, .user-section {
            width: 100%;
            text-align: left;
            padding: 12px 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          
          .user-section {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
            margin-top: 20px;
          }
          
          .menu-toggle {
            display: block;
          }
        }
        
        @media (max-width: 480px) {
          .logo a {
            font-size: 1.5rem;
          }
          
          .nav-links {
            width: 85%;
          }
        }
      `}</style>
    </header>
  );
}