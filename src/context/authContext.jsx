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
    // Store all authentication data
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

  const logout = useCallback(async () => {
    try {
      // Attempt server-side logout if possible
      await logoutUser();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Clear client-side authentication state
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const verifyAuthState = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const userData = getLocalStorageUser();
        
        if (accessToken && userData) {
          // Add token validation check here in production
          setUser(userData);
        } else {
          // Clear invalid state
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          setUser(null);
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyAuthState();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      loading,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};