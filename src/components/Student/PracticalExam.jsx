import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import Swal from 'sweetalert2';
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
  const [retryCount, setRetryCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderTimeLeft, setPreloaderTimeLeft] = useState(120);
  const [warningCount, setWarningCount] = useState(0);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

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

  // Preloader countdown timer
  useEffect(() => {
    if (showPreloader) {
      preloaderInterval.current = setInterval(() => {
        setPreloaderTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(preloaderInterval.current);
            setShowPreloader(false);
            setIsExamStarted(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (preloaderInterval.current) {
        clearInterval(preloaderInterval.current);
      }
    };
  }, [showPreloader]);

  // Tab visibility and focus detection
  useEffect(() => {
    if (!isExamStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched tabs
        handleTabChange();
      }
    };

    const handleBlur = () => {
      // User might be switching tabs or applications
      handleTabChange();
    };

    const handleBeforeUnload = (e) => {
      // Prevent page refresh/close
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam may be terminated.';
      return 'Are you sure you want to leave? Your exam may be terminated.';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isExamStarted, warningCount]);

  const handleTabChange = () => {
    const newWarningCount = warningCount + 1;
    setWarningCount(newWarningCount);

    if (newWarningCount >= 3) {
      // Terminate exam after 3 warnings
      Swal.fire({
        title: 'Exam Terminated',
        text: 'You have switched tabs too many times. Your exam has been terminated.',
        icon: 'error',
        confirmButtonText: 'OK'
      }).then(() => {
        terminateExam('Switched tabs multiple times during exam');
      });
    } else {
      // Show warning
      Swal.fire({
        title: 'Warning',
        text: `Please do not switch tabs during the exam. Warning ${newWarningCount} of 3.`,
        icon: 'warning',
        confirmButtonText: 'I Understand'
      });
    }
  };

  const terminateExam = async (reason) => {
    try {
      await authPost(`/api/practical-sessions/${sessionId}/terminate/`, { reason });
      navigate('/student/dashboard');
    } catch (err) {
      console.error('Failed to terminate exam:', err);
      Swal.fire({
        title: 'Error',
        text: 'Failed to terminate exam. Please contact your instructor.',
        icon: 'error'
      });
    }
  };

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
          setVmErrorDetails(sessionData.termination_reason || sessionData.startup_log || 'VM initialization failed');
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

  // Initialize terminal - only after preloader is done
  useEffect(() => {
    if (showPreloader || !session || !exam || !terminalRef.current) return;
    
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
  }, [session, exam, vmStatus, vmErrorDetails, showPreloader]);

  // Connect to terminal when VM is ready - only after preloader is done
  useEffect(() => {
    if (showPreloader || vmStatus !== 'running' || !isTerminalReady) return;
    
    // Small delay to ensure VM is fully ready
    const timer = setTimeout(() => {
      initWebSocket();
    }, 2000);
    return () => clearTimeout(timer);
  }, [vmStatus, isTerminalReady, showPreloader]);

  // Handle session timer - only after preloader is done
  useEffect(() => {
    if (showPreloader || !session || !exam || session.status !== 'running') return;
    
    const totalTime = exam.duration_minutes * 60;
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
  }, [session, exam, showPreloader]);

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
      setShowPreloader(true);
      setPreloaderTimeLeft(30); // 30 seconds for VM restart
      
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
      setShowPreloader(false);
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Restart failed: ${err.message}\r\n`);
      }
    }
  };

  // Submit exam with confirmation
  const submitExam = async () => {
    if (!session || isSubmitting) return;
    
    // Show confirmation dialog
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
    
    setIsSubmitting(true);
    try {
      cleanupResources();
      
      const response = await authPost(`/api/practical-sessions/${session.id}/verify/`, {});
      
      navigate(`/student/practical-results/${response.result_id}`, {
        state: {
          success: response.success,
          output: response.output
        }
      });
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

  // Format preloader time
  const formatPreloaderTime = (sec) => {
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
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
    }
  };

  // Toggle instructions panel
  const toggleInstructions = () => {
    setShowInstructions(!showInstructions);
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
            Time remaining: {formatPreloaderTime(preloaderTimeLeft)}
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
              onClick={toggleInstructions}
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
              onClick={submitExam}
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