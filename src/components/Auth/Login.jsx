import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/CSS/Login.css";

export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    document.title = "Login - Exam System";
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const response = await login({
        username_or_email: usernameOrEmail,
        password: password,
      });

      if (response.force_password_change) {
        navigate("/change-password", { replace: true });
      } else if (response.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      setErrors({
        nonField:
          err.message || "Login failed. Please check your credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <div className="logo-circle">🎓</div>
            <h2>Exam Management System</h2>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to your account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {errors.nonField && (
            <div className="alert-error">{errors.nonField}</div>
          )}

          <div className="form-group">
            <label>Email or Username</label>
            <input
              type="text"
              placeholder="Enter your email or username"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-options">
            <Link to="/password-reset" className="forgot-password">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
