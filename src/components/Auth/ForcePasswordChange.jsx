import React, { useState } from 'react';
import { changePassword } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/CSS/ChangePassword.css';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  /* ================= ADD ONLY (NO CHANGE) ================= */
  const passwordRules = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
  };

  const strengthCount = Object.values(passwordRules).filter(Boolean).length;

  const strengthLabel =
    strengthCount <= 2 ? 'Weak' : strengthCount <= 4 ? 'Medium' : 'Strong';
  /* ======================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      await changePassword(newPassword, confirmPassword);
      setSuccess('Password changed successfully. Please login again.');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="change-password-card">
        <h2 className="change-password-title">Change Password</h2>

        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />

            {/* ===== ADD ONLY: STRENGTH UI ===== */}
            <div className="strength-bar">
              <div
                className={`strength-fill ${strengthLabel.toLowerCase()}`}
                style={{ width: `${(strengthCount / 5) * 100}%` }}
              />
            </div>

            <p className={`strength-text ${strengthLabel.toLowerCase()}`}>
              Password Strength: {strengthLabel}
            </p>

            <ul className="password-rules">
              <li className={passwordRules.length ? "ok" : ""}>✔ Minimum 8 characters</li>
              <li className={passwordRules.upper ? "ok" : ""}>✔ One uppercase letter</li>
              <li className={passwordRules.lower ? "ok" : ""}>✔ One lowercase letter</li>
              <li className={passwordRules.number ? "ok" : ""}>✔ One number</li>
              <li className={passwordRules.special ? "ok" : ""}>✔ One special character</li>
            </ul>
            {/* ===== END ADD ===== */}
          </div>

          <div className="input-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter your password"
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
