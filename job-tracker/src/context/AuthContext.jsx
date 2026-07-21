import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/authApi';

const AuthContext = createContext(null);

// Key used to hint that the user has an active session (cookie may exist).
// This avoids a pointless /auth/refresh request on every cold load.
const SESSION_HINT_KEY = 'has_session';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem(SESSION_HINT_KEY);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const userData = await authApi.getMe();
    setUser(userData);
    setError(null);
    return userData;
  }, []);

  // Bootstrap auth state on mount — runs once
  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        const hasSessionHint = sessionStorage.getItem(SESSION_HINT_KEY);

        if (accessToken) {
          // We have a token — try to fetch the user directly
          await fetchCurrentUser();
        } else if (hasSessionHint) {
          // We previously had a session; attempt a silent cookie-based refresh
          try {
            const session = await authApi.refreshToken();
            if (session?.access_token) {
              localStorage.setItem('access_token', session.access_token);
              await fetchCurrentUser();
            }
          } catch {
            // Cookie expired or invalid — clean up the hint
            sessionStorage.removeItem(SESSION_HINT_KEY);
          }
        }
        // No token, no hint → unauthenticated, skip network call entirely
      } catch {
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initAuth();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (email, password) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem(SESSION_HINT_KEY, '1');
      const userData = await fetchCurrentUser();
      return userData;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const register = useCallback(async (userData) => {
    setError(null);
    return authApi.register(userData);
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authApi.googleAuth(idToken);
      localStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem(SESSION_HINT_KEY, '1');
      const userData = await fetchCurrentUser();
      return userData;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort logout — clear client state regardless
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
        isAuthenticated: !!user,
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
