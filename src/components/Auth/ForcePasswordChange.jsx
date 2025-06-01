import React, { useState } from 'react';
import { changePassword } from '../../services/auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await changePassword(newPassword, confirmPassword);
      setSuccess('Password changed successfully. Please login again.');
      logout();
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border shadow rounded bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center">Change Password</h2>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
      <form onSubmit={handleSubmit}>
        <label className="block mb-2">
          New Password
          <input
            type="password"
            className="w-full p-2 border mt-1 rounded"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className="block mb-2 mt-4">
          Confirm Password
          <input
            type="password"
            className="w-full p-2 border mt-1 rounded"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
        >
          Change Password
        </button>
      </form>
    </div>
  );
}
