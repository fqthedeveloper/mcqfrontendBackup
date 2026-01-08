import api from "./api";

export const mcqService = {
  /* ================= SUBJECTS ================= */
  getSubjects: () => api.get("/mcq/subjects/"),
  createSubject: (data) => api.post("/mcq/subjects/", data),
  updateSubject: (id, data) => api.put(`/mcq/subjects/${id}/`, data),
  deleteSubject: (id) => api.delete(`/mcq/subjects/${id}/`),

  /* ================= QUESTIONS ================= */
  getQuestions: (params = "") =>
    api.get(`/mcq/questions/${params}`),

  createQuestion: (data) =>
    api.post("/mcq/questions/", data),

  updateQuestion: (id, data) =>
    api.put(`/mcq/questions/${id}/`, data),

  deleteQuestion: (id) =>
    api.delete(`/mcq/questions/${id}/`),

  bulkUpload: (formData) =>
    api.upload("/mcq/questions/upload-excel/", formData),

  /* ================= EXAMS ================= */
  getExams: () => api.get("/mcq/exams/"),
  getExam: (id) => api.get(`/mcq/exams/${id}/`),
  createExam: (data) => api.post("/mcq/exams/", data),
  updateExam: (id, data) =>
    api.put(`/mcq/exams/${id}/`, data),
  deleteExam: (id) =>
    api.delete(`/mcq/exams/${id}/`),

  publishExam: (id) =>
    api.post(`/mcq/exams/${id}/publish/`),

  unpublishExam: (id) =>
    api.post(`/mcq/exams/${id}/unpublish/`),

  /* ================= SESSIONS ================= */
  createSession: (examId) =>
    api.post("/mcq/sessions/", { exam_id: examId }),

  getSession: (sessionId) =>
    api.get(`/mcq/sessions/${sessionId}/`),

  submitExam: (sessionId, answers) =>
    api.post(`/mcq/sessions/${sessionId}/submit/`, { answers }),

  /* ================= RESULTS ================= */
  getResults: () => api.get("/mcq/results/"),

  getResultBySession: (sessionId) =>
    api.get(`/mcq/results/session/${sessionId}/`),

  /* ================= DASHBOARD ================= */
  getAdminDashboard: () =>
    api.get("/mcq/admin-dashboard/"),

  getStudentDashboard: () =>
    api.get("/mcq/student-dashboard/"),
};

export default mcqService;
