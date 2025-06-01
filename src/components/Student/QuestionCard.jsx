// src/components/Student/QuestionCard.jsx

import React, { useState, useEffect } from 'react';
import '../CSS/Exam.css';

export default function QuestionCard({
  question,
  index,
  selectedAnswers = [],    // default to empty array/string
  onChange,
}) {
  // 1) Always call Hooks at top level (never inside an if)
  const [selected, setSelected] = useState(
    question
      ? Array.isArray(selectedAnswers)
        ? selectedAnswers
        : [selectedAnswers]
      : []
  );

  useEffect(() => {
    if (question) {
      setSelected(
        Array.isArray(selectedAnswers)
          ? selectedAnswers
          : [selectedAnswers]
      );
    }
  }, [question, selectedAnswers]);

  // 2) Early return if no question (but Hooks have already been called)
  if (!question) return null;

  // 3) Build an array of option objects for A/B/C/D
  const options = [
    { id: 'A', text: question.option_a },
    { id: 'B', text: question.option_b },
    { id: 'C', text: question.option_c },
    { id: 'D', text: question.option_d },
  ];

  // 4) Handler when a user clicks an option
  const handleOptionClick = (optId) => {
    let newSel;
    if (question.is_multi) {
      if (selected.includes(optId)) {
        newSel = selected.filter((o) => o !== optId);
      } else {
        newSel = [...selected, optId];
      }
    } else {
      newSel = [optId];
    }
    setSelected(newSel);
    onChange(question.id, optId, question.is_multi);
  };

  return (
    <div className="question-container">
      <div className="question-header">
        <div className="question-number">Q{index + 1}</div>
        <div className="question-meta">
          <span className="question-marks">{question.marks} marks</span>
          {question.is_multi && <span className="multi-tag">Multiple</span>}
        </div>
      </div>

      <div className="question-text">{question.text}</div>

      <div className="options-grid">
        {options.map((opt) => (
          <div
            key={opt.id}
            className={`option-card ${selected.includes(opt.id) ? 'selected' : ''}`}
            onClick={() => handleOptionClick(opt.id)}
          >
            <div className="option-selector">
              {question.is_multi ? (
                <div className={`custom-checkbox ${selected.includes(opt.id) ? 'checked' : ''}`}>
                  {selected.includes(opt.id) && <div className="checkmark" />}
                </div>
              ) : (
                <div className={`custom-radio ${selected.includes(opt.id) ? 'checked' : ''}`}>
                  {selected.includes(opt.id) && <div className="radio-dot" />}
                </div>
              )}
            </div>
            <div className="option-content">
              <span className="option-letter">{opt.id}</span>
              <span className="option-text">{opt.text}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
