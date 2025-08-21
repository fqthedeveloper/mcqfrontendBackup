// src/components/Exam/QuestionCard.jsx
import React from "react";
import "../CSS/Exam.css";



export default function QuestionCard({ question, index = 0, selectedAnswers = [], onChange }) {
  if (!question) return null;
  const isMulti = !!question.is_multi;

  // Normalize options into [{ id, label, text }]
  let optionList = [];
  if (Array.isArray(question.options) && question.options.length > 0) {
    optionList = question.options.map((opt, i) => {
      const label = opt.label || String.fromCharCode(65 + i);
      const text = opt.text ?? opt.value ?? opt.description ?? opt;
      const id = opt.id ?? label;
      return { id: String(id), label, text };
    });
  } else {
    const letters = ["a", "b", "c", "d", "e", "f"];
    for (let i = 0; i < letters.length; i++) {
      const key = `option_${letters[i]}`;
      if (question[key]) {
        const label = String.fromCharCode(65 + i);
        optionList.push({ id: label, label, text: question[key] });
      }
    }
  }

  const checked = (val) => {
    if (isMulti) {
      if (!Array.isArray(selectedAnswers)) return false;
      return selectedAnswers.includes(val) || selectedAnswers.includes(String(val));
    }
    return selectedAnswers === val || selectedAnswers === String(val);
  };

  return (
    <div className="question-card">
      <div className="question-text">
        <strong>
          {index + 1}. {question.text || question.question_text || question.title}
          {question.marks ? ` (${question.marks} Mark${question.marks > 1 ? "s" : ""})` : ""}
        </strong>
      </div>

      <div className="options-list">
        {optionList.length > 0 ? optionList.map((opt) => {
          const val = String(opt.id);
          return (
            <div className="option-item" key={val}>
              <input
                type={isMulti ? "checkbox" : "radio"}
                name={`q_${question.id}`}
                value={val}
                id={`q_${question.id}_${val}`}
                checked={checked(val)}
                onChange={() => onChange(String(question.id), val, isMulti)}
              />
              <label htmlFor={`q_${question.id}_${val}`} className="option-label">{opt.label}. {opt.text}</label>
            </div>
          );
        }) : (
          <div className="no-options">No options available for this question.</div>
        )}
      </div>
    </div>
  );
}
