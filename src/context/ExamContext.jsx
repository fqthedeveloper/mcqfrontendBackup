import React, { createContext, useState, useContext, useCallback } from 'react';
import { mcqService } from '../services/mcqService';

const ExamContext = createContext();

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

export const ExamProvider = ({ children }) => {
  const [currentExam, setCurrentExam] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [timer, setTimer] = useState(null);

  // Start timer for exam
  const startTimer = useCallback((duration) => {
    if (timer) {
      clearInterval(timer);
    }
    
    setTimeLeft(duration * 60); // Convert minutes to seconds
    
    const newTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(newTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setTimer(newTimer);
    
    return () => {
      clearInterval(newTimer);
    };
  }, [timer]);

  // Stop timer
  const stopTimer = useCallback(() => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  }, [timer]);

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Save answer
  const saveAnswer = useCallback((questionId, selectedAnswers) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedAnswers,
    }));
  }, []);

  // Clear answers
  const clearAnswers = useCallback(() => {
    setAnswers({});
  }, []);

  // Start exam session
  const startExamSession = async (examId) => {
    try {
      const session = await mcqService.validateSession(examId);
      setCurrentSession(session);
      setCurrentExam(session.exam);
      
      // Load saved answers if any
      if (session.answers) {
        const savedAnswers = {};
        session.answers.forEach(answer => {
          savedAnswers[answer.question] = answer.selected_answers;
        });
        setAnswers(savedAnswers);
      }
      
      return session;
    } catch (error) {
      throw error;
    }
  };

  // Submit exam
  const submitExam = async (sessionId) => {
    try {
      const answersArray = Object.entries(answers).map(([questionId, selectedAnswers]) => ({
        question: parseInt(questionId),
        selected_answers: Array.isArray(selectedAnswers) ? selectedAnswers.join(',') : selectedAnswers,
      }));
      
      const data = {
        answers: answersArray,
        elapsed_time: currentExam.duration * 60 - timeLeft,
      };
      
      const result = await mcqService.submitExam(sessionId, data);
      
      // Clean up
      stopTimer();
      setCurrentExam(null);
      setCurrentSession(null);
      clearAnswers();
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Save progress
  const saveProgress = async (sessionId) => {
    try {
      const answersArray = Object.entries(answers).map(([questionId, selectedAnswers]) => ({
        question: parseInt(questionId),
        selected_answers: Array.isArray(selectedAnswers) ? selectedAnswers.join(',') : selectedAnswers,
      }));
      
      const data = {
        answers: answersArray,
        elapsed_time: currentExam.duration * 60 - timeLeft,
      };
      
      await mcqService.saveProgress(sessionId, data);
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const value = {
    currentExam,
    currentSession,
    answers,
    timeLeft,
    formatTime,
    startTimer,
    stopTimer,
    saveAnswer,
    clearAnswers,
    startExamSession,
    submitExam,
    saveProgress,
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};
