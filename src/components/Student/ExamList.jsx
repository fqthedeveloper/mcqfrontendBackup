import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../../context/examContext';
import '../CSS/ExamList.css';

export default function ExamList() {
  const { exams, fetchExams, startExam, loading, error } = useExam();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    document.title = 'Available Exams';
  }, []);

  const handleStartExam = (exam) => {
    if (!exam || !exam.id) {
      console.error('Invalid exam object:', exam);
      return;
    }

    startExam(exam);
    navigate(`/student/exam/${exam.id}`, { state: { exam } });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  return (
    <div className="exam-list-container">
      <div className="exam-list-header">
        <h1>Available Exams</h1>
        <p>Select an exam to begin your assessment</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading exams...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Couldn't load exams</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={fetchExams}>
            Try Again
          </button>
        </div>
      ) : exams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No exams available</h3>
          <p>Check back later for new exams</p>
        </div>
      ) : (
        <div className="exams-grid">
          {exams
            .filter((exam) => exam && exam.id)
            .map((exam) => (
              <div key={exam.id} className="exam-card">
                <div className="card-header">
                  <div className="exam-icon">📝</div>
                  <h3 className="exam-title">{exam.title}</h3>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">{exam.subject_name}</span>
                </div>

                <div className="exam-details">
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{formatDuration(exam.duration)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Questions:</span>
                    <span className="detail-value">{exam.question_count || exam.questions?.length || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type Mode:</span>
                    <span className="detail-value">{exam.mode}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="status-badge">Available</span>
                  </div>
                </div>

                <button className="start-exam-btn" onClick={() => handleStartExam(exam)}>
                  Start Exam <span className="btn-icon">➔</span>
                </button>
              </div>
            ))}
        </div>
      )}

      <div className="exam-tips">
        <h4>Exam Tips</h4>
        <ul>
          <li>Ensure you have a stable internet connection</li>
          <li>Find a quiet environment for your exam</li>
          <li>Have all necessary materials ready before starting</li>
        </ul>
      </div>
    </div>
  );
}
