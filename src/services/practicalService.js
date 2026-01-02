import { api } from './api';

export const practicalService = {
  // Practical Tasks
  getTasks: () => api.get('/practical/tasks/'),
  getTask: (id) => api.get(`/practical/tasks/${id}/`),
  createTask: (data) => api.post('/practical/tasks/', data),
  updateTask: (id, data) => api.put(`/practical/tasks/${id}/`, data),
  deleteTask: (id) => api.delete(`/practical/tasks/${id}/`),
  
  // Practical Exams
  getPracticalExams: () => api.get('/practical/exams/'),
  getPracticalExam: (id) => api.get(`/practical/exams/${id}/`),
  createPracticalExam: (data) => api.post('/practical/exams/', data),
  updatePracticalExam: (id, data) => api.put(`/practical/exams/${id}/`, data),
  deletePracticalExam: (id) => api.delete(`/practical/exams/${id}/`),
  publishPracticalExam: (id) => api.post(`/practical/exams/${id}/publish/`),
  assignStudents: (examId, studentIds) => 
    api.post(`/practical/exams/${examId}/assign-students/`, { student_ids: studentIds }),
  
  // Student Practical Exams
  getStudentPracticalExams: () => api.get('/practical/student-exams/'),
  getStudentPracticalExam: (id) => api.get(`/practical/student-exams/${id}/`),
  startVM: (id) => api.post(`/practical/student-exams/${id}/start-vm/`),
  submitTask: (examId, taskId, data) => 
    api.post(`/practical/student-exams/${examId}/submit-task/`, { task_id: taskId, ...data }),
  submitPracticalExam: (id) => api.post(`/practical/student-exams/${id}/submit-exam/`),
  getConnectionInfo: (id) => api.get(`/practical/student-exams/${id}/connection-info/`),
  
  // VM Management
  getVMLogs: (id) => api.get(`/practical/student-exams/${id}/logs/`),
  
  // Monitor
  getExamMonitor: (examId) => api.get(`/practical/monitor/${examId}/`),
  
  // Bulk operations
  bulkAssignStudents: (examId, studentIds) =>
    api.post('/practical/bulk-assign/', { exam_id: examId, student_ids: studentIds }),
};