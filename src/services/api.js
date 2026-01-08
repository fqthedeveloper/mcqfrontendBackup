/* =========================================================
   API CORE CONFIG (FIXED & BULLETPROOF)
========================================================= */

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

/* ================= URL NORMALIZER (🔥 IMPORTANT) ================= */

/**
 * Accepts:
 *  - /mcq/questions/
 *  - /api/mcq/questions/
 *  - http://localhost:8000/api/mcq/questions/
 *
 * Always returns:
 *  - http://localhost:8000/api/mcq/questions/
 */
const normalizeUrl = (url) => {
  // absolute URL → strip domain
  if (url.startsWith("http")) {
    const u = new URL(url);
    url = u.pathname + u.search;
  }

  // remove duplicate /api
  url = url.replace(/^\/api/, "");

  // ensure leading slash
  if (!url.startsWith("/")) {
    url = `/${url}`;
  }

  return `${API_BASE_URL}${url}`;
};

/* ================= HEADERS ================= */

const getHeaders = (isFormData = false) => {
  const headers = {};
  const token = getToken();

  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

/* ================= RESPONSE HANDLER ================= */

const handleResponse = async (response) => {
  let data = null;

  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      logout();
    }
    throw data || { detail: "API Error" };
  }

  return data;
};

/* ================= API CORE ================= */

export const api = {
  get: (url) =>
    fetch(normalizeUrl(url), {
      method: "GET",
      headers: getHeaders(),
    }).then(handleResponse),

  post: (url, data, isForm = false) =>
    fetch(normalizeUrl(url), {
      method: "POST",
      headers: getHeaders(isForm),
      body: isForm ? data : JSON.stringify(data),
    }).then(handleResponse),

  put: (url, data) =>
    fetch(normalizeUrl(url), {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  patch: (url, data) =>
    fetch(normalizeUrl(url), {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(data),
    }).then(handleResponse),

  delete: (url) =>
    fetch(normalizeUrl(url), {
      method: "DELETE",
      headers: getHeaders(),
    }).then(handleResponse),

  upload: (url, formData) =>
    fetch(normalizeUrl(url), {
      method: "POST",
      headers: getHeaders(true),
      body: formData,
    }).then(handleResponse),
};

/* ================= NAMED EXPORTS ================= */

// Auth-style exports
export const authGet = api.get;
export const authPost = api.post;
export const authPut = api.put;
export const authPatch = api.patch;
export const authDelete = api.delete;
export const authPostFormData = api.upload;

// Generic exports
export const get = api.get;
export const post = api.post;
export const put = api.put;
export const patch = api.patch;
export const deleteReq = api.delete;

export default api;
