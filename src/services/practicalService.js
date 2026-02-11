import { api } from "./api";

export const practicalService = {

  // ================= ADMIN =================
  getTasks: () =>
    api.get("/practical/tasks/"),

  createTask: (data) =>
    api.post("/practical/tasks/", data),

  updateTask: (id, data) =>
    api.put(`/practical/tasks/${id}/`, data),

  getAdminResults: () =>
    api.get("/practical/admin/results/"),


  // ================= STUDENT =================
  getStudentPracticals: () =>
    api.get("/practical/student-exams/"),

  getPracticalDetail: (taskId) =>
    api.get(`/practical/student-exams/${taskId}/detail/`),

  startPractical: (taskId) =>
    api.post(`/practical/student-exams/${taskId}/start/`),

  getStudentResults: () =>
    api.get("/practical/student/results/"),


  // ================= SESSION =================
  getPracticalSession: (sessionId) =>
    api.get(`/practical/sessions/${sessionId}/`),

  submitSession: (sessionId) =>
    api.post(`/practical/sessions/${sessionId}/submit/`),

  getResultDetail: (id) =>
    api.get(`/practical/results/${id}/`),


  // ================= HISTORY =================

  // 1️⃣ Get list of history files
  getHistoryList: (id) =>
    api.get(`/practical/history/${id}/`),

  // 2️⃣ Read specific history file
  getHistoryFile: (id, filePath) =>
    api.get(`/practical/history/${id}/file/`, {
      params: {
        file: filePath
      }
    })
};
