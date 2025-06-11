// src/components/Student/ResultDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { authGet } from '../../services/api';
import '../CSS/Result.css';

export default function ResultDetail() {
  const { sessionId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await authGet(`/api/results/session/${sessionId}/`);
        setResult(data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError('Failed to load result. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <p>Loading Result Details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error">
        <div className="error-icon">!</div>
        <h3>Error Loading Results</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-empty">
        <h3>No Results Found</h3>
        <p>No result data available for this session.</p>
      </div>
    );
  }

  // Calculate percentage score
  const percentageScore = Math.round((result.score / result.total_marks) * 100);

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>Exam Result</h1>
        <h2>{result.exam_title}</h2>
      </div>

      <div className="result-summary">
        <div className="score-card">
          <div className="score-percentage">
            {percentageScore}%
          </div>
          <div className="score-details">
            <p><strong>Student:</strong> {result.student_name}</p>
            <p><strong>Submitted:</strong> {new Date(result.submitted_at).toLocaleString()}</p>
            <p><strong>Score:</strong> <span className="marks-obtained">{result.score}</span> / {result.total_marks}</p>
            <p><strong>Status:</strong> 
              <span className={`status-badge ${result.result.toLowerCase()}`}>
                {result.result}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="result-details">
        <h3>Question Breakdown</h3>
        
        {/* Desktop Table */}
        <div className="desktop-view">
          <table className="result-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Correct Answer</th>
                <th>Your Answer</th>
                <th>Status</th>
                <th>Marks</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(result.details).map(([qId, q]) => (
                <tr key={qId} className={q.is_correct ? "correct-row" : "incorrect-row"}>
                  <td>{q.question_text}</td>
                  <td>{q.correct.join(', ')}</td>
                  <td>{q.selected.join(', ') || '—'}</td>
                  <td>
                    <span className={`status-badge ${q.is_correct ? 'correct' : 'incorrect'}`}>
                      {q.is_correct ? 'Correct' : 'Wrong'}
                    </span>
                  </td>
                  <td>{q.earned} / {q.marks}</td>
                  <td>{q.explanation || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="mobile-view">
          {Object.entries(result.details).map(([qId, q]) => (
            <div key={qId} className={`question-card ${q.is_correct ? 'correct' : 'incorrect'}`}>
              <div className="question-header">
                <h4>Question</h4>
                <span className={`status-badge ${q.is_correct ? 'correct' : 'incorrect'}`}>
                  {q.is_correct ? 'Correct' : 'Wrong'}
                </span>
              </div>
              <p className="question-text">{q.question_text}</p>
              
              <div className="answer-grid">
                <div>
                  <h4>Correct Answer</h4>
                  <p>{q.correct.join(', ')}</p>
                </div>
                <div>
                  <h4>Your Answer</h4>
                  <p>{q.selected.join(', ') || '—'}</p>
                </div>
                <div>
                  <h4>Marks</h4>
                  <p>{q.earned} / {q.marks}</p>
                </div>
              </div>
              
              {q.explanation && (
                <div className="explanation">
                  <h4>Explanation</h4>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="result-footer">
        <button className="dashboard-btn">Back to Dashboard</button>
      </div>
    </div>
  );
}