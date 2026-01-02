import { api } from "./api";

export const mcqService = {
  // Subjects
  getSubjects: () => api.get("/mcq/subjects/"),
  createSubject: (data) => api.post("/mcq/subjects/", data),
  updateSubject: (id, data) => api.put(`/mcq/subjects/${id}/`, data),
  deleteSubject: (id) => api.delete(`/mcq/subjects/${id}/`),

  // Questions
  getQuestions: () => api.get("/mcq/questions/"),
  createQuestion: (data) => api.post("/mcq/questions/", data),
  updateQuestion: (id, data) => api.put(`/mcq/questions/${id}/`, data),
  deleteQuestion: (id) => api.delete(`/mcq/questions/${id}/`),
  bulkUpload: (formData) =>
    api.upload("/mcq/questions/bulk-upload/", formData),

  // Exams (MCQ ONLY)
  getExams: () => api.get("/mcq/exams/"),
  getExam: (id) => api.get(`/mcq/exams/${id}/`),
  createExam: (data) => api.post("/mcq/exams/", data),
  updateExam: (id, data) => api.put(`/mcq/exams/${id}/`, data),
  deleteExam: (id) => api.delete(`/mcq/exams/${id}/`),
  publishExam: (id) => api.post(`/mcq/exams/${id}/publish/`),
  unpublishExam: (id) => api.post(`/mcq/exams/${id}/unpublish/`),

  // Sessions
  startSession: (examId) =>
    api.post("/mcq/sessions/", { exam: examId }),
  submitExam: (sessionId, answers) =>
    api.post(`/mcq/sessions/${sessionId}/submit/`, { answers }),

  // Results
  getResults: () => api.get("/mcq/results/"),
  getResultBySession: (sessionId) =>
    api.get(`/mcq/results/session/${sessionId}/`),

  // Dashboards
  getAdminDashboard: () => api.get("/mcq/admin-dashboard/"),
  getStudentDashboard: () => api.get("/mcq/student-dashboard/"),
};
