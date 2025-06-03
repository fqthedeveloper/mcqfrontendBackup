// src/components/ExamForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  authGet,
  authPut,
  authPost,
} from '../../services/api';
import { FaTrash, FaArrowUp, FaArrowDown, FaPaperPlane } from 'react-icons/fa';
import Swal from 'sweetalert2';
import '../CSS/ExamForm.css';

const ExamForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [exam, setExam] = useState({
    title: '',
    subject: '',
    mode: 'practice',
    duration: 60,
    start_time: '',
    end_time: '',
    selected_questions: [],
    notification_message:
      'A new exam has been scheduled. Please check your dashboard for details.',
  });

  const [allQuestions, setAllQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', search: '' });
  const [isPublished, setIsPublished] = useState(false);
  

  useEffect(() => {
    document.title = isEdit ? 'Edit Exam' : 'Add Exam';
  }, [isEdit]);

  const showSuccess = (message) =>
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: message,
      timer: 3000,
      showConfirmButton: false,
    });

  const showError = (message) =>
    Swal.fire({ icon: 'error', title: 'Error!', text: message });

  const showConfirmation = (title, text, confirmText, callback) =>
    Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: confirmText,
    }).then((result) => {
      if (result.isConfirmed) callback();
    });

  const fetchData = async () => {
    try {
      setLoading(true);

      // 1) Fetch all questions (with a large page_size to avoid pagination issues)
      const questionsRes = await authGet('/api/questions/?page_size=1000');
      let questionsData = questionsRes.data;
      // If paginated:
      if (questionsData.results) {
        questionsData = questionsData.results;
      }

      // 2) Fetch subjects
      const subjectsRes = await authGet('/api/subjects/');
      const subjectsData = subjectsRes.data;

      // Normalize question.subject into a full object if needed
      questionsData = questionsData.map((q) => {
        if (q.subject && typeof q.subject === 'object') {
          return q;
        }
        const subjVal = q.subject || '';
        const found = subjectsData.find(
          (sub) => sub.name.trim().toLowerCase() === subjVal.trim().toLowerCase()
        );
        return { ...q, subject: found || null };
      });

      setAllQuestions(questionsData);
      setSubjects(subjectsData);

      // 3) If editing, fetch the existing exam
      if (isEdit && id) {
        const examRes = await authGet(`/api/exams/${id}/`);
        const examData = examRes.data;
        setIsPublished(examData.is_published);

        // examData.questions is an array of objects like:
        // { id: 803, order: 0, question: { id: 391, text: "...", ... } }
        // We want an array of the **inner** question.id (e.g. 391, 392, etc.)
        const selectedIds = examData.questions.map((q) => q.question.id);

        setExam({
          title: examData.title || '',
          subject: examData.subject || '',
          mode: examData.mode || 'practice',
          duration: examData.duration || 60,
          start_time: examData.start_time ? examData.start_time.slice(0, 16) : '',
          end_time: examData.end_time ? examData.end_time.slice(0, 16) : '',
          selected_questions: selectedIds,
          notification_message:
            examData.notification_message ||
            'A new exam has been scheduled. Please check your dashboard for details.',
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Failed to load exam data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setExam((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleQuestionSelect = (questionId) => {
    setExam((prev) => {
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
    setExam((prev) => {
      const list = [...prev.selected_questions];
      const swapWith = direction === 'up' ? index - 1 : index + 1;
      if (swapWith >= 0 && swapWith < list.length) {
        [list[index], list[swapWith]] = [list[swapWith], list[index]];
      }
      return { ...prev, selected_questions: list };
    });
  };

  const filteredQuestions = allQuestions.filter((q) => {
  // 1) Exclude already‐selected
  if (exam.selected_questions.includes(q.id)) {
    return false;
  }
  // 2) Filter by subject, if provided
  const subjectMatch = filter.subject
    ? String(q.subject?.id) === filter.subject
    : true;
  // 3) Search text
  const searchMatch = filter.search
    ? q.text.toLowerCase().includes(filter.search.toLowerCase())
    : true;
  return subjectMatch && searchMatch;
});

  const selectedQuestionDetails = exam.selected_questions
    .map((id) => allQuestions.find((q) => q.id === id))
    .filter(Boolean);

  const performSubmit = async (publish) => {
    try {
      // Payload keys must match what your DRF expects:
      const payload = {
        title: exam.title,
        subject: exam.subject,
        mode: exam.mode,
        duration: exam.duration,
        start_time: exam.start_time,
        end_time: exam.end_time,
        // The backend expects “questions” = [array of question‐IDs]
        questions: exam.selected_questions,
        notification_message: exam.notification_message,
        is_published: publish || isPublished,
      };

      let response;
      if (isEdit) {
        response = await authPut(`/api/exams/${id}/`, payload);
      } else {
        response = await authPost('/api/exams/', payload);
      }

      if (publish && !isPublished) {
        await authPost(
          `/api/exams/${response.data.id}/publish/`,
          { message: exam.notification_message }
        );
        setIsPublished(true);
      }

      showSuccess(`Exam ${isEdit ? 'updated' : 'created'} successfully!`);
      setTimeout(() => navigate('/admin/exams'), 1500);
    } catch (err) {
      console.error('Error saving exam:', err);
      showError('Failed to save exam. Please try again.');
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
        () => performSubmit(true)
      );
    } else {
      performSubmit(false);
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

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {/* ───────── Exam Details ───────── */}
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
                {subjects.map((subject) => (
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

        {/* ───────── Notification Message ───────── */}
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

        {/* ───────── Question Selection ───────── */}
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
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
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
            {/* ─ Available Questions ─ */}
            <div className="question-list available-questions">
              <h4>Available Questions ({filteredQuestions.length})</h4>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        const top100 = filteredQuestions
                          .slice(0, 100)
                          .map((q) => q.id);
                        setExam((prev) => ({
                          ...prev,
                          selected_questions: Array.from(
                            new Set([...prev.selected_questions, ...top100])
                          ),
                        }));
                      }
                    }}
                  />{' '}
                  Select Top 100 Questions
                </label>
              </div>

              <div className="questions-container">
                {filteredQuestions.length > 0 ? (
                  filteredQuestions.map((question) => (
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
                  ))
                ) : (
                  <p>No questions available</p>
                )}
              </div>
            </div>

            {/* ─ Selected Questions ─ */}
            <div className="question-list selected-questions">
              <h4>Selected Questions ({selectedQuestionDetails.length})</h4>
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

        {/* ───────── Save & Publish Buttons ───────── */}
        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">
            Save Exam
          </button>
          <button
            type="button"
            className="btn btn-success"
            onClick={(e) => handleSubmit(e, true)}
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
