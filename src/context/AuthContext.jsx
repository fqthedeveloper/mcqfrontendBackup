import React, { createContext, useState, useContext, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState(null);

  /* ================= INIT FROM STORAGE ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      authService.startIdleTimer?.();
    }
    setLoading(false);
  }, []);

  /* ================= LOGIN (PASSWORD) ================= */
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    setUser(res);
    return res;
  };

   /* ================= OTP LOGIN ================= */
  const verifyOTP = async (payload) => {
    const res = await authService.verifyLoginOTP(payload);
    setUser(res); // 🔥 THIS WAS MISSING
    return res;
  };

  /* ================= LOGOUT ================= */
  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const isAuthenticated = !!user;

  if (loading) return null; // ⛔ prevent redirect race

  return (
    <AuthContext.Provider
      value={{
        user,
        error,
        login,
        verifyOTP,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
