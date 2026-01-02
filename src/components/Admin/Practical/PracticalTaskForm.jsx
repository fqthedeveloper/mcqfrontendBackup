import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authGet, authPost, authPut } from '../../../services/api';
import Swal from 'sweetalert2';
import '../../../styles/CSS/ExamForm.css';

const PracticalTaskForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState({
    title: "",
    description: "",
    subject: "",
    base_vm_name: "generic/centos9",
    snapshot_name: "exam-base",
    vm_username: "student",
    vm_password: "centos123",
    duration_minutes: 60,
    total_marks: 100,
    verification_command: "echo 'CentOS 9 Exam Environment Verified' && cat /etc/centos-release",
    vm_memory: 2048,
    vm_cpus: 2,
    enable_internet: true,
    enable_nat: true,
    enable_bridge: false,
    use_snapshot: true,
    max_attempts: 3,
    is_active: true,
    is_published: false,
    start_time: "",
    end_time: "",
  });

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.title = isEdit ? "Edit Practical Exam" : "Create Practical Exam";

    const loadData = async () => {
      try {
        const subj = await authGet("/api/subjects/");
        setSubjects(subj);

        if (!isEdit && subj.length > 0) {
          setExam(prev => ({ ...prev, subject: subj[0].id }));
        }

        if (isEdit && id) {
          const data = await authGet(`/api/practical-exams/${id}/`);
          // Format dates for datetime-local input
          const formatDate = (dateString) => {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toISOString().slice(0, 16);
          };

          setExam({
            title: data.title || "",
            description: data.description || "",
            subject: data.subject || "",
            base_vm_name: data.base_vm_name || "generic/centos9",
            snapshot_name: data.snapshot_name || "exam-base",
            vm_username: data.vm_username || "student",
            vm_password: data.vm_password || "centos123",
            duration_minutes: data.duration_minutes || 60,
            total_marks: data.total_marks || 100,
            verification_command: data.verification_command || "",
            vm_memory: data.vm_memory || 2048,
            vm_cpus: data.vm_cpus || 2,
            enable_internet: data.enable_internet !== undefined ? data.enable_internet : true,
            enable_nat: data.enable_nat !== undefined ? data.enable_nat : true,
            enable_bridge: data.enable_bridge || false,
            use_snapshot: data.use_snapshot !== undefined ? data.use_snapshot : true,
            max_attempts: data.max_attempts || 3,
            is_active: data.is_active !== undefined ? data.is_active : true,
            is_published: data.is_published || false,
            start_time: formatDate(data.start_time),
            end_time: formatDate(data.end_time),
          });
        }
      } catch (err) {
        Swal.fire("Error", "Failed to load exam data", "error");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEdit]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!exam.title.trim()) newErrors.title = "Title is required";
    if (!exam.description.trim()) newErrors.description = "Description is required";
    if (!exam.subject) newErrors.subject = "Subject is required";
    if (exam.duration_minutes < 1) newErrors.duration_minutes = "Duration must be at least 1 minute";
    if (exam.total_marks < 1) newErrors.total_marks = "Total marks must be at least 1";
    if (exam.vm_memory < 512) newErrors.vm_memory = "VM memory must be at least 512 MB";
    if (exam.vm_cpus < 1) newErrors.vm_cpus = "VM CPUs must be at least 1";
    if (exam.max_attempts < 1) newErrors.max_attempts = "Max attempts must be at least 1";
    
    // Date validation
    if (exam.start_time && exam.end_time) {
      const start = new Date(exam.start_time);
      const end = new Date(exam.end_time);
      if (start >= end) newErrors.end_time = "End time must be after start time";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : 
                    type === 'number' ? Number(value) : value;
    
    setExam(prev => ({ ...prev, [name]: newValue }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire("Error", "Please fix the errors in the form", "error");
      return;
    }

    // Prepare payload
    const payload = {
      ...exam,
      subject: Number(exam.subject),
      duration_minutes: Number(exam.duration_minutes),
      total_marks: Number(exam.total_marks),
      vm_memory: Number(exam.vm_memory),
      vm_cpus: Number(exam.vm_cpus),
      max_attempts: Number(exam.max_attempts),
      start_time: exam.start_time ? exam.start_time : null,
      end_time: exam.end_time ? exam.end_time : null,
    };

    try {
      Swal.fire({
        title: 'Please wait...',
        html: `${isEdit ? 'Updating' : 'Creating'} practical exam`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      if (isEdit) {
        await authPut(`/api/practical-exams/${id}/`, payload);
        Swal.fire("Success", "Practical exam updated successfully!", "success");
      } else {
        await authPost("/api/practical-exams/", payload);
        Swal.fire("Success", "Practical exam created successfully!", "success");
      }
      navigate("/admin/task-list");
    } catch (err) {
      Swal.fire("Error", err.message || "Operation failed", "error");
    }
  };

  if (loading) return <div className="loading-container">Loading…</div>;

  return (
    <div className="task-form-container">
      <h2>{isEdit ? "Edit Practical Exam" : "Create Practical Exam"}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Basic Information</h3>
          <div className="form-group">
            <label>Title*</label>
            <input 
              type="text" 
              name="title" 
              value={exam.title}
              onChange={handleChange} 
              className={errors.title ? 'error' : ''}
              placeholder="Enter exam title"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label>Description*</label>
            <textarea 
              name="description" 
              rows="4"
              value={exam.description} 
              onChange={handleChange} 
              className={errors.description ? 'error' : ''}
              placeholder="Enter detailed exam description"
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Subject*</label>
            <select 
              name="subject" 
              value={exam.subject}
              onChange={handleChange} 
              className={errors.subject ? 'error' : ''}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.subject && <span className="error-message">{errors.subject}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>VM Configuration</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Base VM Image*</label>
              <input 
                type="text" 
                name="base_vm_name"
                value={exam.base_vm_name}
                onChange={handleChange}
                placeholder="generic/centos9"
              />
              <small className="form-help">CentOS 9 VM image name</small>
            </div>

            <div className="form-group">
              <label>Snapshot Name</label>
              <input 
                type="text" 
                name="snapshot_name"
                value={exam.snapshot_name}
                onChange={handleChange}
                placeholder="exam-base"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>VM Username*</label>
              <input 
                type="text" 
                name="vm_username"
                value={exam.vm_username}
                onChange={handleChange}
                placeholder="student"
              />
            </div>

            <div className="form-group">
              <label>VM Password*</label>
              <input 
                type="text" 
                name="vm_password"
                value={exam.vm_password}
                onChange={handleChange}
                placeholder="centos123"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>VM Memory (MB)*</label>
              <input 
                type="number" 
                name="vm_memory"
                min="512"
                step="256"
                value={exam.vm_memory}
                onChange={handleChange}
                className={errors.vm_memory ? 'error' : ''}
              />
              {errors.vm_memory && <span className="error-message">{errors.vm_memory}</span>}
            </div>

            <div className="form-group">
              <label>VM CPUs*</label>
              <input 
                type="number" 
                name="vm_cpus"
                min="1"
                max="8"
                value={exam.vm_cpus}
                onChange={handleChange}
                className={errors.vm_cpus ? 'error' : ''}
              />
              {errors.vm_cpus && <span className="error-message">{errors.vm_cpus}</span>}
            </div>
          </div>

          <div className="checkbox-group">
            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="enable_internet"
                name="enable_internet" 
                checked={exam.enable_internet}
                onChange={handleChange} 
              />
              <label htmlFor="enable_internet">Enable Internet Access</label>
            </div>

            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="enable_nat"
                name="enable_nat" 
                checked={exam.enable_nat}
                onChange={handleChange} 
              />
              <label htmlFor="enable_nat">Enable NAT Networking</label>
            </div>

            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="use_snapshot"
                name="use_snapshot" 
                checked={exam.use_snapshot}
                onChange={handleChange} 
              />
              <label htmlFor="use_snapshot">Use Snapshot for Reset</label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Exam Settings</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Duration (minutes)*</label>
              <input 
                type="number" 
                name="duration_minutes"
                min="1" 
                value={exam.duration_minutes}
                onChange={handleChange}
                className={errors.duration_minutes ? 'error' : ''}
              />
              {errors.duration_minutes && <span className="error-message">{errors.duration_minutes}</span>}
            </div>

            <div className="form-group">
              <label>Total Marks*</label>
              <input 
                type="number" 
                name="total_marks"
                min="1" 
                value={exam.total_marks}
                onChange={handleChange}
                className={errors.total_marks ? 'error' : ''}
              />
              {errors.total_marks && <span className="error-message">{errors.total_marks}</span>}
            </div>

            <div className="form-group">
              <label>Max Attempts*</label>
              <input 
                type="number" 
                name="max_attempts"
                min="1" 
                max="10"
                value={exam.max_attempts}
                onChange={handleChange}
                className={errors.max_attempts ? 'error' : ''}
              />
              {errors.max_attempts && <span className="error-message">{errors.max_attempts}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time (Optional)</label>
              <input 
                type="datetime-local" 
                name="start_time"
                value={exam.start_time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Time (Optional)</label>
              <input 
                type="datetime-local" 
                name="end_time"
                value={exam.end_time}
                onChange={handleChange}
                className={errors.end_time ? 'error' : ''}
              />
              {errors.end_time && <span className="error-message">{errors.end_time}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Verification Command</label>
            <textarea 
              name="verification_command" 
              rows="3"
              value={exam.verification_command}
              onChange={handleChange}
              placeholder="Command to verify exam completion"
            />
            <small className="form-help">This command will be executed to verify exam completion</small>
          </div>
        </div>

        <div className="form-section">
          <h3>Status</h3>
          <div className="checkbox-group">
            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="is_active"
                name="is_active" 
                checked={exam.is_active}
                onChange={handleChange} 
              />
              <label htmlFor="is_active">Active</label>
            </div>

            <div className="form-checkbox">
              <input 
                type="checkbox" 
                id="is_published"
                name="is_published" 
                checked={exam.is_published}
                onChange={handleChange} 
              />
              <label htmlFor="is_published">Published</label>
            </div>
          </div>
        </div>

        <div className="form-buttons">
          <button className="btn btn-primary" type="submit">
            {isEdit ? "Update Exam" : "Create Exam"}
          </button>
          <button className="btn btn-secondary" type="button"
            onClick={() => navigate("/admin/task-list")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PracticalTaskForm;