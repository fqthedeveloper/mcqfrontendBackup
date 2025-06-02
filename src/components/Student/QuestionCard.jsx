// src/components/QuestionCard.js
import React from 'react';
import '../CSS/Exam.css';

export default function QuestionCard({
  question,
  index,
  selectedAnswers,
  onChange,
}) {
  return (
    <div className="question-card">
      <div className="question-text">
        <strong>
          {index + 1}. {question.text} ({question.marks} Mark)
        </strong>
      </div>
      <div className="options-list">
        {['A', 'B', 'C', 'D'].map((option) => (
          <div className="option-item" key={option}>
            <input
              type={question.is_multi ? 'checkbox' : 'radio'}
              name={`q_${question.id}`}
              value={option}
              id={`q_${question.id}_${option}`}
              checked={
                question.is_multi 
                  ? selectedAnswers.includes(option) 
                  : selectedAnswers === option
              }
              onChange={() => onChange(question.id, option, question.is_multi)}
            />
            <label 
              htmlFor={`q_${question.id}_${option}`}
              className="option-label"
            >
              {option}. {question[`option_${option.toLowerCase()}`]}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}