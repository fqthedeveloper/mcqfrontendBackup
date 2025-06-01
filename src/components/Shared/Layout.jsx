// src/components/Shared/Layout.js
import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

export default function Layout() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="container">
          <Link to="/" className="logo">ExamPortal</Link>
          <div className="nav-links">
            {currentUser ? (
              <>
                <Link to={currentUser.role === 'admin' ? '/admin' : '/student'}>Dashboard</Link>
                <button onClick={logout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="container">
        <Outlet />
      </main>

      <footer>
        <div className="container">
          <p>© 2023 ExamPortal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}