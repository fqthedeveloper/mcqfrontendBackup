import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { resetPasswordWithToken } from "../../services/auth";
import "../../styles/components/auth.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    if (password !== confirm) {
      setErr("Passwords do not match");
      return;
    }

    try {
      await resetPasswordWithToken(token, password);
      setMsg("Password reset successful");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setErr(error?.error || "Invalid or expired link");
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={submit}>
        <h2>Set New Password</h2>

        {msg && <p className="success">{msg}</p>}
        {err && <p className="error">{err}</p>}

        <input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}
