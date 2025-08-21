import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { authGet, authPost, baseURL } from '../../services/api';
import '../CSS/PracticalExam.css';

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
        
        // Check if VM is already in error state
        if (sessionData.vm_status === 'error') {
          setVmStatus('error');
          setVmErrorDetails(sessionData.vm_error_details || 'VM initialization failed');
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
  }, [sessionId]);

  // Initialize terminal
  useEffect(() => {
    if (!session || !exam || !terminalRef.current) return;
    
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
    
    const fitTerminal = () => {
      if (fitAddon.current) {
        try {
          fitAddon.current.fit();
        } catch (e) {
          console.error('Terminal fit error:', e);
        }
      }
    };
    
    // Initial fit
    setTimeout(fitTerminal, 100);
    
    // Handle resize
    resizeHandlerRef.current = () => {
      if (fitAddon.current) {
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
      }
    });

    setIsTerminalReady(true);

    return () => {
      if (resizeHandlerRef.current) {
        window.removeEventListener('resize', resizeHandlerRef.current);
      }
      
      if (terminal.current) {
        terminal.current.dispose();
        terminal.current = null;
      }
      
      if (fitAddon.current) {
        fitAddon.current.dispose();
        fitAddon.current = null;
      }
      
      setIsTerminalReady(false);
    };
  }, [session, exam, vmStatus, vmErrorDetails]);

  // Connect to terminal when VM is ready
  useEffect(() => {
    if (vmStatus === 'running' && isTerminalReady) {
      setTimeout(() => {
        initWebSocket();
      }, 1000);
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
      try {
        const statusRes = await authGet(
          `/api/practical-sessions/${sessionId}/container_status/`
        );
        
        // Handle backend errors gracefully
        if (statusRes && statusRes.status) {
          setVmStatus(statusRes.status);
          if (statusRes.error) {
            setVmErrorDetails(statusRes.error);
          }
        } else if (statusRes && statusRes.error) {
          setVmStatus('error');
          setVmErrorDetails(statusRes.error);
        }
      } catch (e) {
        console.error('VM status check failed', e);
        // Don't set error status on temporary network issues
        if (vmStatus !== 'error' && e.message.includes('OBJECT_NOT_FOUND')) {
          setVmStatus('error');
          setVmErrorDetails('Virtual machine not found. Please contact support.');
        }
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
        
        // Try to reconnect if the closure was unexpected
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
            }
          };
          reader.readAsText(event.data);
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
      await authPost(`/api/practical-sessions/${session.id}/terminate/`, {
        reason: 'Exam submitted by student'
      });
      navigate(`/student/results/${session.id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Submission error: ${err.message}\r\n`);
      }
    }
  };

  // Report VM issue to instructor
  const reportIssue = async () => {
    try {
      await authPost(`/api/practical-sessions/${sessionId}/report_issue/`, {
        error: vmErrorDetails || 'VM failed to start',
        timestamp: new Date().toISOString()
      });
      
      if (terminal.current) {
        terminal.current.writeln('\r\n✅ Issue reported to instructor. Please wait for assistance.\r\n');
      }
    } catch (err) {
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Failed to report issue: ${err.message}\r\n`);
      }
    }
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
    if (terminal.current) {
      terminal.current.dispose();
      terminal.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    if (vmCheckInterval.current) clearInterval(vmCheckInterval.current);
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading exam environment...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        {error}
        <button 
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
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
          <div>
            <button
              className="practical-btn submit"
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
                  <button className="practical-btn report" onClick={reportIssue}>
                    Report to Instructor
                  </button>
                  <button className="practical-btn restart" onClick={restartVm}>
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="practical-terminal-panel">
          <div className="practical-terminal-header">
            <div className="font-medium">Terminal</div>
            <div className="practical-terminal-actions">
              <button
                className="practical-btn reconnect"
                onClick={initWebSocket}
                disabled={vmStatus !== 'running'}
              >
                Reconnect
              </button>
              <button
                className="practical-btn restart"
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
              className="h-full-w-full"
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