import {
  baseURL,
  post,
  authPost,
  authPostFormData,
  getUser,
  getToken,
  setToken,
  setUser,
  removeToken,
  removeUser,
} from "./api";

let idleTimer;
const IDLE_LIMIT = 2 * 60 * 60 * 1000; // 2 hours

const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];

const resetIdleTimer = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(logout, IDLE_LIMIT);
};

export const startIdleTimer = () => {
  events.forEach((e) => window.addEventListener(e, resetIdleTimer));
  resetIdleTimer();
};

export const stopIdleTimer = () => {
  events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
  clearTimeout(idleTimer);
};

export const login = async (credentials) => {
  // Use the shared `post` helper so callers elsewhere keep consistent behavior
  const data = await post('/mcq/login/', credentials);
  if (data?.token) {
    setToken(data.token);
  }
  // store user payload if provided
  if (data) {
    setUser(data);
  }

  startIdleTimer();
  return data;
};

export const logout = () => {
  stopIdleTimer();
  removeToken();
  removeUser();
  window.location.href = "/login";
};

export const getCurrentUser = () => getUser();

export const changePassword = async (payload) => {
  return authPost('/api/change-password/', payload);
};

export const sendOTP = async () => {
  return authPost('/api/send-otp/', {});
};

export const verifyOTP = async (otp) => {
  return authPost('/api/verify-otp/', { otp });
};

export const isAuthenticated = () => Boolean(getToken());

export const isAdmin = () => {
  const u = getUser();
  return u && (u.role === 'admin' || u.is_staff || u.is_superuser);
};

export const isStudent = () => {
  const u = getUser();
  return u && (u.role === 'student' || u.role === 'student_user');
};

const authService = {
  login,
  logout,
  getCurrentUser,
  changePassword,
  sendOTP,
  verifyOTP,
  isAuthenticated,
  isAdmin,
  isStudent,
  startIdleTimer,
  stopIdleTimer,
};

export { authService };
export default authService;
