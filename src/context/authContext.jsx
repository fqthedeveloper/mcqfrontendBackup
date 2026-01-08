import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { mcqService } from '../services/mcqService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      const userData = {
        id: response.id,
        email: response.email,
        full_name: response.full_name,
        username: response.username,
        role: response.role,
        force_password_change: response.force_password_change,
        is_verified: response.is_verified,
      };
      setUser(userData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const changePassword = async (data) => {
    try {
      const response = await authService.changePassword(data);
      if (user) {
        setUser({ ...user, force_password_change: false });
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const sendOTP = async () => {
    try {
      return await authService.sendOTP();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const verifyOTP = async (otp) => {
    try {
      const response = await authService.verifyOTP(otp);
      if (user) {
        setUser({ ...user, is_verified: true });
      }
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateUserProfile = (updates) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    changePassword,
    sendOTP,
    verifyOTP,
    updateUserProfile,
    isAuthenticated: authService.isAuthenticated(),
    isAdmin: authService.isAdmin(),
    isStudent: authService.isStudent(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};