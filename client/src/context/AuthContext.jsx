import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('lifeledger_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('lifeledger_token');
      if (storedToken) {
        try {
          const res = await apiClient.auth.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            setToken(storedToken);
          } else {
            await handleLogout();
          }
        } catch (err) {
          console.warn('[Auth] Session validation failed:', err.message);
          // Only clear the token if the server explicitly rejected the authentication (401/403)
          // Do not log the user out on transient network disconnects
          if (err.status === 401 || err.status === 403) {
            await handleLogout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const handleLogin = async (email, password) => {
    const res = await apiClient.auth.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('lifeledger_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Login failed');
  };

  const handleRegister = async (name, email, password) => {
    const res = await apiClient.auth.register({ name, email, password });
    if (res.success && res.data) {
      localStorage.setItem('lifeledger_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const handleLogout = async () => {
    try {
      await apiClient.auth.logout();
    } catch (err) {
      // Ignore network errors during logout
    } finally {
      localStorage.removeItem('lifeledger_token');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout
      }}
    >
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
