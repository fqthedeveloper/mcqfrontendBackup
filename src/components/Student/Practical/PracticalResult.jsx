import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { authGet } from '../../../services/api';
import './PracticalExamResult.css';

export default function PracticalExamResult() {
  const { sessionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [session, setSession] = useState(null);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load session data
        const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
        setSession(sessionData);
        
        // Load exam data
        if (sessionData.exam) {
          const examData = await authGet(`/api/practical-exams/${sessionData.exam}/`);
          setExam(examData);
        }
        
        // Check if we have a result already
        if (sessionData.status === 'completed' || sessionData.status === 'failed') {
          try {
            const resultData = await authGet(`/api/practical-results/?session=${sessionId}`);
            if (resultData && resultData.results && resultData.results.length > 0) {
              setResult(resultData.results[0]);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.error('Error loading result:', err);
          }
        }
        
        // If no result yet, start polling
        if (sessionData.status === 'verifying') {
          setPolling(true);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load exam results');
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId]);

  useEffect(() => {
    let intervalId = null;
    
    if (polling) {
      intervalId = setInterval(async () => {
        try {
          const sessionData = await authGet(`/api/practical-sessions/${sessionId}/`);
          
          if (sessionData.status === 'completed' || sessionData.status === 'failed') {
            // Stop polling
            setPolling(false);
            
            // Load result
            try {
              const resultData = await authGet(`/api/practical-results/?session=${sessionId}`);
              if (resultData && resultData.results && resultData.results.length > 0) {
                setResult(resultData.results[0]);
              }
            } catch (err) {
              console.error('Error loading result:', err);
            }
          }
        } catch (err) {
          console.error('Error polling session status:', err);
        }
      }, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [polling, sessionId]);

  if (loading) {
    return (
      <div className="practical-result-container">
        <div className="practical-result-loading">
          <h2>Loading Exam Results</h2>
          <div className="loading-spinner"></div>
          <p>Please wait while we retrieve your exam results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="practical-result-container">
        <div className="practical-result-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/student')}>Return to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className="practical-result-container">
      <div className="practical-result-header">
        <h1>Exam Results: {exam?.title || 'Practical Exam'}</h1>
        <button className="back-button" onClick={() => navigate('/student')}>
          Return to Dashboard
        </button>
      </div>

      {polling && (
        <div className="practical-result-pending">
          <div className="pending-content">
            <h2>Verification in Progress</h2>
            <div className="loading-spinner"></div>
            <p>Your exam is being verified. This may take a few minutes.</p>
            <p>You will receive an email with the results once verification is complete.</p>
          </div>
        </div>
      )}

      {result && (
        <div className="practical-result-content">
          <div className="result-summary">
            <h2>Exam Summary</h2>
            <div className="score-display">
              <span className="score">{result.score}</span>
              <span className="total">/{result.total_possible}</span>
            </div>
            <div className={`status ${session.is_success ? 'passed' : 'failed'}`}>
              {session.is_success ? 'PASSED' : 'FAILED'}
            </div>
          </div>

          <div className="result-details">
            <h3>Detailed Results</h3>
            <pre>{JSON.stringify(result.details, null, 2)}</pre>
          </div>

          <div className="result-actions">
            <button onClick={() => window.print()} className="print-button">
              Print Results
            </button>
          </div>
        </div>
      )}

      {!polling && !result && (
        <div className="practical-result-error">
          <h2>No Results Available</h2>
          <p>No results could be found for this exam session.</p>
          <button onClick={() => navigate('/student')}>Return to Dashboard</button>
        </div>
      )}
    </div>
  );
}