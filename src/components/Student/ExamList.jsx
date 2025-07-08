import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExam } from '../../context/examContext';
import '../CSS/ExamList.css';
import '../CSS/PracticalExam.css';

export function ExamList() {
  const { exams, fetchExams, startExam, loading, error } = useExam();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const handleStartExam = async (exam) => {
    try {
      const session = await startExam(exam);
      
      if (!session?.id) {
        throw new Error('Failed to create exam session: Invalid session ID');
      }

      if (exam.mode === 'strict') {
        navigate(`/student/exam/${session.id}`);
      } else if (exam.mode === 'practical') {
        navigate(`/student/practical/${session.id}`);
      }
    } catch (err) {
      console.error('Failed to start exam:', err);
      
      let errorMsg = err.message;
      
      // Extract the most specific error message
      if (err.message.includes('Container startup failed') || 
          err.message.includes('Docker')) {
        const errorParts = err.message.split(':');
        const mainError = errorParts[0];
        const details = errorParts.slice(1).join(':');
        
        alert(`${mainError}\n\nTechnical Details:\n${details}\n\nPlease ensure Docker is running and properly configured.`);
      } else {
        alert(errorMsg);
      }
    }
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const getButtonLabel = (mode) => {
    return mode === 'strict' ? 'Start Strict Exam' : 'Start Practical Exam';
  };

  const getButtonClass = (mode) => {
    return mode === 'strict' ? 'strict-exam-btn' : 'practical-exam-btn';
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
                    <span className="detail-label">
                      {exam.mode === 'practical' ? 'Tasks:' : 'Questions:'}
                    </span>
                    <span className="detail-value">
                      {exam.mode === 'practical'
                        ? exam.practical_count || exam.practical_count?.length || 'N/A'
                        : exam.question_count || exam.questions?.length || 'N/A'
                      }
                    </span>
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

                <button 
                  className={`start-exam-btn ${getButtonClass(exam.mode)}`}
                  onClick={() => handleStartExam(exam)}
                >
                  {getButtonLabel(exam.mode)}
                </button>
                
                {exam.mode === 'practical' && (
                  <div className="practical-note">
                    <span>⚠️ Note: Practical exams require a terminal session</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <div className="exam-tips">
        <h4>Exam Tips</h4>
        <ul>
          <li>Exam Passing is 80% </li>
          <li>Ensure you have a stable internet connection</li>
          <li>Find a quiet environment for your exam</li>
          <li>Have all necessary materials ready before starting</li>
          {exams.some(exam => exam.mode === 'practical') && (
            <li>For practical exams, commands are executed in a secure environment</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default ExamList;