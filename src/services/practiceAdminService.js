import api from "./api";

export const practiceAdminService = {
  mapQuestions: (subjectId, difficulty, questionIds) =>
    api.post("/mcq/practice/admin/map/", {
      subject_id: subjectId,
      difficulty,
      question_ids: questionIds,
    }),
  
  getStats: (subjectId) =>
    api.get(`/mcq/practice/admin/stats/?subject_id=${subjectId}`),
};

export default practiceAdminService;
