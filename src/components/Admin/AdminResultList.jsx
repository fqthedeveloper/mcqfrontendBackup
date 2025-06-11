import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authGet } from '../../services/api';
import '../CSS/Result.css';

export default function AdminResultList() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExamHistory = async () => {
      try {
        const data = await authGet('/api/results/');
        setResults(data.results || data);
      } catch (err) {
        console.error('Error fetching exam history:', err);
        setError(err.message || 'Failed to load exam history');
      } finally {
        setLoading(false);
      }
    };
    fetchExamHistory();
  }, []);

  if (loading) {
    return (
      <div className="result-loading">
        <div className="loading-spinner"></div>
        <p>Loading your exam history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="result-error">
        <h3>Error Loading History</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="result-empty">
        <h3>No Exam History</h3>
        <p>You have not completed any exams yet.</p>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-header">
        <h1>My Exam History</h1>
      </div>

      <div className="result-details">
        <table className="result-table">
          <thead>
            <tr>
              <th>Exam Name</th>
              <th>Student Name</th>
              <th>Score</th>
              <th>Marks Obtained</th>
              <th>Right Answers</th>
              <th>Wrong Answers</th>
              <th>Result</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res) => {
              const percentage = res.total_marks
                ? Math.round((res.score / res.total_marks) * 100)
                : 0;
              return (
                <tr key={res.session_id || res.id}>
                  <td>{res.exam_title}</td>
                  <td>{res.student_name}</td>
                  <td>{res.score} / {res.total_marks}</td>
                  <td>{percentage}%</td>
                  <td>{ res.right_answers }</td>
                  <td>{ res.wrong_answers }</td>
                  <td>
                    <span className={`status-badge ${res.pass_fail === 'Pass' ? 'correct' : 'incorrect'}`}>
                      {res.pass_fail}
                    </span>
                  </td>
                  <td>
                    {/* ✅ FIXED: Use correct identifier for session-based route */}
                    <Link to={`/results/session/${res.session}`}>
                      View Result
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
