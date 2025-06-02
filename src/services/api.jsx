// src/api.js
export const baseURL = 'http://localhost:8000';

const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const saveAccessToken = (token) => localStorage.setItem('access_token', token);

export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const getAuthHeaders = () => {
  const token = getAccessToken();
  // Change from 'Bearer' to 'Token'
  return token ? { Authorization: `Token ${token}` } : {};
};

const refreshAccessToken = async () => {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token available');

  const res = await fetch(`${baseURL}/api/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) throw new Error('Token refresh failed');
  const data = await res.json();
  saveAccessToken(data.access);
  return data.access;
};

const fetchWithAuthRetry = async (url, options = {}, retry = true) => {
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...getAuthHeaders(),
    },
  });

  if (res.ok) return res;

  const errorData = await res.json().catch(() => ({}));
  const detail = errorData.detail || '';

  if (res.status === 401 && detail.toLowerCase().includes('token') && retry) {
    try {
      await refreshAccessToken();
      return fetchWithAuthRetry(url, options, false);
    } catch {
      logoutUser();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const errMsg = errorData.non_field_errors?.[0] || detail || 'Unknown error';
  throw new Error(errMsg);
};

// ---------------------- API METHODS ----------------------

export const get = async (endpoint) => {
  const res = await fetch(`${baseURL}${endpoint}`);
  if (!res.ok) throw new Error((await res.json())?.detail || 'Unknown error');
  return res.json();
};

export const post = async (endpoint, data) => {
  const res = await fetch(`${baseURL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error((await res.json())?.detail || 'Unknown error');
  return res.json();
};

export const authGet = async (endpoint) => {
  const res = await fetchWithAuthRetry(`${baseURL}${endpoint}`);
  return res.json();
};

export const authPost = async (endpoint, data) => {
  const res = await fetchWithAuthRetry(`${baseURL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const authPut = async (endpoint, data) => {
  const res = await fetchWithAuthRetry(`${baseURL}${endpoint}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const authDelete = async (endpoint) => {
  // re‐use fetchWithAuthRetry to send a DELETE with auth headers
  const res = await fetchWithAuthRetry(`${baseURL}${endpoint}`, {
    method: 'DELETE',
  });
  // if the server returns 204 No Content, just return
  if (res.status === 204) return;
  // otherwise, try to parse JSON
  return res.json();
};

// ---------------------- Domain-Specific API ----------------------

export const getExam = (examId) => authGet(`/api/exams/${examId}/`);
export const createExamSession = (data) => authPost('/api/exam-sessions/', data);
export const submitAnswers = (payload) => authPost('/api/submit-answers/', payload);
export const checkExamSubmission = (examId, userId) =>
  authGet(`/api/exams/${examId}/submitted/${userId}/`);
export const getResult = (resultId) => get(`/api/results/${resultId}/`);
