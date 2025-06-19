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
    environment_id: '',
    verification_script: '',
    marks: 10
  });
  
  const [environments, setEnvironments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = isEdit ? 'Edit Practical Task' : 'Create Practical Task';
    
    const fetchData = async () => {
      try {
        const envs = await authGet('/api/environments/');
        setEnvironments(envs);
        
        if (isEdit && id) {
          const taskData = await authGet(`/api/tasks/${id}/`);
          setTask({
            title: taskData.title,
            description: taskData.description,
            environment_id: taskData.environment.id,
            verification_script: taskData.verification_script,
            marks: taskData.marks
          });
        } else if (envs.length > 0) {
          setTask(prev => ({ ...prev, environment_id: envs[0].id }));
        }
      } catch (err) {
        Swal.fire('Error', 'Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!task.title || !task.description || !task.verification_script || !task.environment_id) {
      Swal.fire('Error', 'Please fill in all required fields', 'error');
      return;
    }
    
    const payload = {
      ...task,
      environment_id: parseInt(task.environment_id)
    };

    try {
      if (isEdit) {
        await authPut(`/api/tasks/${id}/`, payload);
        Swal.fire('Success', 'Task updated successfully!', 'success');
      } else {
        await authPost('/api/tasks/', payload);
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
          <label>Docker Environment*</label>
          <select 
            name="environment" 
            value={task.environment_id} 
            onChange={handleChange}
            required
          >
            {environments.map(env => (
              <option key={env.id} value={env.id}>
                {env.name} ({env.image})
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Verification Script*</label>
          <textarea 
            name="verification_script" 
            value={task.verification_script} 
            onChange={handleChange} 
            required 
            rows="6"
            placeholder="Enter bash script to verify task completion"
          />
          <small className="hint">This script will be run to check student's work</small>
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