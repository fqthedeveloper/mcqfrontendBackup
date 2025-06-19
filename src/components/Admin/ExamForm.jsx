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
    selected_tasks: [],
    notification_message: 'A new exam has been scheduled. Please check your dashboard for details.'
  });
  const [allQuestions, setAllQuestions] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ subject: '', search: '' });
  const [taskFilter, setTaskFilter] = useState({ search: '' });
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    document.title = isEdit ? 'Edit Exam' : 'Add Exam';
  }, [isEdit]);

  const showSuccess = msg => Swal.fire({ icon: 'success', title: 'Success!', text: msg, timer: 3000, showConfirmButton: false });
  const showError   = msg => Swal.fire({ icon: 'error', title: 'Error!', text: msg });
  
  const showConfirmation = (title, text, confirmText, callback) => {
    Swal.fire({ title, text, icon: 'warning', showCancelButton: true, confirmButtonColor: '#3085d6', cancelButtonColor: '#d33', confirmButtonText: confirmText })
      .then(result => {
        if (result.isConfirmed) callback();
      });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const questionsRes = await authGet('/api/questions/');
      const tasksRes = await authGet('/api/tasks/');
      const subjectsRes  = await authGet('/api/subjects/');
      
      const subjectsData = Array.isArray(subjectsRes) ? subjectsRes : subjectsRes.results;
      const questionsData = (Array.isArray(questionsRes) ? questionsRes : questionsRes.results)
        .map(q => typeof q.subject === 'object' ? q : ({ ...q, subject: subjectsData.find(s => s.id === q.subject) || null }));
      
      const tasksData = Array.isArray(tasksRes) ? tasksRes : tasksRes.results;

      setAllQuestions(questionsData);
      setAllTasks(tasksData);
      setSubjects(subjectsData);

      if (isEdit && id) {
        const examRes = await authGet(`/api/exams/${id}/`);
        const ed = examRes;
        setIsPublished(ed.is_published);
        
        // FIX: Correctly extract task IDs from practical_tasks array
        const taskIds = ed.practical_tasks ? 
          ed.practical_tasks.map(t => t.id) :  // Changed from t.task.id to t.id
          [];
        
        setExam({
          title: ed.title || '',
          subject: ed.subject || '',
          mode: ed.mode || 'practice',
          duration: ed.duration || 60,
          start_time: ed.start_time ? ed.start_time.slice(0, 16) : '',
          end_time: ed.end_time ? ed.end_time.slice(0, 16) : '',
          selected_questions: ed.questions ? ed.questions.map(q => q.question?.id) : [],
          selected_tasks: taskIds,
          notification_message: ed.notification_message || 'A new exam has been scheduled. Please check your dashboard for details.'
        });
      }
    } catch (err) {
      showError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id, isEdit]);

  const handleChange = e => {
    const { name, value } = e.target;
    setExam(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilter(prev => ({ ...prev, [name]: value }));
  };

  const handleTaskFilterChange = e => {
    const { name, value } = e.target;
    setTaskFilter(prev => ({ ...prev, [name]: value }));
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

  const handleTaskSelect = taskId => {
    setExam(prev => {
      const list = [...prev.selected_tasks];
      const idx = list.indexOf(taskId);
      if (idx > -1) list.splice(idx, 1);
      else list.push(taskId);
      return { ...prev, selected_tasks: list };
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
    const bySubject = filter.subject ? q.subject?.id.toString() === filter.subject : true;
    const bySearch  = filter.search ? q.text?.toLowerCase().includes(filter.search.toLowerCase()) : true;
    return bySubject && bySearch;
  });

  const filteredTasks = allTasks.filter(task => {
    return taskFilter.search ? 
      task.title.toLowerCase().includes(taskFilter.search.toLowerCase()) || 
      task.description.toLowerCase().includes(taskFilter.search.toLowerCase()) : true;
  });

  const selectedQuestionDetails = exam.selected_questions.map(qid => 
    allQuestions.find(q => q.id === qid)).filter(Boolean);
  
  const selectedTaskDetails = exam.selected_tasks.map(tid => 
    allTasks.find(t => t.id === tid)).filter(Boolean);

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
        selected_tasks: exam.selected_tasks,
        notification_message: exam.notification_message,
        is_published: publish || isPublished
      };

      let response;
      if (isEdit) response = await authPut(`/api/exams/${id}/`, payload);
      else response = await authPost(`/api/exams/`, payload);

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
      if (exam.selected_tasks.length === 0) {
        return showError('Please select at least one practical task');
      }
    } else {
      if (exam.selected_questions.length === 0) {
        return showError('Please select at least one question');
      }
    }
    
    if (publish) {
      showConfirmation('Publish Exam?', 'This will notify students. Proceed?', 'Yes, publish it!', () => performSubmit(publish));
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
              <input type="text" name="title" value={exam.title} onChange={handleChange} required placeholder="Enter exam title" />
            </div>
            <div className="form-group">
              <label>Subject*</label>
              <select name="subject" value={exam.subject} onChange={handleChange} required>
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Mode*</label>
              <select name="mode" value={exam.mode} onChange={handleChange} required>
                <option value="practice">Practice</option>
                <option value="strict">Strict</option>
                <option value="practical">Practical</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration (minutes)*</label>
              <input type="number" name="duration" value={exam.duration} onChange={handleChange} min="1" required />
            </div>
            <div className="form-group">
              <label>Start Time</label>
              <input type="datetime-local" name="start_time" value={exam.start_time} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="datetime-local" name="end_time" value={exam.end_time} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Notification Message</h3>
          <textarea name="notification_message" value={exam.notification_message} onChange={handleChange} rows="3" placeholder="Message to send to students" />
        </div>

        {exam.mode === 'practical' ? (
          <div className="form-section">
            <div className="section-header">
              <h3>Select Practical Tasks</h3>
              <div className="selection-count">{exam.selected_tasks.length} selected</div>
            </div>
            <div className="filters">
              <div className="form-group">
                <label>Search Tasks</label>
                <input 
                  type="text" 
                  name="search" 
                  value={taskFilter.search} 
                  onChange={handleTaskFilterChange} 
                  placeholder="Search tasks..." 
                />
              </div>
            </div>
            <div className="question-lists-container">
              <div className="question-list available-questions">
                <h4>Available Tasks ({filteredTasks.length})</h4>
                <div className="questions-container">
                  {filteredTasks.map(task => (
                    <div 
                      key={task.id}
                      className={`question-item ${exam.selected_tasks.includes(task.id) ? 'selected' : ''}`}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      <input 
                        type="checkbox" 
                        checked={exam.selected_tasks.includes(task.id)} 
                        onChange={() => handleTaskSelect(task.id)} 
                      />
                      <div className="question-content">
                        <div className="question-text">{task.title}</div>
                        <div className="question-meta">
                          <div>Marks: {task.marks}</div>
                          <div className="task-description">
                            {task.description.length > 100 ? 
                              `${task.description.substring(0, 100)}...` : task.description}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="question-list selected-questions">
                <h4>Selected Tasks</h4>
                <div className="questions-container">
                  {selectedTaskDetails.length > 0 ? selectedTaskDetails.map((t, idx) => (
                    <div key={t.id} className="question-item selected">
                      <div className="question-header">
                        <div className="question-order">#{idx + 1}</div>
                        <div className="question-actions">
                          <button 
                            type="button" 
                            onClick={() => handleMoveItem('selected_tasks', idx, 'up')} 
                            disabled={idx === 0}
                          >
                            <FaArrowUp />
                          </button>
                          <button 
                            type="button" 
                            onClick={() => handleMoveItem('selected_tasks', idx, 'down')} 
                            disabled={idx === selectedTaskDetails.length - 1}
                          >
                            <FaArrowDown />
                          </button>
                          <button type="button" onClick={() => handleTaskSelect(t.id)}>
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <div className="question-text">{t.title}</div>
                      <div className="question-meta">
                        <div>Marks: {t.marks}</div>
                        <div className="task-description">
                          {t.description.length > 100 ? 
                            `${t.description.substring(0, 100)}...` : t.description}
                        </div>
                      </div>
                    </div>
                  )) : <p>No tasks selected</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-section">
            <div className="section-header">
              <h3>Select Questions</h3>
              <div className="selection-count">{exam.selected_questions.length} selected</div>
            </div>
            <div className="filters">
              <div className="form-group">
                <label>Filter by Subject</label>
                <select name="subject" value={filter.subject} onChange={handleFilterChange}>
                  <option value="">All Subjects</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                          const top100 = filteredQuestions.slice(0, 100).map(q => q.id);
                          setExam(prev => ({ 
                            ...prev, 
                            selected_questions: Array.from(new Set([...prev.selected_questions, ...top100])) 
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
                          <span>Subject: {question.subject?.name || 'N/A'}</span>
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
                  {selectedQuestionDetails.length > 0 ? selectedQuestionDetails.map((q, idx) => (
                    <div key={q.id} className="question-item selected">
                      <div className="question-header">
                        <div className="question-order">#{idx + 1}</div>
                        <div className="question-actions">
                          <button type="button" onClick={() => handleMoveItem('selected_questions', idx, 'up')} disabled={idx === 0}>
                            <FaArrowUp />
                          </button>
                          <button type="button" onClick={() => handleMoveItem('selected_questions', idx, 'down')} disabled={idx === selectedQuestionDetails.length - 1}>
                            <FaArrowDown />
                          </button>
                          <button type="button" onClick={() => handleQuestionSelect(q.id)}>
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
                  )) : <p>No questions selected</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="form-buttons">
          <button type="submit" className="btn btn-primary">Save Exam</button>
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