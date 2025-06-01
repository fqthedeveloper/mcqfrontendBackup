// src/components/Admin/AdminStudentList.jsx
import React, { useEffect, useState } from 'react';
import { authGet, authPut } from '../../services/api';
import '../CSS/AdminStudentList.css'; // Assuming you have a CSS file for styles


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
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await authGet('/api/students/');
      setStudents(res);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch students. Are you logged in?');
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
      is_active: student.is_active || true,
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
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const saveEdit = async () => {
    setLoading(true);
    try {
      // Use PUT method here
      await authPut(`/api/students/${editId}/`, formData);
      await fetchStudents();
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert('Error saving student');
    }
    setLoading(false);
  };

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
              <th>Verified</th>
              
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) =>
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
                  
                  <td className="actions">
                    <button 
                      className="save-btn"
                      onClick={saveEdit} 
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
                  <td data-label="First Name">{student.first_name}</td>
                  <td data-label="Last Name">{student.last_name}</td>
                  <td data-label="Email">{student.email}</td>
                  <td data-label="Username">{student.username}</td>
                  <td data-label="Verified">{student.is_verified ? 'Yes' : 'No'}</td>
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
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
