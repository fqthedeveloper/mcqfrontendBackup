import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { WebglAddon } from "xterm-addon-webgl";
import Swal from "sweetalert2";
import "xterm/css/xterm.css";
import "./practical.css";

const baseURL = "http://localhost:8000";

export default function StudentPracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const terminalRef = useRef(null);
  const socketRef = useRef(null);
  const termRef = useRef(null);
  const fitAddonRef = useRef(null);
  const webglAddonRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  

  // =====================================================
  // 🔒 LOCK BROWSER BACK BUTTON
  // =====================================================
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const blockNavigation = () => {
      window.history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", blockNavigation);

    return () => {
      window.removeEventListener("popstate", blockNavigation);
    };
  }, []);

  // =====================================================
  // 🔒 PREVENT PAGE RELOAD / CLOSE
  // =====================================================
  useEffect(() => {
    const beforeUnload = (e) => {
      if (session && session.status === "running") {
        e.preventDefault();
        e.returnValue = "Exam is running. Are you sure?";
      }
    };

    window.addEventListener("beforeunload", beforeUnload);

    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [session]);

  // =====================================================
  // SUBMIT FUNCTION (UNCHANGED)
  // =====================================================
  const submitExam = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${baseURL}/api/practical/sessions/${sessionId}/submit/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );

      const data = await response.json();

      localStorage.removeItem(`exam_end_time_${sessionId}`);

      navigate(`/student/practical/result/${sessionId}`, {
        replace: true,
        state: data,
      });
    } catch (err) {
      setSubmitting(false);
      alert("Submission Error: " + err.message);
    }
  }, [sessionId, navigate, submitting]);

  // =====================================================
  // LOAD SESSION + BLOCK IF SUBMITTED
  // =====================================================
  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${baseURL}/api/practical/sessions/${sessionId}/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then((r) => r.json())
      .then((res) => {

        // 🚨 If already submitted → redirect
        if (res.status === "submitted") {
          navigate(`/student/practical/result/${sessionId}`, { replace: true });
          return;
        }

        setSession(res);

        const storageKey = `exam_end_time_${sessionId}`;
        let endTime = localStorage.getItem(storageKey);

        if (!endTime) {
          endTime = Date.now() + res.duration * 60 * 1000;
          localStorage.setItem(storageKey, endTime);
        }

        const remaining = Math.max(
          0,
          Math.floor((endTime - Date.now()) / 1000)
        );

        setTimeLeft(remaining);
      });
  }, [sessionId, navigate]);

  // =====================================================
  // TIMER (CONTINUE NOT RESTART)
  // =====================================================
  useEffect(() => {
    if (timeLeft === null) return;

    const interval = setInterval(() => {
      const storageKey = `exam_end_time_${sessionId}`;
      const endTime = parseInt(localStorage.getItem(storageKey), 10);

      const remaining = Math.max(
        0,
        Math.floor((endTime - Date.now()) / 1000)
      );

      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        submitExam();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, submitExam, timeLeft]);

  // =====================================================
  // TERMINAL (UNCHANGED)
  // =====================================================
  useEffect(() => {
    if (!session || !terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: window.innerWidth < 768 ? 12 : 16,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: { background: "#000000", foreground: "#ffffff" },
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    setTimeout(() => {
        try {
          fitAddon.fit();
        } catch {}
      }, 100);

    try {
      const webglAddon = new WebglAddon();
      term.loadAddon(webglAddon);
      webglAddonRef.current = webglAddon;
    } catch {}

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    const protocol =
      window.location.protocol === "https:" ? "wss" : "ws";

    const ws = new WebSocket(
      `${protocol}://localhost:8000/ws/practical/terminal/${sessionId}/?token=${localStorage.getItem("token")}`
    );

    socketRef.current = ws;

    ws.onmessage = (e) => term.write(e.data);
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (webglAddonRef.current) {
        try { webglAddonRef.current.dispose(); } catch {}
      }
      if (termRef.current) {
        try { termRef.current.dispose(); } catch {}
      }
    };
  }, [session, sessionId]);

  useEffect(() => {
  const handleResize = () => {
    try {
      if (fitAddonRef.current && terminalRef.current) {
        setTimeout(() => {
          try {
            fitAddonRef.current.fit();
          } catch (e) {}
        }, 100);
      }
    } catch (e) {}
  };

  window.addEventListener("resize", handleResize);

  return () => {
    window.removeEventListener("resize", handleResize);
  };
}, []);

  useEffect(() => {
    document.title = session ? `${session.title} - Practical Exam` : "Loading Exam...";
  }, [session]);

  // ================= SAFE REMINDER POPUPS =================
const shownWarnings = useRef({
  five: false,
  one: false,
});

useEffect(() => {
  if (typeof timeLeft !== "number") return; // safety

  const minutes = Math.floor(timeLeft / 60);

  // 5 minute warning
  if (minutes === 5 && !shownWarnings.current.five) {
    shownWarnings.current.five = true;

    Swal.fire({
      icon: "warning",
      title: "5 Minutes Remaining",
      text: "Only 5 minutes left to complete your exam.",
      timer: 5000,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
  }

  // 1 minute warning
  if (minutes === 1 && !shownWarnings.current.one) {
    shownWarnings.current.one = true;

    Swal.fire({
      icon: "error",
      title: "1 Minute Remaining",
      text: "Only 1 minute left! Please submit now.",
      timer: 5000,
      showConfirmButton: false,
      allowOutsideClick: false,
    });
  }

}, [timeLeft]);



  if (!session || timeLeft === null)
    return <div className="loading-screen">Starting VM...</div>;

  return (
    <div className="exam-mode-wrapper">

      {submitting && (
        <div className="verification-overlay">
          <div className="verification-box">
            <div className="spinner"></div>
            <h3>Verifying Your Exam...</h3>
            <p>Please wait while we evaluate your answers.</p>
          </div>
        </div>
      )}

      <div className="exam-status-bar">
        <div>
          <span className="live-indicator">● LIVE EXAM</span>
          <span className="exam-name">{session.title}</span>
        </div>
        <div className={`exam-timer ${timeLeft < 60 ? "critical" : ""}`}>
          ⏱ {Math.floor(timeLeft / 60)}:
          {String(timeLeft % 60).padStart(2, "0")}
        </div>
      </div>

      <div className="exam-content-area">
        <div className="instruction-panel">
          <div className="panel-header">Instructions</div>
          <div className="panel-body">
          <div
            className="instruction-content"
            dangerouslySetInnerHTML={{ __html: session.description }}
          />
        </div>
        </div>

        <div className="terminal-panel">
          <div className="terminal-window-chrome">
            <div className="window-dots">
              <span className="dot-close"></span>
              <span className="dot-min"></span>
              <span className="dot-max"></span>
            </div>
            <div className="window-title">root@exam:~</div>
          </div>
          <div ref={terminalRef} className="xterm-container-mount" />
        </div>
      </div>

      <div className="exam-action-bar">
        <div className="safety-note">
          Environment: <b>Practical Mode Active</b>
        </div>

        <button
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="submit-practical-btn"
        >
          {submitting ? "Verifying..." : "Submit Exam"}
        </button>
      </div>

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Submit Practical Exam?</h3>
            <p>Once submitted, you cannot return to the exam.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  submitExam();
                }}
                className="btn-confirm"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
