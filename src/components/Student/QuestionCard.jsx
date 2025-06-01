import React from 'react';
import '../CSS/Exam.css'; // We'll create this CSS file

export default function QuestionCard({ question, index, selectedAnswers, onChange }) {
  const options = [
    { id: 'A', text: question.option_a },
    { id: 'B', text: question.option_b },
    { id: 'C', text: question.option_c },
    { id: 'D', text: question.option_d },
  ];

  const isOptionSelected = (optionId) => {
    return question.is_multi 
      ? selectedAnswers.includes(optionId)
      : selectedAnswers === optionId;
  };

  return (
    <div className="question-card">
      <div className="question-header">
        <h3>Question {index + 1} <span>({question.marks} marks)</span></h3>
        {question.is_multi && <span className="multi-tag">Multiple Select</span>}
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      <div className="options-grid">
        {options.map(opt => (
          <div 
            key={opt.id}
            className={`option-card ${isOptionSelected(opt.id) ? 'selected' : ''}`}
            onClick={() => onChange(opt.id)}
          >
            <div className="option-selector">
              {question.is_multi ? (
                <div className={`custom-checkbox ${isOptionSelected(opt.id) ? 'checked' : ''}`}>
                  {isOptionSelected(opt.id) && (
                    <svg viewBox="0 0 24 24" className="checkmark">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
              ) : (
                <div className={`custom-radio ${isOptionSelected(opt.id) ? 'checked' : ''}`}>
                  {isOptionSelected(opt.id) && <div className="radio-dot"></div>}
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