import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaPlus, FaEdit, FaTrash, FaClock, FaBook, 
  FaTasks, FaQuestionCircle 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { authGet, authDelete } from '../../services/api';

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
    fetchExams();
  }, []);

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

  const handleDelete = async (examId, examTitle) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete the exam "${examTitle}". This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        container: 'swal-container',
        popup: 'swal-popup',
        title: 'swal-title',
        htmlContainer: 'swal-text',
        confirmButton: 'swal-confirm',
        cancelButton: 'swal-cancel'
      }
    });
    
    if (result.isConfirmed) {
      try {
        // Show loading indicator
        Swal.fire({
          title: 'Deleting Exam',
          text: 'Please wait...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        // Call backend to delete exam
        await authDelete(`/api/exams/${examId}/`);
        
        // Update UI after successful deletion
        setExams(exams.filter(exam => exam.id !== examId));
        
        // Close loading indicator
        Swal.close();
        
        // Show success message
        Swal.fire({
          title: 'Deleted!',
          text: `Exam "${examTitle}" has been deleted.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        // Close loading indicator
        Swal.close();
        
        // Show error message
        Swal.fire({
          title: 'Error!',
          text: 'Failed to delete exam. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesStatus = filter.status === 'all' || 
      (filter.status === 'published' && exam.is_published) ||
      (filter.status === 'draft' && !exam.is_published);
    
    const matchesSearch = exam.title.toLowerCase().includes(filter.search.toLowerCase()) ||
      (exam.subject_name && exam.subject_name.toLowerCase().includes(filter.search.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return date.toLocaleString();
  };

  const getCountDisplay = (exam) => {
    if (exam.mode === 'practical') {
      return {
        icon: <FaTasks />,
        text: `${exam.practical_count || 0} tasks`,
        className: 'practical-count'
      };
    } else {
      return {
        icon: <FaQuestionCircle />,
        text: `${exam.question_count || 0} questions`,
        className: 'question-count'
      };
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Loading exams...</p>
    </div>
  );
  
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
          filteredExams.map(exam => {
            const countInfo = getCountDisplay(exam);
            
            return (
              <div key={exam.id} className="exam-card">
                <div className="card-header">
                  <div className={`status-badge ${exam.is_published ? 'published' : 'draft'}`}>
                    {exam.is_published ? 'Published' : 'Draft'}
                  </div>
                  <h3>{exam.title}</h3>
                  <div className="subject">
                    <FaBook /> {exam.subject_name || 'No Subject'}
                  </div>
                </div>
                
                <div className="card-details">
                  <div className="detail-item">
                    <FaClock /> Duration: {exam.duration} minutes
                  </div>
                  <div className="detail-item">
                    <span>Mode:</span> 
                    <span className={`mode-tag ${exam.mode}`}>
                      {exam.mode.charAt(0).toUpperCase() + exam.mode.slice(1)}
                    </span>
                  </div>
                  {exam.start_time && (
                    <div className="detail-item">
                      <span>Start:</span> {formatDateTime(exam.start_time)}
                    </div>
                  )}
                  {exam.end_time && (
                    <div className="detail-item">
                      <span>End:</span> {formatDateTime(exam.end_time)}
                    </div>
                  )}
                </div>
                
                <div className="card-footer">
                  <div className={`count-info ${countInfo.className}`}>
                    {countInfo.icon} {countInfo.text}
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
                      onClick={() => handleDelete(exam.id, exam.title)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <p>No exams found. Create your first exam!</p>
            <Link to="/admin/add-exam" className="btn-create">
              <FaPlus /> Create Exam
            </Link>
          </div>
        )}
      </div>
      
      {/* Add some global styles for SweetAlert */}
      <style jsx global>{`
        .swal-container {
          z-index: 2000;
        }
        .swal-popup {
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .swal-title {
          font-size: 1.5rem;
          margin-bottom: 15px;
          color: #333;
        }
        .swal-text {
          font-size: 1.1rem;
          color: #555;
          line-height: 1.5;
        }
        .swal-confirm {
          background-color: #d33 !important;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .swal-confirm:hover {
          background-color: #c22 !important;
        }
        .swal-cancel {
          background-color: #6c757d !important;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          font-weight: 600;
          transition: background-color 0.2s;
        }
        .swal-cancel:hover {
          background-color: #5a6268 !important;
        }
      `}</style>
    </div>
  );
};

export default ExamList;