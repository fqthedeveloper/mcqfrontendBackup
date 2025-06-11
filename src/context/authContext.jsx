import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  const login = useCallback((userData) => {
    localStorage.setItem('access_token', userData.token);
    localStorage.setItem('refresh_token', userData.refresh_token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const updateUser = useCallback((newData) => {
    setUser(prevUser => {
      const updatedUser = { ...prevUser, ...newData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);