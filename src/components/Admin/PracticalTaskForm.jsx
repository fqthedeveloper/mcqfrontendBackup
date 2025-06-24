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
    docker_image: '',
    setup_command: '',
    verification_command: '',
    duration: 60,
    subject: '',
    is_published: false
  });
  
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = isEdit ? 'Edit Practical Exam' : 'Create Practical Exam';
    
    const fetchData = async () => {
      try {
        const subjectsData = await authGet('/api/subjects/');
        setSubjects(subjectsData);
        
        if (isEdit && id) {
          const taskData = await authGet(`/api/practical-exams/${id}/`);
          setTask({
            title: taskData.title,
            description: taskData.description,
            docker_image: taskData.docker_image,
            setup_command: taskData.setup_command,
            verification_command: taskData.verification_command,
            duration: taskData.duration,
            subject: taskData.subject.id,
            is_published: taskData.is_published
          });
        } else if (subjectsData.length > 0) {
          setTask(prev => ({ ...prev, subject: subjectsData[0].id }));
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

  const handleCheckboxChange = (e) => {
    setTask(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const requiredFields = [
      'title', 'description', 'docker_image', 
      'setup_command', 'verification_command', 'subject'
    ];
    
    // Check for empty required fields
    const emptyFields = requiredFields.filter(field => !task[field]);
    if (emptyFields.length > 0) {
      Swal.fire('Error', `Please fill in all required fields: ${emptyFields.join(', ')}`, 'error');
      return;
    }
    
    if (task.duration < 1) {
      Swal.fire('Error', 'Duration must be at least 1 minute', 'error');
      return;
    }

    const payload = {
      ...task,
      duration: parseInt(task.duration),
      subject: parseInt(task.subject)
    };

    try {
      if (isEdit) {
        await authPut(`/api/practical-exams/${id}/`, payload);
        Swal.fire('Success', 'Practical exam updated successfully!', 'success');
      } else {
        await authPost('/api/practical-exams/', payload);
        Swal.fire('Success', 'Practical exam created successfully!', 'success');
      }
      navigate('/admin');
    } catch (err) {
      Swal.fire('Error', err.message || 'Operation failed', 'error');
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <div className="task-form-container">
      <h2>{isEdit ? 'Edit Practical Exam' : 'Create New Practical Exam'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title*</label>
          <input 
            type="text" 
            name="title" 
            value={task.title} 
            onChange={handleChange} 
            required 
            placeholder="Enter exam title"
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
            placeholder="Describe the exam requirements"
          />
        </div>
        
        <div className="form-group">
          <label>Subject*</label>
          <select 
            name="subject" 
            value={task.subject || ''} 
            onChange={handleChange}
            required
          >
            <option value="">Select Subject</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label>Docker Image*</label>
          <input 
            type="text" 
            name="docker_image" 
            value={task.docker_image} 
            onChange={handleChange} 
            required 
            placeholder="e.g. ubuntu:latest"
          />
        </div>
        
        <div className="form-group">
          <label>Setup Command*</label>
          <textarea 
            name="setup_command" 
            value={task.setup_command} 
            onChange={handleChange} 
            required 
            rows="3"
            placeholder="Command to run when container starts"
          />
        </div>
        
        <div className="form-group">
          <label>Verification Command*</label>
          <textarea 
            name="verification_command" 
            value={task.verification_command} 
            onChange={handleChange} 
            required 
            rows="3"
            placeholder="Command to verify solution"
          />
        </div>
        
        <div className="form-group">
          <label>Duration (minutes)*</label>
          <input 
            type="number" 
            name="duration" 
            value={task.duration} 
            onChange={handleChange} 
            min="1" 
            required 
          />
        </div>
        
        <div className="form-checkbox">
          <input 
            type="checkbox" 
            id="is_published" 
            name="is_published" 
            checked={task.is_published} 
            onChange={handleCheckboxChange}
          />
          <label htmlFor="is_published">Publish this exam</label>
        </div>
        
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update Exam' : 'Create Exam'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate('/admin/add-tasks')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticalTaskForm;