import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authGet, authDelete } from '../../services/api';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaDocker } from 'react-icons/fa';
import '../CSS/ExamForm.css';

const PracticalTaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    document.title = 'Manage Practical Tasks';
    fetchTasks();
  }, [currentPage]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await authGet(`/api/tasks/?page=${currentPage}&page_size=${pageSize}`);
      setTasks(response.results || response);
      setTotalPages(Math.ceil((response.count || response.length) / pageSize));
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Delete Task?',
      text: 'Are you sure you want to delete this task?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await authDelete(`/api/tasks/${id}/`);
          fetchTasks();
          Swal.fire('Deleted!', 'The task has been deleted.', 'success');
        } catch (err) {
          Swal.fire('Error', 'Failed to delete task', 'error');
        }
      }
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return <div className="loading-container">Loading tasks...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="task-list-container">
      <div className="header">
        <h1>Practical Tasks</h1>
        <Link to="/admin/add-task" className="btn btn-primary">
          <FaPlus /> Add New Task
        </Link>
      </div>

      <div className="task-table-container">
        <table className="task-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Environment</th>
              <th>Marks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? tasks.map(task => (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td className="description-cell">
                  {task.description.length > 100 ? 
                    `${task.description.substring(0, 100)}...` : task.description}
                </td>
                <td className="environment-cell">
                  {task.environment && (
                    <div className="env-info">
                      <FaDocker className="docker-icon" />
                      <span>{task.environment.name}</span>
                      <small>{task.environment.image}</small>
                    </div>
                  )}
                </td>
                <td>{task.marks}</td>
                <td className="actions-cell">
                  <Link to={`/admin/edit-task/${task.id}`} className="btn btn-edit">
                    <FaEdit /> Edit
                  </Link>
                  <button 
                    onClick={() => handleDelete(task.id)} 
                    className="btn btn-danger"
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" className="no-tasks">No practical tasks found</td>
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