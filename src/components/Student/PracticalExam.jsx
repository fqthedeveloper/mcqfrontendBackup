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
  const [terminalOutput, setTerminalOutput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [terminalReady, setTerminalReady] = useState(false);
  
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const commandBuffer = useRef('');
  const websocket = useRef(null);

  const STORAGE_KEY_OUTPUT = `practical_${sessionId}_output`;

  useEffect(() => {
    if (!sessionId) {
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        // Load session data
        const sessionData = await authGet(`/api/sessions/${sessionId}/`);
        
        // Check if it's a practical exam
        if (sessionData.exam_mode !== 'practical') {
          setError('This is not a practical exam session');
          setLoading(false);
          return;
        }
        
        setSession(sessionData);
        
        // Extract tasks from practical_tasks array
        const practicalTasks = sessionData.practical_tasks || [];
        setTasks(practicalTasks);
        
        if (practicalTasks.length > 0) {
          // Set first task as current
          setCurrentTask(practicalTasks[0]);
        }
        
        // Load saved terminal output
        const savedOutput = localStorage.getItem(STORAGE_KEY_OUTPUT) || '';
        setTerminalOutput(savedOutput);
        
        // Initialize terminal after DOM is ready
        setTerminalReady(true);
        
        // Set up timer
        const totalTime = sessionData.exam_duration * 60;
        const elapsed = sessionData.elapsed_time || 0;
        setElapsedTime(elapsed);
        setRemainingTime(totalTime - elapsed);
        
      } catch (err) {
        // Handle session creation if needed
        if (err.message.includes('404') || err.message.includes('400')) {
          try {
            const params = new URLSearchParams(location.search);
            const examId = params.get('exam_id');
            
            if (!examId) {
              throw new Error('Exam ID is required to create a new session');
            }
            
            const newSession = await authPost('/api/sessions/validate-exam/', {
              exam: examId
            });
            
            navigate(`/student/practical/${newSession.id}?exam_id=${examId}`, { replace: true });
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
    };
  }, [sessionId, location.search, navigate]);

  useEffect(() => {
    if (terminalReady && terminalRef.current && !terminal.current) {
      initTerminal();
    }
  }, [terminalReady]);

  const initTerminal = () => {
    if (!terminalRef.current) return;
    
    terminal.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4'
      }
    });
    
    fitAddon.current = new FitAddon();
    terminal.current.loadAddon(fitAddon.current);
    terminal.current.open(terminalRef.current);
    fitAddon.current.fit();
    
    terminal.current.write(terminalOutput);
    terminal.current.write('\r\n$ ');
    
    terminal.current.onData(data => {
      handleTerminalInput(data);
    });
    
    initWebSocket();
  };

  const initWebSocket = () => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = localStorage.getItem('access_token');
    const params = new URLSearchParams(location.search);
    const examId = params.get('exam_id');
    
    const wsUrl = `${wsProtocol}//${window.location.host}/ws/practical/${sessionId}/?token=${token}&exam_id=${examId || ''}`;
    
    websocket.current = new WebSocket(wsUrl);
    
    websocket.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    websocket.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'command_output' || data.type === 'error') {
        terminal.current.write(data.output);
        setTerminalOutput(prev => prev + data.output);
      }
    };
    
    websocket.current.onerror = (err) => {
      console.error('WebSocket error:', err);
      setError('WebSocket connection failed');
    };
    
    websocket.current.onclose = () => {
      console.log('WebSocket closed');
    };
  };
  
  const handleTerminalInput = (data) => {
    if (data === '\r') {
      const command = commandBuffer.current.trim();
      if (command) {
        setCommandHistory(prev => [command, ...prev]);
        setHistoryIndex(-1);
        
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
          websocket.current.send(JSON.stringify({
            type: 'command',
            command: command,
            task_id: currentTask?.id
          }));
        }
        
        commandBuffer.current = '';
      }
      terminal.current.write('\r\n$ ');
      return;
    }
    
    if (data === '\x7f') {
      if (commandBuffer.current.length > 0) {
        commandBuffer.current = commandBuffer.current.slice(0, -1);
        terminal.current.write('\b \b');
      }
      return;
    }
    
    if (data === '\x1b[A') {
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        terminal.current.write('\x1b[2K\r$ ' + commandHistory[newIndex]);
        commandBuffer.current = commandHistory[newIndex];
      }
      return;
    }
    
    if (data === '\x1b[B') {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        terminal.current.write('\x1b[2K\r$ ' + commandHistory[newIndex]);
        commandBuffer.current = commandHistory[newIndex];
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        terminal.current.write('\x1b[2K\r$ ');
        commandBuffer.current = '';
      }
      return;
    }
    
    commandBuffer.current += data;
    terminal.current.write(data);
  };

  const saveTerminalOutput = async () => {
    if (!session) return;
    try {
      await authPost(`/api/sessions/${session.id}/save_terminal/`, {
        terminal_output: terminalOutput
      });
      localStorage.setItem(STORAGE_KEY_OUTPUT, terminalOutput);
    } catch (err) {
      console.error('Failed to save terminal output:', err);
    }
  };

  const submitExam = async () => {
    try {
      await saveTerminalOutput();
      await authPost(`/api/sessions/${session.id}/submit_exam/`, {
        terminal_output: terminalOutput
      });
      localStorage.removeItem(STORAGE_KEY_OUTPUT);
      navigate(`/student/results/${session.id}`);
    } catch (err) {
      setError('Failed to submit exam: ' + err.message);
    }
  };

  useBeforeUnload(() => {
    saveTerminalOutput();
  });

  useEffect(() => {
    if (!session || session.is_completed) return;
    
    const interval = setInterval(() => {
      setElapsedTime(prev => {
        const newTime = prev + 1;
        setRemainingTime(session.exam_duration * 60 - newTime);
        
        if (newTime >= session.exam_duration * 60) {
          submitExam();
          clearInterval(interval);
        }
        
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [session]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return <div className="practical-loading">Loading practical exam...</div>;
  }

  if (error) {
    return <div className="practical-error">{error}</div>;
  }

  return (
    <div className="practical-container">
      <div className="exam-header">
        <div className="exam-info">
          <h1>{session?.exam_title} - Practical</h1>
          <div className="exam-meta">
            <span>{tasks.length} Tasks</span>
            <span>•</span>
            <span>{session?.exam_duration} min</span>
            <span>•</span>
            <span>{formatTime(remainingTime)}</span>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="timer-container">
            <span className="time-left">{formatTime(remainingTime)}</span>
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
                onClick={() => setCurrentTask(task)}
              >
                Task {index + 1}: {task.task.title}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="task-content">
          {currentTask && (
            <>
              <h2>{currentTask.task.title}</h2>
              <div 
                className="task-description" 
                dangerouslySetInnerHTML={{ 
                  __html: currentTask.task.description.replace(/\r\n/g, '<br/>') 
                }} 
              />
              {currentTask.task.command_template && (
                <div className="hint-box">
                  <strong>Command Hint:</strong>
                  <pre>{currentTask.task.command_template}</pre>
                </div>
              )}
              {currentTask.task.expected_output && (
                <div className="expected-output">
                  <strong>Expected Output:</strong>
                  <pre>{currentTask.task.expected_output}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="terminal-container">
        <div ref={terminalRef} className="terminal"></div>
      </div>
      
      <div className="practical-footer">
        <button className="btn-save" onClick={saveTerminalOutput}>
          Save Progress
        </button>
        <button className="btn-submit" onClick={submitExam}>
          Submit Exam
        </button>
      </div>
    </div>
  );
}

export default PracticalExam;