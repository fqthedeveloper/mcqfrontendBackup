// src/components/Exam/Exam.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { authGet, authPost } from '../../services/api';
import { useAuth } from '../../context/authContext';
import { useExam } from '../../context/examContext';
import QuestionCard from './QuestionCard';
import useVisibilityChange from '../../hooks/useVisibilityChange';
import useBeforeUnload from '../../hooks/useBeforeUnload';
import '../CSS/Exam.css';

export default function Exam() {
  const { examId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { submitExam } = useExam();
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Timer & progress
  const [elapsedTime, setElapsedTime] = useState(0); // seconds passed
  const [remainingTime, setRemainingTime] = useState(0); // totalSeconds - elapsedTime
  const [isActive, setIsActive] = useState(true);

  // Notification flags
  const [showResumeNotification, setShowResumeNotification] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // Current question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Refs so that saveExamProgress always sees latest state
  const sessionRef = useRef(session);
  const answersRef = useRef(answers);
  const elapsedRef = useRef(elapsedTime);

  useEffect(() => {
    sessionRef.current = session;
    answersRef.current = answers;
    elapsedRef.current = elapsedTime;
  }, [session, answers, elapsedTime]);

  // Total allowed time in seconds
  const totalTime = exam ? exam.duration * 60 : 0;

  // Keying localStorage per user+exam for fallback
  const STORAGE_KEY_ANSWERS = `exam_${examId}_answers_${user?.id}`;
  const STORAGE_KEY_ELAPSED = `exam_${examId}_elapsed_${user?.id}`;
  const STORAGE_KEY_INDEX = `exam_${examId}_index_${user?.id}`;

  // ──────────────────────────────────────────────────────────────────────
  // 1) Load exam + session on mount, restore saved answers/time/index
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadExamAndSession() {
      try {
        setLoading(true);
        setError(null);

        // 1a) Fetch full exam object (with nested questions)
        const examData = await authGet(`/api/exams/${examId}/`, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        setExam(examData);

        // 1b) Validate/Create session
        const sessionData = await authGet(`/api/sessions/validate/${examId}/`, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        setSession(sessionData);
        sessionRef.current = sessionData;

        // 1c) QUESTIONS: examData.questions is an array of objects like:
        //     [ { id: <examQuestionID>, question: { id, text, option_a, …, is_multi, marks } }, … ]
        //    We only need the inner question objects, so:
        const questionObjects = Array.isArray(examData.questions)
          ? examData.questions.map((eq) => eq.question)
          : [];
        setQuestions(questionObjects);

        // 1d) Restore answers & elapsedTime from sessionResponse if available
        const initialAnswers = {};
        let savedElapsed = 0;

        if (
          sessionData &&
          Array.isArray(sessionData.answers) &&
          questionObjects.length > 0
        ) {
          sessionData.answers.forEach((ans) => {
            const qObj = questionObjects.find((q) => q.id === ans.question);
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

        // 1e) Fallback to localStorage if server didn’t send saved answers
        const storedAnswers = localStorage.getItem(STORAGE_KEY_ANSWERS);
        if (storedAnswers) {
          const parsed = JSON.parse(storedAnswers);
          if (parsed && typeof parsed === 'object') {
            Object.keys(parsed).forEach((qid) => {
              if (qid in initialAnswers) {
                initialAnswers[qid] = parsed[qid];
              }
            });
          }
        }
        setAnswers(initialAnswers);
        answersRef.current = initialAnswers;

        // 1f) Restore elapsedTime from server OR localStorage fallback
        let initialElapsed = savedElapsed;
        const storedElapsed = localStorage.getItem(STORAGE_KEY_ELAPSED);
        if (storedElapsed !== null) {
          const parsedNum = parseInt(storedElapsed, 10);
          if (!isNaN(parsedNum)) {
            initialElapsed = parsedNum;
          }
        }
        setElapsedTime(initialElapsed);
        elapsedRef.current = initialElapsed;

        // 1g) Compute remainingTime now
        setRemainingTime(examData.duration * 60 - initialElapsed);

        // 1h) Restore current question index (fallback to 0)
        let idx = 0;
        const storedIndex = localStorage.getItem(STORAGE_KEY_INDEX);
        if (storedIndex !== null) {
          const parsedIdx = parseInt(storedIndex, 10);
          if (
            !isNaN(parsedIdx) &&
            parsedIdx >= 0 &&
            parsedIdx < questionObjects.length
          ) {
            idx = parsedIdx;
          }
        }
        setCurrentIndex(idx);
      } catch (err) {
        if (isMounted && err.name !== 'AbortError') {
          setError(err.message || 'Failed to load exam');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (examId && user?.id) {
      loadExamAndSession();
    }

    return () => {
      isMounted = false;
      controller.abort();
      saveExamProgress();
    };
  }, [examId, user]);

  // ──────────────────────────────────────────────────────────────────────
  // 2) Auto-save progress every 30 seconds (and on visibility change / unload)
  // ──────────────────────────────────────────────────────────────────────
  const saveExamProgress = useCallback(async () => {
    const currentSession = sessionRef.current;
    if (!currentSession) return;

    try {
      const payloadAnswers = Object.entries(answersRef.current).map(
        ([qId, sel]) => ({
          question: qId,
          selected_answers: Array.isArray(sel) ? sel.join(',') : sel,
        })
      );
      const payloadElapsed = elapsedRef.current;

      await authPost(
        `/api/sessions/${currentSession.id}/save_progress/`,
        {
          elapsed_time: payloadElapsed,
          answers: payloadAnswers,
        }
      );

      // Also mirror to localStorage
      localStorage.setItem(STORAGE_KEY_ANSWERS, JSON.stringify(answersRef.current));
      localStorage.setItem(STORAGE_KEY_ELAPSED, payloadElapsed.toString());
      localStorage.setItem(STORAGE_KEY_INDEX, currentIndex.toString());

      setLastSaved(new Date());
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  }, [currentIndex]);

  useEffect(() => {
    const iv = setInterval(() => {
      saveExamProgress();
    }, 30000);
    return () => clearInterval(iv);
  }, [saveExamProgress]);

  useVisibilityChange(
    () => {
      setIsActive(true);
      setShowResumeNotification(true);
      setTimeout(() => setShowResumeNotification(false), 3000);
    },
    () => {
      setIsActive(false);
      saveExamProgress();
    }
  );

  useBeforeUnload(() => {
    saveExamProgress();
  });

  // ──────────────────────────────────────────────────────────────────────
  // 3) Timer ticker (every second when active)
  // ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
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
      confirmAndSubmit();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, remainingTime, totalTime, session]);

  // ──────────────────────────────────────────────────────────────────────
  // 4) Answer changes (update state + ref)
  // ──────────────────────────────────────────────────────────────────────
  function handleAnswerChange(questionId, optionId, isMulti) {
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
  }

  // ──────────────────────────────────────────────────────────────────────
  // 5) Final submission (called after confirmation)
  // ──────────────────────────────────────────────────────────────────────
  const finalSubmit = useCallback(async () => {
    if (!sessionRef.current) return;

    try {
      const finalAnswers = Object.entries(answersRef.current).map(
        ([qId, sel]) => ({
          question: qId,
          selected_answers: Array.isArray(sel) ? sel.join(',') : sel,
        })
      );
      const finalElapsed = elapsedRef.current;

      await authPost(
        `/api/sessions/${sessionRef.current.id}/submit_exam/`,
        {
          answers: finalAnswers,
          elapsed_time: finalElapsed,
        }
      );

      // Clear localStorage keys
      localStorage.removeItem(STORAGE_KEY_ANSWERS);
      localStorage.removeItem(STORAGE_KEY_ELAPSED);
      localStorage.removeItem(STORAGE_KEY_INDEX);

      submitExam(answersRef.current);
      navigate(`/results/${sessionRef.current.id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit exam');
    }
  }, [submitExam, navigate]);

  // ──────────────────────────────────────────────────────────────────────
  // 6) SweetAlert2 confirmation + call finalSubmit
  // ──────────────────────────────────────────────────────────────────────
  const confirmAndSubmit = () => {
    Swal.fire({
      title: 'Submit Exam?',
      text: 'Are you sure you want to submit your answers now? You cannot change them after submission.',
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

  // ──────────────────────────────────────────────────────────────────────
  // 7) Pagination controls (Next / Prev)
  // ──────────────────────────────────────────────────────────────────────
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

  // ──────────────────────────────────────────────────────────────────────
  // 8) Formatting “mm:ss” from seconds
  // ──────────────────────────────────────────────────────────────────────
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ──────────────────────────────────────────────────────────────────────
  // RENDERING LOGIC
  // ──────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-error">
        <div className="error-icon">⚠️</div>
        <h3>Exam Loading Error</h3>
        <p>{error}</p>
        <button className="retry-btn" onClick={() => window.location.reload()}>
          Reload Exam
        </button>
      </div>
    );
  }

  if (!exam || !session) {
    return (
      <div className="exam-empty">
        <div className="empty-icon">❌</div>
        <h3>Exam Not Available</h3>
        <p>The requested exam could not be loaded.</p>
      </div>
    );
  }

  // If there are no questions at all, show a placeholder:
  if (questions.length === 0) {
    return (
      <div className="exam-empty">
        <div className="empty-icon">❓</div>
        <h3>No questions available for this exam.</h3>
      </div>
    );
  }

  // Safe guard: ensure currentIndex < questions.length
  const safeIndex = Math.min(currentIndex, questions.length - 1);
  const currentQuestion = questions[safeIndex];
  const selectedForThis = answers[currentQuestion.id] || (currentQuestion.is_multi ? [] : '');

  // How many answered so far?
  const answeredCount = Object.values(answers).filter((a) =>
    Array.isArray(a) ? a.length > 0 : a !== ''
  ).length;
  const progressPercentage = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="exam-container">
      {/* ===== Notifications ===== */}
      {showResumeNotification && (
        <div className="resume-message">
          <span>↩️</span> Exam resumed. Time is now running.
        </div>
      )}
      {showSaveNotification && (
        <div className="save-message">
          <span>💾</span> Progress saved at{' '}
          {lastSaved ? lastSaved.toLocaleTimeString() : ''}
        </div>
      )}

      {/* ===== Header ===== */}
      <div className="exam-header">
        <div className="exam-info">
          <h1>{exam.title}</h1>
          <div className="exam-meta">
            <span>{questions.length} Questions</span>
            <span>•</span>
            <span>{exam.duration} min</span>
            <span>•</span>
            <span>{progressPercentage}% Complete</span>
          </div>
        </div>

        <div className="header-controls">
          <div className="timer-container">
            <span className="time-left">{formatTime(remainingTime)}</span>
            <div className="timer-progress">
              <div
                className="timer-progress-bar"
                style={{ width: `${(remainingTime / totalTime) * 100}%` }}
              ></div>
            </div>
          </div>

          <button
            className="submit-btn"
            onClick={confirmAndSubmit}
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* ===== Progress Bar ===== */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* ===== Single Question Card ===== */}
      <QuestionCard
        question={currentQuestion}
        index={safeIndex}
        selectedAnswers={selectedForThis}
        onChange={handleAnswerChange}
      />

      {/* ===== Navigation Buttons ===== */}
      <div className="nav-buttons">
        <button onClick={goPrev} disabled={safeIndex === 0}>
          ← Previous
        </button>
        <button
          onClick={goNext}
          disabled={safeIndex === questions.length - 1}
        >
          Next →
        </button>
      </div>

      {/* ===== Footer Submit (redundant) ===== */}
      <div className="exam-footer">
        <button
          className="final-submit-btn"
          onClick={confirmAndSubmit}
        >
          Submit Final Answers
        </button>
        <p className="time-warning">
          Time remaining: <span className="simple-timer">{formatTime(remainingTime)}</span>
        </p>
      </div>
    </div>
  );
}
