import { api } from "./api";

export const practicalService = {
  // ===== ADMIN =====
  getTasks: () => api.get("/practical/tasks/"),
  createTask: (data) => api.post("/practical/tasks/", data),
  updateTask: (id, data) => api.put(`/practical/tasks/${id}/`, data),

  // ===== STUDENT =====
  getStudentPracticals: () =>
    api.get("/practical/student-exams/"),

  getPracticalDetail: (taskId) =>
    api.get(`/practical/student-exams/${taskId}/detail/`),

  startPractical: (taskId) =>
    api.post(`/practical/student-exams/${taskId}/start/`),

  getSession: (sessionId) =>
    api.get(`/practical/sessions/${sessionId}/`),

  submitSession: (sessionId) =>
    api.post(`/practical/sessions/${sessionId}/submit/`)
};
