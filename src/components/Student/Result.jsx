// src/components/Student/Result.js
import React, { useState, useEffect } from 'react';
import { useExam } from '../../context/examContext';
import { getResult } from '../../services/api';

export default function Result() {
  const { results } = useExam();
  const [examResult, setExamResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const latestResult = results[results.length - 1];

  useEffect(() => {
    const fetchResult = async () => {
      try {
        if (latestResult) {
          const resultData = await getResult(latestResult.examId);
          setExamResult(resultData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching result:', error);
        setLoading(false);
      }
    };

    fetchResult();
  }, [latestResult]);

  if (loading) {
    return <div>Loading results...</div>;
  }

  if (!latestResult || !examResult) {
    return <p>No results available</p>;
  }

  const correctAnswers = Object.values(examResult.answers).filter(
    (answer, index) => answer === examResult.questions[index].correctOption
  ).length;

  const totalQuestions = examResult.questions.length;
  const score = (correctAnswers / totalQuestions) * 100;

  return (
    <div className="result">
      <h1>Exam Result: {examResult.examTitle}</h1>
      
      <div className="score-card">
        <h2>Your Score: {score.toFixed(0)}%</h2>
        <p>Correct Answers: {correctAnswers}/{totalQuestions}</p>
      </div>
      
      <div className="details">
        <h3>Question-wise Results:</h3>
        <ul>
          {examResult.questions.map((question, index) => {
            const userAnswerIndex = examResult.answers[question.id];
            const isCorrect = userAnswerIndex === question.correctOption;
            
            return (
              <li key={index} className={isCorrect ? 'correct' : 'incorrect'}>
                <p>Q{index + 1}: {question.text}</p>
                <p>Your answer: {question.options[userAnswerIndex]}</p>
                {!isCorrect && (
                  <p>Correct answer: {question.options[question.correctOption]}</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}