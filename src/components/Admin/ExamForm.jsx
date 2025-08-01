import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authGet, authPost, authPut } from '../../services/api';
import { useAuth } from '../../context/authContext';
import Swal from 'sweetalert2';
import { FaTrash, FaArrowUp, FaArrowDown, FaPaperPlane } from 'react-icons/fa';
import '../CSS/ExamForm.css';

const ExamForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [exam, setExam] = useState({
    title: '',
    subject: '',
    mode: 'practice',
    duration: 60,
    start_time: '',
    end_time: '',
    selected_questions: [],
    selected_practical_exams: [],
    notification_message: 'A new exam has been scheduled. Please check your dashboard for details.'
  });
  
  const [allQuestions, setAllQuestions] = useState([]);
  const [allPracticalExams, setAllPracticalExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', search: '' });
  const [practicalFilter, setPracticalFilter] = useState({ search: '' });
  const [isPublished, setIsPublished] = useState(false);
  const [practicalTaskCounts, setPracticalTaskCounts] = useState({});

  useEffect(() => {
    document.title = isEdit ? 'Edit Exam' : 'Add Exam';
  }, [isEdit]);

  const showSuccess = msg => Swal.fire({ icon: 'success', title: 'Success!', text: msg, timer: 3000, showConfirmButton: false });
  const showError   = msg => Swal.fire({ icon: 'error', title: 'Error!', text: msg });
  
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
      if (result.isConfirmed) callback();
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [questionsRes, practicalExamsRes, subjectsRes] = await Promise.all([
        authGet('/api/questions/'),
        authGet('/api/practical-exams/'),
        authGet('/api/subjects/')
      ]);
      
      // Process subjects
      const subjectsData = subjectsRes.results || subjectsRes;
      setSubjects(subjectsData);
      
      // Process questions
      const questionsData = questionsRes.results || questionsRes;
      setAllQuestions(questionsData.map(q => ({
        ...q,
        subject: typeof q.subject === 'object' ? q.subject : subjectsData.find(s => s.id === q.subject)
      })));
      
      // Process practical exams
      const practicalExamsData = practicalExamsRes.results || practicalExamsRes;
      setAllPracticalExams(practicalExamsData);

      // Fetch task counts for practical exams
      const counts = {};
      for (const exam of practicalExamsData) {
        try {
          const taskRes = await authGet(`/api/practical-exams/${exam.id}/tasks/`);
          counts[exam.id] = taskRes.count || 0;
        } catch (err) {
          counts[exam.id] = 0;
        }
      }
      setPracticalTaskCounts(counts);

      if (isEdit && id) {
        const examRes = await authGet(`/api/exams/${id}/`);
        const ed = examRes;
        setIsPublished(ed.is_published);
        
        const practicalIds = ed.practical_exams 
          ? ed.practical_exams.map(p => p.id) 
          : [];
        
        setExam({
          title: ed.title || '',
          subject: ed.subject?.id || '',
          mode: ed.mode || 'practice',
          duration: ed.duration || 60,
          start_time: ed.start_time ? ed.start_time.slice(0, 16) : '',
          end_time: ed.end_time ? ed.end_time.slice(0, 16) : '',
          selected_questions: ed.questions ? ed.questions.map(q => q.id) : [],
          selected_practical_exams: practicalIds,
          notification_message: ed.notification_message || 'A new exam has been scheduled. Please check your dashboard for details.'
        });
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setExam(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handlePracticalFilterChange = e => {
    const { name, value } = e.target;
    setPracticalFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleQuestionSelect = qid => {
    setExam(prev => {
      const list = [...prev.selected_questions];
      const idx = list.indexOf(qid);
      if (idx > -1) list.splice(idx, 1);
      else list.push(qid);
      return { ...prev, selected_questions: list };
    });
  };

  const handlePracticalSelect = examId => {
    setExam(prev => {
      const list = [...prev.selected_practical_exams];
      const idx = list.indexOf(examId);
      if (idx > -1) list.splice(idx, 1);
      else list.push(examId);
      return { ...prev, selected_practical_exams: list };
    });
  };

  const handleMoveItem = (listName, idx, direction) => {
    setExam(prev => {
      const list = [...prev[listName]];
      const swap = direction === 'up' ? idx-1 : idx+1;
      if (swap >= 0 && swap < list.length) {
        [list[idx], list[swap]] = [list[swap], list[idx]];
      }
      return { ...prev, [listName]: list };
    });
  };

  const filteredQuestions = allQuestions.filter(q => {
    const bySubject = filter.subject ? 
      (q.subject?.id || q.subject)?.toString() === filter.subject : 
      true;
    const bySearch  = filter.search ? 
      q.text?.toLowerCase().includes(filter.search.toLowerCase()) : 
      true;
    return bySubject && bySearch;
  });

  const filteredPracticalExams = allPracticalExams.filter(exam => {
    return practicalFilter.search ? 
      exam.title.toLowerCase().includes(practicalFilter.search.toLowerCase()) || 
      (exam.description && exam.description.toLowerCase().includes(practicalFilter.search.toLowerCase())) : 
      true;
  });

  const selectedQuestionDetails = exam.selected_questions.map(qid => 
    allQuestions.find(q => q.id === qid)).filter(Boolean);
  
  const selectedPracticalDetails = exam.selected_practical_exams.map(eid => 
    allPracticalExams.find(e => e.id === eid)).filter(Boolean);

  const performSubmit = async publish => {
    try {
      const payload = {
        title: exam.title,
        subject: exam.subject,
        mode: exam.mode,
        duration: Number(exam.duration),
        start_time: exam.start_time,
        end_time: exam.end_time,
        selected_questions: exam.selected_questions,
        selected_practical_exams: exam.selected_practical_exams,
        notification_message: exam.notification_message,
        is_published: publish || isPublished
      };

      let response;
      if (isEdit) {
        response = await authPut(`/api/exams/${id}/`, payload);
      } else {
        response = await authPost(`/api/exams/`, payload);
      }

      if (publish && !isPublished) {
        await authPost(`/api/exams/${response.id}/publish/`, { 
          message: payload.notification_message 
        });
        setIsPublished(true);
      }

      showSuccess(`Exam ${isEdit ? 'updated' : 'created'} successfully!`);
      setTimeout(() => navigate('/admin/exam-list'), 1500);
    } catch (err) {
      showError(err.response?.data?.error || err.message || 'Save failed');
    }
  };

  const handleSubmit = (e, publish=false) => {
    e.preventDefault();
    
    if (exam.mode === 'practical') {
      if (exam.selected_practical_exams.length === 0) {
        return showError('Please select at least one practical exam');
      }
    } else {
      if (exam.selected_questions.length === 0) {
        return showError('Please select at least one question');
      }
    }
    
    if (publish) {
      showConfirmation(
        'Publish Exam?', 
        'This will notify students. Proceed?', 
        'Yes, publish it!', 
        () => performSubmit(publish)
      );
    } else {
      performSubmit(publish);
    }
  };

  if (loading) {
    return <div className="exam-form-loading"><p>Loading data…</p></div>;
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
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
                <option value="practical">Practical</option>
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
          <textarea 
            name="notification_message" 
            value={exam.notification_message} 
            onChange={handleChange} 
            rows="3" 
            placeholder="Message to send to students" 
          />
        </div>

        {exam.mode === 'practical' ? (
          <div className="form-section">
            <div className="section-header">
              <h3>Select Practical Exams</h3>
              <div className="selection-count">
                {exam.selected_practical_exams.length} selected
              </div>
            </div>
            <div className="filters">
              <div className="form-group">
                <label>Search Exams</label>
                <input 
                  type="text" 
                  name="search" 
                  value={practicalFilter.search} 
                  onChange={handlePracticalFilterChange} 
                  placeholder="Search exams..." 
                />
              </div>
            </div>
            <div className="question-lists-container">
              <div className="question-list available-questions">
                <h4>Available Exams ({filteredPracticalExams.length})</h4>
                <div className="questions-container">
                  {filteredPracticalExams.map(practical => (
                    <div 
                      key={practical.id}
                      className={`question-item ${exam.selected_practical_exams.includes(practical.id) ? 'selected' : ''}`}
                      onClick={() => handlePracticalSelect(practical.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={exam.selected_practical_exams.includes(practical.id)} 
                        onChange={() => handlePracticalSelect(practical.id)} 
                      />
                      <div className="question-content">
                        <div className="question-text">{practical.title}</div>
                        <div className="question-meta">
                          <div>Duration: {practical.duration} mins</div>
                          <div>Tasks: {practicalTaskCounts[practical.id] || 0}</div>
                          <div>Docker: {practical.docker_image}</div>
                          <div className="task-description">
                            {practical.description && 
                              (practical.description.length > 100 ? 
                                `${practical.description.substring(0, 100)}...` : 
                                practical.description
                              )
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="question-list selected-questions">
                <h4>Selected Exams</h4>
                <div className="questions-container">
                  {selectedPracticalDetails.length > 0 ? (
                    selectedPracticalDetails.map((p, idx) => (
                      <div key={p.id} className="question-item selected">
                        <div className="question-header">
                          <div className="question-order">#{idx + 1}</div>
                          <div className="question-actions">
                            <button 
                              type="button" 
                              onClick={() => handleMoveItem('selected_practical_exams', idx, 'up')} 
                              disabled={idx === 0}
                            >
                              <FaArrowUp />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleMoveItem('selected_practical_exams', idx, 'down')} 
                              disabled={idx === selectedPracticalDetails.length - 1}
                            >
                              <FaArrowDown />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handlePracticalSelect(p.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        <div className="question-text">{p.title}</div>
                        <div className="question-meta">
                          <div>Duration: {p.duration} mins</div>
                          <div>Tasks: {practicalTaskCounts[p.id] || 0}</div>
                          <div>Docker: {p.docker_image}</div>
                          <div className="task-description">
                            {p.description && 
                              (p.description.length > 100 ? 
                                `${p.description.substring(0, 100)}...` : 
                                p.description
                              )
                            }
                          </div>
                        </div>
                      </div>
                    ))
                  ) : <p>No exams selected</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
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
                  placeholder="Search questions..." 
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
                            selected_questions: [
                              ...new Set([...prev.selected_questions, ...top100])
                            ] 
                          }));
                        }
                      }} 
                    />
                    Select Top 100 Questions
                  </label>
                </div>
                <div className="questions-container">
                  {filteredQuestions.map(question => (
                    <div 
                      key={question.id}
                      className={`question-item ${exam.selected_questions.includes(question.id) ? 'selected' : ''}`}
                      onClick={() => handleQuestionSelect(question.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={exam.selected_questions.includes(question.id)} 
                        onChange={() => handleQuestionSelect(question.id)} 
                      />
                      <div className="question-content">
                        <div className="question-text">{question.text}</div>
                        <div className="question-meta">
                          <span>Subject: {question.subject_name?.name || 'N/A'}</span>
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
                    selectedQuestionDetails.map((q, idx) => (
                      <div key={q.id} className="question-item selected">
                        <div className="question-header">
                          <div className="question-order">#{idx + 1}</div>
                          <div className="question-actions">
                            <button 
                              type="button" 
                              onClick={() => handleMoveItem('selected_questions', idx, 'up')} 
                              disabled={idx === 0}
                            >
                              <FaArrowUp />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleMoveItem('selected_questions', idx, 'down')} 
                              disabled={idx === selectedQuestionDetails.length - 1}
                            >
                              <FaArrowDown />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleQuestionSelect(q.id)}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        <div className="question-text">{q.text}</div>
                        <div className="question-meta">
                          <span>Subject: {q.subject?.name || 'N/A'}</span>
                          <span>Marks: {q.marks}</span>
                        </div>
                      </div>
                    ))
                  ) : <p>No questions selected</p>}
                </div>
              </div>
            </div>
          </div>
        )}

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