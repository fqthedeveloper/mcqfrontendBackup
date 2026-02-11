import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import "xterm/css/xterm.css";
import "./practical.css";

const baseURL = "http://localhost:8000";

export default function StudentPracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const socketRef = useRef(null);
  
  const alertsShown = useRef({ ten: false, five: false, one: false });

  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- IMPROVED SUBMIT HANDLER ---
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    // Prevent double-clicks
    if (submitting) return;

    console.log("Submit triggered. AutoSubmit:", autoSubmit);

    if (!autoSubmit) {
      const result = await Swal.fire({
        title: "Submit Practical?",
        text: "Your environment will be verified. This cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#2563eb",
        confirmButtonText: "Yes, Submit Now",
      });
      if (!result.isConfirmed) return;
    }

    // Lock the button
    setSubmitting(true);
    
    Swal.fire({
      title: "Verifying Lab...",
      html: "Checking system configuration. Please wait...",
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
    });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${baseURL}/api/practical/sessions/${sessionId}/submit/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Token ${token}` 
        },
      });
      
      const data = await res.json();
      console.log("Server Response:", data);

      if (!res.ok) throw new Error(data.detail || "Verification failed");

      // Success Path
      localStorage.removeItem(`exam_end_time_${sessionId}`);
      Swal.close();
      navigate(`/student/practical/result/${sessionId}`, { state: data });

    } catch (err) {
      console.error("Submission Error:", err);
      Swal.fire({
        title: "Error",
        text: err.message || "Connection to server failed.",
        icon: "error"
      });
      // Re-enable the button so user can try again
      setSubmitting(false);
    }
  }, [sessionId, navigate, submitting]);

  // --- TIMER LOGIC ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${baseURL}/api/practical/sessions/${sessionId}/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        setSession(res);
        const storageKey = `exam_end_time_${sessionId}`;
        let endTime = localStorage.getItem(storageKey);

        if (!endTime) {
          endTime = Date.now() + res.duration * 60 * 1000;
          localStorage.setItem(storageKey, endTime);
        }
        setTimeLeft(Math.max(0, Math.floor((endTime - Date.now()) / 1000)));
      });
  }, [sessionId]);

  useEffect(() => {
    if (timeLeft === null) return;

    const timer = setInterval(() => {
      const storageKey = `exam_end_time_${sessionId}`;
      const endTime = parseInt(localStorage.getItem(storageKey));
      const newRemaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      
      setTimeLeft(newRemaining);

      // Alert checks
      if (newRemaining === 600 && !alertsShown.current.ten) {
        alertsShown.current.ten = true;
        Swal.fire({ title: "10 Mins Left", icon: "info", toast: true, position: 'top-end', timer: 3000 });
      }
      if (newRemaining === 300 && !alertsShown.current.five) {
        alertsShown.current.five = true;
        Swal.fire({ title: "5 Minutes Left!", icon: "warning" });
      }

      if (newRemaining <= 0) {
        clearInterval(timer);
        handleSubmit(true); 
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, sessionId, handleSubmit]);

  // --- TERMINAL SETUP ---
  useEffect(() => {
    if (!session || !terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: "#000000" },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    xtermInstance.current = term;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${protocol}://localhost:8000/ws/practical/terminal/${sessionId}/?token=${localStorage.getItem("token")}`);
    socketRef.current = ws;

    ws.onmessage = (e) => {
      if (e.data instanceof ArrayBuffer) term.write(new Uint8Array(e.data));
      else term.write(e.data);
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    return () => {
      if (socketRef.current) socketRef.current.close();
      term.dispose();
    };
  }, [session, sessionId]);

  if (!session || timeLeft === null) return <div className="loading">Connecting...</div>;

  return (
    <div className="exam-mode-wrapper">
      <div className="exam-status-bar">
        <div className="exam-info">
          <span className="live-indicator">● LIVE EXAM</span>
          <span>{session.title}</span>
        </div>
        <div className={`exam-timer ${timeLeft < 60 ? 'critical' : ''}`}>
          ⏱ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>

      <div className="exam-content-area">
        <div className="instruction-panel">
          <div className="panel-header">Instructions</div>
          <div className="panel-body">
            {session.description.split("\n").map((l, i) => <p key={i}>{l}</p>)}
          </div>
        </div>

        <div className="terminal-panel">
          <div className="terminal-window-chrome">
            <div className="window-dots"><span className="dot-close"></span><span className="dot-min"></span><span className="dot-max"></span></div>
            <div className="window-title">bash — {session.user_display}</div>
          </div>
          <div ref={terminalRef} className="xterm-container-mount" />
        </div>
      </div>

      <div className="exam-action-bar">
        <div className="status-note">Status: <b>Environment Active</b></div>
        <button 
          onClick={() => handleSubmit(false)} 
          disabled={submitting} 
          className="submit-practical-btn"
          style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
        >
          {submitting ? "Verifying..." : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}