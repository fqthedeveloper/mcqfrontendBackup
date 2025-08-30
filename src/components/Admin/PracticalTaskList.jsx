import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authGet, authDelete, authPut } from '../../services/api';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaClock, FaBook, FaDesktop, FaUser, FaKey } from 'react-icons/fa';
import '../CSS/ExamForm.css';

const PracticalTaskList = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    document.title = 'Manage Practical Exams';
    fetchExams();
  }, [currentPage]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      const response = await authGet(`/api/practical-exams/?page=${currentPage}&page_size=${pageSize}`);
      setExams(response.results || response);
      setTotalPages(Math.ceil((response.count || response.length) / pageSize));
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete Exam?',
      text: 'Are you sure you want to delete this exam?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await authDelete(`/api/practical-exams/${id}/`);
          fetchExams();
          Swal.fire('Deleted!', 'The exam has been deleted.', 'success');
        } catch (err) {
          Swal.fire('Error', 'Failed to delete exam', 'error');
        }
      }
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const togglePublishStatus = async (id, currentStatus) => {
    try {
      await authPut(`/api/practical-exams/${id}/`, {
        is_published: !currentStatus
      });
      fetchExams();
      Swal.fire('Success', `Exam ${!currentStatus ? 'published' : 'unpublished'}`, 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to update status', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading exams...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="task-list-container">
      <div className="header">
        <h1>Practical Exams</h1>
        <Link to="/admin/add-task" className="btn btn-primary">
          <FaPlus /> Add New Exam
        </Link>
      </div>

      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Subject</th>
              <th>VM Configuration</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length > 0 ? exams.map(exam => (
              <tr key={exam.id}>
                <td>{exam.title}</td>
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
                      <span>Base VM: {exam.base_vm_name}</span>
                    </div>
                    <div className="vm-item">
                      <FaDesktop className="vm-icon" />
                      <span>Snapshot: {exam.snapshot_name}</span>
                    </div>
                    <div className="vm-item">
                      <FaUser className="vm-icon" />
                      <span>User: {exam.vm_username}</span>
                    </div>
                    <div className="vm-item">
                      <FaKey className="vm-icon" />
                      <span>Pass: {exam.vm_password}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="duration-cell">
                    <FaClock className="icon" />
                    <span>{exam.duration_minutes} mins</span>
                  </div>
                </td>
                <td>
                  <span className={`status-badge ${exam.is_published ? 'published' : 'draft'}`}>
                    {exam.is_published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td className="actions-cell">
                  <Link to={`/admin/edit-task/${exam.id}`} className="btn btn-edit">
                    <FaEdit /> Edit
                  </Link>
                  <button 
                    onClick={() => togglePublishStatus(exam.id, exam.is_published)} 
                    className={`btn ${exam.is_published ? 'btn-warning' : 'btn-success'}`}
                  >
                    {exam.is_published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button 
                    onClick={() => handleDelete(exam.id)} 
                    className="btn btn-danger"
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="no-tasks">No practical exams found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={currentPage === page ? 'active' : ''}
            >
              {page}
            </button>
          ))}
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};


export default PracticalTaskList;