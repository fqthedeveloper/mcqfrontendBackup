import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (cooldown > 0) return;

    if (!email) {
      setMessage({ text: 'Please enter your email', type: 'error' });
      return;
    }

    setIsLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await authPost('/api/send-otp/', { email });
      setMessage({ 
        text: res.message || 'OTP sent to your email', 
        type: 'success' 
      });
      setCooldown(60);
      setStep('verify');
    } catch (err) {
      setMessage({ 
        text: err.response?.data?.error || 'Failed to send OTP', 
        type: 'error' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Email Verification";
  }, []);

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  useEffect(() => {
    document.title = "Email Verification";
  }, []);

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
  
    if (fullOtp.length !== 6) {
      setMessage({ text: 'Please enter a 6-digit OTP', type: 'error' });
      return;
    }
  
    setIsLoading(true);
    setMessage({ text: '', type: '' });
  
    try {
      const res = await authPost('/api/verify-otp/', { otp: fullOtp, email });
      const updatedUser = { ...user, is_verified: true }; // ensure role remains
      updateUser(updatedUser);
  
      setMessage({
        text: res.message || 'Verification successful!',
        type: 'success',
      });
  
      // ✅ Use updatedUser.role for reliable navigation
      setTimeout(() => {
        if (updatedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/student');
        }
      }, 2000);
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || 'Invalid OTP code',
        type: 'error',
      });
      setOtp(['', '', '', '', '', '']);
      const firstOtpInput = document.getElementById('otp-0');
      if (firstOtpInput) firstOtpInput.focus();
    } finally {
      setIsLoading(false);
    }
  };

  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <button
          className="back-button"
          onClick={() => {
            if (step === 'verify') {
              setStep('send');
              setMessage({ text: '', type: '' });
            } else {
              setEmail('');
              setMessage({ text: '', type: '' });
            }
          }}
        >
          <FiArrowLeft size={20} /> Back
        </button>

        <div className="auth-icon">
          {step === 'send' ? (
            <FiMail size={48} className="text-primary" />
          ) : (
            <FiLock size={48} className="text-primary" />
          )}
        </div>

        <h2>{step === 'send' ? 'Send OTP to Your Email' : 'Verify OTP'}</h2>
        <p className="auth-subtext">
          {step === 'send'
            ? 'Enter your email address to receive a one-time password'
            : `Enter the 6-digit code sent to your email${email ? ` ${email}` : ''}`}
        </p>

        {step === 'send' ? (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || cooldown > 0}
                required
              />
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={isLoading || cooldown > 0}
            >
              {isLoading ? (
                <span>Sending...</span>
              ) : cooldown > 0 ? (
                <span>
                  <FiClock className="icon-spin" /> Resend in {cooldown}s
                </span>
              ) : (
                <span>Send OTP</span>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="otp-container">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[index] && index > 0) {
                      const prevInput = document.getElementById(`otp-${index - 1}`);
                      if (prevInput) prevInput.focus();
                    }
                  }}
                  disabled={isLoading}
                  autoFocus={index === 0}
                  className="otp-input"
                />
              ))}
            </div>

            {message.text && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <FiCheck size={18} /> Verify Code
                </>
              )}
            </button>
          </form>
        )}

        {step === 'verify' && (
          <div className="auth-footer">
            Didn't receive code?{' '}
            <button
              className="text-link"
              disabled={cooldown > 0}
              onClick={() => {
                setStep('send');
                setMessage({ text: '', type: '' });
                setOtp(['', '', '', '', '', '']);
                setCooldown(0);
              }}
            >
              Resend OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}