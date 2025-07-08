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
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  // Refs
  const terminalRef = useRef(null);
  const terminal = useRef(null);
  const fitAddon = useRef(null);
  const websocket = useRef(null);
  const timerRef = useRef(null);
  const reconnectTimer = useRef(null);
  const containerCheckInterval = useRef(null);
  const isMounted = useRef(true);
  const lastPong = useRef(Date.now());

  // Load session data
  useEffect(() => {
    isMounted.current = true;
    
    const loadSession = async () => {
      try {
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        setSession(sessionData);
        setExam(await authGet(`/api/practical-exams/${sessionData.exam}/`));

        // Start container status polling
        startContainerStatusPolling();
        
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
    if (!session || !exam) return;

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
      if (websocket.current) {
        websocket.current.close();
        websocket.current = null;
      }
    };
  }, [session, exam]);

  // Connect to terminal when container is ready
  useEffect(() => {
    if (containerStatus === 'running' && isTerminalReady) {
      setTimeout(() => {
        initWebSocket();
      }, 1000);
    } else if (containerStatus !== 'running' && websocket.current) {
      websocket.current.close();
      websocket.current = null;
      setConnectionStatus('Container stopped');
    }
  }, [containerStatus, isTerminalReady]);

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

  // Initialize terminal UI
  const initTerminal = () => {
    if (!terminalRef.current || terminal.current) return;

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

    // Handle window resize
    const resizeHandler = () => fitAddon.current && fitAddon.current.fit();
    window.addEventListener('resize', resizeHandler);

    // Show initial message
    if (containerStatus !== 'running') {
      terminal.current.writeln('\r\n⏳ Waiting for container to start...\r\n');
      setConnectionStatus('Waiting for container');
    }
  };

  // Start container status polling
  const startContainerStatusPolling = () => {
    if (containerCheckInterval.current) {
      clearInterval(containerCheckInterval.current);
    }
    
    containerCheckInterval.current = setInterval(async () => {
      try {
        const statusRes = await authGet(
          `/api/practical-sessions/${sessionId}/container_status/`
        );
        setContainerStatus(statusRes.status);
        
        // If container ID was null but now exists, update session
        if (session && !session.container_id && statusRes.container_id) {
          setSession(prev => ({ ...prev, container_id: statusRes.container_id }));
        }
      } catch (e) {
        console.error('Container status check failed', e);
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
      lastPong.current = Date.now();
      
      if (terminal.current) {
        terminal.current.writeln('\r\n✅ Connected to exam environment\r\n');
        
        // Handle terminal input
        terminal.current.onData(data => {
          if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            // Send as UTF-8 encoded text
            websocket.current.send(data);
          }
        });
        
        // Start heartbeat monitoring
        startHeartbeat();
        
        // Trigger initial prompt
        setTimeout(() => {
          terminal.current.write('\r\n');
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
      }
    };

    // Handle incoming messages
    websocket.current.onmessage = (event) => {
      lastPong.current = Date.now();
      
      if (typeof event.data === 'string') {
        // Handle control messages (ping)
        if (event.data.startsWith('{')) {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'ping') {
              // Respond to ping with pong
              websocket.current.send(JSON.stringify({
                type: 'pong',
                timestamp: message.timestamp
              }));
              return;
            }
          } catch (e) {
            // Not JSON, fall through to terminal output
          }
        }
        
        // Write to terminal
        if (terminal.current) {
          terminal.current.write(event.data);
        }
      } 
      // Handle binary data (container output)
      else if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        const str = new TextDecoder().decode(data);
        if (terminal.current) {
          terminal.current.write(str);
        }
      }
      // Handle Blob data (alternative binary format)
      else if (event.data instanceof Blob) {
        const reader = new FileReader();
        reader.onload = () => {
          if (terminal.current && typeof reader.result === 'string') {
            terminal.current.write(reader.result);
          }
        };
        reader.readAsText(event.data);
      }
    };
  };

  // Start heartbeat monitoring
  const startHeartbeat = () => {
    // Clear any existing heartbeat
    if (reconnectTimer.current) {
      clearInterval(reconnectTimer.current);
    }
    
    // Check connection every 15 seconds
    reconnectTimer.current = setInterval(() => {
      const now = Date.now();
      if (now - lastPong.current > 30000) { // 30 seconds without pong
        setConnectionStatus('Reconnecting due to missed heartbeats...');
        if (terminal.current) {
          terminal.current.writeln('\r\n♻️ Reconnecting due to missed heartbeats...\r\n');
        }
        initWebSocket();
      }
    }, 15000);
  };

  // Restart container
  const restartContainer = async () => {
    try {
      setConnectionStatus('Restarting container...');
      
      if (terminal.current) {
        terminal.current.writeln('\r\n♻️ Restarting container...\r\n');
      }
      
      await authPost(`/api/practical-sessions/${sessionId}/restart_container/`, {});
      
      // Reset container status and force re-check
      setContainerStatus('starting');
      startContainerStatusPolling();
    } catch (err) {
      setConnectionStatus('Restart failed');
      
      if (terminal.current) {
        terminal.current.writeln(`\r\n❌ Restart failed: ${err.message}\r\n`);
      }
    }
  };

  // Submit exam
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
        terminal.current.writeln(`\r\n❌ Submission error: ${err.message}\r\n`);
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
    if (websocket.current) websocket.current.close();
    if (terminal.current) terminal.current.dispose();
    if (timerRef.current) clearInterval(timerRef.current);
    if (reconnectTimer.current) clearInterval(reconnectTimer.current);
    if (containerCheckInterval.current) clearInterval(containerCheckInterval.current);
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
          
          <div className="flex space-x-2">
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              onClick={submitExam}
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row bg-gray-100">
        <div className="w-full md:w-2/5 p-4 border-r border-gray-300 overflow-auto">
          <div className="bg-white rounded-lg shadow p-4 h-full">
            <h2 className="text-lg font-semibold mb-4">Exam Instructions</h2>
            {exam && (
              <>
                <div className="mb-4">
                  <pre className="whitespace-pre-wrap font-sans">{exam.description}</pre>
                </div>
                
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
            <div 
              ref={terminalRef} 
              className="h-full w-full"
            />
          </div>
          
          <div className="bg-gray-800 text-white p-2 text-sm">
            Status: {connectionStatus}
          </div>
        </div>
      </div>
    </div>
  );
}