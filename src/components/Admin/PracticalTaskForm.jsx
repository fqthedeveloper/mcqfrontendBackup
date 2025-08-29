import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authGet, authPost, authPut } from '../../services/api';
import Swal from 'sweetalert2';
import '../CSS/ExamForm.css';

const PracticalExamForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState({
    title: '',
    description: '',
    subject: '',
    base_vm_name: 'Redhat',
    snapshot_name: 'base_snapshot',
    vm_username: 'kiosk',
    vm_password: 'redhat',
    duration_minutes: 60,
    verification_command: "echo 'Verification complete'",
    is_published: false,
    is_active: true,
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
          const examData = await authGet(`/api/practical-exams/${id}/`);
          setExam({
            title: examData.title,
            description: examData.description,
            subject: examData.subject,
            base_vm_name: examData.base_vm_name,
            snapshot_name: examData.snapshot_name,
            vm_username: examData.vm_username,
            vm_password: examData.vm_password,
            duration_minutes: examData.duration_minutes,
            verification_command: examData.verification_command,
            is_published: examData.is_published,
            is_active: examData.is_active,
          });
        } else if (subjectsData.length > 0) {
          setExam(prev => ({ ...prev, subject: subjectsData[0].id }));
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
    setExam(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    setExam(prev => ({ ...prev, [e.target.name]: e.target.checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = ['title', 'description', 'subject'];
    const emptyFields = requiredFields.filter(field => !exam[field]);
    if (emptyFields.length > 0) {
      Swal.fire('Error', `Please fill in required fields: ${emptyFields.join(', ')}`, 'error');
      return;
    }

    if (exam.duration_minutes < 1) {
      Swal.fire('Error', 'Duration must be at least 1 minute', 'error');
      return;
    }

    const payload = {
      ...exam,
      subject: parseInt(exam.subject),
      duration_minutes: parseInt(exam.duration_minutes),
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
            value={exam.title}
            onChange={handleChange}
            required
            placeholder="Enter exam title"
          />
        </div>

        <div className="form-group">
          <label>Description*</label>
          <textarea
            name="description"
            value={exam.description}
            onChange={handleChange}
            required
            rows="4"
            placeholder="Describe the exam"
          />
        </div>

        <div className="form-group">
          <label>Subject*</label>
          <select
            name="subject"
            value={exam.subject || ''}
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
          <label>Base VM Name</label>
          <input
            type="text"
            name="base_vm_name"
            value={exam.base_vm_name}
            onChange={handleChange}
            placeholder="Default: Redhat"
          />
        </div>

        <div className="form-group">
          <label>Snapshot Name</label>
          <input
            type="text"
            name="snapshot_name"
            value={exam.snapshot_name}
            onChange={handleChange}
            placeholder="Default: base_snapshot"
          />
        </div>

        <div className="form-group">
          <label>VM Username</label>
          <input
            type="text"
            name="vm_username"
            value={exam.vm_username}
            onChange={handleChange}
            placeholder="Default: kiosk"
          />
        </div>

        <div className="form-group">
          <label>VM Password</label>
          <input
            type="text"
            name="vm_password"
            value={exam.vm_password}
            onChange={handleChange}
            placeholder="Default: redhat"
          />
        </div>

        <div className="form-group">
          <label>Duration (minutes)*</label>
          <input
            type="number"
            name="duration_minutes"
            value={exam.duration_minutes}
            onChange={handleChange}
            min="1"
            required
          />
        </div>

        <div className="form-group">
          <label>Verification Command*</label>
          <textarea
            name="verification_command"
            value={exam.verification_command}
            onChange={handleChange}
            rows="3"
            required
            placeholder="Command to verify exam completion"
          />
        </div>

        <div className="form-checkbox">
          <input
            type="checkbox"
            id="is_published"
            name="is_published"
            checked={exam.is_published}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="is_published">Publish this exam</label>
        </div>

        <div className="form-checkbox">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={exam.is_active}
            onChange={handleCheckboxChange}
          />
          <label htmlFor="is_active">Mark exam as active</label>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            {isEdit ? 'Update Exam' : 'Create Exam'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate('/admin')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticalExamForm;
