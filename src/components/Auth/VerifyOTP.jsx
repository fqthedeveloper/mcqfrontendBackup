import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authPost } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/CSS/OTP.css";

export default function OTPPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [step, setStep] = useState("send");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const verifiedRef = useRef(false);   // 🔥 OTP already verified
  const submittingRef = useRef(false); // 🔥 block double submit

  /* ================= INIT ================= */
  useEffect(() => {
    if (user?.email) setEmail(user.email);

    if (sessionStorage.getItem("OTP_IN_PROGRESS") === "1") {
      setStep("verify");
    }
  }, [user]);

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await authPost("/mcq/send-otp/", { email });
      sessionStorage.setItem("OTP_IN_PROGRESS", "1");
      setStep("verify");
    } catch {
      setMessage("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= OTP INPUT ================= */
  const handleOtpChange = (i, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[i] = value;
    setOtp(next);
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async (e) => {
    e.preventDefault();

    // 🔥 BLOCK ALL DUPLICATES
    if (submittingRef.current || verifiedRef.current) return;
    submittingRef.current = true;

    const code = otp.join("");
    if (code.length !== 6) {
      setMessage("Enter 6 digit OTP");
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      await authPost("/mcq/verify-otp/", { email, otp: code });

      // ✅ MARK VERIFIED ONCE
      verifiedRef.current = true;
      sessionStorage.removeItem("OTP_IN_PROGRESS");

      updateUser({ ...user, is_verified: true });

      // 🔥 IMMEDIATE REDIRECT (NO UI UPDATE AFTER THIS)
      navigate("/student", { replace: true });
    } catch (err) {
      // ❌ IGNORE ERRORS AFTER SUCCESS
      if (!verifiedRef.current) {
        setMessage("Invalid OTP");
        submittingRef.current = false;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{step === "send" ? "Verify Your Email" : "Enter OTP"}</h2>

        {step === "send" && (
          <>
            <input type="email" value={email} readOnly />
            <button onClick={sendOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === "verify" && (
          <form onSubmit={verifyOtp}>
            <div className="otp-container">
              {otp.map((v, i) => (
                <input
                  key={i}
                  maxLength="1"
                  value={v}
                  onChange={(e) =>
                    handleOtpChange(i, e.target.value)
                  }
                />
              ))}
            </div>

            <button disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {message && <p className="message error">{message}</p>}
      </div>
    </div>
  );
}
