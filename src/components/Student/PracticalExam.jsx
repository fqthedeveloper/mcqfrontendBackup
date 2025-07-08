// PracticalExam.jsx (Fixed Frontend)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { AttachAddon } from 'xterm-addon-attach';
import 'xterm/css/xterm.css';
import { authGet, authPost, baseURL } from '../../services/api';

export default function PracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [containerStatus, setContainerStatus] = useState('unknown');
  const [lastPong, setLastPong] = useState(Date.now());
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const websocket = useRef(null);
  const attachAddon = useRef(null); // Added ref for attach addon
  const timerRef = useRef(null);
  const reconnectTimer = useRef(null);
  const reconnectAttempts = useRef(0);
  const isMounted = useRef(true);
  const containerCheckInterval = useRef(null);
  const pingInterval = useRef(null);

  // Load session data
  useEffect(() => {
    isMounted.current = true;
    
    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        if (sessionData.status !== 'running') {
          setError('This session is not active');
          setLoading(false);
          return;
        }

        setSession(sessionData);
        setSessionToken((await authGet(`/api/practical-sessions/${sessionId}/token/`)).token);
        setExam(await authGet(`/api/practical-exams/${sessionData.exam}/`));

        const statusRes = await authGet(`/api/practical-sessions/${sessionId}/container_status/`);
        setContainerStatus(statusRes.status);

        // Setup container status checker
        containerCheckInterval.current = setInterval(async () => {
          try {
            const status = (await authGet(
              `/api/practical-sessions/${sessionId}/container_status/`
            )).status;
            setContainerStatus(status);
          } catch (e) {
            console.error('Container status check failed', e);
          }
        }, 5000);

        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load session');
        setLoading(false);
      }
    };

    loadSession();

    return () => {
      isMounted.current = false;
      cleanupResources();
    };
  }, [sessionId]);

  // Initialize terminal when dependencies are ready
  useEffect(() => {
    if (!sessionToken || !session || !exam) return;

    initTerminal();
    setIsTerminalReady(true);

    return () => {
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
      }
      if (fitAddon.current) {
        fitAddon.current.dispose();
        fitAddon.current = null;
      }
      if (attachAddon.current) {
        attachAddon.current.dispose();
        attachAddon.current = null;
      }
      if (websocket.current) {
        websocket.current.close();
        websocket.current = null;
      }
      setIsTerminalReady(false);
    };
  }, [sessionToken, session, exam]);

  // Handle container status changes
  useEffect(() => {
    if (containerStatus === 'running' && isTerminalReady && terminal.current) {
      initWebSocket();
    } else if (containerStatus !== 'running' && websocket.current) {
      websocket.current.close();
      websocket.current = null;
      setConnectionStatus('Container stopped');
    }
  }, [containerStatus, isTerminalReady]);

  // Timer for exam duration
  useEffect(() => {
    if (session && exam && !session.is_completed) {
      const totalTime = exam.duration * 60;
      const startTime = new Date(session.start_time).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsedSeconds);
      setRemainingTime(Math.max(0, totalTime - elapsedSeconds));

      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          setRemainingTime(totalTime - newTime);

          if (newTime >= totalTime) {
            submitExam();
          }

          return newTime;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [session, exam]);

  // Connection health monitoring
  useEffect(() => {
    pingInterval.current = setInterval(() => {
      if (Date.now() - lastPong > 60000) {
        setConnectionStatus('Connection timed out (no ping response)');
        handleReconnect();
      }
    }, 10000);

    return () => clearInterval(pingInterval.current);
  }, [lastPong]);

  const initTerminal = () => {
    if (!terminalRef.current || terminal.current) return;

    // Create terminal instance
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
      convertEol: true,
      disableStdin: false,
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);

    // Add resize handler
    const resizeHandler = () => {
      if (fitAddon.current && terminal.current) {
        fitAddon.current.fit();
        sendResizeCommand();
      }
    };
    window.addEventListener('resize', resizeHandler);
    setTimeout(resizeHandler, 100);  // Initial resize with delay

    // Show initial status
    if (containerStatus !== 'running') {
      terminal.current.writeln('\r\n\x1b[33m⏳ Waiting for container to start...\x1b[0m\r\n');
      setConnectionStatus('Waiting for container');
    }

    // Cleanup resize handler on unmount
    return () => window.removeEventListener('resize', resizeHandler);
  };

  const initWebSocket = () => {
    // Close existing connection if any
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }

    // Build WebSocket URL
    const isSecure = baseURL.startsWith('https');
    const wsProtocol = isSecure ? 'wss' : 'ws';
    const host = baseURL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    const wsUrl = `${wsProtocol}://${host}/ws/practical/${sessionId}/?session_token=${encodeURIComponent(sessionToken)}`;

    console.log("WebSocket URL:", wsUrl);
    setConnectionStatus('Connecting...');
    
    if (terminal.current) {
      terminal.current.writeln('\r\n\x1b[33mConnecting to exam environment...\x1b[0m\r\n');
    }

    websocket.current = new WebSocket(wsUrl);

    // FIX: Only attach if terminal exists
    if (terminal.current) {
      attachAddon.current = new AttachAddon(websocket.current);
      terminal.current.loadAddon(attachAddon.current);
    }

    // Handle incoming messages
    websocket.current.onmessage = (event) => {
      // Handle text messages (control messages)
      if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'ping') {
            websocket.current.send(JSON.stringify({
              type: 'pong',
              timestamp: data.timestamp
            }));
            setLastPong(Date.now());
          }
        } catch (e) {
          // If not JSON, treat as plain text
          if (terminal.current) {
            terminal.current.write(event.data);
          }
        }
      }
    };

    websocket.current.onopen = () => {
      reconnectAttempts.current = 0;
      setConnectionStatus('Connected');
      setLastPong(Date.now());
      
      if (terminal.current) {
        terminal.current.writeln('\r\n\x1b[32m✅ Connected to exam environment\x1b[0m\r\n');
      }
      
      sendResizeCommand();
    };

    websocket.current.onerror = (error) => {
      setConnectionStatus(`Error: ${error.message || 'Unknown error'}`);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[31m❌ Connection error: ${error.message || 'Unknown error'}\x1b[0m\r\n`);
      }
    };

    websocket.current.onclose = (event) => {
      setConnectionStatus(`Disconnected: ${event.reason || 'Unknown reason'}`);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[31m🔌 Connection closed: ${event.reason || 'Unknown reason'}\x1b[0m\r\n`);
      }

      // Attempt reconnect unless closed normally
      if (event.code !== 1000 && isMounted.current) {
        scheduleReconnect();
      }
    };
  };

  const sendResizeCommand = () => {
    if (terminal.current && websocket.current?.readyState === WebSocket.OPEN) {
      const { cols, rows } = terminal.current;
      websocket.current.send(JSON.stringify({
        type: 'resize',
        cols: cols,
        rows: rows
      }));
    }
  };

  const scheduleReconnect = () => {
    // Clear any existing timer
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }

    // Exponential backoff with max 30s
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current++;

    if (terminal.current) {
      terminal.current.writeln(`\r\n\x1b[33mReconnecting in ${delay/1000}s...\x1b[0m\r\n`);
    }

    reconnectTimer.current = setTimeout(() => {
      if (isMounted.current) {
        if (terminal.current) {
          terminal.current.writeln('\r\n\x1b[33mReconnecting to exam environment...\x1b[0m\r\n');
        }
        initWebSocket();
      }
    }, delay);
  };

  const handleReconnect = () => {
    reconnectAttempts.current = 0;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    
    if (terminal.current) {
      terminal.current.writeln('\r\n\x1b[33mReconnecting...\x1b[0m\r\n');
    }
    
    initWebSocket();
  };

  const handleTerminalReset = () => {
    if (terminal.current) {
      terminal.current.reset();
    }
    handleReconnect();
  };

  const restartContainer = async () => {
    try {
      await authPost(`/api/practical-sessions/${sessionId}/restart_container/`, {});
      setConnectionStatus('Restarting container...');
      
      if (terminal.current) {
        terminal.current.writeln('\r\n\x1b[33mContainer restart requested...\x1b[0m\r\n');
      }
    } catch (err) {
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[31mRestart failed: ${err.message}\x1b[0m\r\n`);
      }
    }
  };

  const verifyTask = async () => {
    if (!session) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const response = await authPost(`/api/practical-sessions/${session.id}/verify/`, {});
      setVerificationResult({
        is_verified: response.is_success,
        verification_output: response.verification_output || 'No output'
      });

      if (terminal.current) {
        terminal.current.writeln(
          `\r\nVerification result: ${
            response.is_success ? '\x1b[32mSUCCESS ✅\x1b[0m' : '\x1b[31mFAILURE ❌\x1b[0m'
          }\r\n`
        );
      }
    } catch (err) {
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[31mVerification error: ${err.message}\x1b[0m\r\n`);
      }
      setVerificationResult({
        is_verified: false,
        verification_output: `Verification failed: ${err.message}`
      });
    } finally {
      setVerifying(false);
    }
  };

  const submitExam = async () => {
    if (!session) return;

    try {
      await authPost(`/api/practical-sessions/${session.id}/terminate/`, {
        reason: 'Exam submitted by student'
      });
      navigate(`/student/results/${session.id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
      if (terminal.current) {
        terminal.current.writeln(`\r\n\x1b[31mSubmission error: ${err.message}\x1b[0m\r\n`);
      }
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cleanupResources = () => {
    if (websocket.current) websocket.current.close();
    if (terminal.current) terminal.current.dispose();
    if (attachAddon.current) attachAddon.current.dispose();
    if (timerRef.current) clearInterval(timerRef.current);
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    if (containerCheckInterval.current) clearInterval(containerCheckInterval.current);
    if (pingInterval.current) clearInterval(pingInterval.current);
  };

  if (loading) {
    return <div className="practical-loading">Loading exam environment...</div>;
  }

  if (error) {
    return (
      <div className="practical-error">
        {error}
        <button onClick={() => navigate('/student')}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="practical-container">
      <div className="exam-header">
        <div className="exam-info">
          <h1>{exam?.title} - Practical Exam</h1>
          <div className="exam-meta">
            <span>Time Left: {formatTime(remainingTime)}</span>
            <span>• Container: <span className={containerStatus === 'running' ? 'running' : 'stopped'}>
              {containerStatus}
            </span></span>
          </div>
        </div>

        <div className="header-controls">
          <div className={`connection-status ${connectionStatus.includes('Error') ? 'error' : 
                         connectionStatus.includes('Disconnected') ? 'warning' : 
                         connectionStatus.includes('Connected') ? 'success' : 'info'}`}>
            Status: {connectionStatus}
          </div>
          <button className="submit-btn" onClick={submitExam}>
            Submit Exam
          </button>
        </div>
      </div>

      <div className="practical-layout">
        <div className="task-content">
          {exam && (
            <>
              <div className="task-header">
                <h2>Practical Task</h2>
                <div className="task-actions">
                  <button
                    className="verify-btn"
                    onClick={verifyTask}
                    disabled={verifying}
                  >
                    {verifying ? 'Verifying...' : 'Verify Task'}
                  </button>
                  <button
                    className="restart-btn"
                    onClick={restartContainer}
                    disabled={containerStatus === 'running'}
                  >
                    {containerStatus === 'running' ? 'Container Running' : 'Restart Container'}
                  </button>
                </div>
              </div>

              <div className="task-description">
                <pre>{exam.description}</pre>
                {exam.verification_command && (
                  <div className="verification-command">
                    <strong>Verification Command:</strong>
                    <code>{exam.verification_command}</code>
                  </div>
                )}
              </div>

              {verificationResult && (
                <div className={`verification-result ${verificationResult.is_verified ? 'success' : 'failure'}`}>
                  <h3>Verification Result:</h3>
                  <pre>{verificationResult.verification_output}</pre>
                </div>
              )}
            </>
          )}
        </div>

        <div className="terminal-container">
          <div className="terminal-header">
            <h3>Terminal</h3>
            <div className="terminal-actions">
              <button className="btn-reconnect" onClick={handleReconnect}>
                Reconnect
              </button>
              <button className="btn-reset" onClick={handleTerminalReset}>
                Reset
              </button>
            </div>
          </div>
          <div ref={terminalRef} className="terminal"></div>
        </div>
      </div>
    </div>
  );
}