// src/components/ExamList.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaClock, FaBook } from 'react-icons/fa';
import { authGet } from '../../services/api';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({
    status: 'all',
    search: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
        document.title = "Exam List";
      }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const data = await authGet('/api/exams/');
        setExams(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load exams');
        setLoading(false);
      }
    };
    
    fetchExams();
  }, []);

  const handleDelete = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        // In a real app, you would call an API to delete
        setExams(exams.filter(exam => exam.id !== examId));
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        setError('Failed to delete exam');
      }
    }
  };

  const handlePublishToggle = async (examId) => {
    try {
      // In a real app, you would call an API to toggle publish status
      setExams(exams.map(exam => 
        exam.id === examId ? { ...exam, is_published: !exam.is_published } : exam
      ));
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      setError('Failed to update exam status');
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesStatus = filter.status === 'all' || 
      (filter.status === 'published' && exam.is_published) ||
      (filter.status === 'draft' && !exam.is_published);
    
    const matchesSearch = exam.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      exam.subject.name.toLowerCase().includes(filter.search.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  if (loading) return <div className="loading">Loading exams...</div>;
  
  return (
    <div className="exam-list-container">
      <div className="list-header">
        <h2>Exam List</h2>
        <Link to="/admin/add-exam" className="btn-create">
          <FaPlus /> Create New Exam
        </Link>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search exams..."
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
          />
        </div>
        
        <div className="filter-group">
          <select
            value={filter.status}
            onChange={(e) => setFilter({...filter, status: e.target.value})}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>
      
      <div className="exams-grid">
        {filteredExams.length > 0 ? (
          filteredExams.map(exam => (
            <div key={exam.id} className="exam-card">
              <div className="card-header">
                <div className={`status-badge ${exam.is_published ? 'published' : 'draft'}`}>
                  {exam.is_published ? 'Published' : 'Draft'}
                </div>
                <h3>{exam.title}</h3>
                <div className="subject">
                  <FaBook /> {exam.subject.name}
                </div>
              </div>
              
              <div className="card-details">
                <div className="detail-item">
                  <FaClock /> Duration: {exam.duration} minutes
                </div>
                <div className="detail-item">
                  <FaCalendarAlt /> Mode: {exam.mode === 'practice' ? 'Practice' : 'Strict'}
                </div>
                {exam.start_time && (
                  <div className="detail-item">
                    <span>Start:</span> {new Date(exam.start_time).toLocaleString()}
                  </div>
                )}
                {exam.end_time && (
                  <div className="detail-item">
                    <span>End:</span> {new Date(exam.end_time).toLocaleString()}
                  </div>
                )}
              </div>
              
              <div className="card-footer">
                <div className="questions-count">
                  {exam.questions.length} questions
                </div>
                
                <div className="actions">
                  <button 
                    className="btn-edit"
                    onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(exam.id)}
                  >
                    <FaTrash /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No exams found. Create your first exam!</p>
            <Link to="/exams/create" className="btn-create">
              <FaPlus /> Create Exam
            </Link>
          </div>
        )}
      </div>
    <style>{`
        .exam-list-container {
          padding: 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        .list-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .filters {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .filter-group {
          flex: 1;
          min-width: 200px;
        }
        
        .filter-group input,
        .filter-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .exams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .exam-card {
          border: 1px solid #eaeaea;
          border-radius: 8px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .exam-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        
        .card-header {
          margin-bottom: 1rem;
        }
        
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        
        .published {
          background-color: #e6f7ee;
          color: #10b981;
        }
        
        .draft {
          background-color: #eff6ff;
          color: #3b82f6;
        }
        
        .subject {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #64748b;
          margin-top: 0.5rem;
        }
        
        .card-details {
          flex: 1;
          margin-bottom: 1rem;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #475569;
        }
        
        .card-footer {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 0.75rem;
          padding-top: 1rem;
          border-top: 1px solid #f1f1f1;
        }
        
        .questions-count {
          font-weight: 600;
          color: #475569;
        }
        
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        
        .actions button {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.5rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .btn-view { background-color: #e0f2fe; color: #0369a1; }
        .btn-edit { background-color: #fef9c3; color: #854d0e; }
        .btn-delete { background-color: #fee2e2; color: #b91c1c; }
        
        .btn-create {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        
        .btn-create:hover {
          background-color: #2563eb;
        }
        
        .empty-state {
          text-align: center;
          grid-column: 1 / -1;
          padding: 3rem;
          background-color: #f8fafc;
          border-radius: 8px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
          .exams-grid {
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          }
          
          .list-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
        
        @media (max-width: 480px) {
          .exam-card {
            padding: 1rem;
          }
          
          .card-footer {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .actions {
            width: 100%;
          }
          
          .actions button {
            flex: 1;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ExamList;