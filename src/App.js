// src/App.jsx
import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/authContext";
import { ExamProvider } from "./context/examContext";

// Components
import Header from "./components/Assest/Header";
import Footer from "./components/Assest/Footer";

// Auth
import Login from "./components/Auth/Login";
import PasswordReset from "./components/Auth/PasswordReset";
import ForcePasswordChange from "./components/Auth/ForcePasswordChange";

// Admin
import Dashboard from "./components/Admin/Dashboard";
import AddStudent from "./components/Admin/AddStudent";
import StudentList from "./components/Admin/AdminStudentList";
import QuestionUpload from "./components/Admin/QuestionUpload";
import ExamForm from "./components/Admin/ExamForm";
import AdminExamList from "./components/Admin/AdminExamList";

// Student
import ExamList from "./components/Student/ExamList";
import Exam from "./components/Student/Exam";
import Result from "./components/Student/Result";

import "./App.css";

// Debug: Logs route + auth status
const RouteDebugger = () => {
  const location = useLocation();
  const { user, loading } = useAuth();
  useEffect(() => {
    console.log("Route:", location.pathname, "User:", user, "Loading:", loading);
  }, [location, user, loading]);
  return null;
};

// Route for public pages (login, reset)
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (user) {
    if (user.force_password_change) {
      return <Navigate to="/change-password" replace />;
    }
    return <Navigate to={user.role === "admin" ? "/admin" : "/student"} replace />;
  }
  return children;
};

// Route for protected pages
const ProtectedRoute = ({ element, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user.force_password_change && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/access-denied" replace />;
  }

  return element;
};

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Router>
          <Header />
          <RouteDebugger />
          <div className="main-content">
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
              <Route path="/password-reset" element={<AuthRoute><PasswordReset /></AuthRoute>} />

              {/* Password change required */}
              <Route
                path="/change-password"
                element={<ProtectedRoute element={<ForcePasswordChange />} allowedRoles={["admin", "student"]} />}
              />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute element={<Dashboard />} allowedRoles={["admin"]} />} />
              <Route path="/admin/add-student" element={<ProtectedRoute element={<AddStudent />} allowedRoles={["admin"]} />} />
              <Route path="/admin/student-list" element={<ProtectedRoute element={<StudentList />} allowedRoles={["admin"]} />} />
              <Route path="/admin/upload" element={<ProtectedRoute element={<QuestionUpload />} allowedRoles={["admin"]} />} />
              <Route path="/admin/add-exam" element={<ProtectedRoute element={<ExamForm isEdit={false} />} allowedRoles={["admin"]} />} />
              <Route path="/admin/exam-list" element={<ProtectedRoute element={<AdminExamList />} allowedRoles={["admin"]} />} />
              <Route path="/admin/exams/:id/edit" element={<ProtectedRoute element={<ExamForm isEdit={true} />} allowedRoles={["admin"]} />} />

              {/* Student routes */}
              <Route path="/student" element={<ProtectedRoute element={<Dashboard />} allowedRoles={["student"]} />} />
              <Route path="/student/exam-list" element={<ProtectedRoute element={<ExamList />} allowedRoles={["student"]} />} />
              <Route path="/student/exam/:examId" element={<ProtectedRoute element={<Exam />} allowedRoles={["student"]} />} />
              <Route path="/student/results" element={<ProtectedRoute element={<Result />} allowedRoles={["student"]} />} />

              {/* Default route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Footer />
        </Router>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;
