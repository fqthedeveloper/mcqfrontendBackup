import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ExamProvider } from "./context/ExamContext";

/* Layout */
import Header from "./components/Shared/Header";
import Footer from "./components/Shared/Footer";

/* Auth */
import Login from "./components/Auth/Login";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import ForcePasswordChange from "./components/Auth/ForcePasswordChange";
import VerifyOTP from "./components/Auth/VerifyOTP";

/* Admin */
import AdminDashboard from "./components/Admin/Core/AdminDashboard";
import AddStudent from "./components/Admin/Core/AddStudent";
import StudentList from "./components/Admin/Core/StudentList";
import QuestionUpload from "./components/Admin/MCQ/QuestionUpload";
import QuestionManagement from "./components/Admin/MCQ/QuestionManegment";
import ExamForm from "./components/Admin/MCQ/ExamForm";
import EditExamForm from "./components/Admin/MCQ/EditExamForm";
import AdminExamList from "./components/Admin/MCQ/AdminExamList";
import AdminResultList from "./components/Admin/MCQ/AdminResultList";
import AdminResultDetail from "./components/Admin/MCQ/AdminResultDetail";

/* Student */
import StudentDashboard from "./components/Student/MCQ/StudentDashboard";
import ExamList from "./components/Student/MCQ/ExamList";
import Exam from "./components/Student/MCQ/Exam";
import ResultList from "./components/Student/MCQ/ResultList";
import ResultDetail from "./components/Student/MCQ/ResultDetail";

import "./App.css";

/* ================= AUTH GUARDS ================= */

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

const ProtectedRoute = ({ element, roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.force_password_change && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return element;
};

/* ================= APP ================= */

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Router>
          <Header />
          <div className="main-content">
            <Routes>
              {/* ===== PUBLIC ===== */}
              <Route
                path="/login"
                element={
                  <AuthRoute>
                    <Login />
                  </AuthRoute>
                }
              />
              <Route
                path="/password-reset"
                element={
                  <AuthRoute>
                    <ForgotPassword />
                  </AuthRoute>
                }
              />
              <Route
                path="/reset-password/:token"
                element={
                  <AuthRoute>
                    <ResetPassword />
                  </AuthRoute>
                }
              />
              <Route path="/email-verify" element={<VerifyOTP />} />

              {/* ===== FORCE PASSWORD ===== */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute
                    element={<ForcePasswordChange />}
                    roles={["admin", "student"]}
                  />
                }
              />

              {/* ===== ADMIN ===== */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    element={<AdminDashboard />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/add-student"
                element={
                  <ProtectedRoute
                    element={<AddStudent />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/student-list"
                element={
                  <ProtectedRoute
                    element={<StudentList />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/upload-questions"
                element={
                  <ProtectedRoute
                    element={<QuestionUpload />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/question-list"
                element={
                  <ProtectedRoute
                    element={<QuestionManagement />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/add-exam"
                element={
                  <ProtectedRoute
                    element={<ExamForm isEdit={false} />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/exam-list"
                element={
                  <ProtectedRoute
                    element={<AdminExamList />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/exams/:id/edit"
                element={
                  <ProtectedRoute
                    element={<EditExamForm />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/results"
                element={
                  <ProtectedRoute
                    element={<AdminResultList />}
                    roles={["admin"]}
                  />
                }
              />
              <Route
                path="/admin/results/:sessionId" 
                element={
                  <ProtectedRoute
                    element={<AdminResultDetail />}
                    roles={["admin"]}
                  />
                }
              />
              {/* ===== STUDENT ===== */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute
                    element={<StudentDashboard />}
                    roles={["student"]}
                  />
                }
              />
              <Route
                path="/student/exams"
                element={
                  <ProtectedRoute
                    element={<ExamList />}
                    roles={["student"]}
                  />
                }
              />
              <Route
                path="/student/exam/:sessionId"
                element={
                  <ProtectedRoute
                    element={<Exam />}
                    roles={["student"]}
                  />
                }
              />
              <Route
                path="/student/results"
                element={
                  <ProtectedRoute
                    element={<ResultList />}
                    roles={["student"]}
                  />
                }
              />
              <Route
                path="/student/results/:sessionId"
                element={
                  <ProtectedRoute
                    element={<ResultDetail />}
                    roles={["student"]}
                  />
                }
              />

              {/* ===== DEFAULT ===== */}
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
