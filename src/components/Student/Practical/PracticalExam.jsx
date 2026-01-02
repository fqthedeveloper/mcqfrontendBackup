import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import Swal from 'sweetalert2';
import { authGet, authPost, baseURL } from '../../../services/api';
import '../../../styles/CSS/PracticalExam.css';

// Constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;
const VM_CHECK_INTERVAL = 5000;

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
  const [vmStatus, setVmStatus] = useState('checking');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderTimeLeft, setPreloaderTimeLeft] = useState(120);

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

  const isMounted = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const sessionEndTime = useRef(null);

  // Helpers
  const formatTime = (sec) => {
    if (typeof sec !== 'number' || sec < 0) return '00:00';
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // SSH readiness check
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

  // Load session and exam
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

          // Compute remaining time
          if (s.start_time && examData?.duration_minutes) {
            const start = new Date(s.start_time);
            const end = new Date(start.getTime() + examData.duration_minutes * 60000);
            sessionEndTime.current = end;
            const secs = Math.max(0, Math.floor((end - new Date()) / 1000));
            setRemainingTime(secs);
          }
        }

        // Set initial VM status
        if (s.status === 'running') {
          setVmStatus('running');
          setShowPreloader(false);
          // Wait a bit then try to connect
          setTimeout(() => {
            initWebSocket();
          }, 1000);
        } else if (s.status === 'failed') {
          setVmStatus('error');
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
  }, [sessionId]);

  // Terminal initialization
  useEffect(() => {
    if (!terminalRef.current || !exam) return;

    if (terminal.current) {
      terminal.current.clear();
      if (vmStatus === 'error') {
        terminal.current.writeln(`\r\n❌ VM Error: Failed to start VM\r\n`);
      } else {
        terminal.current.writeln('\r\n⏳ Waiting for VM connection...\r\n');
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
      try { fitAddon.current.fit(); } catch (e) { }
    }, 100);

    // Handle terminal input
    terminal.current.onData((data) => {
      try {
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
          websocket.current.send(data);
        } else {
          // Local echo fallback
          terminal.current.write(data);
        }
      } catch (e) {
        console.error('terminal onData send error', e);
      }
    });

    setIsTerminalReady(true);

    return () => {
      if (terminal.current) {
        terminal.current.dispose();
      }
    };
  }, [terminalRef, exam, vmStatus]);

  // Timer countdown
  useEffect(() => {
    if (!sessionEndTime.current) return;
    
    timerRef.current = setInterval(() => {
      const now = new Date();
      const secs = Math.max(0, Math.floor((sessionEndTime.current - now) / 1000));
      setRemainingTime(secs);
      
      if (secs === 0) {
        clearInterval(timerRef.current);
        submitExam(true);
      }
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionEndTime.current]);

  // VM status polling
  const startVmStatusPolling = useCallback(() => {
    if (vmCheckInterval.current) clearInterval(vmCheckInterval.current);

    vmCheckInterval.current = setInterval(async () => {
      if (!isMounted.current) return;
      try {
        const res = await authGet(`/api/practical-sessions/${sessionId}/vm_status/`);
        if (res && res.status) {
          setVmStatus(res.status);
          if (res.status === 'running') {
            const updated = await authGet(`/api/practical-sessions/${sessionId}/`);
            setSession(updated);
            setShowPreloader(false);
            initWebSocket();
            clearInterval(vmCheckInterval.current);
          } else if (res.status === 'failed') {
            setShowPreloader(false);
            clearInterval(vmCheckInterval.current);
          }
        }
      } catch (e) {
        console.error('vm status poll failed', e);
      }
    }, VM_CHECK_INTERVAL);
  }, [sessionId]);

  // WebSocket connection
  const initWebSocket = useCallback(() => {
    if (!session || !session.token) {
      console.warn('No session or token to open websocket');
      return;
    }

    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) return;

    // Close existing connection
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
    } catch (e) {
      console.error('WebSocket creation failed:', e);
      setConnectionStatus('Failed to create WebSocket');
      return;
    }

    websocket.current.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setConnectionStatus('Connected to terminal');
      setShowPreloader(false);
      terminal.current && terminal.current.writeln('\r\n✅ Connected! You can now begin your exam.\r\n');
    };

    websocket.current.onerror = (ev) => {
      console.error('WebSocket error', ev);
      setConnectionStatus('Terminal connection error');
    };

    websocket.current.onclose = (ev) => {
      console.warn('WebSocket closed', ev);
      setConnectionStatus(`Terminal disconnected: ${ev.reason || 'Unknown'}`);
      
      // Try to reconnect if VM still running
      if (vmStatus === 'running' && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        const attemptsLeft = MAX_RECONNECT_ATTEMPTS - reconnectAttemptsRef.current;
        terminal.current && terminal.current.writeln(`\r\nAttempting to reconnect... (${attemptsLeft} attempts left)\r\n`);
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
        reconnectTimer.current = setTimeout(initWebSocket, RECONNECT_INTERVAL);
      }
    };

    websocket.current.onmessage = (ev) => {
      if (!terminal.current) return;

      try {
        const data = JSON.parse(ev.data);
        if (data.type === 'output' && data.data) {
          terminal.current.write(data.data);
        }
      } catch (e) {
        // If not JSON, treat as raw text
        terminal.current.write(ev.data);
      }
    };
  }, [session, sessionId, vmStatus]);

  // Submit exam
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
      cleanupAll();
      
      Swal.fire({
        title: 'Submitting Exam',
        html: 'Please wait while we process your submission...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      const response = await authPost(`/api/practical-sessions/${session.id}/verify/`, {});
      
      Swal.close();
      
      if (response && response.status === 'completed') {
        navigate(`/student/results/${session.id}`, {
          state: {
            message: 'Exam submitted successfully!',
            is_success: response.is_success
          }
        });
      } else {
        throw new Error('Unexpected response from server');
      }
    } catch (err) {
      console.error('submitExam error', err);
      Swal.fire('Error', 'Failed to submit exam: ' + (err.message || err), 'error');
      setIsSubmitting(false);
    }
  };

  // Restart VM
  const restartVm = async () => {
    try {
      setConnectionStatus('Restarting VM...');
      setVmStatus('starting');
      setShowPreloader(true);
      cleanupWebsocketOnly();

      await authPost(`/api/practical-sessions/${sessionId}/restart_vm/`, {});
      const updated = await authGet(`/api/practical-sessions/${sessionId}/`);
      setSession(updated);
      startVmStatusPolling();
    } catch (err) {
      console.error('Restart failed', err);
      setConnectionStatus('Restart failed');
      setVmStatus('error');
      setShowPreloader(false);
    }
  };

  // Cleanup
  const cleanupWebsocketOnly = () => {
    try { websocket.current && websocket.current.close(); } catch (_) {}
    websocket.current = null;
    reconnectAttemptsRef.current = 0;
    try { if (reconnectTimer.current) clearTimeout(reconnectTimer.current); } catch (_) {}
  };

  const cleanupAll = () => {
    cleanupWebsocketOnly();
    try { if (timerRef.current) clearInterval(timerRef.current); } catch (_) {}
    try { if (preloaderInterval.current) clearInterval(preloaderInterval.current); } catch (_) {}
    try { if (vmCheckInterval.current) clearInterval(vmCheckInterval.current); } catch (_) {}
  };

  // Preloader countdown
  useEffect(() => {
    if (!showPreloader) return;
    preloaderInterval.current = setInterval(() => {
      setPreloaderTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(preloaderInterval.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (preloaderInterval.current) clearInterval(preloaderInterval.current);
    };
  }, [showPreloader]);

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
        <div className="practical-preloader-status">VM Status: {vmStatus}</div>
      </div>
    </div>
  );

  if (showPreloader) return <Preloader />;

  return (
    <div className="practical-container">
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
            <button className="practical-btn practical-refresh-btn" onClick={() => window.location.reload()}>Refresh</button>
            <button className="practical-btn practical-restart-btn" onClick={restartVm} disabled={vmStatus === 'starting'}>
              {vmStatus === 'starting' ? 'Restarting...' : 'Restart VM'}
            </button>
            <button className="practical-btn practical-submit-btn" onClick={() => submitExam(false)} disabled={isSubmitting}>
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
          </div>
        </div>

        <div className="practical-terminal-container">
          <div className="practical-terminal-header">
            <span>Terminal</span>
            <div className="practical-terminal-actions">
              <span className="practical-connection-status">{connectionStatus}</span>
              <button className="practical-btn practical-reconnect-btn" onClick={initWebSocket} disabled={vmStatus !== 'running'}>
                Reconnect
              </button>
            </div>
          </div>

          <div className="practical-terminal-body">
            <div
              ref={terminalRef}
              className="practical-terminal"
              style={{ width: '100%', height: '520px' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}