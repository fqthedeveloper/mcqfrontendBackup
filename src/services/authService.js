import { post, setToken, setUser, removeToken, removeUser } from "./api";

/* ================= IDLE TIMER ================= */
let idleTimer;
const IDLE_LIMIT = 2 * 60 * 60 * 1000;
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

/* ================= LOGIN ================= */
const login = async (credentials) => {
  const res = await post("/mcq/login/", credentials);

  if (res?.token) {
    setToken(res.token);
    setUser(res);
    localStorage.setItem("user", JSON.stringify(res));
    startIdleTimer();
  }

  return res;
};

/* ================= SEND OTP ================= */
const sendLoginOTP = async (email) => {
  return await post("/mcq/login/email/send-otp/", { email });
};

/* ================= VERIFY OTP ================= */
const verifyLoginOTP = async ({ email, otp }) => {
  const res = await post("/mcq/login/email/verify-otp/", { email, otp });

  if (res?.token) {
    setToken(res.token);
    setUser(res);
    localStorage.setItem("user", JSON.stringify(res));
    startIdleTimer();
  }

  return res;
};

/* ================= LOGOUT ================= */
const logout = () => {
  stopIdleTimer();
  removeToken();
  removeUser();
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const authService = {
  login,
  sendLoginOTP,
  verifyLoginOTP,
  logout,
  startIdleTimer,
};

export default authService;