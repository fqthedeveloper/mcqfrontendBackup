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
  const [containerStatus, setContainerStatus] = useState('checking');

  // Refs
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const websocket = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimer = useRef(null);
  const containerCheckInterval = useRef(null);
  const lastPong = useRef(Date.now());

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        setSession(sessionData);
        setExam(await authGet(`/api/practical-exams/${sessionData.exam}/`));
        startContainerStatusPolling();
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Failed to load session');
        setLoading(false);
      }
    };

    loadSession();

    return cleanupResources;
  }, [sessionId]);

  // Initialize terminal
  useEffect(() => {
    if (!session || !exam) return;

    initTerminal();

    return () => {
      if (terminal.current) terminal.current.dispose();
      if (fitAddon.current) fitAddon.current.dispose();
      if (websocket.current) websocket.current.close();
    };
  }, [session, exam]);

  // Connect when container ready
  useEffect(() => {
    if (containerStatus === 'running') {
      setTimeout(initWebSocket, 1000);
    } else if (websocket.current) {
      websocket.current.close();
      setConnectionStatus('Container stopped');
    }
  }, [containerStatus]);

  // Timer
  useEffect(() => {
    if (session && exam && session.status === 'running') {
      const totalTime = exam.duration * 60;
      const startTime = new Date(session.start_time).getTime();
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setRemainingTime(Math.max(0, totalTime - elapsedSeconds));

      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timerRef.current);
    }
  }, [session, exam]);

  const initTerminal = () => {
    if (terminal.current || !terminalRef.current) return;

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
    fitAddon.current.fit();

    window.addEventListener('resize', () => fitAddon.current.fit());

    if (containerStatus !== 'running') {
      terminal.current.writeln('\r\n⏳ Waiting for container to start...\r\n');
      setConnectionStatus('Waiting for container');
    }
  };

  const startContainerStatusPolling = () => {
    clearInterval(containerCheckInterval.current);
    containerCheckInterval.current = setInterval(async () => {
      try {
        const statusRes = await authGet(
          `/api/practical-sessions/${sessionId}/container_status/`
        );
        setContainerStatus(statusRes.status);
        if (statusRes.container_id && session && !session.container_id) {
          setSession(prev => ({ ...prev, container_id: statusRes.container_id }));
        }
      } catch (e) {
        console.error('Container status check failed', e);
      }
    }, 3000);
  };

  const initWebSocket = () => {
    if (!session?.token) return;

    if (websocket.current) websocket.current.close();

    const isSecure = baseURL.startsWith('https');
    const wsProtocol = isSecure ? 'wss' : 'ws';
    const host = baseURL.replace(/^https?:\/\//, '').split('/')[0];
    const token = encodeURIComponent(session.token);
    const wsUrl = `${wsProtocol}://${host}/ws/practical/${sessionId}/?token=${token}`;

    setConnectionStatus('Connecting to terminal...');
    terminal.current?.writeln('\r\n🔌 Connecting to exam environment...\r\n');

    websocket.current = new WebSocket(wsUrl);
    websocket.current.binaryType = 'arraybuffer';  // Critical fix

    websocket.current.onopen = () => {
      setConnectionStatus('Connected to terminal');
      lastPong.current = Date.now();
      
      if (terminal.current) {
        terminal.current.writeln('\r\n✅ Connected to exam environment\r\n');
        terminal.current.onData(data => {
          websocket.current?.readyState === WebSocket.OPEN && websocket.current.send(data);
        });
        
        startHeartbeat();
        setTimeout(() => terminal.current.write('\r\n'), 500);
      }
    };

    websocket.current.onerror = (error) => {
      setConnectionStatus(`Terminal error: ${error.message || 'Unknown error'}`);
      terminal.current?.writeln(`\r\n❌ Connection error: ${error.message || 'Unknown error'}\r\n`);
    };

    websocket.current.onclose = (event) => {
      setConnectionStatus(`Terminal disconnected: ${event.reason || 'Unknown reason'}`);
      terminal.current?.writeln(`\r\n🔌 Connection closed: ${event.reason || 'Unknown reason'}\r\n`);
    };

    websocket.current.onmessage = (event) => {
      lastPong.current = Date.now();
      
      if (typeof event.data === 'string') {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'ping') {
            websocket.current.send(JSON.stringify({
              type: 'pong',
              timestamp: message.timestamp
            }));
            return;
          }
        } catch (e) {
          // Not JSON, treat as terminal output
          terminal.current?.write(event.data);
        }
      } else {
        // Handle binary data properly
        terminal.current?.write(new Uint8Array(event.data));
      }
    };
  };

  const startHeartbeat = () => {
    clearInterval(reconnectTimer.current);
    reconnectTimer.current = setInterval(() => {
      if (Date.now() - lastPong.current > 30000) {
        setConnectionStatus('Reconnecting due to missed heartbeats...');
        terminal.current?.writeln('\r\n♻️ Reconnecting due to missed heartbeats...\r\n');
        initWebSocket();
      }
    }, 15000);
  };

  const restartContainer = async () => {
    try {
      setConnectionStatus('Restarting container...');
      terminal.current?.writeln('\r\n♻️ Restarting container...\r\n');
      await authPost(`/api/practical-sessions/${sessionId}/restart_container/`, {});
      setContainerStatus('starting');
      startContainerStatusPolling();
    } catch (err) {
      setConnectionStatus('Restart failed');
      terminal.current?.writeln(`\r\n❌ Restart failed: ${err.message}\r\n`);
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
      terminal.current?.writeln(`\r\n❌ Submission error: ${err.message}\r\n`);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const cleanupResources = () => {
    websocket.current?.close();
    terminal.current?.dispose();
    clearInterval(timerRef.current);
    clearInterval(reconnectTimer.current);
    clearInterval(containerCheckInterval.current);
  };

  if (loading) return <div className="p-4 text-center">Loading exam environment...</div>;

  if (error) return (
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

  return (
    <div className="practical-container h-screen flex flex-col">
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">{exam?.title} - Practical Exam</h1>
            <div className="flex space-x-4 mt-2">
              <span>Time Left: {formatTime(remainingTime)}</span>
              <span>• Container: 
                <span className={`ml-1 px-2 py-1 rounded ${
                  containerStatus === 'running' ? 'bg-green-500' : 
                  containerStatus === 'starting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {containerStatus}
                </span>
              </span>
            </div>
          </div>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={submitExam}
          >
            Submit Exam
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row bg-gray-100">
        <div className="w-full md:w-2/5 p-4 border-r border-gray-300 overflow-auto">
          <div className="bg-white rounded-lg shadow p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Exam Instructions</h2>
            {exam && (
              <>
                <pre className="whitespace-pre-wrap font-sans mb-4">{exam.description}</pre>
                {exam.verification_command && (
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <h3 className="font-medium">Verification Command:</h3>
                    <code className="block mt-1 p-2 bg-gray-100 rounded">{exam.verification_command}</code>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="w-full md:w-3/5 flex flex-col">
          <div className="bg-gray-700 text-white p-2 flex justify-between items-center">
            <h3 className="font-medium">Terminal</h3>
            <div className="flex space-x-2">
              <button 
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={initWebSocket}
              >
                Reconnect
              </button>
              <button 
                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                onClick={restartContainer}
                disabled={containerStatus === 'starting' || containerStatus === 'running'}
              >
                {containerStatus === 'starting' || containerStatus === 'running' 
                  ? 'Restarting...' : 'Restart Container'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 bg-black p-2">
            <div ref={terminalRef} className="h-full w-full" />
          </div>
          
          <div className="bg-gray-800 text-white p-2 text-sm">
            Status: {connectionStatus}
          </div>
        </div>
      </div>
    </div>
  );
}