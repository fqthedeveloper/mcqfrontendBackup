import React, { useState, useEffect } from "react";
import { forgotPassword } from "../../services/auth";
import "../../styles/components/auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setMsg("");

    try {
      await forgotPassword(email);
      setMsg("Password reset link sent to your email");
    } catch (error) {
      setErr(error?.error || "Password reset not allowed");
    }
  };

  useEffect(() => {
    document.title = "Forgot Password";
  }, []);  

  return (
    <div className="auth-container">
      <form className="auth-box" onSubmit={submit}>
        <h2>Forgot Password</h2>

        {msg && <p className="success">{msg}</p>}
        {err && <p className="error">{err}</p>}

        <input
          type="email"
          placeholder="Registered Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <button type="submit">Send Reset Link</button>
      </form>
    </div>
  );
}
