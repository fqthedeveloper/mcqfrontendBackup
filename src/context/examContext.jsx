import React, { createContext, useState, useContext, useEffect } from 'react';
import { authGet } from '../services/api';

const ExamContext = createContext();

export function useExam() {
  return useContext(ExamContext);
}

export function ExamProvider({ children }) {
  const [exams, setExams] = useState([]);
  const [currentExam, setCurrentExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [examContextReady, setExamContextReady] = useState(false);

  useEffect(() => {
    const savedExam = localStorage.getItem('currentExam');
    if (savedExam) {
      try {
        const parsedExam = JSON.parse(savedExam);
        setCurrentExam(parsedExam);
      } catch (e) {
        console.error('Failed to parse saved exam:', e);
        localStorage.removeItem('currentExam');
      }
    }
    setExamContextReady(true);
  }, []);

  useEffect(() => {
    if (currentExam) {
      localStorage.setItem('currentExam', JSON.stringify(currentExam));
    } else {
      localStorage.removeItem('currentExam');
    }
  }, [currentExam]);

  const fetchExams = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await authGet('/api/exams/');
      setExams(response);
      return response;
    } catch (error) {
      setError('Failed to load exams. Please try again later.');
      console.error('Failed to fetch exams:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const startExam = (exam) => {
    setCurrentExam(exam);
  };

  const submitExam = (answers) => {
    if (currentExam) {
      setResults([...results, { examId: currentExam.id, answers }]);
    }
    setCurrentExam(null);
  };

  const value = {
    exams,
    currentExam,
    results,
    loading,
    error,
    fetchExams,
    startExam,
    submitExam,
    setCurrentExam,
    examContextReady
  };

  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}