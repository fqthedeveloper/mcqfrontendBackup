import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { authPost, authGet } from '../../services/api';
import { useAuth } from '../../context/authContext';
import { useExam } from '../../context/examContext';
import Timer from '../Shared/Timer';
import QuestionCard from './QuestionCard';

import '../CSS/Exam.css'; // Assuming you have a CSS file for styling

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

  useEffect(() => {
    async function loadExam() {
      try {
        const examData = location.state?.exam || await authGet(`/api/exams/${examId}/`);
        setExam(examData);

        const sessionResponse = await authPost('/api/sessions/', { exam: examId ,  student: user.id  });
        setSession(sessionResponse);

        const questionList = examData.questions.map(q => q.question);
        setQuestions(questionList);

        const initialAnswers = {};
        questionList.forEach(q => {
          initialAnswers[q.id] = q.is_multi ? [] : '';
        });
        setAnswers(initialAnswers);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    if (examId) loadExam();
  }, [examId, location.state]);

  function handleAnswerChange(questionId, option, isMulti) {
    setAnswers(prev => {
      if (isMulti) {
        const current = prev[questionId] || [];
        return {
          ...prev,
          [questionId]: current.includes(option)
            ? current.filter(o => o !== option)
            : [...current, option],
        };
      } else {
        return { ...prev, [questionId]: option };
      }
    });
  }

  async function handleSubmit() {
    try {
      const answersPayload = Object.entries(answers).map(([questionId, selected]) => ({
        question: questionId,
        selected_answers: Array.isArray(selected) ? selected.join(',') : selected,
      }));

      await authPost(`/api/sessions/${session.id}/submit_exam/`, { answers: answersPayload });

      submitExam(answers);
      navigate(`/results/${session.id}`);
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div>Loading exam...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!exam || !session) return <div>Exam not found</div>;

  return (
    <div className="exam-container">
      <h2>{exam.title}</h2>
      <div className="exam-header">
        <Timer duration={exam.duration} onTimeUp={handleSubmit} />
        <button onClick={handleSubmit} className="submit-btn">Submit Exam</button>
      </div>

      <div className="questions-list">
        {questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            question={q}
            index={idx}
            selectedAnswers={answers[q.id]}
            onChange={(option) => handleAnswerChange(q.id, option, q.is_multi)}
          />
        ))}
      </div>
    </div>
  );
}
