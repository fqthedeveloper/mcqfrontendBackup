// PracticalExam.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { authGet, authPost } from '../../services/api';

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
  
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const websocket = useRef(null);
  const timerRef = useRef(null);
  const reconnectInterval = useRef(1000);
  const reconnectTimer = useRef(null);
  const shouldReconnect = useRef(true);

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        
        if (sessionData.status !== 'running') {
          setError('This session is not active');
          setLoading(false);
          return;
        }
        
        setSession(sessionData);
        
        const tokenResponse = await authGet(`/api/practical-sessions/${sessionId}/token/`);
        setSessionToken(tokenResponse.token);
        
        const examData = await authGet(`/api/practical-exams/${sessionData.exam}/`);
        setExam(examData);
        
        const totalTime = examData.duration * 60;
        const startTime = new Date(sessionData.start_time).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        setElapsedTime(elapsedSeconds);
        setRemainingTime(Math.max(0, totalTime - elapsedSeconds));
        
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load session');
        setLoading(false);
      }
    };
    
    loadSession();
    
    return () => {
      shouldReconnect.current = false;
      if (websocket.current) websocket.current.close();
      if (terminal.current) terminal.current.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
      if (fitAddon.current) fitAddon.current.dispose();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [sessionId]);

  useEffect(() => {
    if (sessionToken && session && exam) {
      initTerminal();
    }
  }, [sessionToken, session, exam]);

  useEffect(() => {
    if (session && exam && !session.is_completed) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          setRemainingTime(exam.duration * 60 - newTime);
          
          if (newTime >= exam.duration * 60) {
            submitExam();
          }
          
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timerRef.current);
    }
  }, [session, exam]);

  const initTerminal = () => {
    if (!terminalRef.current) return;
    
    if (terminal.current) {
      terminal.current.dispose();
      terminal.current = null;
    }
    
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' },
      convertEol: true,
    });
    
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    
    const resizeListener = () => {
      if (fitAddon.current) {
        fitAddon.current.fit();
        sendResizeCommand();
      }
    };
    window.addEventListener('resize', resizeListener);
    
    setTimeout(() => {
      if (fitAddon.current) {
        fitAddon.current.fit();
        sendResizeCommand();
      }
    }, 10);
    
    terminal.current.onData(data => {
      if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
        websocket.current.send(data);
      }
    });
    
    initWebSocket();
    
    return () => window.removeEventListener('resize', resizeListener);
  };

  const sendResizeCommand = () => {
    if (terminal.current && websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      const { cols, rows } = terminal.current;
      websocket.current.send(JSON.stringify({
        type: 'resize',
        cols: cols,
        rows: rows
      }));
    }
  };

  const initWebSocket = () => {
    const backendHost = process.env.REACT_APP_BACKEND_HOST || window.location.host;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${backendHost}/ws/practical/${sessionId}/?session_token=${sessionToken}`;
    
    setConnectionStatus('Connecting...');
    terminal.current?.writeln('\r\n\x1b[33mConnecting to exam environment...\x1b[0m\r\n');
    
    if (websocket.current) {
      websocket.current.close();
    }
    
    websocket.current = new WebSocket(wsUrl);
    
    websocket.current.onopen = () => {
      reconnectInterval.current = 1000;
      setConnectionStatus('Connected');
      terminal.current?.writeln('\r\n\x1b[32m✅ Connected to exam environment\x1b[0m\r\n');
      sendResizeCommand();
    };
    
    websocket.current.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        terminal.current?.write(data);
      }
      else if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            const data = new Uint8Array(reader.result);
            terminal.current?.write(data);
          }
        };
        reader.readAsArrayBuffer(event.data);
      }
      else if (typeof event.data === 'string') {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'system') {
            terminal.current?.writeln(`\r\n${data.message}\r\n`);
          } else {
            terminal.current?.write(event.data);
          }
        } catch {
          terminal.current?.write(event.data);
        }
      }
    };
    
    websocket.current.onerror = (error) => {
      const errorMessage = error.message || 'Unknown WebSocket error';
      setConnectionStatus(`Error: ${errorMessage}`);
      terminal.current?.writeln(`\r\n\x1b[31m❌ WebSocket error: ${errorMessage}\x1b[0m\r\n`);
    };
    
    websocket.current.onclose = (event) => {
      let reason = event.reason || 'Unknown reason';
      if (event.code === 1006) reason = 'Abnormal closure - server may be down';
      
      setConnectionStatus(`Disconnected: ${reason}`);
      terminal.current?.writeln(`\r\n\x1b[31m🔌 Connection closed: ${reason}\x1b[0m\r\n`);
      
      if (event.code === 1000 || !shouldReconnect.current) return;
      
      const nextInterval = Math.min(reconnectInterval.current * 2, 30000);
      
      terminal.current?.writeln(`\r\n\x1b[33mReconnecting in ${nextInterval/1000}s...\x1b[0m\r\n`);
      
      reconnectTimer.current = setTimeout(() => {
        if (shouldReconnect.current) {
          terminal.current?.writeln('\r\n\x1b[33mReconnecting to exam environment...\x1b[0m\r\n');
          initWebSocket();
        }
      }, nextInterval);
      
      reconnectInterval.current = nextInterval;
    };
  };

  const handleManualReconnect = () => {
    reconnectInterval.current = 1000;
    
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    terminal.current?.writeln('\r\n\x1b[33mManual reconnect initiated...\x1b[0m\r\n');
    initWebSocket();
  };

  const handleTerminalReset = () => {
    reconnectInterval.current = 1000;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    
    if (websocket.current) {
      websocket.current.close();
      websocket.current = null;
    }
    
    if (terminal.current) {
      terminal.current.clear();
    }
    
    terminal.current?.writeln('\r\n\x1b[33mResetting terminal connection...\x1b[0m\r\n');
    initWebSocket();
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
        terminal.current.writeln(`\r\nVerification result: ${response.is_success ? '\x1b[32mSUCCESS ✅\x1b[0m' : '\x1b[31mFAILURE ❌\x1b[0m'}\r\n`);
      }
    } catch (err) {
      terminal.current?.writeln(`\r\n\x1b[31mVerification error: ${err.message}\x1b[0m\r\n`);
      setVerificationResult({
        is_verified: false,
        verification_output: `Verification failed: ${err.message}`
      });
    } finally {
      setVerifying(false);
    }
  };

  const submitExam = async () => {
    shouldReconnect.current = false;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    
    if (!session) return;
    
    try {
      await authPost(`/api/practical-sessions/${session.id}/terminate/`, {
        reason: 'Exam submitted by student'
      });
      navigate(`/student/results/${session.id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
      terminal.current?.writeln(`\r\n\x1b[31mSubmission error: ${err.message}\x1b[0m\r\n`);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
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
            <span>{exam?.subject?.name}</span>
            <span>•</span>
            <span>{exam?.duration} min</span>
            <span>•</span>
            <span className="time-left">{formatTime(remainingTime)}</span>
          </div>
        </div>
        
        <div className="header-controls">
          <div className={`connection-status ${connectionStatus.includes('Error') ? 'error' : connectionStatus.includes('Disconnected') ? 'warning' : 'success'}`}>
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
                <button 
                  className="verify-btn" 
                  onClick={verifyTask}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify Exam'}
                </button>
              </div>
              
              <div className="task-description">
                <pre>{exam.description}</pre>
                {exam.setup_command && (
                  <div className="setup-command">
                    <strong>Setup Command:</strong> 
                    <code>{exam.setup_command}</code>
                  </div>
                )}
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
                  <p>
                    {verificationResult.is_verified 
                      ? '✅ Exam completed successfully!' 
                      : '❌ Exam verification failed'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="terminal-container">
          <div className="terminal-header">
            <h3>Exam Terminal</h3>
            <div className="terminal-actions">
              <button className="btn-clear" onClick={() => terminal.current?.clear()}>
                Clear
              </button>
              <button className="btn-reconnect" onClick={handleManualReconnect}>
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
      
      <div className="practical-footer">
        <button 
          className="btn-verify" 
          onClick={verifyTask}
          disabled={verifying}
        >
          Verify Exam
        </button>
        <button className="btn-submit" onClick={submitExam}>
          Submit Exam
        </button>
      </div>
    </div>
  );
}