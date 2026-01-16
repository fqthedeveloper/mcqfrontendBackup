import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authPost } from '../../services/api';
import { FiMail, FiClock, FiArrowLeft, FiLock, FiCheck } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import '../../styles/CSS/OTP.css';

export default function OTPPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [step, setStep] = useState('send');

  const isVerifyingRef = useRef(false);   // blocks double submit
  const verifiedRef = useRef(false);      // blocks post-success UI
  const unmountedRef = useRef(false);     // blocks state updates

  /* ================= CLEANUP ================= */
  useEffect(() => {
    return () => {
      unmountedRef.current = true;
    };
  }, []);

  /* ================= AUTO EMAIL ================= */
  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user]);

  /* ================= COOLDOWN ================= */
  useEffect(() => {
    if (cooldown > 0) {
      const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [cooldown]);

  /* ================= SEND OTP ================= */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (cooldown > 0 || isLoading) return;

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await authPost('/mcq/send-otp/', { email });
      if (!unmountedRef.current) {
        setMessage({ text: res.message, type: 'success' });
        setCooldown(60);
        setStep('verify');
      }
    } catch (err) {
      if (!unmountedRef.current) {
        setMessage({
          text: err?.error || err?.detail || 'Failed to send OTP',
          type: 'error',
        });
      }
    } finally {
      if (!unmountedRef.current) setIsLoading(false);
    }
  };

  /* ================= OTP INPUT ================= */
  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    setOtp((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (isVerifyingRef.current || verifiedRef.current) return;
    isVerifyingRef.current = true;

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setMessage({ text: 'Please enter 6-digit OTP', type: 'error' });
      isVerifyingRef.current = false;
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await authPost('/mcq/verify-otp/', {
        otp: fullOtp,
        email,
      });

      // ✅ MARK VERIFIED IMMEDIATELY
      verifiedRef.current = true;

      updateUser({ ...user, is_verified: true });

      // 🔥 HARD REDIRECT (OTP PAGE WILL NEVER RENDER AGAIN)
      navigate(
        user?.role === 'admin' ? '/admin' : '/student',
        { replace: true }
      );
    } catch (err) {
      if (!verifiedRef.current && !unmountedRef.current) {
        setMessage({
          text: err?.error || err?.detail || 'Invalid OTP',
          type: 'error',
        });
        setOtp(['', '', '', '', '', '']);
        isVerifyingRef.current = false;
        document.getElementById('otp-0')?.focus();
      }
    } finally {
      if (!unmountedRef.current) setIsLoading(false);
    }
  };

  /* ================= BACK ================= */
  const handleBack = () => {
    if (step === 'verify') {
      setStep('send');
      setOtp(['', '', '', '', '', '']);
      setMessage({ text: '', type: '' });
      isVerifyingRef.current = false;
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button type="button" className="back-button" onClick={handleBack}>
          <FiArrowLeft size={20} /> Back
        </button>

        <div className="auth-icon">
          {step === 'send' ? <FiMail size={48} /> : <FiLock size={48} />}
        </div>

        <h2>{step === 'send' ? 'Verify Your Email' : 'Enter OTP'}</h2>

        {step === 'send' ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <input type="email" value={email} disabled readOnly />
            <button type="submit" disabled={isLoading || cooldown > 0}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Send OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-container">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  className="otp-input"
                />
              ))}
            </div>
            <button type="submit" disabled={isLoading}>
              <FiCheck /> Verify
            </button>
          </form>
        )}

        {message.text && !verifiedRef.current && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
