// src/components/Exam.js

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
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

export default function Exam() {
  const { examId } = useParams();
  const { user } = useAuth();
  const { submitExam } = useExam();
  const navigate = useNavigate();

  // ─── State Variables ───────────────────────────────────────────────────────
  const [exam, setExam] = useState(null);
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  // errorMsg holds any generic error (network, unexpected, etc.)
  const [errorMsg, setErrorMsg] = useState(null);

  // Holds “Strict exam already completed. No retries allowed.”
  const [alreadyCompletedError, setAlreadyCompletedError] = useState('');

  const [examStarted, setExamStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // elapsedTime / remainingTime for countdown
  const [elapsedTime, setElapsedTime] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // For detecting tab visibility changes
  const [isActive, setIsActive] = useState(true);

  // Count of warnings (strict mode only)
  const [warningCount, setWarningCount] = useState(0);

  // Whether to show start screen (before user clicks “Start … Exam”)
  const [showStartScreen, setShowStartScreen] = useState(true);

  // ─── Refs to always read the latest data during callbacks ───────────────────
  const sessionRef = useRef(session);
  const answersRef = useRef(answers);
  const elapsedRef = useRef(elapsedTime);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => {
    sessionRef.current = session;
    answersRef.current = answers;
    elapsedRef.current = elapsedTime;
    currentIndexRef.current = currentIndex;
  }, [session, answers, elapsedTime, currentIndex]);

  // Total allowed time in seconds (both modes now use countdown)
  const totalTime = exam ? exam.duration * 60 : 0;

  // Keys for localStorage
  const STORAGE_KEY_ANSWERS = `exam_${examId}_answers_${user?.id}`;
  const STORAGE_KEY_ELAPSED = `exam_${examId}_elapsed_${user?.id}`;
  const STORAGE_KEY_INDEX = `exam_${examId}_index_${user?.id}`;

  // ─── Helpers to Hide/Show the Site Header (<header> element) ──────────────
  function hideSiteHeader() {
    const hdr = document.querySelector('header');
    if (hdr) {
      hdr.dataset.previousDisplay = hdr.style.display || '';
      hdr.style.display = 'none';
    }
  }

  function showSiteHeader() {
    const hdr = document.querySelector('header');
    if (hdr) {
      hdr.style.display = hdr.dataset.previousDisplay || '';
      delete hdr.dataset.previousDisplay;
    }
  }

  // ─── 1) Load Exam & Validate/Create Session ─────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function loadExamAndSession() {
      try {
        setLoading(true);
        setErrorMsg(null);
        setAlreadyCompletedError('');

        // 1.1 Fetch exam details
        const examData = await authGet(`/api/exams/${examId}/`, {
          signal: controller.signal,
        });
        if (!isMounted) return;
        setExam(examData);

        // 1.2 Validate or create session
        let sessionData = null;
        try {
          sessionData = await authGet(
            `/api/sessions/validate/${examId}/`,
            { signal: controller.signal }
          );
        } catch (validateErr) {
          // If backend returned 400 with { error: "Strict exam already completed. No retries allowed." }
          if (
            validateErr.response &&
            validateErr.response.status === 400 &&
            validateErr.response.data &&
            typeof validateErr.response.data.error === 'string' &&
            validateErr.response.data.error.includes('Strict exam already completed')
          ) {
            // Show that message via SweetAlert and hide header
            if (!isMounted) return;
            setAlreadyCompletedError(validateErr.response.data.error);
            setLoading(false);
            hideSiteHeader();
            return;
          }
          // Otherwise, re‐throw to be caught by outer catch
          throw validateErr;
        }

        if (!isMounted) return;
        setSession(sessionData);
        sessionRef.current = sessionData;

        // 1.3 Extract question objects
        const questionObjects = Array.isArray(examData.questions)
          ? examData.questions.map((eq) => eq.question)
          : [];
        setQuestions(questionObjects);

        // 1.4 Initialize answers + elapsed time
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
          // Fresh session, no saved answers
          questionObjects.forEach((q) => {
            initialAnswers[q.id] = q.is_multi ? [] : '';
          });
        }

        // 1.5 Override with localStorage if present
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

        // 1.6 Determine initial elapsed time (from session or localStorage)
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
        setRemainingTime(totalTime - initialElapsed);

        // 1.7 Determine initial question index
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
          // Show generic error via SweetAlert
          const message =
            err.response && err.response.data && err.response.data.error
              ? err.response.data.error
              : err.message || 'Failed to load exam';
          setErrorMsg(message);
        }
      } finally {
        if (isMounted && !alreadyCompletedError) {
          setLoading(false);
        }
      }
    }

    if (examId && user?.id) {
      loadExamAndSession();
    }

    return () => {
      isMounted = false;
      controller.abort();
      saveExamProgress();
      // Always restore header on unmount
      showSiteHeader();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, user]);

  // ─── Show SweetAlert for generic loading errors ───────────────────────────────
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

  // ─── Show SweetAlert if already completed strict exam ─────────────────────────
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

  // ─── 2) Save Exam Progress (auto‐save every 30s) ───────────────────────────────
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

      await authPost(
        `/api/sessions/${currentSession.id}/save_progress/`,
        {
          elapsed_time: payloadElapsed,
          answers: payloadAnswers,
        }
      );

      localStorage.setItem(
        STORAGE_KEY_ANSWERS,
        JSON.stringify(answersRef.current)
      );
      localStorage.setItem(STORAGE_KEY_ELAPSED, payloadElapsed.toString());
      localStorage.setItem(
        STORAGE_KEY_INDEX,
        currentIndexRef.current.toString()
      );
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  }, [examStarted]);

  useEffect(() => {
    if (!examStarted) return;
    const iv = setInterval(() => {
      saveExamProgress();
    }, 30000);
    return () => clearInterval(iv);
  }, [saveExamProgress, examStarted]);

  // ─── 3) Visibility Change (Tab Switch) ────────────────────────────────────────
  useVisibilityChange(
    () => {
      setIsActive(true);
    },
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
              text: 'You have switched tabs 3 times during a strict exam. Your exam has been submitted automatically.',
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

  // ─── 4) Before Unload (Browser Reload/Close) ─────────────────────────────────
  useBeforeUnload(() => {
    saveExamProgress();
  });

  // ─── 5) Timer Logic ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!examStarted) return;

    let interval = null;
    // Both modes now use countdown
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
  }, [isActive, remainingTime, totalTime, session, examStarted]);

  // ─── 6) Handle Answer Changes ─────────────────────────────────────────────────
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

  // ─── 7) Final Submission ──────────────────────────────────────────────────────
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

        await authPost(
          `/api/sessions/${sessionRef.current.id}/submit_exam/`,
          {
            answers: finalAnswers,
            elapsed_time: finalElapsed,
            termination_reason: terminationReason,
          }
        );

        // Restore header as soon as the exam is over
        showSiteHeader();

        localStorage.removeItem(STORAGE_KEY_ANSWERS);
        localStorage.removeItem(STORAGE_KEY_ELAPSED);
        localStorage.removeItem(STORAGE_KEY_INDEX);

        submitExam(answersRef.current);
        navigate(`/results/${sessionRef.current.id}`);
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Submission Error',
          text: err.response?.data?.error || err.message || 'Failed to submit exam',
        });
      }
    },
    [submitExam, navigate]
  );

  // ─── 8) Confirm & Submit (Strict‐mode only) ──────────────────────────────────
  const confirmAndSubmit = () => {
    if (exam.mode !== 'strict') {
      // Practice mode: immediately submit
      finalSubmit();
      return;
    }

    // Strict mode: show confirmation dialog
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

  // ─── 9) Next / Previous Navigation ────────────────────────────────────────────
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

  // ─── 10) Format Time (mm:ss) ──────────────────────────────────────────────────
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── 11) Start Exam Button ────────────────────────────────────────────────────
  const startExam = () => {
    if (exam.mode === 'strict') {
      // Show instruction modal
      Swal.fire({
        title: 'Important Instructions',
        html: `
          <div style="text-align: left;">
            <p><strong>DO NOT navigate away from this page during the exam!</strong></p>
            <ul>
              <li>Switching tabs, minimizing the browser, or closing the window will count as a warning</li>
              <li>Clicking browser navigation buttons will count as a warning</li>
              <li>You will receive <strong>3 warnings</strong> before your exam is automatically terminated</li>
              <li>Ensure you have a stable internet connection throughout</li>
              <li>All answers are saved automatically every 30 seconds</li>
            </ul>
            <p style="color: #e74c3c; font-weight: bold;">Violations will result in termination of your exam!</p>
          </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'I Understand – Start Exam',
        cancelButtonText: 'Cancel',
        customClass: {
          confirmButton: 'swal-confirm-btn',
          cancelButton: 'swal-cancel-btn',
        },
        reverseButtons: true,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) {
          // Hide header and start strict exam
          hideSiteHeader();
          setExamStarted(true);
          setShowStartScreen(false);
          setIsActive(true);
          // Notify backend that exam has started (optional, if you want to record start_time)
          authPost(`/api/sessions/${sessionRef.current.id}/start_exam/`);
          // Initialize remainingTime if not already set
          if (remainingTime === 0) {
            setRemainingTime(totalTime);
          }
        } else {
          navigate('/dashboard');
        }
      });
    } else {
      // Practice mode: start immediately (header stays visible)
      setExamStarted(true);
      setShowStartScreen(false);
      setIsActive(true);
      // In practice mode, also set countdown
      if (remainingTime === 0) {
        setRemainingTime(totalTime);
      }
    }
  };

  // ─── 12) Strict‐Mode Navigation Blocking (After Start) ────────────────────────
  useEffect(() => {
    if (!examStarted || !exam || exam.mode !== 'strict') return;

    const handleAttemptedNavigation = () => {
      setWarningCount((prev) => {
        const newCount = prev + 1;
        if (newCount < 3) {
          Swal.fire({
            icon: 'warning',
            title: `Warning ${newCount}/3`,
            text: 'Navigation is not allowed during the exam!',
            timer: 2500,
            showConfirmButton: false,
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Exam Terminated',
            text: 'You have attempted navigation 3 times. Your exam has been submitted.',
            confirmButtonText: 'OK',
          }).then(() => {
            finalSubmit('Terminated due to multiple navigation attempts');
          });
        }
        return newCount;
      });
    };

    // 12.1 Block back/forward
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', handleAttemptedNavigation);

    // 12.2 Block any <a> click
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

  // ─── RENDER: While Loading ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="exam-loading">
        <div className="loading-spinner"></div>
        <p>Preparing your exam...</p>
      </div>
    );
  }

  // ─── RENDER: If Already Completed Strict Exam ─────────────────────────────────
  if (alreadyCompletedError) {
    // (SweetAlert has already shown it, so render nothing here)
    return null;
  }

  // ─── RENDER: Start Screen (Before user clicks “Start … Exam”) ─────────────────
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
                <li>Do not navigate away from this page during the exam</li>
                <li>Switching tabs or minimizing will count as a warning</li>
                <li>Clicking browser back/forward buttons will count as a warning</li>
                <li>Clicking any header links will count as a warning</li>
                <li>You will get 3 warnings; on the 3rd, the exam terminates</li>
                <li>All answers are saved automatically</li>
                <li>The timer cannot be paused once started</li>
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

  // ─── RENDER: Main Exam Interface ──────────────────────────────────────────────
  const safeIndex = Math.min(currentIndex, questions.length - 1);
  const currentQuestion = questions[safeIndex];
  const selectedForThis =
    answers[currentQuestion.id] || (currentQuestion.is_multi ? [] : '');

  const answeredCount = Object.values(answers).filter((a) =>
    Array.isArray(a) ? a.length > 0 : a !== ''
  ).length;
  const progressPercentage = Math.round(
    (answeredCount / questions.length) * 100
  );

  return (
    <div className="exam-container">
      {/* 1) Strict‐mode warning banner (if any warnings so far) */}
      {exam.mode === 'strict' && warningCount > 0 && (
        <div className="back-warning">
          ⚠️ You have {warningCount} warning{warningCount > 1 ? 's' : ''} / 3
        </div>
      )}

      {/* 2) Header: Title, Meta, Timer, Submit Button */}
      <div className="exam-header">
        <div className="exam-info">
          <h1>{exam.title}</h1>
          <div className="exam-meta">
            <span>{questions.length} Questions</span>
            <span>•</span>
            <span>{exam.duration} min</span>
            <span>•</span>
            <span>
              {exam.mode === 'strict'
                ? `${formatTime(remainingTime)}`
                : `${formatTime(remainingTime)}`}
            </span>
            <span>•</span>
            <span>{progressPercentage}% Complete</span>
            {exam.mode === 'strict' && (
              <>
                <span>•</span>
                <span className="warning-count">
                  Warnings: {warningCount}/3
                </span>
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
              ></div>
            </div>
          </div>
          <button className="submit-btn" onClick={confirmAndSubmit}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* 3) Progress Bar */}
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* 4) Current Question */}
      <QuestionCard
        question={currentQuestion}
        index={safeIndex}
        selectedAnswers={selectedForThis}
        onChange={handleAnswerChange}
      />

      {/* 5) Navigation Buttons */}
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

      {/* 6) Footer: Final Submit + Time Warning */}
      <div className="exam-footer">
        <button className="final-submit-btn" onClick={confirmAndSubmit}>
          Submit Final Answers
        </button>
        <p className="time-warning">
          Time remaining:{' '}
          <span className="simple-timer">{formatTime(remainingTime)}</span>
        </p>
      </div>
    </div>
  );
}
