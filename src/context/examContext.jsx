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
      // Fetch both types of exams
      const [strictExams, practicalExams] = await Promise.all([
        authGet('/api/exams/'),
        authGet('/api/practical-exams/')
      ]);
      
      // Add mode to each exam
      const strictWithMode = strictExams.map(exam => ({ ...exam, mode: 'strict' }));
      const practicalWithMode = practicalExams.map(exam => ({ ...exam, mode: 'practical' }));
      
      setExams([...strictWithMode, ...practicalWithMode]);
      
      // Fetch sessions
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
      let endpoint, payload;
      
      if (exam.mode === 'strict') {
        endpoint = '/api/sessions/';
        payload = { exam: exam.id };
      } else if (exam.mode === 'practical') {
        endpoint = '/api/practical-sessions/';
        payload = { exam: exam.id };
      } else {
        throw new Error('Invalid exam mode');
      }

      const response = await authPost(endpoint, payload);
      return response;
    } catch (err) {
      let errorMsg = 'Failed to start exam';
      let details = '';
      
      if (err.response) {
        if (err.response.data) {
          errorMsg = err.response.data.error || errorMsg;
          details = err.response.data.details || 
                    err.response.data.detail || 
                    JSON.stringify(err.response.data);
        } else {
          details = `Status: ${err.response.status} ${err.response.statusText}`;
        }
      } else if (err.message) {
        details = err.message;
      }
      
      throw new Error(`${errorMsg}: ${details}`);
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