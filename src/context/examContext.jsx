import React, { createContext, useState, useContext } from 'react';
import { authGet, authPost } from '../services/api';

const ExamContext = createContext();

export const ExamProvider = ({ children }) => {
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const examsResponse = await authGet('/api/exams/');
      setExams(examsResponse);
      
      try {
        const sessionsResponse = await authGet('/api/sessions/');
        setSessions(sessionsResponse);
      } catch (sessionsError) {
        console.warn('Could not fetch sessions:', sessionsError);
      }
    } catch (err) {
      setError(err.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (exam) => {
    try {
      // Fixed endpoint with exam ID in URL
      const response = await authPost(`/api/sessions/validate-exam/${exam.id}/`, {});
      return response;
    } catch (err) {
      // Enhanced error handling
      let errorMsg = 'Failed to start exam';
      if (err.response) {
        if (err.response.data && err.response.data.error) {
          errorMsg = err.response.data.error;
        } else {
          errorMsg = `Server error: ${err.response.status}`;
        }
      }
      throw new Error(errorMsg);
    }
  };

  return (
    <ExamContext.Provider value={{
      exams,
      sessions,
      loading,
      error,
      fetchExams,
      startExam
    }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => useContext(ExamContext);