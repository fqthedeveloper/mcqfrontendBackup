import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authPost } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "../../styles/CSS/OTP.css";

const RESEND_TIME = 30; // seconds

export default function OTPPage() {
  const navigate = useNavigate();
  const { user, updateUserProfile } = useAuth();

  const [step, setStep] = useState("send"); // send | verify
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(0);

  const otpRefs = useRef([]);

  /* ================= INIT ================= */
  useEffect(() => {
    if (user?.email) setEmail(user.email);

    const savedStep = sessionStorage.getItem("OTP_STEP");
    const savedTimer = sessionStorage.getItem("OTP_TIMER");

    if (savedStep === "verify") {
      setStep("verify");
      if (savedTimer) setTimer(Number(savedTimer));
    }
  }, [user]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (timer <= 0) return;

    sessionStorage.setItem("OTP_TIMER", timer);

    const id = setTimeout(() => {
      setTimer((t) => t - 1);
    }, 1000);

    return () => clearTimeout(id);
  }, [timer]);

  /* ================= SEND / RESEND OTP ================= */
  const sendOtp = async (isResend = false) => {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const res = await authPost("/mcq/send-otp/", { email });

      if (res?.success === true) {
        sessionStorage.setItem("OTP_STEP", "verify");
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setTimer(RESEND_TIME);

        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 200);

        if (isResend) {
          setMessage("OTP resent successfully");
        }
      } else {
        setMessage(res?.message || "OTP not sent");
      }
    } catch (err) {
      setMessage(err?.error || "OTP not sent");
    } finally {
      setLoading(false);
    }
  };

  /* ================= OTP INPUT ================= */
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async (e) => {
    e.preventDefault();
    if (loading) return;

    const code = otp.join("");

    if (code.length !== 6) {
      setMessage("Enter 6 digit OTP");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await authPost("/mcq/verify-otp/", {
        email,
        otp: code,
      });

      if (res?.success === true) {
        updateUserProfile({ is_verified: true });
        sessionStorage.removeItem("OTP_STEP");
        sessionStorage.removeItem("OTP_TIMER");
        navigate("/student", { replace: true });
      } else {
        setMessage(res?.error || "Invalid OTP");
      }
    } catch (err) {
      setMessage(err?.error || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE EMAIL ================= */
  const resetFlow = () => {
    sessionStorage.removeItem("OTP_STEP");
    sessionStorage.removeItem("OTP_TIMER");
    setStep("send");
    setOtp(["", "", "", "", "", ""]);
    setTimer(0);
    setMessage("");
  };

  useEffect(() => {
    document.title = "Verify OTP";
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{step === "send" ? "Verify Email" : "Enter OTP"}</h2>

        {/* ================= SEND STEP ================= */}
        {step === "send" && (
          <>
            <input type="email" value={email} readOnly />
            <button onClick={() => sendOtp(false)} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {/* ================= VERIFY STEP ================= */}
        {step === "verify" && (
          <>
            <form onSubmit={verifyOtp}>
              <div className="otp-container">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    maxLength="1"
                    value={v}
                    onChange={(e) =>
                      handleOtpChange(i, e.target.value)
                    }
                  />
                ))}
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>

            {/* ================= RESEND ================= */}
            <div style={{ marginTop: "12px", textAlign: "center" }}>
              {timer > 0 ? (
                <p style={{ fontSize: "14px", color: "#666" }}>
                  Resend OTP in {timer}s
                </p>
              ) : (
                <button
                  type="button"
                  className="link-button"
                  onClick={() => sendOtp(true)}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              )}

            </div>
          </>
        )}

        {message && <p className="message error">{message}</p>}
      </div>
    </div>
  );
}
