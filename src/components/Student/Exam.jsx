import React, {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authGet, authPost } from '../../services/api';
import { useAuth } from '../../context/authContext';
import { useExam } from '../../context/examContext';
import QuestionCard from './QuestionCard';
import useVisibilityChange from '../../hooks/useVisibilityChange';
import useBeforeUnload from '../../hooks/useBeforeUnload';
import '../CSS/Exam.css';

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function Exam() {
  const { examId } = useParams();
  const { user } = useAuth();
  const { submitExam } = useExam();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [alreadyCompletedError, setAlreadyCompletedError] = useState('');
  const [examStarted, setExamStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [warningCount, setWarningCount] = useState(0);
  const [showStartScreen, setShowStartScreen] = useState(true);

  const sessionRef = useRef(session);
  const answersRef = useRef(answers);
  const elapsedRef = useRef(elapsedTime);
  const currentIndexRef = useRef(currentIndex);
  const submittedRef = useRef(false);

  useEffect(() => {
    sessionRef.current = session;
    answersRef.current = answers;
    elapsedRef.current = elapsedTime;
    currentIndexRef.current = currentIndex;
  }, [session, answers, elapsedTime, currentIndex]);

  const totalTime = exam ? exam.duration * 60 : 0;

  const STORAGE_KEY_ANSWERS = `exam_${examId}_answers_${user?.id}`;
  const STORAGE_KEY_ELAPSED = `exam_${examId}_elapsed_${user?.id}`;
  const STORAGE_KEY_INDEX = `exam_${examId}_index_${user?.id}`;

  const hideSiteHeader = () => {
    const hdr = document.querySelector('header');
    if (hdr) {
      hdr.dataset.previousDisplay = hdr.style.display || '';
      hdr.style.display = 'none';
    }
  };
  
  const showSiteHeader = () => {
    const hdr = document.querySelector('header');
    if (hdr) {
      hdr.style.display = hdr.dataset.previousDisplay || '';
      delete hdr.dataset.previousDisplay;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadExamAndSession = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        setAlreadyCompletedError('');

        const examData = await authGet(`/api/exams/${examId}/`, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        setExam(examData);

        let sessionData;
        try {
          sessionData = await authGet(`/api/sessions/validate/${examId}/`, {
            signal: controller.signal,
          });
        } catch (validateErr) {
          if (
            validateErr.response &&
            validateErr.response.status === 400 &&
            validateErr.response.data?.error?.includes('Strict exam already completed')
          ) {
            if (!isMounted) return;
            setAlreadyCompletedError(validateErr.response.data.error);
            setLoading(false);
            hideSiteHeader();
            return;
          }
          throw validateErr;
        }

        if (!isMounted) return;
        setSession(sessionData);
        sessionRef.current = sessionData;

        let questionObjects = Array.isArray(examData.questions)
          ? examData.questions.map((eq) => eq.question)
          : [];

        questionObjects = shuffleArray(questionObjects);

        questionObjects = questionObjects.map((q) => {
          if (Array.isArray(q.options)) {
            return {
              ...q,
              options: shuffleArray(q.options),
            };
          }
          return q;
        });

        setQuestions(questionObjects);

        const initialAnswers = {};
        let savedElapsed = 0;

        if (sessionData && Array.isArray(sessionData.answers)) {
          sessionData.answers.forEach((ans) => {
            const qObj = questionObjects.find((qq) => qq.id === ans.question);
            if (!qObj) return;
            initialAnswers[ans.question] = qObj.is_multi
              ? ans.selected_answers.split(',').filter((v) => v)
              : ans.selected_answers;
          });
          savedElapsed = sessionData.elapsed_time || 0;
        } else {
          questionObjects.forEach((q) => {
            initialAnswers[q.id] = q.is_multi ? [] : '';
          });
        }

        const storedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
        if (storedAnswers) {
          try {
            const parsed = JSON.parse(storedAnswers);
            if (parsed && typeof parsed === 'object') {
              Object.keys(parsed).forEach((qid) => {
                if (qid in initialAnswers) {
                  initialAnswers[qid] = parsed[qid];
                }
              });
            }
          } catch {}
        }

        setAnswers(initialAnswers);
        answersRef.current = initialAnswers;

        let initialElapsed = savedElapsed;
        const storedElapsed = localStorage.getItem(STORAGE_KEY_ELAPSED);
        if (storedElapsed !== null) {
          const parsedNum = parseInt(storedElapsed, 10);
          if (!isNaN(parsedNum)) initialElapsed = parsedNum;
        }
        setElapsedTime(initialElapsed);
        elapsedRef.current = initialElapsed;
        setRemainingTime(totalTime - initialElapsed);

        let idx = 0;
        const storedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
        if (storedIndex !== null) {
          const parsedIdx = parseInt(storedIndex, 10);
          if (!isNaN(parsedIdx) && parsedIdx >= 0 && parsedIdx < questionObjects.length) {
            idx = parsedIdx;
          }
        }
        setCurrentIndex(idx);
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setErrorMsg(err.response?.data?.error || err.message || 'Failed to load exam');
        }
      } finally {
        if (isMounted && !alreadyCompletedError) {
          setLoading(false);
        }
      }
    };

    if (examId && user?.id) {
      loadExamAndSession();
    }

    return () => {
      isMounted = false;
      controller.abort();
      saveExamProgress();
      showSiteHeader();
    };
  }, [examId, user]);

  useEffect(() => {
    if (errorMsg) {
      Swal.fire({
        icon: 'error',
        title: 'Exam Loading Error',
        text: errorMsg,
        confirmButtonText: 'Go Back',
        allowOutsideClick: false,
      }).then(() => {
        navigate('/dashboard');
      });
    }
  }, [errorMsg, navigate]);

  useEffect(() => {
    if (alreadyCompletedError) {
      Swal.fire({
        icon: 'info',
        title: 'Exam Completed',
        text: alreadyCompletedError,
        confirmButtonText: 'Go Back',
        allowOutsideClick: false,
      }).then(() => {
        showSiteHeader();
        navigate('/dashboard');
      });
    }
  }, [alreadyCompletedError, navigate]);

  const saveExamProgress = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession || !examStarted) return;

    try {
      const payloadAnswers = Object.entries(answersRef.current).map(
        ([qId, sel]) => ({
          question: qId,
          selected_answers: Array.isArray(sel) ? sel.join(',') : sel,
        })
      );
      const payloadElapsed = elapsedRef.current;

      await authPost(`/api/sessions/${currentSession.id}/save_progress/`, {
        elapsed_time: payloadElapsed,
        answers: payloadAnswers,
      });

      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answersRef.current));
      localStorage.setItem(STORAGE_KEY_ELAPSED, payloadElapsed.toString());
      localStorage.setItem(STORAGE_KEY_INDEX, currentIndexRef.current.toString());
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  }, [examStarted]);

  useEffect(() => {
    if (!examStarted) return;
    const iv = setInterval(saveExamProgress, 30000);
    return () => clearInterval(iv);
  }, [saveExamProgress, examStarted]);

  useVisibilityChange(
    () => setIsActive(true),
    () => {
      setIsActive(false);
      if (exam && exam.mode === 'strict' && examStarted) {
        setWarningCount((wc) => {
          const nw = wc + 1;
          if (nw < 3) {
            Swal.fire({
              icon: 'warning',
              title: `Warning ${nw}/3`,
              text: 'You switched tabs during a strict exam. Do not switch again.',
              timer: 2500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Exam Terminated',
              text: 'You have switched tabs 3 times. Your exam has been submitted.',
              confirmButtonText: 'OK',
            }).then(() => {
              finalSubmit('Terminated due to multiple tab switches');
            });
          }
          return nw;
        });
      }
      saveExamProgress();
    }
  );

  useBeforeUnload(() => {
    saveExamProgress();
  });

  // Auto-submit when time runs out
  const finalSubmit = useCallback(
    async (terminationReason = null) => {
      if (!sessionRef.current) return;
      try {
        const finalAnswers = Object.entries(answersRef.current).map(
          ([qId, sel]) => ({
            question: qId,
            selected_answers: Array.isArray(sel) ? sel.join(',') : sel,
          })
        );
        const finalElapsed = elapsedRef.current;

        await authPost(`/api/sessions/${sessionRef.current.id}/submit_exam/`, {
          answers: finalAnswers,
          elapsed_time: finalElapsed,
          termination_reason: terminationReason,
        });

        showSiteHeader();
        localStorage.removeItem(STORAGE_KEY_ANSWERS);
        localStorage.removeItem(STORAGE_KEY_ELAPSED);
        localStorage.removeItem(STORAGE_KEY_INDEX);

        submitExam(answersRef.current);
        navigate(`/student/results/${sessionRef.current.id}`);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Submission Error',
          text: err.response?.data?.error || err.message || 'Failed to submit exam',
        });
      }
    },
    [navigate, submitExam]
  );

  useEffect(() => {
    if (!examStarted || submittedRef.current) return;

    let interval = null;
    if (isActive && remainingTime > 0) {
      interval = setInterval(() => {
        setElapsedTime((prev) => {
          const nxt = prev + 1;
          elapsedRef.current = nxt;
          setRemainingTime(totalTime - nxt);
          return nxt;
        });
      }, 1000);
    } else if (remainingTime <= 0 && session) {
      // Auto-terminate when time runs out
      submittedRef.current = true;
      finalSubmit('Exam duration elapsed');
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, remainingTime, totalTime, session, examStarted, finalSubmit]);

  const handleAnswerChange = (questionId, optionId, isMulti) => {
    setAnswers((prev) => {
      let newAns;
      if (isMulti) {
        const already = prev[questionId] || [];
        newAns = already.includes(optionId)
          ? already.filter((o) => o !== optionId)
          : [...already, optionId];
      } else {
        newAns = optionId;
      }
      const updated = { ...prev, [questionId]: newAns };
      answersRef.current = updated;
      return updated;
    });
  };

  const confirmAndSubmit = () => {
    if (exam.mode !== 'strict') {
      finalSubmit();
      return;
    }
    Swal.fire({
      title: 'Submit Exam?',
      text: 'Are you sure you want to submit your answers?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit',
      cancelButtonText: 'No, go back',
    }).then((result) => {
      if (result.isConfirmed) {
        finalSubmit();
      }
    });
  };

  const goNext = () => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => {
      const nxt = Math.min(prev + 1, questions.length - 1);
      localStorage.setItem(STORAGE_KEY_INDEX, nxt.toString());
      return nxt;
    });
  };

  const goPrev = () => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => {
      const nxt = Math.max(prev - 1, 0);
      localStorage.setItem(STORAGE_KEY_INDEX, nxt.toString());
      return nxt;
    });
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startExam = () => {
    if (exam.mode === 'strict') {
      Swal.fire({
        title: 'Important Instructions',
        html: `
          <div style="text-align: left;">
            <p><strong>DO NOT navigate away during the exam!</strong></p>
            <ul>
              <li>Switching tabs counts as a warning</li>
              <li>3 warnings will terminate the exam</li>
              <li>Answers save automatically</li>
            </ul>
            <p style="color: #e74c3c; font-weight: bold;">Violations will terminate your exam!</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'I Understand – Start Exam',
        cancelButtonText: 'Cancel',
        reverseButtons: true,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          hideSiteHeader();
          setExamStarted(true);
          setShowStartScreen(false);
          setIsActive(true);
          authPost(`/api/sessions/${sessionRef.current.id}/start_exam/`);
          if (remainingTime === 0) {
            setRemainingTime(totalTime);
          }
        } else {
          navigate('/dashboard');
        }
      });
    } else {
      setExamStarted(true);
      setShowStartScreen(false);
      setIsActive(true);
      if (remainingTime === 0) {
        setRemainingTime(totalTime);
      }
    }
  };

  useEffect(() => {
    if (!examStarted || !exam || exam.mode !== 'strict') return;

    const handleAttemptedNavigation = () => {
      setWarningCount((prev) => {
        const newCount = prev + 1;
        if (newCount < 3) {
          Swal.fire({
            icon: 'warning',
            title: `Warning ${newCount}/3`,
            text: 'Navigation not allowed!',
            timer: 2500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Exam Terminated',
            text: 'Multiple navigation attempts detected',
            confirmButtonText: 'OK',
          }).then(() => {
            finalSubmit('Terminated due to multiple navigation attempts');
          });
        }
        return newCount;
      });
    };

    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handleAttemptedNavigation);

    const blockLinks = (e) => {
      if (e.target.closest('a')) {
        e.preventDefault();
        handleAttemptedNavigation();
      }
    };
    document.addEventListener('click', blockLinks);

    return () => {
      window.removeEventListener('popstate', handleAttemptedNavigation);
      document.removeEventListener('click', blockLinks);
    };
  }, [examStarted, exam, finalSubmit]);

  if (loading) {
    return (
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your exam...</p>
      </div>
    );
  }
  if (alreadyCompletedError) {
    return null;
  }
  if (showStartScreen) {
    return (
      <div className="start-screen">
        <div className="start-card">
          <h1>{exam.title}</h1>
          <div className="exam-meta">
            <p><strong>Duration:</strong> {exam.duration} minutes</p>
            <p><strong>Questions:</strong> {questions.length}</p>
            <p><strong>Mode:</strong> {exam.mode === 'strict' ? 'Strict' : 'Practice'}</p>
          </div>

          {exam.mode === 'strict' && (
            <div className="instructions">
              <h2>Exam Rules:</h2>
              <ul>
                <li>Do not navigate away during the exam</li>
                <li>3 warnings will terminate the exam</li>
                <li>Answers save automatically</li>
              </ul>
            </div>
          )}

          <button className="start-btn" onClick={startExam}>
            {exam.mode === 'strict' ? 'Start Strict Exam' : 'Start Practice Exam'}
          </button>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(currentIndex, questions.length - 1);
  const currentQuestion = questions[safeIndex];
  const selectedForThis = answers[currentQuestion.id] || (currentQuestion.is_multi ? [] : '');

  const answeredCount = Object.values(answers).filter((a) =>
    Array.isArray(a) ? a.length > 0 : a !== ''
  ).length;
  const progressPercentage = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="exam-container">
      {exam.mode === 'strict' && warningCount > 0 && (
        <div className="back-warning">
          ⚠️ You have {warningCount} warning{warningCount > 1 ? 's' : ''} / 3
        </div>
      )}

      <div className="exam-header">
        <div className="exam-info">
          <h1>{exam.title}</h1>
          <div className="exam-meta">
            <span>{questions.length} Questions</span>
            <span>•</span>
            <span>{exam.duration} min</span>
            <span>•</span>
            <span>{formatTime(remainingTime)}</span>
            <span>•</span>
            <span>{progressPercentage}% Complete</span>
            {exam.mode === 'strict' && (
              <>
                <span>•</span>
                <span className="warning-count">Warnings: {warningCount}/ 3</span>
              </>
            )}
          </div>
        </div>

        <div className="header-controls">
          <div className="timer-container">
            <span className="time-left">{formatTime(remainingTime)}</span>
            <div className="timer-progress">
              <div
                className="timer-progress-bar"
                style={{
                  width: `${(remainingTime / totalTime) * 100}%`,
                  backgroundColor: remainingTime <= 60 ? '#e74c3c' : '#2ecc71',
                }}
              />
            </div>
          </div>
          <button className="submit-btn" onClick={confirmAndSubmit}>
            Submit Exam
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <QuestionCard
        question={currentQuestion}
        index={safeIndex}
        selectedAnswers={selectedForThis}
        onChange={handleAnswerChange}
      />

      <div className="nav-buttons">
        <button onClick={goPrev} disabled={safeIndex === 0}>
          ← Previous
        </button>
        <button onClick={goNext} disabled={safeIndex === questions.length - 1}>
          Next →
        </button>
      </div>

      <div className="exam-footer">
        <button className="final-submit-btn" onClick={confirmAndSubmit}>
          Submit Final Answers
        </button>
        <p className="time-warning">
          Time remaining: <span className="simple-timer">{formatTime(remainingTime)}</span>
        </p>
      </div>
    </div>
  );
}