// React component (PracticalExam.js) - fixed version
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { authGet, authPost, baseURL } from '../../services/api';
import '../CSS/PracticalExam.css';

// WebSocket connection management
export default function PracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  // State variables
  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [vmStatus, setVmStatus] = useState('checking');
  const [isTerminalReady, setIsTerminalReady] = useState(false);
  const [vmErrorDetails, setVmErrorDetails] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const websocket = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimer = useRef(null);
  const vmCheckInterval = useRef(null);
  const isMounted = useRef(true);
  const resizeHandlerRef = useRef(null);

  // Load session data
  useEffect(() => {
    isMounted.current = true;
    
    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        setSession(sessionData);
        const examData = await authGet(`/api/practical-exams/${sessionData.exam}/`);
        setExam(examData);
        
        if (sessionData.status === 'failed' || sessionData.status === 'terminated') {
          setVmStatus('error');
          setVmErrorDetails(sessionData.termination_reason || 'VM initialization failed');
        } else {
          startVmStatusPolling();
        }
        
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
  }, [sessionId, retryCount]);

  // Initialize terminal
  useEffect(() => {
    if (!session || !exam || !terminalRef.current) return;
    
    if (terminal.current) {
      // Terminal already initialized, just clear and update
      terminal.current.clear();
      if (vmStatus === 'error') {
        terminal.current.writeln('\r\n❌ VM Error: ' + (vmErrorDetails || 'Failed to start VM') + '\r\n');
        terminal.current.writeln('Please contact your instructor for assistance.\r\n');
      } else if (vmStatus !== 'running') {
        terminal.current.writeln('\r\n⏳ Waiting for VM to start...\r\n');
        setConnectionStatus('Waiting for VM');
      }
      return;
    }
    
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
      convertEol: true,
      disableStdin: false,
    });

    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    
    const terminalContainer = terminalRef.current;
    if (terminalContainer && terminalContainer.offsetWidth > 0 && terminalContainer.offsetHeight > 0) {
      terminal.current.open(terminalContainer);
      
      const fitTerminal = () => {
        if (fitAddon.current && terminalContainer.offsetWidth > 0) {
          try {
            fitAddon.current.fit();
          } catch (e) {
            console.error('Terminal fit error:', e);
          }
        }
      };
      
      setTimeout(fitTerminal, 100);
      
      resizeHandlerRef.current = () => {
        if (fitAddon.current && terminalContainer.offsetWidth > 0) {
          try {
            fitAddon.current.fit();
          } catch (e) {
            console.error('Terminal resize error:', e);
          }
        }
      };
      
      window.addEventListener('resize', resizeHandlerRef.current);

      if (vmStatus === 'error') {
        terminal.current.writeln('\r\n❌ VM Error: ' + (vmErrorDetails || 'Failed to start VM') + '\r\n');
        terminal.current.writeln('Please contact your instructor for assistance.\r\n');
      } else if (vmStatus !== 'running') {
        terminal.current.writeln('\r\n⏳ Waiting for VM to start...\r\n');
        setConnectionStatus('Waiting for VM');
      }

      terminal.current.onData(data => {
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
          websocket.current.send(data);
        } else if (terminal.current) {
          // Echo input if not connected
          terminal.current.write(data);
        }
      });

      setIsTerminalReady(true);
    }

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }
    };
  }, [session, exam, vmStatus, vmErrorDetails]);

  // Connect to terminal when VM is ready
  useEffect(() => {
    if (vmStatus === 'running' && isTerminalReady) {
      // Small delay to ensure VM is fully ready
      const timer = setTimeout(() => {
        initWebSocket();
      }, 2000);
      return () => clearTimeout(timer);
    } else if (vmStatus !== 'running' && websocket.current) {
      websocket.current.close();
      websocket.current = null;
      setConnectionStatus('VM stopped');
    }
  }, [vmStatus, isTerminalReady]);

  // Handle session timer
  useEffect(() => {
    if (session && exam && session.status === 'running') {
      const totalTime = exam.duration * 60;
      const startTime = new Date(session.start_time).getTime();
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setRemainingTime(Math.max(0, totalTime - elapsedSeconds));

      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            submitExam();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [session, exam]);

  // Start VM status polling
  const startVmStatusPolling = () => {
    if (vmCheckInterval.current) {
      clearInterval(vmCheckInterval.current);
    }
    
    vmCheckInterval.current = setInterval(async () => {
      if (!isMounted.current) return;
      
      try {
        const statusRes = await authGet(
          `/api/practical-sessions/${sessionId}/vm_status/`
        );
        
        if (statusRes && statusRes.status) {
          setVmStatus(statusRes.status);
          
          // If VM is running but session status is still starting, update session
          if (statusRes.status === 'running' && session && session.status === 'starting') {
            const updatedSession = await authGet(`/api/practical-sessions/${sessionId}/`);
            setSession(updatedSession);
          }
        }
      } catch (e) {
        console.error('VM status check failed', e);
      }
    }, 3000);
  };

  // Initialize WebSocket connection
  const initWebSocket = () => {
    if (!session || !session.token) {
      console.error('Session token not available');
      return;
    }
    
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }

    const isSecure = baseURL.startsWith('https');
    const wsProtocol = isSecure ? 'wss' : 'ws';
    const host = baseURL.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    const token = encodeURIComponent(session.token);
    const wsUrl = `${wsProtocol}://${host}/ws/practical/${sessionId}/?token=${token}`;

    setConnectionStatus('Connecting to terminal...');
    
    if (terminal.current) {
      terminal.current.writeln('\r\n🔌 Connecting to exam environment...\r\n');
    }

    websocket.current = new WebSocket(wsUrl);

    websocket.current.onopen = () => {
      setConnectionStatus('Connected to terminal');
      
      if (terminal.current) {
        terminal.current.writeln('\r\n✅ Connected to exam environment\r\n');
        terminal.current.writeln('\r\nYou can now begin your exam. Good luck!\r\n');
        // Send a newline to trigger prompt
        setTimeout(() => {
          if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            websocket.current.send('\n');
          }
        }, 500);
      }
    };

    websocket.current.onerror = (error) => {
      setConnectionStatus(`Terminal error: ${error.message || 'Unknown error'}`);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Connection error: ${error.message || 'Unknown error'}\r\n`);
      }
    };

    websocket.current.onclose = (event) => {
      setConnectionStatus(`Terminal disconnected: ${event.reason || 'Unknown reason'}`);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n🔌 Connection closed: ${event.reason || 'Unknown reason'}\r\n`);
        
        // Try to reconnect if the closure was unexpected and VM is still running
        if (vmStatus === 'running' && !event.reason.includes('normal')) {
          terminal.current.writeln('\r\nAttempting to reconnect in 3 seconds...\r\n');
          setTimeout(initWebSocket, 3000);
        }
      }
    };

    websocket.current.onmessage = (event) => {
      if (terminal.current) {
        if (typeof event.data === 'string') {
          terminal.current.write(event.data);
        } else if (event.data instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              terminal.current.write(reader.result);
            } else if (reader.result instanceof ArrayBuffer) {
              const data = new Uint8Array(reader.result);
              terminal.current.write(data);
            }
          };
          reader.readAsText(event.data);
        } else if (event.data instanceof ArrayBuffer) {
          const data = new Uint8Array(event.data);
          terminal.current.write(data);
        }
      }
    };
  };

  // Restart VM
  const restartVm = async () => {
    try {
      setConnectionStatus('Restarting VM...');
      setVmStatus('starting');
      setVmErrorDetails(null);
      
      if (terminal.current) {
        terminal.current.writeln('\r\n♻️ Restarting VM...\r\n');
      }
      
      await authPost(`/api/practical-sessions/${sessionId}/restart_vm/`, {});
      
      // Refresh session data
      const updatedSession = await authGet(`/api/practical-sessions/${sessionId}/`);
      setSession(updatedSession);
      
      startVmStatusPolling();
    } catch (err) {
      setConnectionStatus('Restart failed');
      setVmStatus('error');
      setVmErrorDetails(err.message || 'Failed to restart VM');
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Restart failed: ${err.message}\r\n`);
      }
    }
  };

  // Submit exam
  const submitExam = async () => {
    if (!session) return;

    try {
      cleanupResources();
      await authPost(`/api/practical-sessions/${session.id}/verify/`, {});
      navigate(`/student/results/${session.id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Submission error: ${err.message}\r\n`);
      }
    }
  };

  // Refresh the session
  const refreshSession = () => {
    setRetryCount(prev => prev + 1);
  };

  // Format time display
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Cleanup resources
  const cleanupResources = () => {
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    if (vmCheckInterval.current) clearInterval(vmCheckInterval.current);
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
    }
  };

  if (loading) {
    return <div className="practical-loading">Loading exam environment...</div>;
  }

  if (error) {
    return (
      <div className="practical-error">
        {error}
        <button 
          className="practical-back-btn"
          onClick={() => navigate('/student')}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="practical-container">
      <div className="practical-header">
        <div className="practical-header-row">
          <div>
            <div className="practical-title">{exam?.title} - Practical Exam</div>
            <div className="practical-status">
              <span>Time Left: {formatTime(remainingTime)}</span>
              <span>
                • VM:
                <span className={`practical-container-status ${vmStatus}`}>
                  {vmStatus}
                  {vmStatus === 'error' && ' - Click for details'}
                </span>
              </span>
            </div>
          </div>
          <div className="practical-header-actions">
            <button
              className="practical-btn practical-refresh-btn"
              onClick={refreshSession}
            >
              Refresh
            </button>
            <button
              className="practical-btn practical-submit-btn"
              onClick={submitExam}
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      <div className="practical-main">
        <div className="practical-instructions">
          <div>
            <div className="practical-instructions-title">Exam Instructions</div>
            {exam && (
              <>
                <div className="practical-instructions-desc">{exam.description}</div>
                {exam.verification_command && (
                  <div className="practical-verification">
                    <div className="practical-verification-title">Verification Command:</div>
                    <code className="practical-verification-command">{exam.verification_command}</code>
                  </div>
                )}
              </>
            )}
            {vmStatus === 'error' && (
              <div className="practical-error-panel">
                <div className="practical-error-title">VM Error</div>
                <div className="practical-error-desc">
                  {vmErrorDetails || 'The virtual machine failed to start properly.'}
                </div>
                <div className="practical-error-actions">
                  <button className="practical-btn practical-restart-btn" onClick={restartVm}>
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="practical-terminal-panel">
          <div className="practical-terminal-header">
            <div className="practical-terminal-title">Terminal</div>
            <div className="practical-terminal-actions">
              <button
                className="practical-btn practical-reconnect-btn"
                onClick={initWebSocket}
                disabled={vmStatus !== 'running'}
              >
                Reconnect
              </button>
              <button
                className="practical-btn practical-restart-btn"
                onClick={restartVm}
                disabled={vmStatus === 'starting'}
              >
                {vmStatus === 'starting' ? 'Restarting...' : 'Restart VM'}
              </button>
            </div>
          </div>
          <div className="practical-terminal-body">
            <div
              ref={terminalRef}
              className="practical-terminal"
            />
          </div>
          <div className="practical-terminal-status">
            Status: {connectionStatus}
          </div>
        </div>
      </div>
    </div>
  );
}