import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { authGet, authPost } from '../../services/api';
import '../CSS/PracticalResult.css';

export default function PracticalResult() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [result, setResult] = useState(null);
  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('pending');
  const [vmDeletionStatus, setVmDeletionStatus] = useState('pending');
  const [showDetails, setShowDetails] = useState(false);

  // Get result data from location state if available (from the submit process)
  const resultData = location.state;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load session data
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        setSession(sessionData);
        
        // Load exam data
        const examData = await authGet(`/api/practical-exams/${sessionData.exam}/`);
        setExam(examData);
        
        // Try to load result data
        try {
          // First check if we have result data passed from the submission
          if (resultData) {
            setResult({
              score: resultData.success ? 100 : 0,
              total_possible: 100,
              details: {
                verification_output: resultData.output,
                success: resultData.success
              },
              created_at: new Date().toISOString()
            });
          } else {
            // If not, try to fetch from API
            const results = await authGet(`/api/practical-results/?session=${sessionId}`);
            if (results.length > 0) {
              setResult(results[0]);
            }
          }
        } catch (err) {
          console.log('No result found yet, will verify');
        }
        
        setLoading(false);
        
        // If session is still running or verification hasn't been done, verify it
        if (sessionData.status === 'running' || sessionData.status === 'starting') {
          await verifyAndTerminateSession();
        } else if (sessionData.status === 'completed' || sessionData.status === 'terminated') {
          // If already completed, check if VM needs to be deleted
          checkAndDeleteVm();
        }
        
      } catch (err) {
        setError('Failed to load result data: ' + err.message);
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId, resultData]);

  const verifyAndTerminateSession = async () => {
    try {
      setVerificationStatus('in-progress');
      
      // Run verification
      const verificationResponse = await authPost(
        `/api/practical-sessions/${sessionId}/verify/`, 
        {}
      );
      
      setVerificationStatus('completed');
      
      // Load the updated result
      const results = await authGet(`/api/practical-results/?session=${sessionId}`);
      if (results.length > 0) {
        setResult(results[0]);
      }
      
      // Terminate the VM
      await terminateVm();
      
    } catch (err) {
      setVerificationStatus('failed');
      setError('Verification failed: ' + err.message);
    }
  };

  const terminateVm = async () => {
    try {
      setVmDeletionStatus('in-progress');
      
      // Call terminate endpoint
      await authPost(
        `/api/practical-sessions/${sessionId}/terminate/`,
        { reason: 'Exam completed - automatic termination' }
      );
      
      setVmDeletionStatus('completed');
      
      // Refresh session data
      const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
      setSession(sessionData);
      
    } catch (err) {
      setVmDeletionStatus('failed');
      console.error('VM termination failed:', err);
    }
  };

  const checkAndDeleteVm = async () => {
    // If VM is still running, terminate it
    if (session && session.status === 'running') {
      await terminateVm();
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    
    return `${minutes}:${seconds.padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="result-container">
        <div className="result-loading">
          <div className="loading-spinner"></div>
          <p>Loading exam results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-container">
        <div className="result-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button 
            className="result-back-btn"
            onClick={() => navigate('/student')}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>Exam Results: {exam?.title}</h1>
        <button 
          className="result-back-btn"
          onClick={() => navigate('/student')}
        >
          Return to Dashboard
        </button>
      </div>

      <div className="result-content">
        <div className="result-summary">
          <div className="score-display">
            <div className="score-circle">
              <span className="score-value">
                {result ? `${result.score}/${result.total_possible}` : 'N/A'}
              </span>
            </div>
            <div className="score-label">Final Score</div>
          </div>

          <div className="result-details">
            <div className="detail-row">
              <span className="detail-label">Status:</span>
              <span className={`detail-value status-${session?.status}`}>
                {session?.status?.toUpperCase()}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Started:</span>
              <span className="detail-value">
                {session?.start_time ? formatDate(session.start_time) : 'N/A'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Completed:</span>
              <span className="detail-value">
                {session?.end_time ? formatDate(session.end_time) : 'N/A'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">
                {formatDuration(session?.start_time, session?.end_time)}
              </span>
            </div>
          </div>
        </div>

        <div className="verification-section">
          <h2>Verification Results</h2>
          
          {verificationStatus === 'pending' && session?.status === 'completed' && (
            <div className="status-message">
              <p>Verification was completed during the exam session.</p>
            </div>
          )}
          
          {verificationStatus === 'in-progress' && (
            <div className="status-message">
              <div className="loading-spinner small"></div>
              <p>Verifying your work...</p>
            </div>
          )}
          
          {verificationStatus === 'completed' && (
            <div className="status-message success">
              <p>✓ Verification completed successfully</p>
            </div>
          )}
          
          {verificationStatus === 'failed' && (
            <div className="status-message error">
              <p>✗ Verification failed</p>
            </div>
          )}

          {vmDeletionStatus === 'in-progress' && (
            <div className="status-message">
              <div className="loading-spinner small"></div>
              <p>Cleaning up exam environment...</p>
            </div>
          )}
          
          {vmDeletionStatus === 'completed' && (
            <div className="status-message success">
              <p>✓ Exam environment cleaned up</p>
            </div>
          )}
          
          {vmDeletionStatus === 'failed' && (
            <div className="status-message warning">
              <p>⚠ Exam environment cleanup failed (contact administrator)</p>
            </div>
          )}

          {result && result.details && (
            <div className="verification-output">
              <button 
                className="toggle-details-btn"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Verification Details
              </button>
              
              {showDetails && (
                <div className="output-content">
                  <h4>Verification Output:</h4>
                  <pre className="output-text">
                    {result.details.verification_output || 'No output captured'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="result-actions">
          <button 
            className="result-action-btn primary"
            onClick={() => navigate('/student/exams')}
          >
            View All Exams
          </button>
          {session?.status === 'completed' && (
            <button 
              className="result-action-btn"
              onClick={() => window.print()}
            >
              Print Results
            </button>
          )}
        </div>
      </div>
    </div>
  );
}