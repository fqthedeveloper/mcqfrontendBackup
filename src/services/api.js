// src/api.js
import axios from 'axios';

export const baseURL = 'http://localhost:8000'; 

// Create an Axios instance with baseURL
const axiosInstance = axios.create({
  baseURL,
});

// Utility to get tokens from localStorage
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const saveAccessToken = (token) => localStorage.setItem('access_token', token);

// If you want to log the user out on token expiry:
export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// Interceptor to attach “Token <access_token>” header to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Optional: Response interceptor to catch 401 and try refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      getRefreshToken()
    ) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh
        const refresh = getRefreshToken();
        const { data } = await axios.post(
          `${baseURL}/api/token/refresh/`,
          { refresh }
        );
        saveAccessToken(data.access);
        // Retry original request with new token
        originalRequest.headers.Authorization = `Token ${data.access}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        logoutUser();
        return Promise.reject(refreshErr);
      }
    }
    return Promise.reject(error);
  }
);

// --- Exported Helpers ---

// Unauthenticated GET/POST (no token attached)
export const get = (endpoint) => axios.get(`${baseURL}${endpoint}`);
export const post = (endpoint, payload) =>
  axios.post(`${baseURL}${endpoint}`, payload);

// Authenticated calls via axiosInstance
export const authGet = (endpoint) => axiosInstance.get(endpoint);
export const authPost = (endpoint, payload) => axiosInstance.post(endpoint, payload);
export const authPut = (endpoint, payload) => axiosInstance.put(endpoint, payload);
export const authDelete = (endpoint) => axiosInstance.delete(endpoint);

// Domain‐specific helpers (optional)
export const getExam = (examId) => authGet(`/api/exams/${examId}/`);
export const createExamSession = (data) => authPost('/api/exam-sessions/', data);
export const submitAnswers = (payload) => authPost('/api/submit-answers/', payload);
export const checkExamSubmission = (examId, userId) =>
  authGet(`/api/exams/${examId}/submitted/${userId}/`);
export const getResult = (resultId) => get(`/api/results/${resultId}/`);
