import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaBook, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { authGet } from '../../services/api';


const ExamList = () => {
  const [exams, setExams] = useState([]);         // initialize as an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: 'all', search: '' });
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Exam List';
  }, []);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await authGet('/api/exams/');
        // ─── pull out the actual array ───
        setExams(response.data);
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
        setExams((prev) => prev.filter((exam) => exam.id !== examId));
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (err) {
        setError('Failed to delete exam');
      }
    }
  };

  const handlePublishToggle = async (examId) => {
    try {
      setExams((prev) =>
        prev.map((exam) =>
          exam.id === examId ? { ...exam, is_published: !exam.is_published } : exam
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      setError('Failed to update exam status');
    }
  };

  // ─── now exams is guaranteed to be an array, so .filter is safe ───
  const filteredExams = exams.filter((exam) => {
    const matchesStatus =
      filter.status === 'all' ||
      (filter.status === 'published' && exam.is_published) ||
      (filter.status === 'draft' && !exam.is_published);

    const matchesSearch =
      exam.title.toLowerCase().includes(filter.search.toLowerCase()) ||
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
            onChange={(e) => setFilter({ ...filter, search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="exams-grid">
        {filteredExams.length > 0 ? (
          filteredExams.map((exam) => (
            <div key={exam.id} className="exam-card">
              <div className="card-header">
                <div className={`status-badge ${exam.is_published ? 'published' : 'draft'}`}>
                  {exam.is_published ? 'Published' : 'Draft'}
                </div>&nbsp; &nbsp;
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
                  <button className="btn-delete" onClick={() => handleDelete(exam.id)}>
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

      {/* (CSS-in-JS style block omitted for brevity) */}
    </div>
  );
};

export default ExamList;
