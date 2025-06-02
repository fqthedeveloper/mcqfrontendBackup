import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { authPost } from '../../services/api';

export default function AddStudent() {
  useEffect(() => {
    document.title = "Add Students";
  }, []);

  const [form, setForm] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
const handleSubmit = async e => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    await authPost('/api/students/', form);
    Swal.fire({
      icon: 'success',
      title: 'Student added successfully',
      text: 'Credentials sent via email.',
    });
    setForm({ email: '', username: '', first_name: '', last_name: '' });
  } catch (error) {
    // Try to extract a meaningful error message
    let message = 'An unexpected error occurred';

    if (error.response && error.response.data) {
      // Axios error format
      if (error.response.data.detail) {
        message = error.response.data.detail;
      } else if (typeof error.response.data === 'string') {
        message = error.response.data;
      } else if (typeof error.response.data === 'object') {
        // Sometimes errors come as objects with field keys
        message = Object.values(error.response.data).flat().join(' ') || message;
      }
    } else if (error.detail) {
      message = error.detail;
    } else if (error.message) {
      message = error.message;
    }

    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: message,
    });
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="form-container">
      <h2>Add New Student</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email*</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="student@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="username">Username*</label>
          <input
            id="username"
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Unique identifier"
            required
            minLength={3}
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="first_name">First Name*</label>
          <input
            id="first_name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            placeholder="Given name"
            required
            autoComplete="given-name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="last_name">Last Name*</label>
          <input
            id="last_name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            placeholder="Family name"
            required
            autoComplete="family-name"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
        >
          {isSubmitting ? (
            <>
              <span className="spinner"></span> Processing...
            </>
          ) : 'Add Student'}
        </button>
      </form>

      <style>{`
        .form-container {
          padding: 1.5rem;
          max-width: 500px;
          margin: 0 auto;
          width: 90%;
        }
        
        h2 {
          text-align: center;
          margin-bottom: 1.5rem;
          font-size: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.2rem;
        }
        
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #333;
        }
        
        input {
          width: 100%;
          padding: 0.8rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }
        
        input:focus {
          border-color: #3498db;
          outline: none;
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        .submit-btn {
          width: 100%;
          padding: 0.9rem;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
          position: relative;
        }
        
        .submit-btn:hover {
          background-color: #2980b9;
        }
        
        .submit-btn:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }
        
        .submitting {
          background-color: #7f8c8d;
        }
        
        .spinner {
          display: inline-block;
          width: 1rem;
          height: 1rem;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
          vertical-align: text-bottom;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        /* Responsive adjustments */
        @media (min-width: 768px) {
          .form-container {
            padding: 2rem;
            width: 80%;
          }
          
          h2 {
            font-size: 1.8rem;
          }
        }
        
        @media (min-width: 992px) {
          .form-container {
            max-width: 600px;
          }
        }
      `}</style>
    </div>
  );
}
