import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authGet, authDelete, authPut } from '../../../services/api';
import Swal from 'sweetalert2';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaClock,
  FaBook,
  FaDesktop,
  FaUser,
  FaKey,
  FaMemory,
  FaMicrochip,
  FaNetworkWired,
  FaCalendar,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import '../../../styles/CSS/ExamForm.css';

const PracticalTaskList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const pageSize = 10;

  useEffect(() => {
    document.title = "Practical Exams";
    fetchExams();
  }, [currentPage, filterStatus]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      let url = `/api/practical-exams/?page=${currentPage}&page_size=${pageSize}`;
      
      if (searchTerm) {
        url += `&search=${searchTerm}`;
      }
      if (filterStatus !== 'all') {
        url += `&is_${filterStatus}=true`;
      }

      const response = await authGet(url);

      const list = response.results || response;
      const total = response.count || response.length || 1;

      setExams(list);
      setTotalPages(Math.ceil(total / pageSize));
    } catch (err) {
      setError(err.message || "Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = id => {
    Swal.fire({
      title: "Delete Practical Exam?",
      text: "Are you sure you want to delete this practical exam? All related sessions and results will also be deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    }).then(async result => {
      if (result.isConfirmed) {
        try {
          await authDelete(`/api/practical-exams/${id}/`);
          fetchExams();
          Swal.fire("Deleted!", "The practical exam has been deleted.", "success");
        } catch (err) {
          Swal.fire("Error", "Failed to delete exam", "error");
        }
      }
    });
  };

  const togglePublishStatus = async (id, status) => {
    try {
      await authPut(`/api/practical-exams/${id}/`, {
        is_published: !status
      });
      fetchExams();
      Swal.fire(
        "Success",
        `Exam ${!status ? "published" : "unpublished"}`,
        "success"
      );
    } catch (err) {
      Swal.fire("Error", "Failed to update exam status", "error");
    }
  };

  const toggleActiveStatus = async (id, status) => {
    try {
      await authPut(`/api/practical-exams/${id}/`, {
        is_active: !status
      });
      fetchExams();
      Swal.fire(
        "Success",
        `Exam ${!status ? "activated" : "deactivated"}`,
        "success"
      );
    } catch (err) {
      Swal.fire("Error", "Failed to update exam status", "error");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchExams();
  };

  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) return <div className="loading-container">Loading exams…</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="task-list-container">
      <div className="header">
        <h1>Practical Exams</h1>
        <Link to="/admin/add-task" className="btn btn-primary">
          <FaPlus /> Add Practical Exam
        </Link>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search exams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-search">Search</button>
        </form>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active
          </button>
          <button
            className={`filter-btn ${filterStatus === 'published' ? 'active' : ''}`}
            onClick={() => setFilterStatus('published')}
          >
            Published
          </button>
          <button
            className={`filter-btn ${filterStatus === 'inactive' ? 'active' : ''}`}
            onClick={() => setFilterStatus('inactive')}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>VM Configuration</th>
              <th>Duration</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {exams.length > 0 ? (
              exams.map(exam => (
                <tr key={exam.id}>
                  <td>
                    <div className="exam-title-cell">
                      <strong>{exam.title}</strong>
                      <small>{exam.description.substring(0, 50)}...</small>
                    </div>
                  </td>

                  <td>
                    <div className="subject-cell">
                      <FaBook className="icon" />
                      <span>{exam.subject_name}</span>
                    </div>
                  </td>

                  <td className="vm-config-cell">
                    <div className="vm-info">
                      <div className="vm-item">
                        <FaDesktop className="vm-icon" />
                        <span>{exam.base_vm_name}</span>
                      </div>
                      <div className="vm-item">
                        <FaMemory className="vm-icon" />
                        <span>{exam.vm_memory}MB</span>
                      </div>
                      <div className="vm-item">
                        <FaMicrochip className="vm-icon" />
                        <span>{exam.vm_cpus} CPUs</span>
                      </div>
                      <div className="vm-item">
                        <FaUser className="vm-icon" />
                        <span>{exam.vm_username}</span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="duration-cell">
                      <FaClock className="icon" />
                      <span>{exam.duration_minutes} mins</span>
                      <small>{exam.total_marks} marks</small>
                    </div>
                  </td>

                  <td>
                    <div className="schedule-cell">
                      <FaCalendar className="icon" />
                      <div>
                        <div>Start: {formatDate(exam.start_time)}</div>
                        <div>End: {formatDate(exam.end_time)}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="status-cell">
                      <div className="status-badges">
                        <span className={`status-badge ${exam.is_active ? 'active' : 'inactive'}`}>
                          {exam.is_active ? <FaCheckCircle /> : <FaTimesCircle />}
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`status-badge ${exam.is_published ? 'published' : 'draft'}`}>
                          {exam.is_published ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="actions-cell">
                    <Link
                      to={`/admin/edit-task/${exam.id}`}
                      className="btn btn-edit"
                    >
                      <FaEdit /> Edit
                    </Link>

                    <button
                      className={`btn ${exam.is_published ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => togglePublishStatus(exam.id, exam.is_published)}
                    >
                      {exam.is_published ? 'Unpublish' : 'Publish'}
                    </button>

                    <button
                      className={`btn ${exam.is_active ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleActiveStatus(exam.id, exam.is_active)}
                    >
                      {exam.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-tasks">
                  No practical exams found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="pagination-btn"
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNum}
                className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticalTaskList;