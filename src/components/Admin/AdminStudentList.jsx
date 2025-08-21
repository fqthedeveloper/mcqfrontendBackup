// AdminStudentList.jsx
import React, { useEffect, useState } from 'react';
import { authGet, authPut } from '../../services/api';
import Swal from 'sweetalert2';

export default function AdminStudentList() {
  const [students, setStudents] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    is_verified: false,
    is_active: true,
    subject_ids: []
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
    fetchSubjects();
  }, []);

  const showErrorAlert = (title, text) => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: text,
      confirmButtonColor: '#d33',
    });
  };

  const showSuccessAlert = (title, text) => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: text,
      confirmButtonColor: '#3085d6',
    });
  };

  const showConfirmDialog = (title, text, confirmButtonText) => {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancel'
    });
  };

  const fetchStudents = async () => {
    try {
      const res = await authGet('/api/students/');
      setStudents(res.data || res);
    } catch (err) {
      console.error('Error fetching students:', err);
      showErrorAlert('Error', 'Failed to fetch students. Are you logged in?');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await authGet('/api/subjects/');
      setAvailableSubjects(response.data || response);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      showErrorAlert('Error', 'Failed to fetch subjects');
    }
  };

  const startEdit = (student) => {
    setEditId(student.id);
    setFormData({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      email: student.email || '',
      username: student.username || '',
      is_verified: student.is_verified || false,
      is_active: student.is_active !== undefined ? student.is_active : true,
      subject_ids: student.subjects ? student.subjects.map(s => s.id || s) : []
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      is_verified: false,
      is_active: true,
      subject_ids: []
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubjectChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedSubjectIds = selectedOptions.map(option => parseInt(option.value));
    setFormData((prev) => ({
      ...prev,
      subject_ids: selectedSubjectIds
    }));
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      await authPut(`/api/students/${editId}/`, formData);
      await fetchStudents();
      cancelEdit();
      showSuccessAlert('Success', 'Student updated successfully!');
    } catch (err) {
      console.error('Error saving student:', err);
      showErrorAlert('Error', 'Error saving student: ' + (err.response?.data?.detail || err.message));
    }
    setLoading(false);
  };

  const handleSaveClick = () => {
    showConfirmDialog('Are you sure?', 'Do you want to update this student?', 'Yes, update it!')
      .then((result) => {
        if (result.isConfirmed) {
          saveEdit();
        }
      });
  };

  if (isLoading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="admin-student-list">
      <h2>Student List</h2>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Email</th>
              <th>Username</th>
              <th>Subjects</th>
              <th>Verified</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students && students.length > 0 ? (
              students.map((student) =>
                editId === student.id ? (
                  <tr key={student.id}>
                    <td data-label="First Name">
                      <input 
                        name="first_name"
                        value={formData.first_name} 
                        onChange={handleChange}
                        placeholder="First name"
                      />
                    </td>
                    <td data-label="Last Name">
                      <input 
                        name="last_name"
                        value={formData.last_name} 
                        onChange={handleChange}
                        placeholder="Last name"
                      />
                    </td>
                    <td data-label="Email">
                      <input 
                        name="email"
                        type="email"
                        value={formData.email} 
                        onChange={handleChange}
                        placeholder="Email"
                      />
                    </td>
                    <td data-label="Username">
                      <input 
                        name="username"
                        value={formData.username} 
                        onChange={handleChange}
                        placeholder="Username"
                      />
                    </td>
                    <td data-label="Subjects">
                      <select
                        name="subject_ids"
                        multiple
                        value={formData.subject_ids}
                        onChange={handleSubjectChange}
                        className="subject-select"
                      >
                        {availableSubjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name}
                          </option>
                        ))}
                      </select>
                      <div className="select-hint">Hold Ctrl/Cmd to select multiple</div>
                    </td>
                    <td data-label="Verified">
                      <label className="checkbox-container">
                        <input 
                          type="checkbox" 
                          name="is_verified" 
                          checked={formData.is_verified} 
                          onChange={handleChange} 
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td data-label="Active">
                      <label className="checkbox-container">
                        <input 
                          type="checkbox" 
                          name="is_active" 
                          checked={formData.is_active} 
                          onChange={handleChange} 
                        />
                        <span className="checkmark"></span>
                      </label>
                    </td>
                    <td className="actions">
                      <button 
                        className="save-btn"
                        onClick={handleSaveClick} 
                        disabled={loading}
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={cancelEdit} 
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={student.id}>
                    <td data-label="First Name">{student.first_name || 'N/A'}</td>
                    <td data-label="Last Name">{student.last_name || 'N/A'}</td>
                    <td data-label="Email">{student.email || 'N/A'}</td>
                    <td data-label="Username">{student.username || 'N/A'}</td>
                    <td data-label="Subjects">
                      {student.subjects && student.subjects.length > 0 
                        ? student.subjects.map(s => s.name || `Subject ${s.id}`).join(', ') 
                        : 'None'}
                    </td>
                    <td data-label="Verified">{student.is_verified ? 'Yes' : 'No'}</td>
                    <td data-label="Active">{student.is_active ? 'Yes' : 'No'}</td>
                    <td className="actions">
                      <button 
                        className="edit-btn"
                        onClick={() => startEdit(student)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td colSpan="8" className="no-data">No students found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .admin-student-list {
          padding: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 20px;
          font-size: 18px;
        }
        
        .table-container {
          overflow-x: auto;
          margin-top: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          background-color: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        
        th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        
        tr:hover {
          background-color: #f5f5f5;
        }
        
        .no-data {
          text-align: center;
          color: #6c757d;
          font-style: italic;
        }
        
        input[type="text"], input[type="email"], select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
        }
        
        .subject-select {
          height: 100px;
        }
        
        .select-hint {
          font-size: 0.7rem;
          color: #666;
          margin-top: 4px;
        }
        
        .checkbox-container {
          display: inline-block;
          position: relative;
          padding-left: 25px;
          cursor: pointer;
          font-size: 16px;
        }
        
        .checkbox-container input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }
        
        .checkmark {
          position: absolute;
          top: 0;
          left: 0;
          height: 20px;
          width: 20px;
          background-color: #eee;
          border-radius: 4px;
        }
        
        .checkbox-container:hover input ~ .checkmark {
          background-color: #ccc;
        }
        
        .checkbox-container input:checked ~ .checkmark {
          background-color: #2196F3;
        }
        
        .checkmark:after {
          content: "";
          position: absolute;
          display: none;
        }
        
        .checkbox-container input:checked ~ .checkmark:after {
          display: block;
        }
        
        .checkbox-container .checkmark:after {
          left: 7px;
          top: 3px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        
        .actions {
          display: flex;
          gap: 8px;
        }
        
        .edit-btn, .save-btn, .cancel-btn {
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .edit-btn {
          background-color: #4CAF50;
          color: white;
        }
        
        .save-btn {
          background-color: #2196F3;
          color: white;
        }
        
        .cancel-btn {
          background-color: #f44336;
          color: white;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          table, thead, tbody, th, td, tr {
            display: block;
          }
          
          thead tr {
            position: absolute;
            top: -9999px;
            left: -9999px;
          }
          
          tr {
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          
          td {
            border: none;
            border-bottom: 1px solid #eee;
            position: relative;
            padding-left: 50%;
          }
          
          td:before {
            position: absolute;
            left: 6px;
            width: 45%;
            padding-right: 10px;
            white-space: nowrap;
            font-weight: bold;
          }
          
          td:nth-of-type(1):before { content: "First Name"; }
          td:nth-of-type(2):before { content: "Last Name"; }
          td:nth-of-type(3):before { content: "Email"; }
          td:nth-of-type(4):before { content: "Username"; }
          td:nth-of-type(5):before { content: "Subjects"; }
          td:nth-of-type(6):before { content: "Verified"; }
          td:nth-of-type(7):before { content: "Active"; }
          td:nth-of-type(8):before { content: "Actions"; }
          
          .subject-select {
            height: 80px;
          }
        }
      `}</style>
    </div>
  );
}