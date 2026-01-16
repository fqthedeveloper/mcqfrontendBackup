import { baseURL, post, authPost } from './api';

// Idle timer variables
let idleTimeout;
const IDLE_TIMEOUT_DURATION = 7200000; // 2 hours in milliseconds

// Event types to reset idle timer
const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

// Initialize idle timer
const startIdleTimer = () => {
  clearTimeout(idleTimeout);
  idleTimeout = setTimeout(forceLogout, IDLE_TIMEOUT_DURATION);
};

// Reset timer on user activity
const resetIdleTimer = () => {
  clearTimeout(idleTimeout);
  startIdleTimer();
};

// Setup event listeners for user activity
const setupActivityListeners = () => {
  activityEvents.forEach(event => {
    window.addEventListener(event, resetIdleTimer);
  });
  startIdleTimer();
};

// Remove event listeners
const removeActivityListeners = () => {
  activityEvents.forEach(event => {
    window.removeEventListener(event, resetIdleTimer);
  });
  clearTimeout(idleTimeout);
};

// Force logout function
const forceLogout = () => {
  removeActivityListeners();
  clearUserData();
  // Add any additional logout logic here (e.g., redirect)
  console.log('User automatically logged out due to inactivity');
};

// Clear user data from storage
const clearUserData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('sessionToken');
};

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

    // Start idle timer on successful login
    setupActivityListeners();
    return responseData;
  } catch (error) {
    throw new Error(error.message || 'An error occurred during login');
  }
};

export const logoutUser = () => {
  removeActivityListeners();
  clearUserData();
  // Add API call to backend logout if needed
};

export const resetPassword = async (email) => {
  return post('/mcq/reset-password/', { email });
};

export const changePassword = async (newPassword, confirmPassword) => {
  return authPost('/mcq/change-password/', {
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
};

// Initialize on app load if user is already logged in
export const initAuth = () => {
  if (localStorage.getItem('authToken')) {
    setupActivityListeners();
  }
};

// Call init on module load
initAuth();

export const forgotPassword = (email) => {
  return post("/mcq/forgot-password/", { email });
};

// Reset password from email link
export const resetPasswordWithToken = (token, newPassword) => {
  return post("/mcq/reset-password/", {
    token,
    new_password: newPassword,
  });
};

