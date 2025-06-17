import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authGet, authPost, authPut } from '../../services/api';
import Swal from 'sweetalert2';
import '../CSS/ExamForm.css';

const PracticalTaskForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [task, setTask] = useState({
    title: '',
    description: '',
    command_template: '',
    expected_output: '',
    marks: 10
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = isEdit ? 'Edit Practical Task' : 'Create Practical Task';
    if (isEdit && id) {
      fetchTask();
    } else {
      setLoading(false);
    }
  }, [id, isEdit]);

  const fetchTask = async () => {
    try {
      const taskData = await authGet(`/api/tasks/${id}/`);
      setTask({
        title: taskData.title,
        description: taskData.description,
        command_template: taskData.command_template,
        expected_output: taskData.expected_output,
        marks: taskData.marks
      });
    } catch (err) {
      Swal.fire('Error', 'Failed to load task', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!task.title || !task.description || !task.expected_output) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }
    
    try {
      if (isEdit) {
        await authPut(`/api/tasks/${id}/`, task);
        Swal.fire('Success', 'Task updated successfully!', 'success');
      } else {
        await authPost('/api/tasks/', task);
        Swal.fire('Success', 'Task created successfully!', 'success');
      }
      navigate('/admin/task-list');
    } catch (err) {
      Swal.fire('Error', err.message || 'Operation failed', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="task-form-container">
      <h2>{isEdit ? 'Edit Practical Task' : 'Create New Practical Task'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title*</label>
          <input 
            type="text" 
            name="title" 
            value={task.title} 
            onChange={handleChange} 
            required 
            placeholder="Enter task title"
          />
        </div>
        
        <div className="form-group">
          <label>Description*</label>
          <textarea 
            name="description" 
            value={task.description} 
            onChange={handleChange} 
            required 
            rows="4"
            placeholder="Describe the task requirements"
          />
        </div>
        
        <div className="form-group">
          <label>Command Template</label>
          <textarea 
            name="command_template" 
            value={task.command_template} 
            onChange={handleChange} 
            rows="3"
            placeholder="Enter command template"
          />
          <small className="hint">Optional template for students</small>
        </div>
        
        <div className="form-group">
          <label>Expected Output (Regex)*</label>
          <textarea 
            name="expected_output" 
            value={task.expected_output} 
            onChange={handleChange} 
            required 
            rows="3"
            placeholder="Enter regex pattern for expected output"
          />
          <small className="hint">Example: ^total\s\d+$</small>
        </div>
        
        <div className="form-group">
          <label>Marks*</label>
          <input 
            type="number" 
            name="marks" 
            value={task.marks} 
            onChange={handleChange} 
            min="1" 
            required 
          />
        </div>
        
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update Task' : 'Create Task'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/task-list')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticalTaskForm;