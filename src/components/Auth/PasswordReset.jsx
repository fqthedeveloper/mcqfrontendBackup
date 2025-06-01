// src/components/Auth/PasswordReset.js
import React, { useState } from 'react';
import { resetPassword } from '../../services/auth'; // Fixed import

export default function PasswordReset() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword(email);
      setMessage('Password reset instructions sent to your email');
    } catch (err) {
      setError('Failed to reset password');
    }
  };

  return (
    <div className="auth-form">
      <h2>Password Reset</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}