const API_BASE_URL = "http://localhost:8000/api";
export const baseURL = API_BASE_URL;

/* ================= STORAGE ================= */

export const getToken = () => localStorage.getItem("token");
export const setToken = (token) => localStorage.setItem("token", token);
export const removeToken = () => localStorage.removeItem("token");

export const getUser = () =>
  JSON.parse(localStorage.getItem("user") || "null");

export const setUser = (user) =>
  localStorage.setItem("user", JSON.stringify(user));

export const removeUser = () => localStorage.removeItem("user");

/* ================= LOGOUT ================= */

export const logout = () => {
  removeToken();
  removeUser();
  window.location.href = "/login";
};

/* ================= HELPERS ================= */

const getHeaders = (isFormData = false) => {
  const headers = {};
  const token = getToken();

  if (token) headers.Authorization = `Token ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  return headers;
};

const handleResponse = async (response) => {
  const data =
    response.status === 204 ? null : await response.json();

  if (!response.ok) {
    if (response.status === 401) logout();
    throw data;
  }
  return data;
};

/* ================= API CORE ================= */

export const api = {
  get: (url) =>
    fetch(`${API_BASE_URL}${url}`, {
      headers: getHeaders(),
    }).then(handleResponse),

  post: (url, data, isForm = false) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: getHeaders(isForm),
      body: isForm ? data : JSON.stringify(data),
    }).then(handleResponse),

  put: (url, data) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  patch: (url, data) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),


  delete: (url) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  upload: (url, formData) =>
    fetch(`${API_BASE_URL}${url}`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    }).then(handleResponse),
};

/* ================= NAMED EXPORTS (IMPORTANT) ================= */

export const authGet = api.get;
export const authPost = api.post;
export const authPut = api.put;
export const authPatch = api.patch;
export const authDelete = api.delete;
export const authPostFormData = api.upload;

// Convenience named exports expected across the codebase
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const patch = api.patch;
export const deleteReq = api.delete;

export default api;
