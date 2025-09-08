import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import Swal from 'sweetalert2';
import { authGet, authPost, baseURL } from '../../services/api';
import '../CSS/PracticalExam.css';

// Constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;
const VM_CHECK_INTERVAL = 8000;
const VM_CHECK_INTERVAL_SLOW = 10000;
// Preloader time set to 2 minutes = 120 seconds
const PRELOADER_MAX_TIME = 120;

export default function PracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // UI state
  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Initializing...');
  const [vmStatus, setVmStatus] = useState('checking'); // not_created / starting / running / error
  const [vmErrorDetails, setVmErrorDetails] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preloader & start overlay
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderTimeLeft, setPreloaderTimeLeft] = useState(PRELOADER_MAX_TIME);
  const [startPromptVisible, setStartPromptVisible] = useState(true); // overlay prompting student to click to start
  const [examClickedToStart, setExamClickedToStart] = useState(false);

  // Terminal state
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  // Refs
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const websocket = useRef(null);

  const timerRef = useRef(null);
  const preloaderInterval = useRef(null);
  const vmCheckInterval = useRef(null);
  const reconnectTimer = useRef(null);
  const sshReadyCheckTimer = useRef(null);

  const isMounted = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const isWebSocketConnectedRef = useRef(false);
  const sessionEndTime = useRef(null);
  const vmStatusCheckCounter = useRef(0);

  // Helpers
  const formatTime = (sec) => {
    if (typeof sec !== 'number' || sec < 0) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- Backend SSH readiness check ---
  const checkSshReady = useCallback(async () => {
    if (!session || !session.ssh_port) return false;
    try {
      const res = await authGet(`/api/practical-sessions/${sessionId}/check_ssh/`);
      return Boolean(res && res.ready);
    } catch (err) {
      console.error('checkSshReady error:', err);
      return false;
    }
  }, [session, sessionId]);

  // --- Preloader countdown ---
  useEffect(() => {
    if (!showPreloader) return;
    preloaderInterval.current = setInterval(() => {
      setPreloaderTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(preloaderInterval.current);
          waitSshThenConnect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (preloaderInterval.current) clearInterval(preloaderInterval.current);
    };
  }, [showPreloader]);

  // --- Load session & exam ---
  useEffect(() => {
    isMounted.current = true;
    const load = async () => {
      try {
        setLoading(true);
        const s = await authGet(`/api/practical-sessions/${sessionId}/`);
        if (!isMounted.current) return;
        setSession(s);

        if (s.exam) {
          const examData = await authGet(`/api/practical-exams/${s.exam}/`);
          setExam(examData);

          // compute remainingTime from server-provided start_time if available
          if (s.start_time && examData?.duration_minutes) {
            const start = new Date(s.start_time);
            const end = new Date(start.getTime() + examData.duration_minutes * 60000);
            sessionEndTime.current = end;
            const secs = Math.max(0, Math.floor((end - new Date()) / 1000));
            setRemainingTime(secs);
          }
        }

        // Set vmStatus from session
        if (s.status === 'running') {
          setVmStatus('running');
          // Hide start overlay if server already started session
          setStartPromptVisible(false);
          setExamClickedToStart(true);
          // Immediately attempt ssh -> websocket connection
          const ready = await checkSshReady();
          if (ready) {
            setShowPreloader(false);
            initWebSocketSafely();
          } else {
            // start waiting/checking flow
            waitSshThenConnect();
          }
        } else if (s.status === 'failed' || s.status === 'terminated') {
          setVmStatus('error');
          setVmErrorDetails(s.termination_reason || s.startup_log || 'VM failed');
          setShowPreloader(false);
        } else {
          setVmStatus('starting');
          startVmStatusPolling();
        }

        setLoading(false);
      } catch (err) {
        console.error('load session error', err);
        setError(err.message || 'Failed to load session');
        setLoading(false);
      }
    };

    load();

    return () => {
      isMounted.current = false;
      cleanupAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // --- Terminal initialization (xterm) ---
  useEffect(() => {
    if (!terminalRef.current || !exam) return;

    if (terminal.current) {
      // Terminal exists: show messages depending on vmStatus
      terminal.current.clear();
      if (vmStatus === 'error') {
        terminal.current.writeln(`\r\n❌ VM Error: ${vmErrorDetails || 'Failed to start VM'}\r\n`);
      } else {
        terminal.current.writeln('\r\n⏳ Waiting for VM or connecting...\r\n');
      }
      return;
    }

    terminal.current = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 14,
      disableStdin: false,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' }
    });
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);

    const container = terminalRef.current;
    terminal.current.open(container);
    setTimeout(() => {
      try { fitAddon.current.fit(); } catch (e) { /* ignore */ }
    }, 100);

    const onResize = () => {
      try { fitAddon.current && fitAddon.current.fit(); } catch (e) { /* ignore */ }
    };
    window.addEventListener('resize', onResize);

    // keystroke handler: first keystroke will start exam (if overlay present)
    terminal.current.onData(async (data) => {
      if (!examClickedToStart) {
        // treat first interaction as "start exam" trigger
        startExamInteractionHandler();
      }
      try {
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
          // send raw bytes/text directly (backend consumer should forward to SSH channel)
          websocket.current.send(data);
        } else {
          // local echo fallback
          terminal.current.write(data);
        }
      } catch (e) {
        console.error('terminal onData send error', e);
      }
    });

    setIsTerminalReady(true);

    return () => {
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [terminalRef, exam, vmStatus, vmErrorDetails]);

  // --- Timer countdown ---
  useEffect(() => {
    if (!sessionEndTime.current) return;
    
    timerRef.current = setInterval(() => {
      const now = new Date();
      const secs = Math.max(0, Math.floor((sessionEndTime.current - now) / 1000));
      setRemainingTime(secs);
      
      if (secs === 0) {
        clearInterval(timerRef.current);
        // Auto-submit when time is up
        submitExam(true);
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionEndTime.current]);

  // --- When preloader hides & VM running & terminal ready -> auto connect WS ---
  useEffect(() => {
    if (!showPreloader && vmStatus === 'running' && isTerminalReady) {
      // ensure we attempt connect once after a short delay (let terminal settle)
      const t = setTimeout(async () => {
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) return;
        const ready = await checkSshReady();
        if (ready) {
          initWebSocketSafely();
          setShowPreloader(false);
        } else {
          waitSshThenConnect();
        }
      }, 200);
      return () => clearTimeout(t);
    }
  }, [showPreloader, vmStatus, isTerminalReady, checkSshReady]);

  // --- VM status polling ---
  const startVmStatusPolling = useCallback(() => {
    if (vmCheckInterval.current) clearInterval(vmCheckInterval.current);
    vmStatusCheckCounter.current = 0;

    // immediate check
    (async () => {
      try {
        const res = await authGet(`/api/practical-sessions/${sessionId}/vm_status/`);
        if (res && res.status) {
          setVmStatus(res.status);
          if (res.status === 'running') {
            const updated = await authGet(`/api/practical-sessions/${sessionId}/`);
            setSession(updated);
            waitSshThenConnect();
          }
        }
      } catch (e) {
        console.error('vm status initial check failed', e);
      }
    })();

    vmCheckInterval.current = setInterval(async () => {
      if (!isMounted.current) return;
      try {
        const res = await authGet(`/api/practical-sessions/${sessionId}/vm_status/`);
        if (res && res.status) {
          setVmStatus(res.status);
          if (res.status === 'running') {
            if (!session || session.status !== 'running') {
              const updated = await authGet(`/api/practical-sessions/${sessionId}/`);
              setSession(updated);
              waitSshThenConnect();
            }
          }
        }
      } catch (e) {
        console.error('vm status poll failed', e);
      }

      vmStatusCheckCounter.current += 1;
      if (vmStatusCheckCounter.current === 6) {
        clearInterval(vmCheckInterval.current);
        vmCheckInterval.current = setInterval(async () => {
          if (!isMounted.current) return;
          try {
            const slowRes = await authGet(`/api/practical-sessions/${sessionId}/vm_status/`);
            if (slowRes && slowRes.status) setVmStatus(slowRes.status);
          } catch (e) {
            console.error('vm slow poll failed', e);
          }
        }, VM_CHECK_INTERVAL_SLOW);
      }
    }, VM_CHECK_INTERVAL);
  }, [sessionId, session]);

  // wait for ssh then call checkVmSmoothness()
  async function waitSshThenConnect() {
    let tries = 0;
    const maxTries = 30;
    while (tries < maxTries && isMounted.current) {
      const ready = await checkSshReady();
      if (ready) {
        // If the overlay is still visible, hide it (student may not have clicked yet)
        setShowPreloader(false);
        setStartPromptVisible(false);
        initWebSocketSafely();
        return;
      }
      tries += 1;
      await new Promise(r => setTimeout(r, 2000));
    }
    // fallback - show VM message and stop preloader
    setShowPreloader(false);
    setVmErrorDetails('SSH did not become reachable within expected time.');
  }

  // --- WebSocket init (safe wrapper) ---
  const initWebSocketSafely = () => {
    try {
      initWebSocket();
    } catch (e) {
      console.error('initWebSocketSafely error', e);
    }
  };

  // initWebSocket implementation
  const initWebSocket = useCallback(() => {
    if (!session || !session.token) {
      console.warn('No session or token to open websocket');
      return;
    }

    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) return;

    // close any existing
    try { websocket.current && websocket.current.close(); } catch (_) {}
    websocket.current = null;

    const isSecure = baseURL.startsWith('https');
    const wsProtocol = isSecure ? 'wss' : 'ws';
    const host = baseURL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const token = encodeURIComponent(session.token);
    const wsUrl = `${wsProtocol}://${host}/ws/practical/${sessionId}/?token=${token}`;

    setConnectionStatus('Connecting to terminal...');
    terminal.current && terminal.current.writeln('\r\n🔌 Connecting to exam environment...\r\n');

    try {
      websocket.current = new WebSocket(wsUrl);
      try { websocket.current.binaryType = 'arraybuffer'; } catch (_) {}
    } catch (e) {
      console.error('WebSocket creation failed:', e);
      setConnectionStatus('Failed to create WebSocket');
      return;
    }

    websocket.current.onopen = () => {
      reconnectAttemptsRef.current = 0;
      isWebSocketConnectedRef.current = true;
      setConnectionStatus('Connected to terminal');
      setShowPreloader(false);
      terminal.current && terminal.current.writeln('\r\nYou can now begin your exam. Good luck!\r\n');
      // nudge the shell
      setTimeout(() => {
        try { websocket.current && websocket.current.readyState === WebSocket.OPEN && websocket.current.send('\n'); } catch (_) {}
      }, 300);
    };

    websocket.current.onerror = (ev) => {
      console.error('WebSocket error', ev);
      isWebSocketConnectedRef.current = false;
      setConnectionStatus('Terminal connection error');
      terminal.current && terminal.current.writeln('\r\n❌ Connection error\r\n');
    };

    websocket.current.onclose = (ev) => {
      console.warn('WebSocket closed', ev);
      isWebSocketConnectedRef.current = false;
      setConnectionStatus(`Terminal disconnected: ${ev.reason || 'Unknown'}`);
      terminal.current && terminal.current.writeln(`\r\n🔌 Connection closed: ${ev.reason || 'Unknown'}\r\n`);

      // Try to reconnect if VM still running
      if (vmStatus === 'running' && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const attemptsLeft = MAX_RECONNECT_ATTEMPTS - reconnectAttemptsRef.current;
        terminal.current && terminal.current.writeln(`\r\nAttempting to reconnect... (${attemptsLeft} attempts left)\r\n`);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(async () => {
          const ready = await checkSshReady();
          if (ready) initWebSocketSafely();
          else if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectTimer.current = setTimeout(initWebSocketSafely, RECONNECT_INTERVAL);
          }
        }, RECONNECT_INTERVAL);
      }
    };

    websocket.current.onmessage = (ev) => {
      if (!terminal.current) return;

      const deliverText = (text) => {
        try {
          const parsed = JSON.parse(text);
          if (parsed && parsed.type === 'output' && typeof parsed.data === 'string') {
            terminal.current.write(parsed.data);
            setShowPreloader(false);
            return;
          }
        } catch (e) { /* not JSON */ }
        terminal.current.write(text);
        setShowPreloader(false);
      };

      try {
        if (ev.data instanceof ArrayBuffer) {
          const decoder = new TextDecoder();
          const txt = decoder.decode(ev.data);
          deliverText(txt);
        } else if (typeof ev.data === 'string') {
          deliverText(ev.data);
        } else if (ev.data instanceof Blob) {
          ev.data.arrayBuffer().then(buf => {
            const decoder2 = new TextDecoder();
            const txt = decoder2.decode(buf);
            deliverText(txt);
          }).catch(e => console.error('blob->arrayBuffer error', e));
        } else {
          deliverText(String(ev.data));
        }
      } catch (err) {
        console.error('onmessage processing error', err);
      }
    };
  }, [session, sessionId, vmStatus, checkSshReady]);

  // --- Submit (verify) ---
  const submitExam = async (isAutomatic = false) => {
    if (!session || isSubmitting) return;
    if (!isAutomatic) {
      const result = await Swal.fire({
        title: 'Submit Exam?',
        html: `
          <p>Are you sure you want to submit your exam?</p>
          <p><strong>This action cannot be undone.</strong></p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Submit',
        cancelButtonText: 'Cancel'
      });
      if (!result.isConfirmed) return;
    }

    setIsSubmitting(true);
    try {
      cleanupAll(); // close ws, timers
      await authPost(`/api/practical-sessions/${session.id}/verify/`, {});
      
      // Navigate to result page immediately
      navigate(`/student/practical-results/${session.id}`, {
        state: {
          pendingVerification: true,
          message: 'Verification started. You will get an email when result is ready.'
        }
      });
    } catch (err) {
      console.error('submitExam error', err);
      setError('Failed to submit exam: ' + (err.message || err));
      setIsSubmitting(false);
    }
  };

  // --- Start exam interaction (called on first click or keypress) ---
  const startExamInteraction = useCallback(async () => {
    if (examClickedToStart) return;
    setExamClickedToStart(true);
    setStartPromptVisible(false);

    // Try to call server start endpoint if present
    try {
      // Fixed endpoint - use the correct URL pattern
      const res = await authPost(`/api/practical-sessions/${sessionId}/start_vm/`, {});
      if (res && res.id) {
        setSession(res);
        if (res.status === 'running') {
          setVmStatus('running');
        }
        // compute remaining time if server returned start_time
        if (res.start_time && exam?.duration_minutes) {
          const start = new Date(res.start_time);
          const end = new Date(start.getTime() + exam.duration_minutes * 60000);
          sessionEndTime.current = end;
          setRemainingTime(Math.max(0, Math.floor((end - new Date()) / 1000)));
        }
      }
    } catch (e) {
      // silently fallback to client-side start (no server start endpoint)
      console.warn('server-side start not available', e);
      if (exam?.duration_minutes) {
        const now = new Date();
        const end = new Date(now.getTime() + exam.duration_minutes * 60000);
        sessionEndTime.current = end;
        setRemainingTime(Math.max(0, Math.floor((end - new Date()) / 1000)));
      }
    }

    // Hide preloader and attempt to connect if VM already ready
    setShowPreloader(false);
    if (vmStatus === 'running') {
      const ready = await checkSshReady();
      if (ready) initWebSocketSafely();
      else waitSshThenConnect();
    } else {
      startVmStatusPolling();
    }
  }, [exam, examClickedToStart, sessionId, vmStatus, checkSshReady]);

  const startExamInteractionHandler = () => {
    startExamInteraction().catch(e => console.error('startExamInteraction error', e));
  };

  // --- Manual refresh ---
  const refreshSession = async () => {
    try {
      setLoading(true);
      const s = await authGet(`/api/practical-sessions/${sessionId}/`);
      setSession(s);
      setLoading(false);
      if (s.status === 'running') {
        setVmStatus('running');
        waitSshThenConnect();
      } else {
        startVmStatusPolling();
      }
    } catch (e) {
      setLoading(false);
      setError('Failed to refresh session: ' + (e.message || e));
    }
  };

  // --- Restart VM handler ---
  const restartVm = async () => {
    try {
      setConnectionStatus('Restarting VM...');
      setVmStatus('starting');
      setVmErrorDetails(null);
      setShowPreloader(true);
      setPreloaderTimeLeft(PRELOADER_MAX_TIME);
      isWebSocketConnectedRef.current = false;
      reconnectAttemptsRef.current = 0;
      cleanupWebsocketOnly();

      await authPost(`/api/practical-sessions/${sessionId}/restart_vm/`, {});
      const updated = await authGet(`/api/practical-sessions/${sessionId}/`);
      setSession(updated);
      vmStatusCheckCounter.current = 0;
      startVmStatusPolling();
    } catch (err) {
      console.error('Restart failed', err);
      setConnectionStatus('Restart failed');
      setVmStatus('error');
      setVmErrorDetails(err.message || 'Failed to restart VM');
      setShowPreloader(false);
      terminal.current && terminal.current.writeln(`\r\n❌ Restart failed: ${err?.message || err}\r\n`);
    }
  };

  // --- Cleanup helpers ---
  const cleanupWebsocketOnly = () => {
    try { websocket.current && websocket.current.close(); } catch (_) {}
    websocket.current = null;
    isWebSocketConnectedRef.current = false;
    reconnectAttemptsRef.current = 0;
    try { if (reconnectTimer.current) clearTimeout(reconnectTimer.current); } catch (_) {}
  };

  const cleanupAll = () => {
    cleanupWebsocketOnly();
    try { if (timerRef.current) clearInterval(timerRef.current); } catch (_) {}
    try { if (preloaderInterval.current) clearInterval(preloaderInterval.current); } catch (_) {}
    try { if (vmCheckInterval.current) clearInterval(vmCheckInterval.current); } catch (_) {}
    try { if (sshReadyCheckTimer.current) clearTimeout(sshReadyCheckTimer.current); } catch(_) {}
  };

  // Unmount cleanup
  useEffect(() => {
    return () => {
      isMounted.current = false;
      cleanupAll();
    };
  }, []);

  // --- Render UI ---
  if (loading) return <div className="practical-loading">Loading exam environment...</div>;

  if (error) {
    return (
      <div className="practical-error">
        <p>{error}</p>
        <button className="practical-back-btn" onClick={() => navigate('/student')}>Go Back</button>
      </div>
    );
  }

  const Preloader = () => (
    <div className="practical-preloader">
      <div className="practical-preloader-content">
        <div className="practical-preloader-spinner">
          <div className="practical-preloader-dot" />
          <div className="practical-preloader-dot" />
          <div className="practical-preloader-dot" />
          <div className="practical-preloader-dot" />
          <div className="practical-preloader-dot" />
        </div>
        <h2>Preparing Your Exam Environment</h2>
        <p>Please wait while we set up your virtual machine. This may take a few minutes.</p>
        <div className="practical-preloader-time">Time remaining: {formatTime(preloaderTimeLeft)}</div>
        <div className="practical-preloader-tips">
          <h3>Tips for a successful exam:</h3>
          <ul>
            <li>Ensure you have a stable internet connection</li>
            <li>Do not refresh the page during the exam</li>
            <li>Read all instructions carefully before starting</li>
            <li>Manage your time wisely</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const StartPrompt = () => (
    <div
      className="practical-start-overlay"
      onClick={(e) => { e.stopPropagation(); startExamInteractionHandler(); }}
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        zIndex: 40,
        color: '#fff'
      }}
    >
      <div style={{
        textAlign: 'center',
        padding: '28px',
        borderRadius: '8px',
        background: 'rgba(30,30,30,0.95)',
        boxShadow: '0 6px 30px rgba(0,0,0,0.6)'
      }}>
        <h2 style={{ marginBottom: 12 }}>Ready to start your exam?</h2>
        <p style={{ marginBottom: 18 }}>
          Click anywhere on this box or press any key in the terminal to begin. Your exam timer will start immediately.
        </p>
        <button
          className="practical-btn practical-start-btn"
          onClick={(ev) => { ev.stopPropagation(); startExamInteractionHandler(); }}
          style={{ padding: '10px 18px', fontSize: 16 }}
        >
          Start Exam
        </button>
      </div>
    </div>
  );

  if (showPreloader) return <Preloader />;

  return (
    <div className="practical-container" style={{ position: 'relative' }} onClick={() => {
      if (!examClickedToStart && startPromptVisible) startExamInteractionHandler();
    }}>
      <div className="practical-header">
        <div className="practical-header-content">
          <div className="practical-header-info">
            <h2>{exam?.title || 'Practical Exam'}</h2>
            <div className="practical-header-status">
              <span className="practical-time">Time Left: {formatTime(remainingTime)}</span>
              <span className="practical-vm-status">VM Status: <span className={`status-${vmStatus}`}>{vmStatus}</span></span>
            </div>
          </div>

          <div className="practical-header-actions">
            <button className="practical-btn practical-toggle-instructions" onClick={() => { /* toggle handled elsewhere if needed */ }}>
              { /* placeholder */ } Instructions
            </button>
            <button className="practical-btn practical-refresh-btn" onClick={refreshSession}>Refresh</button>
            <button className="practical-btn practical-restart-btn" onClick={restartVm} disabled={vmStatus === 'starting'}>
              {vmStatus === 'starting' ? 'Restarting...' : 'Restart VM'}
            </button>
            <button className="practical-btn practical-submit-btn" onClick={() => submitExam(false)} disabled={!session || session.status !== 'running' || isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      <div className="practical-main">
        <div className="practical-instructions">
          <div className="practical-instructions-content">
            <h3>Exam Instructions</h3>
            <div className="practical-instructions-text">
              {exam?.description || 'Follow the instructions provided by your instructor.'}
            </div>
            {exam?.verification_command && (
              <div className="practical-verification">
                <h4>Verification Command:</h4>
                <code>{exam.verification_command}</code>
              </div>
            )}
            {vmStatus === 'error' && (
              <div className="practical-error-panel">
                <h4>VM Error</h4>
                <p>{vmErrorDetails || 'The virtual machine failed to start properly.'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="practical-terminal-container" style={{ position: 'relative' }}>
          <div className="practical-terminal-header">
            <span>Terminal</span>
            <div className="practical-terminal-actions">
              <button className="practical-btn practical-reconnect-btn" onClick={() => initWebSocketSafely()} disabled={vmStatus !== 'running'}>
                Reconnect
              </button>
            </div>
          </div>

          <div className="practical-terminal-body" style={{ position: 'relative' }}>
            <div
              ref={terminalRef}
              className="practical-terminal"
              style={{ width: '100%', height: '520px', cursor: startPromptVisible ? 'pointer' : 'text' }}
              onClick={(e) => { e.stopPropagation(); if (!examClickedToStart && startPromptVisible) startExamInteractionHandler(); }}
            />

            {startPromptVisible && !examClickedToStart && (
              <div style={{
                position: 'absolute',
                left: 0, right: 0, top: 0, bottom: 0,
                zIndex: 30,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none'
              }}>
                <div style={{ pointerEvents: 'auto' }}>
                  <StartPrompt />
                </div>
              </div>
            )}
          </div>

          <div className="practical-terminal-status">Status: {connectionStatus}</div>
        </div>
      </div>
    </div>
  );
}