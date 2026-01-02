import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { mcqService } from "../../../services/mcqService";
import "../../../styles/CSS/ExamList.css";

export default function ExamList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, upcoming, active, completed
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const data = await mcqService.getExams();
      setExams(data);
    } catch (err) {
      setError("Failed to fetch exams");
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (examId) => {
    try {
      const session = await mcqService.createSession(examId);
      navigate(`/student/exam/${session.id}`);
    } catch (err) {
      setError(err.message || "Failed to start exam");
    }
  };

  const continueExam = (sessionId) => {
    navigate(`/student/exam/${sessionId}`);
  };

  const viewResults = (sessionId) => {
    navigate(`/student/results/${sessionId}`);
  };

  // Filter exams based on type and search term
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);
    
    if (filterType === "upcoming") return matchesSearch && startTime > now;
    if (filterType === "active") return matchesSearch && startTime <= now && endTime > now;
    if (filterType === "completed") return matchesSearch && endTime <= now;
    return matchesSearch;
  });

  const getExamStatus = (exam) => {
    const now = new Date();
    const startTime = new Date(exam.start_time);
    const endTime = new Date(exam.end_time);
    
    if (now < startTime) return "upcoming";
    if (now >= startTime && now <= endTime) return "active";
    return "completed";
  };

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { text: "Upcoming", class: "badge-info" },
      active: { text: "Active", class: "badge-success" },
      completed: { text: "Completed", class: "badge-secondary" },
    };
    return badges[status] || { text: "Unknown", class: "badge-light" };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading exams...</p>
      </div>
    );
  }

  return (
    <div className="student-exam-list">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>My Exams</h1>
          <p>Take exams assigned to you and view results</p>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="exam-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{exams.length}</h3>
            <p>Total Exams</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{exams.filter(e => getExamStatus(e) === "upcoming").length}</h3>
            <p>Upcoming</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-play-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{exams.filter(e => getExamStatus(e) === "active").length}</h3>
            <p>Active</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{exams.filter(e => getExamStatus(e) === "completed").length}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="exam-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search exams by title or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          <button
            className={`filter-tab ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Exams
          </button>
          <button
            className={`filter-tab ${filterType === "upcoming" ? "active" : ""}`}
            onClick={() => setFilterType("upcoming")}
          >
            Upcoming
          </button>
          <button
            className={`filter-tab ${filterType === "active" ? "active" : ""}`}
            onClick={() => setFilterType("active")}
          >
            Active
          </button>
          <button
            className={`filter-tab ${filterType === "completed" ? "active" : ""}`}
            onClick={() => setFilterType("completed")}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      {/* Exams Grid */}
      <div className="exams-grid">
        {filteredExams.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-file-alt"></i>
            </div>
            <h3>No exams found</h3>
            <p>
              {filterType === "all" 
                ? "You don't have any exams assigned yet." 
                : `No ${filterType} exams found.`}
            </p>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const status = getExamStatus(exam);
            const badge = getStatusBadge(status);
            
            return (
              <div key={exam.id} className="exam-card">
                <div className="exam-card-header">
                  <div className="exam-title">
                    <h3>{exam.title}</h3>
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                  </div>
                  <div className="exam-subject">
                    <i className="fas fa-book"></i>
                    {exam.subject_name}
                  </div>
                </div>
                
                <div className="exam-card-body">
                  <div className="exam-info">
                    <div className="info-item">
                      <i className="fas fa-clock"></i>
                      <div>
                        <small>Duration</small>
                        <strong>{exam.duration} minutes</strong>
                      </div>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-question-circle"></i>
                      <div>
                        <small>Questions</small>
                        <strong>{exam.question_count}</strong>
                      </div>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-calendar"></i>
                      <div>
                        <small>Starts</small>
                        <strong>{new Date(exam.start_time).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>
                  
                  <div className="exam-description">
                    <p>{exam.description || "No description provided."}</p>
                  </div>
                </div>
                
                <div className="exam-card-footer">
                  {status === "upcoming" && (
                    <button className="btn btn-secondary" disabled>
                      <i className="fas fa-clock"></i>
                      Starts {new Date(exam.start_time).toLocaleDateString()}
                    </button>
                  )}
                  
                  {status === "active" && (
                    <>
                      {exam.session ? (
                        exam.session.is_completed ? (
                          <button
                            className="btn btn-primary"
                            onClick={() => viewResults(exam.session.id)}
                          >
                            <i className="fas fa-chart-bar"></i>
                            View Results
                          </button>
                        ) : (
                          <button
                            className="btn btn-success"
                            onClick={() => continueExam(exam.session.id)}
                          >
                            <i className="fas fa-play"></i>
                            Continue Exam
                          </button>
                        )
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => startExam(exam.id)}
                        >
                          <i className="fas fa-play"></i>
                          Start Exam
                        </button>
                      )}
                    </>
                  )}
                  
                  {status === "completed" && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        if (exam.session) {
                          viewResults(exam.session.id);
                        } else {
                          setError("No exam session found");
                        }
                      }}
                    >
                      <i className="fas fa-chart-bar"></i>
                      View Results
                    </button>
                  )}
                  
                  <button className="btn btn-outline">
                    <i className="fas fa-info-circle"></i>
                    Details
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Important Notes */}
      <div className="exam-notes">
        <h4>
          <i className="fas fa-exclamation-triangle"></i>
          Important Notes
        </h4>
        <ul>
          <li>Ensure stable internet connection before starting exam</li>
          <li>Do not refresh or close the browser during exam</li>
          <li>Timer will continue even if you leave the page</li>
          <li>Submit your exam before time runs out</li>
          <li>Contact administrator for technical issues</li>
        </ul>
      </div>
    </div>
  );
}