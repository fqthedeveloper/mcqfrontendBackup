// src/components/Student/Result.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { authGet } from '../../services/api';
import '../CSS/Result.css';

export default function Result() {
  const { sessionId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const resultData = await authGet(`/api/results/session/${sessionId}/`);
        setResult(resultData);
      } catch (err) {
        setError(err.message || 'Failed to load results');
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
        <p>Calculating your results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error">
        <h3>Error Loading Results</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="result-empty">
        <h3>No Results Available</h3>
        <p>Could not find results for this session</p>
      </div>
    );
  }

  const calculateScore = () => {
    let totalMarks = 0;
    let obtainedMarks = 0;
    
    result.questions.forEach((q) => {
      totalMarks += q.marks;
      if (q.correctOption === result.answers[q.id]) {
        obtainedMarks += q.marks;
      }
    });
    
    return {
      obtained: obtainedMarks,
      total: totalMarks,
      percentage: Math.round((obtainedMarks / totalMarks) * 100)
    };
  };

  const score = calculateScore();

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>Exam Results</h1>
        <h2>{result.examTitle}</h2>
        <div className="result-summary">
          <div className="score-card">
            <div className="score-percentage">{score.percentage}%</div>
            <div className="score-details">
              <p>{score.obtained} / {score.total} Marks</p>
              <p>Duration: {result.duration} minutes</p>
              <p>Submitted on: {new Date(result.submittedAt).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="result-details">
        <h3>Question-wise Analysis</h3>
        <table className="result-table">
          <thead>
            <tr>
              <th>Question</th>
              <th>Your Answer</th>
              <th>Correct Answer</th>
              <th>Status</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            {result.questions.map((question, index) => {
              const userAnswer = result.answers[question.id];
              const isCorrect = userAnswer === question.correctOption;
              const optionsMap = {
                'A': question.optionA,
                'B': question.optionB,
                'C': question.optionC,
                'D': question.optionD
              };

              return (
                <tr key={index} className={isCorrect ? 'correct-row' : 'incorrect-row'}>
                  <td>
                    <strong>Q{index + 1}:</strong> {question.text}
                  </td>
                  <td>{userAnswer ? optionsMap[userAnswer] : 'Not answered'}</td>
                  <td>{optionsMap[question.correctOption]}</td>
                  <td>
                    <span className={`status-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </td>
                  <td>
                    {isCorrect ? (
                      <span className="marks-obtained">+{question.marks}</span>
                    ) : (
                      <span className="marks-missed">0</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="result-footer">
        <button 
          className="dashboard-btn"
          onClick={() => window.location.href = '/dashboard'}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}