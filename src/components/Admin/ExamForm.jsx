import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrash, FaArrowUp, FaArrowDown, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../../context/authContext';
import Swal from 'sweetalert2';
import '../CSS/ExamForm.css';

const ExamForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const authToken = token || localStorage.getItem("access_token");

  const [exam, setExam] = useState({
    title: '',
    subject: '',
    mode: 'practice',
    duration: 60,
    start_time: '',
    end_time: '',
    selected_questions: [],
    notification_message: 'A new exam has been scheduled. Please check your dashboard for details.'
  });

  const [allQuestions, setAllQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', search: '' });
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    document.title = isEdit ? 'Edit Exam' : 'Add Exam';
  }, [isEdit]);

  const showSuccess = (message) => {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      timer: 3000,
      showConfirmButton: false
    });
  };

  const showError = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Error!',
      text: message
    });
  };

  const showConfirmation = (title, text, confirmText, callback) => {
    Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmText
    }).then(result => {
      if (result.isConfirmed) {
        callback();
      }
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const questionsRes = await axios.get('http://127.0.0.1:8000/api/questions/', {
        headers: { Authorization: `Token ${authToken}` }
      });

      const subjectsRes = await axios.get('http://127.0.0.1:8000/api/subjects/', {
        headers: { Authorization: `Token ${authToken}` }
      });

      const subjectsData = subjectsRes.data;
      let questionsData = questionsRes.data;

      questionsData = questionsData.map(question => {
        if (question.subject && typeof question.subject === 'object') {
          return question;
        }
        const subjVal = question.subject || '';
        const foundSubject = subjectsData.find(
          sub => sub.name.trim().toLowerCase() === subjVal.trim().toLowerCase()
        );
        return {
          ...question,
          subject: foundSubject || null
        };
      });

      setAllQuestions(questionsData);
      setSubjects(subjectsData);

      if (isEdit && id) {
        const examRes = await axios.get(`http://127.0.0.1:8000/api/exams/${id}/`, {
          headers: { Authorization: `Token ${authToken}` }
        });
        const examData = examRes.data;
        setIsPublished(examData.is_published);
        setExam({
          title: examData.title || '',
          subject: examData.subject || '',
          mode: examData.mode || 'practice',
          duration: examData.duration || 60,
          start_time: examData.start_time ? examData.start_time.slice(0, 16) : '',
          end_time: examData.end_time ? examData.end_time.slice(0, 16) : '',
          selected_questions: examData.questions
            ? examData.questions.map(q => q.id)
            : [],
          notification_message:
            examData.notification_message ||
            'A new exam has been scheduled. Please check your dashboard for details.'
        });
      }
    } catch (err) {
      // handle error silently or show error if needed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, isEdit, authToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExam(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionSelect = (questionId) => {
    setExam(prev => {
      const idx = prev.selected_questions.indexOf(questionId);
      const updated = [...prev.selected_questions];
      if (idx > -1) {
        updated.splice(idx, 1);
      } else {
        updated.push(questionId);
      }
      return { ...prev, selected_questions: updated };
    });
  };

  const handleMoveQuestion = (index, direction) => {
    setExam(prev => {
      const list = [...prev.selected_questions];
      const targetIdx = direction === 'up' ? index - 1 : index + 1;
      if (targetIdx >= 0 && targetIdx < list.length) {
        [list[index], list[targetIdx]] = [list[targetIdx], list[index]];
      }
      return { ...prev, selected_questions: list };
    });
  };

  const filteredQuestions = allQuestions.filter(q => {
    const subjectMatch = filter.subject
      ? q.subject
        ? String(q.subject.id) === filter.subject
        : false
      : true;
    const searchMatch = filter.search
      ? q.text.toLowerCase().includes(filter.search.toLowerCase())
      : true;
    return subjectMatch && searchMatch;
  });

  const selectedQuestionDetails = exam.selected_questions
    .map(id => allQuestions.find(q => q.id === id))
    .filter(Boolean);

  const performSubmit = async (publish) => {
    try {
      const payload = {
        title: exam.title,
        subject: exam.subject,
        mode: exam.mode,
        duration: exam.duration,
        start_time: exam.start_time,
        end_time: exam.end_time,
        selected_questions: exam.selected_questions,
        notification_message: exam.notification_message,
        is_published: publish || isPublished
      };

      let response;
      if (isEdit) {
        response = await axios.put(
          `http://127.0.0.1:8000/api/exams/${id}/`,
          payload,
          {
            headers: { Authorization: `Token ${authToken}` }
          }
        );
      } else {
        response = await axios.post(
          'http://127.0.0.1:8000/api/exams/',
          payload,
          {
            headers: { Authorization: `Token ${authToken}` }
          }
        );
      }

      if (publish && !isPublished) {
        await axios.post(
          `http://127.0.0.1:8000/api/exams/${response.data.id}/publish/`,
          { message: exam.notification_message },
          {
            headers: { Authorization: `Token ${authToken}` }
          }
        );
        setIsPublished(true);
      }

      showSuccess(`Exam ${isEdit ? 'updated' : 'created'} successfully!`);
      setTimeout(() => navigate('/admin/exams'), 2000);
    } catch (err) {
      // handle error silently or show error if needed
    }
  };

  const handleSubmit = async (e, publish = false) => {
    e.preventDefault();

    if (exam.selected_questions.length === 0) {
      showError('Please select at least one question');
      return;
    }

    if (publish) {
      showConfirmation(
        'Publish Exam?',
        'This will notify all students. Are you sure you want to publish this exam?',
        'Yes, publish it!',
        () => performSubmit(publish)
      );
    } else {
      performSubmit(publish);
    }
  };

  if (loading) {
    return (
      <div className="exam-form-loading">
        <p>Loading data…</p>
      </div>
    );
  }

  return (
    <div className="exam-form-container">
      <h2>{isEdit ? 'Edit Exam' : 'Create New Exam'}</h2>

      <form onSubmit={e => handleSubmit(e, false)}>
        <div className="form-section">
          <h3>Exam Details</h3>
          <div className="form-grid">
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
              <label>Subject*</label>
              <select
                name="subject"
                value={exam.subject}
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
              <label>Mode*</label>
              <select
                name="mode"
                value={exam.mode}
                onChange={handleChange}
                required
              >
                <option value="practice">Practice</option>
                <option value="strict">Strict</option>
              </select>
            </div>

            <div className="form-group">
              <label>Duration (minutes)*</label>
              <input
                type="number"
                name="duration"
                value={exam.duration}
                onChange={handleChange}
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Start Time</label>
              <input
                type="datetime-local"
                name="start_time"
                value={exam.start_time}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="datetime-local"
                name="end_time"
                value={exam.end_time}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Notification Message</h3>
          <div className="form-group">
            <textarea
              name="notification_message"
              value={exam.notification_message}
              onChange={handleChange}
              rows="3"
              placeholder="Message to send to students"
            />
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h3>Select Questions</h3>
            <div className="selection-count">
              {exam.selected_questions.length} selected
            </div>
          </div>

          <div className="filters">
            <div className="form-group">
              <label>Filter by Subject</label>
              <select
                name="subject"
                value={filter.subject}
                onChange={handleFilterChange}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Search Questions</label>
              <input
                type="text"
                name="search"
                value={filter.search}
                onChange={handleFilterChange}
                placeholder="Search question text…"
              />
            </div>
          </div>

          <div className="question-lists-container">
            <div className="question-list available-questions">
              <h4>Available Questions ({filteredQuestions.length})</h4>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    onChange={e => {
                      if (e.target.checked) {
                        const top100 = filteredQuestions
                          .slice(0, 100)
                          .map(q => q.id);
                        setExam(prev => ({
                          ...prev,
                          selected_questions: Array.from(
                            new Set([...prev.selected_questions, ...top100])
                          )
                        }));
                      }
                    }}
                  />{' '}
                  Select Top 100 Questions
                </label>
              </div>

              <div className="questions-container">
                {filteredQuestions.map(question => (
                  <div
                    key={question.id}
                    className={`question-item ${
                      exam.selected_questions.includes(question.id)
                        ? 'selected'
                        : ''
                    }`}
                    onClick={() => handleQuestionSelect(question.id)}
                  >
                    <div className="question-checkbox">
                      <input
                        type="checkbox"
                        checked={exam.selected_questions.includes(question.id)}
                        onChange={() => handleQuestionSelect(question.id)}
                      />
                    </div>
                    <div className="question-content">
                      <div className="question-text">{question.text}</div>
                      <div className="question-meta">
                        <span>
                          Subject: {question.subject?.name || 'N/A'}
                        </span>
                        <span>Marks: {question.marks}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="question-list selected-questions">
              <h4>Selected Questions</h4>
              <div className="questions-container">
                {selectedQuestionDetails.length > 0 ? (
                  selectedQuestionDetails.map((question, index) => (
                    <div key={question.id} className="question-item selected">
                      <div className="question-header">
                        <div className="question-order">#{index + 1}</div>
                        <div className="question-actions">
                          <button
                            type="button"
                            aria-label="Move Up"
                            onClick={() => handleMoveQuestion(index, 'up')}
                            disabled={index === 0}
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            type="button"
                            aria-label="Move Down"
                            onClick={() => handleMoveQuestion(index, 'down')}
                            disabled={index === selectedQuestionDetails.length - 1}
                          >
                            <FaArrowDown />
                          </button>
                          <button
                            type="button"
                            aria-label="Remove Question"
                            onClick={() => handleQuestionSelect(question.id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <div className="question-text">{question.text}</div>
                      <div className="question-meta">
                        <span>Subject: {question.subject?.name || 'N/A'}</span>
                        <span>Marks: {question.marks}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No questions selected</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            Save Exam
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={e => handleSubmit(e, true)}
            disabled={isPublished}
          >
            <FaPaperPlane /> {isPublished ? 'Published' : 'Publish Exam'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExamForm;
