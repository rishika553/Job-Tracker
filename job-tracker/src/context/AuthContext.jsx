import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

const SESSION_HINT_KEY = 'has_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem(SESSION_HINT_KEY);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const userData = await authApi.getMe();
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      console.error('Failed to fetch user:', err);
      clearSession();
      throw err;
    }
  }, [clearSession]);

  // Initialize auth session on mount
  useEffect(() => {
    let cancelled = false;

    const initializeAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const hasSessionHint = sessionStorage.getItem(SESSION_HINT_KEY);

        if (accessToken) {
          await fetchCurrentUser();
        } else if (hasSessionHint) {
          try {
            const session = await authApi.refreshToken();
            if (session?.access_token) {
              localStorage.setItem('access_token', session.access_token);
              await fetchCurrentUser();
            }
          } catch (err) {
            sessionStorage.removeItem(SESSION_HINT_KEY);
            clearSession();
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initializeAuth();
    return () => { cancelled = true; };
  }, [fetchCurrentUser, clearSession]);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem(SESSION_HINT_KEY, '1');
      await fetchCurrentUser();
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  }, [fetchCurrentUser]);

  const register = useCallback(async (userData) => {
    setError(null);
    try {
      const result = await authApi.register(userData);
      return result;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  }, []);

  const googleLogin = useCallback(async () => {
    setError(null);
    try {
      const userData = await fetchCurrentUser();
      setIsAuthenticated(true);
      return userData;
    } catch (err) {
      setError(err.message || 'Google login failed');
      throw err;
    }
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        googleLogin,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
