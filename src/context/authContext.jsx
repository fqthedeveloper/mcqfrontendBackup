// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { logoutUser } from '../services/api';

const AuthContext = createContext();

const getLocalStorageUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getLocalStorageUser());
  const [loading, setLoading] = useState(true);

  const login = (userData) => {
    localStorage.setItem('access_token', userData.token);
    localStorage.setItem('refresh_token', userData.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
