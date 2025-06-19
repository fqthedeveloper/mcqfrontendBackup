// PracticalExam.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import '../CSS/PracticalExam.css';
import { authGet, authPost } from '../../services/api';
import useBeforeUnload from '../../hooks/useBeforeUnload';

function PracticalExam() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terminalReady, setTerminalReady] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const commandHistoryRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const commandBufferRef = useRef('');
  const websocket = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/sessions/${sessionId}/`);
        
        if (sessionData.exam_mode !== 'practical') {
          setError('This is not a practical exam session');
          setLoading(false);
          return;
        }
        
        setSession(sessionData);
        const examData = await authGet(`/api/exams/${sessionData.exam}/`);
        setTasks(examData.practical_tasks || []);
        
        if (examData.practical_tasks?.length > 0) {
          setCurrentTask(examData.practical_tasks[0]);
        }
        
        const totalTime = examData.duration * 60;
        const elapsed = sessionData.elapsed_time || 0;
        setElapsedTime(elapsed);
        setRemainingTime(totalTime - elapsed);
        setTerminalReady(true);
        
      } catch (err) {
        if (err.message.includes('404') || err.message.includes('400')) {
          try {
            const params = new URLSearchParams(location.search);
            const examId = params.get('exam_id');
            
            if (!examId) {
              throw new Error('Exam ID is required');
            }
            
            const response = await authPost('/api/sessions/validate-exam/', { exam: examId });
            navigate(`/student/practical/${response.data.id}?exam_id=${examId}`, { replace: true });
            return;
          } catch (createErr) {
            setError(createErr.message || 'Failed to create session');
          }
        } else {
          setError(err.message || 'Failed to load session');
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadSession();
    
    return () => {
      if (websocket.current) websocket.current.close();
      if (terminal.current) terminal.current.dispose();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, location.search, navigate]);

  useEffect(() => {
    if (terminalReady && terminalRef.current && !terminal.current) {
      initTerminal();
    }
  }, [terminalReady]);

  useEffect(() => {
    if (session && !session.is_completed) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          setRemainingTime(session.exam_duration * 60 - newTime);
          
          if (newTime >= session.exam_duration * 60) {
            submitExam();
          }
          
          return newTime;
        });
      }, 1000);
      
      return () => clearInterval(timerRef.current);
    }
  }, [session]);

  useEffect(() => {
    return () => {
      if (session && !session.is_completed) {
        authPost(`/api/sessions/${session.id}/save_progress/`, {
          elapsed_time: elapsedTime
        });
      }
    };
  }, [session, elapsedTime]);

  const initTerminal = () => {
    if (!terminalRef.current) return;
    
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: '#1e1e1e', foreground: '#d4d4d4' }
    });
    
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();
    
    window.addEventListener('resize', () => fitAddon.current.fit());
    
    terminal.current.write(`${connectionStatus}\r\n`);
    terminal.current.onData(data => handleTerminalInput(data));
    initWebSocket();
  };

  const initWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('access_token');
    
    if (!session) return;
    
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/practical/${sessionId}/?token=${token}&exam_id=${session.exam}`;
    
    websocket.current = new WebSocket(wsUrl);
    
    websocket.current.onopen = () => {
      setConnectionStatus('Connected');
      terminal.current.write('\r\nConnected to exam environment\r\n$ ');
    };
    
    websocket.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'command_output') {
        terminal.current.write(data.output);
      } else if (data.type === 'error') {
        terminal.current.write(`\r\nError: ${data.message}\r\n$ `);
      }
    };
    
    websocket.current.onerror = (error) => {
      setConnectionStatus('Connection error');
      terminal.current.write(`\r\nWebSocket error: ${error.message || 'Unknown error'}\r\n`);
    };
    
    websocket.current.onclose = () => {
      setConnectionStatus('Disconnected');
      terminal.current.write('\r\nConnection closed\r\n');
    };
  };
  
  const handleTerminalInput = (data) => {
    if (data === '\r') {
      const command = commandBufferRef.current.trim();
      if (command) {
        commandHistoryRef.current = [command, ...commandHistoryRef.current];
        historyIndexRef.current = -1;
        
        if (websocket.current?.readyState === WebSocket.OPEN) {
          websocket.current.send(JSON.stringify({
            type: 'command',
            command: command,
            task_id: currentTask?.id
          }));
        }
        
        terminal.current.write('\r\n$ ');
        commandBufferRef.current = '';
      }
      return;
    }
    
    if (data === '\x7f') {
      if (commandBufferRef.current.length > 0) {
        commandBufferRef.current = commandBufferRef.current.slice(0, -1);
        terminal.current.write('\b \b');
      }
      return;
    }
    
    if (data === '\x1b[A') {
      if (commandHistoryRef.current.length > 0 && historyIndexRef.current < commandHistoryRef.current.length - 1) {
        historyIndexRef.current += 1;
        const command = commandHistoryRef.current[historyIndexRef.current];
        commandBufferRef.current = command;
        terminal.current.write(`\x1b[2K\r$ ${command}`);
      }
      return;
    }
    
    if (data === '\x1b[B') {
      if (historyIndexRef.current > 0) {
        historyIndexRef.current -= 1;
        const command = commandHistoryRef.current[historyIndexRef.current];
        commandBufferRef.current = command;
        terminal.current.write(`\x1b[2K\r$ ${command}`);
      } else if (historyIndexRef.current === 0) {
        historyIndexRef.current = -1;
        commandBufferRef.current = '';
        terminal.current.write('\x1b[2K\r$ ');
      }
      return;
    }
    
    commandBufferRef.current += data;
    terminal.current.write(data);
  };

  const verifyTask = async () => {
    if (!currentTask || !session) return;
    
    setVerifying(true);
    setVerificationResult(null);
    
    try {
      const response = await authPost(`/api/sessions/${session.id}/verify-task/`, {
        task_id: currentTask.id
      });
      
      setVerificationResult(response);
      
      if (terminal.current) {
        terminal.current.write(`\r\nVerification result: ${response.is_verified ? 'SUCCESS' : 'FAILURE'}\r\n$ `);
      }
    } catch (err) {
      terminal.current.write(`\r\nVerification error: ${err.message}\r\n$ `);
    } finally {
      setVerifying(false);
    }
  };

  const submitExam = async () => {
    if (!session) return;
    
    try {
      await authPost(`/api/sessions/${session.id}/submit-exam/`, {});
      navigate(`/student/results/${session.id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return <div className="practical-loading">Loading practical exam environment...</div>;
  }

  if (error) {
    return (
      <div className="practical-error">
        {error}
        <button onClick={() => navigate('/student')}>
          Go Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="practical-container">
      <div className="exam-header">
        <div className="exam-info">
          <h1>{session?.exam_title} - Practical Exam</h1>
          <div className="exam-meta">
            <span>{tasks.length} Tasks</span>
            <span>•</span>
            <span>{session?.exam_duration} min</span>
            <span>•</span>
            <span className="time-left">{formatTime(remainingTime)}</span>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="connection-status">
            Status: {connectionStatus}
          </div>
          <button className="submit-btn" onClick={submitExam}>
            Submit Exam
          </button>
        </div>
      </div>
      
      <div className="practical-layout">
        <div className="task-sidebar">
          <h3>Tasks</h3>
          <ul>
            {tasks.map((task, index) => (
              <li 
                key={task.id} 
                className={currentTask?.id === task.id ? 'active' : ''}
                onClick={() => {
                  setCurrentTask(task);
                  setVerificationResult(null);
                }}
              >
                Task {index + 1}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="task-content">
          {currentTask && (
            <>
              <div className="task-header">
                <h2>Task {tasks.findIndex(t => t.id === currentTask.id) + 1}</h2>
                <button 
                  className="verify-btn" 
                  onClick={verifyTask}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : 'Verify Task'}
                </button>
              </div>
              
              <div className="task-description">
                <pre>{currentTask.description}</pre>
              </div>
              
              {verificationResult && (
                <div className={`verification-result ${verificationResult.is_verified ? 'success' : 'failure'}`}>
                  <h3>Verification Result:</h3>
                  <pre>{verificationResult.verification_output}</pre>
                  <p>
                    {verificationResult.is_verified 
                      ? '✅ Task completed successfully!' 
                      : '❌ Task verification failed'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="terminal-container">
        <div className="terminal-header">
          <h3>Exam Terminal</h3>
          <div className="terminal-actions">
            <button className="btn-clear" onClick={() => terminal.current?.clear()}>
              Clear Terminal
            </button>
            <button className="btn-reconnect" onClick={initWebSocket} disabled={connectionStatus === 'Connected'}>
              Reconnect
            </button>
          </div>
        </div>
        <div ref={terminalRef} className="terminal"></div>
      </div>
      
      <div className="practical-footer">
        <button 
          className="btn-verify" 
          onClick={verifyTask}
          disabled={verifying}
        >
          Verify Current Task
        </button>
        <button className="btn-submit" onClick={submitExam}>
          Submit Exam
        </button>
      </div>
    </div>
  );
}

export default PracticalExam;