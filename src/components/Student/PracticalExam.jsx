import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import Swal from 'sweetalert2';
import { authGet, authPost, baseURL } from '../../services/api';
import '../CSS/PracticalExam.css';

// Add WebSocket reconnection constants
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 3000;
const VM_CHECK_INTERVAL = 8000;
const PRELOADER_MAX_TIME = 120;
const VERIFICATION_POLL_INTERVAL = 3000;
const WEBSOCKET_CONNECT_DELAY = 2000; // Delay before attempting WebSocket connection

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderTimeLeft, setPreloaderTimeLeft] = useState(PRELOADER_MAX_TIME);
  const [warningCount, setWarningCount] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);

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
  const preloaderInterval = useRef(null);
  const sessionEndTime = useRef(null);
  const vmStatusCheckCounter = useRef(0);
  const verificationPollInterval = useRef(null);
  const sshReadyCheckInterval = useRef(null);

  // Check if SSH is ready before connecting WebSocket
  const checkSshReady = useCallback(async () => {
    if (!session || !session.ssh_port) return false;
    
    try {
      // Simple TCP connection check to see if SSH port is open
      const response = await authGet(`/api/practical-sessions/${sessionId}/check_ssh/`);
      return response.ready || false;
    } catch (e) {
      console.error('SSH readiness check failed:', e);
      return false;
    }
  }, [session, sessionId]);

  // Preloader timer effect
  useEffect(() => {
    if (showPreloader) {
      preloaderInterval.current = setInterval(() => {
        setPreloaderTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(preloaderInterval.current);
            checkVmSmoothness();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (preloaderInterval.current) {
        clearInterval(preloaderInterval.current);
      }
    }

    return () => {
      if (preloaderInterval.current) {
        clearInterval(preloaderInterval.current);
      }
    };
  }, [showPreloader]);

  // Check verification status
  const checkVerificationStatus = useCallback(async () => {
    if (!session) return;
    
    try {
      const response = await authGet(`/api/practical-sessions/${session.id}/verification_status/`);
      
      if (response.completed) {
        if (verificationPollInterval.current) {
          clearInterval(verificationPollInterval.current);
          verificationPollInterval.current = null;
        }
        
        navigate(`/student/practical-results/${session.id}`, {
          state: {
            sessionId: session.id,
            examId: session.exam,
            score: response.score,
            isSuccess: response.is_success,
            details: response.details
          }
        });
      }
    } catch (err) {
      console.error('Error checking verification status:', err);
    }
  }, [session, navigate]);

  // Check if VM is running smoothly
  const checkVmSmoothness = useCallback(() => {
    if (vmStatus === 'running' && isWebSocketConnected) {
      setShowPreloader(false);
    } else if (vmStatus === 'running') {
      // Start SSH readiness check before attempting WebSocket connection
      const checkSshAndConnect = async () => {
        const isSshReady = await checkSshReady();
        if (isSshReady) {
          initWebSocket();
        } else {
          // If SSH isn't ready, check again in a few seconds
          setTimeout(checkSshAndConnect, 3000);
        }
      };
      
      checkSshAndConnect();
    } else if (preloaderTimeLeft <= 0) {
      setVmStatus('error');
      setVmErrorDetails('VM failed to start within expected time');
      setShowPreloader(false);
    }
  }, [vmStatus, preloaderTimeLeft, isWebSocketConnected, checkSshReady]);

  // Load session data
  useEffect(() => {
    isMounted.current = true;
    
    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        setSession(sessionData);
        
        if (sessionData.start_time && sessionData.exam) {
          const examData = await authGet(`/api/practical-exams/${sessionData.exam}/`);
          setExam(examData);
          
          const startTime = new Date(sessionData.start_time);
          const endTime = new Date(startTime.getTime() + examData.duration_minutes * 60000);
          sessionEndTime.current = endTime;
          
          const now = new Date();
          const timeLeft = Math.max(0, endTime - now);
          setRemainingTime(Math.floor(timeLeft / 1000));
        }
        
        if (sessionData.status === 'failed' || sessionData.status === 'terminated') {
          setVmStatus('error');
          setVmErrorDetails(sessionData.termination_reason || sessionData.startup_log || 'VM initialization failed');
          setShowPreloader(false);
        } else if (sessionData.status === 'running') {
          setVmStatus('running');
          setIsExamStarted(true);
          
          // Check if SSH is ready before attempting connection
          const checkSshBeforeConnect = async () => {
            const isSshReady = await checkSshReady();
            if (isSshReady) {
              checkVmSmoothness();
            } else {
              // If SSH isn't ready, check again
              setTimeout(checkSshBeforeConnect, 3000);
            }
          };
          
          checkSshBeforeConnect();
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
  }, [sessionId, retryCount, checkVmSmoothness, checkSshReady]);

  // Initialize terminal
  useEffect(() => {
    if (!session || !exam || !terminalRef.current) return;
    
    if (terminal.current) {
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
          websocket.current.send(JSON.stringify({ type: 'input', data }));
        } else if (terminal.current) {
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

  // Initialize WebSocket connection with reconnection logic
  const initWebSocket = useCallback(() => {
    if (!session || !session.token) {
      console.error('Session token not available');
      return;
    }
    
    if (websocket.current) {
      // Don't close existing connection if it's still open
      if (websocket.current.readyState === WebSocket.OPEN) {
        return;
      }
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
      setReconnectAttempts(0);
      setIsWebSocketConnected(true);
      
      if (terminal.current) {
        terminal.current.writeln('\r\nYou can now begin your exam. Good luck!\r\n');
        setTimeout(() => {
          if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            websocket.current.send(JSON.stringify({ type: 'input', data: '\n' }));
          }
        }, 500);
      }
      
      checkVmSmoothness();
    };

    websocket.current.onerror = (error) => {
      setConnectionStatus(`Terminal error: ${error.message || 'Unknown error'}`);
      setIsWebSocketConnected(false);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Connection error: ${error.message || 'Unknown error'}\r\n`);
      }
    };

    websocket.current.onclose = (event) => {
      setConnectionStatus(`Terminal disconnected: ${event.reason || 'Unknown reason'}`);
      setIsWebSocketConnected(false);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n🔌 Connection closed: ${event.reason || 'Unknown reason'}\r\n`);
        
        if (vmStatus === 'running' && !event.reason.includes('normal') && 
            reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const attemptsLeft = MAX_RECONNECT_ATTEMPTS - reconnectAttempts;
          terminal.current.writeln(`\r\nAttempting to reconnect... (${attemptsLeft} attempts left)\r\n`);
          
          setReconnectAttempts(prev => prev + 1);
          reconnectTimer.current = setTimeout(initWebSocket, RECONNECT_INTERVAL);
        }
      }
    };

    websocket.current.onmessage = (event) => {
      if (terminal.current) {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'output') {
            terminal.current.write(data.data);
          }
        } catch (e) {
          terminal.current.write(event.data);
        }
      }
    };
  }, [session, sessionId, vmStatus, reconnectAttempts, checkVmSmoothness]);

  // Start VM status polling with optimized interval
  const startVmStatusPolling = useCallback(() => {
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
          
          if (statusRes.status === 'running' && session && session.status === 'starting') {
            const updatedSession = await authGet(`/api/practical-sessions/${sessionId}/`);
            setSession(updatedSession);
            setIsExamStarted(true);
            
            // Check if SSH is ready before attempting connection
            const checkSshBeforeConnect = async () => {
              const isSshReady = await checkSshReady();
              if (isSshReady) {
                checkVmSmoothness();
              } else {
                setTimeout(checkSshBeforeConnect, 3000);
              }
            };
            
            checkSshBeforeConnect();
          }
        }
        
        vmStatusCheckCounter.current++;
        if (vmStatusCheckCounter.current > 5) {
          clearInterval(vmCheckInterval.current);
          vmCheckInterval.current = setInterval(async () => {
            if (!isMounted.current) return;
            
            try {
              const statusRes = await authGet(`/api/practical-sessions/${sessionId}/vm_status/`);
              if (statusRes && statusRes.status) {
                setVmStatus(statusRes.status);
              }
            } catch (e) {
              console.error('VM status check failed', e);
            }
          }, 10000);
        }
      } catch (e) {
        console.error('VM status check failed', e);
      }
    }, VM_CHECK_INTERVAL);
  }, [sessionId, session, checkVmSmoothness, checkSshReady]);

  // Restart VM
  const restartVm = async () => {
    try {
      setConnectionStatus('Restarting VM...');
      setVmStatus('starting');
      setVmErrorDetails(null);
      setShowPreloader(true);
      setPreloaderTimeLeft(PRELOADER_MAX_TIME);
      setIsWebSocketConnected(false);
      
      if (terminal.current) {
        terminal.current.writeln('\r\n♻️ Restarting VM...\r\n');
      }
      
      await authPost(`/api/practical-sessions/${sessionId}/restart_vm/`, {});
      
      const updatedSession = await authGet(`/api/practical-sessions/${sessionId}/`);
      setSession(updatedSession);
      
      vmStatusCheckCounter.current = 0;
      startVmStatusPolling();
    } catch (err) {
      setConnectionStatus('Restart failed');
      setVmStatus('error');
      setVmErrorDetails(err.message || 'Failed to restart VM');
      setShowPreloader(false);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Restart failed: ${err.message}\r\n`);
      }
    }
  };

  // Submit exam with confirmation
  const submitExam = async (isAutomatic = false) => {
    if (!session || isSubmitting) return;
    
    if (!isAutomatic) {
      const result = await Swal.fire({
        title: 'Submit Exam?',
        html: `
          <p>Are you sure you want to submit your exam?</p>
          <p><strong>This action cannot be undone.</strong></p>
          <div style="text-align: left; margin-top: 15px;">
            <p>By submitting, you declare that:</p>
            <ul>
              <li>This is your own work</li>
              <li>You haven't received unauthorized help</li>
              <li>You followed all exam rules</li>
            </ul>
          </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Submit Exam',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        reverseButtons: true
      });
      
      if (!result.isConfirmed) return;
    }
    
    setIsSubmitting(true);
    try {
      cleanupResources();
      
      const response = await authPost(`/api/practical-sessions/${session.id}/verify/`, {});
      
      if (response.status === 'started') {
        verificationPollInterval.current = setInterval(checkVerificationStatus, VERIFICATION_POLL_INTERVAL);
      } else {
        throw new Error(response.message || 'Failed to start verification');
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Session not found. Please contact your instructor.');
      } else {
        setError('Failed to submit exam: ' + err.message);
      }
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Submission error: ${err.message}\r\n`);
      }
      
      setIsSubmitting(false);
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
    if (preloaderInterval.current) clearInterval(preloaderInterval.current);
    if (verificationPollInterval.current) clearInterval(verificationPollInterval.current);
    if (sshReadyCheckInterval.current) clearInterval(sshReadyCheckInterval.current);
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
    }
  };

  // Preloader component
  const Preloader = () => {
    return (
      <div className="practical-preloader">
        <div className="practical-preloader-content">
          <div className="practical-preloader-spinner">
            <div className="practical-preloader-dot"></div>
            <div className="practical-preloader-dot"></div>
            <div className="practical-preloader-dot"></div>
            <div className="practical-preloader-dot"></div>
            <div className="practical-preloader-dot"></div>
          </div>
          <h2>Preparing Your Exam Environment</h2>
          <p>Please wait while we set up your virtual machine. This may take a few minutes.</p>
          <div className="practical-preloader-time">
            Time remaining: {formatTime(preloaderTimeLeft)}
          </div>
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

  if (showPreloader) {
    return <Preloader />;
  }

  return (
    <div className="practical-container">
      {/* Header with exam info and controls */}
      <div className="practical-header">
        <div className="practical-header-content">
          <div className="practical-header-info">
            <h2>{exam?.title} - Practical Exam</h2>
            <div className="practical-header-status">
              <span className="practical-time">Time Left: {formatTime(remainingTime)}</span>
              <span className="practical-vm-status">
                VM Status: <span className={`status-${vmStatus}`}>{vmStatus}</span>
              </span>
            </div>
          </div>
          <div className="practical-header-actions">
            <button
              className="practical-btn practical-toggle-instructions"
              onClick={() => setShowInstructions(!showInstructions)}
            >
              {showInstructions ? 'Hide Instructions' : 'Show Instructions'}
            </button>
            <button
              className="practical-btn practical-refresh-btn"
              onClick={refreshSession}
            >
              Refresh
            </button>
            <button
              className="practical-btn practical-restart-btn"
              onClick={restartVm}
              disabled={vmStatus === 'starting'}
            >
              {vmStatus === 'starting' ? 'Restarting...' : 'Restart VM'}
            </button>
            <button
              className="practical-btn practical-submit-btn"
              onClick={() => submitExam(false)}
              disabled={!session || session.status !== 'running' || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      {/* Main exam interface */}
      <div className="practical-main">
        {showInstructions && (
          <div className="practical-instructions">
            <div className="practical-instructions-content">
              <h3>Exam Instructions</h3>
              <div className="practical-instructions-text">
                {exam?.description}
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
        )}

        <div className="practical-terminal-container">
          <div className="practical-terminal-header">
            <span>Terminal</span>
            <div className="practical-terminal-actions">
              <button
                className="practical-btn practical-reconnect-btn"
                onClick={initWebSocket}
                disabled={vmStatus !== 'running'}
              >
                Reconnect
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