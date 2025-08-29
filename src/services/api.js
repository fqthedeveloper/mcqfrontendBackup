// src/services/api.js
export const baseURL = 'http://localhost:8000';

// Token management
export const getAccessToken = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');
export const saveAccessToken = (token) => localStorage.setItem('access_token', token);
export const saveRefreshToken = (token) => localStorage.setItem('refresh_token', token);
export const saveUser = (user) => localStorage.setItem('user', JSON.stringify(user));

export const logoutUser = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

const getAuthHeaders = () => {
  const token = getAccessToken();
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
  const headers = getAuthHeaders();
  const requestOptions = {
    ...options,
    headers: {
      ...options.headers,
      ...headers,
    },
  };

  let res;
  try {
    res = await fetch(url, requestOptions);
  } catch (err) {
    throw new Error('Network error');
  }

  if (res.ok) return res;

  const errorData = await res.json().catch(() => ({}));
  const detail = errorData.detail || '';

  // If 401 and the error is token-related, try to refresh
  if (res.status === 401 && detail.toLowerCase().includes('token') && retry) {
    try {
      const newAccessToken = await refreshAccessToken();
      // Update the Authorization header with the new token
      requestOptions.headers.Authorization = `Token ${newAccessToken}`;
      // Retry the request with the new token
      res = await fetch(url, requestOptions);
      if (res.ok) return res;
    } catch (refreshError) {
      // Refresh failed, logout the user
      logoutUser();
      throw new Error('Session expired. Please log in again.');
    }
  }

  // If we are here, the request failed and we don't want to retry or refresh didn't help
  const errMsg = errorData.non_field_errors?.[0] || detail || 'Unknown error';
  throw new Error(errMsg);
};

// Public API methods (without auth)
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

// Authenticated API methods
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
  const res = await fetchWithAuthRetry(`${baseURL}${endpoint}`, {
    method: 'DELETE',
  });
  if (res.status === 204) return;
  return res.json();
};

export const authPostFormData = async (endpoint, formData) => {
  // Note: Do not set Content-Type for FormData, the browser will set it with the correct boundary
  const res = await fetchWithAuthRetry(`${baseURL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  return res.json();
};

// Login and auth methods
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${baseURL}/api/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg =
        responseData.non_field_errors?.[0] ||
        responseData.detail ||
        'Login failed';
      throw new Error(errorMsg);
    }

    // Store tokens and user data
    saveAccessToken(responseData.access);
    saveRefreshToken(responseData.refresh);
    saveUser(responseData.user);

    return responseData;
  } catch (error) {
    throw new Error(error.message || 'An error occurred during login');
  }
};

export const resetPassword = async (email) => {
  return post('/api/reset-password/', { email });
};

export const changePassword = async (newPassword, confirmPassword) => {
  return authPost('/api/change-password/', {
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
};