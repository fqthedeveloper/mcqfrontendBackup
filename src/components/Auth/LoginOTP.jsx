import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import "../../styles/CSS/LoginOTP.css";

export default function LoginOTP() {
  const navigate = useNavigate();
  const { verifyOTP } = useAuth();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.sendLoginOTP(email);
      setStep(2);
    } catch (err) {
      setError(err?.error || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyOTP({ email, otp });

      // ✅ ROLE BASED REDIRECT (CRITICAL FIX)
      if (res.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/student", { replace: true });
      }
    } catch (err) {
      setError(err?.error || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Login with OTP - Exam System";
  }, []);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-content">
          {/* LEFT */}
          <div className="auth-text">
            <h2>Login with OTP</h2>
            <p>Enter your registered email to receive a one-time password.</p>
          </div>

          {/* RIGHT */}
          <div className="auth-form">
            {error && <p className="error">{error}</p>}

            {step === 1 && (
              <form onSubmit={handleSendOTP}>
                <input
                  type="email"
                  placeholder="Enter registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOTP}>
                <p className="otp-info">
                  OTP sent to <strong>{email}</strong>
                </p>

                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />

                <button type="submit" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                <button
                  type="button"
                  className="link-button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                  }}
                >
                  Change Email
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
