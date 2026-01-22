// src/services/practiceService.js
import api from "./api";

export const practiceService = {
  startPractice: (subjectId, difficulty) =>
    api.post("/mcq/practice/start/", {
      subject_id: subjectId,
      difficulty,
    }),

  submitAnswer: (runId, practiceQuestionId, selectedAnswers) =>
    api.post("/mcq/practice/answer/", {
      run_id: runId,
      practice_question_id: practiceQuestionId,
      selected_answers: selectedAnswers,
    }),

  finishPractice: (runId) =>
    api.post("/mcq/practice/finish/", {
      run_id: runId,
    }),
};
export default practiceService;
