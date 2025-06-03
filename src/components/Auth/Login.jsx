import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth} from "../../context/authContext";
import { baseURL } from "../../services/api";
import "../CSS/Login.css";


export default function Login() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    try {
      const res = await fetch(`${baseURL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username_or_email: usernameOrEmail,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle field-specific errors
        if (data.username_or_email || data.password) {
          setErrors({
            usernameOrEmail: data.username_or_email,
            password: data.password
          });
        } else {
          // Handle general errors
          setErrors({
            nonField: data.error || "Login failed. Please try again."
          });
        }
        setLoading(false);
        return;
      }

      const user = {
        id: data.id,
        username: data.username,
        email: data.email,
        role: data.role || "student",
        token: data.token,
        force_password_change: data.force_password_change || false,
      };

      login(user);

      if (user.force_password_change) {
        navigate("/change-password", { replace: true });
      } else if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      setErrors({
        nonField: "Network error. Please check your connection."
      });
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <div className="logo-circle">IRT</div>
            <h2>MCQ Application</h2>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {errors.nonField && <div className="error-message">{errors.nonField}</div>}

          <div className="input-group">
            <label htmlFor="usernameOrEmail">Email or Username</label>
            <div className="input-with-icon">
              <i className="fas fa-user"></i>
              <input
                type="text"
                id="usernameOrEmail"
                placeholder="Enter your email or username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
                className={errors.usernameOrEmail ? "error" : ""}
              />
            </div>
            {errors.usernameOrEmail && 
              <div className="field-error">{errors.usernameOrEmail}</div>}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <i className="fas fa-lock"></i>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={errors.password ? "error" : ""}
              />
            </div>
            {errors.password && 
              <div className="field-error">{errors.password}</div>}
          </div>

          <div className="forgot-password">
            <a href="/password-reset">Forgot Password?</a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="login-footer"></div>
      </div>
    </div>
  );
}