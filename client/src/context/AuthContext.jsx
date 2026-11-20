import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('spotify_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('spotify_token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Check current session on mount
  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('spotify_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('spotify_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          // If token expired or invalid
          logout();
        }
      }
      setLoading(false);
    }
    verifyAuth();
  }, []);

  const login = async (credentials) => {
    setAuthError(null);
    try {
      const res = await authAPI.login(credentials);
      const { user: userData, token: userToken } = res.data;
      if (userToken) {
        setToken(userToken);
        localStorage.setItem('spotify_token', userToken);
      }
      if (userData) {
        setUser(userData);
        localStorage.setItem('spotify_user', JSON.stringify(userData));
      }
      return { success: true, user: userData };
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Login failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const res = await authAPI.register(userData);
      const { user: newUser, token: newToken } = res.data;
      if (newToken) {
        setToken(newToken);
        localStorage.setItem('spotify_token', newToken);
      }
      if (newUser) {
        setUser(newUser);
        localStorage.setItem('spotify_user', JSON.stringify(newUser));
      }
      return { success: true, user: newUser };
    } catch (err) {
      const msg = err.response?.data?.msg || err.message || 'Registration failed';
      setAuthError(msg);
      return { success: false, error: msg };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.warn('Logout API error:', err.message);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('spotify_token');
      localStorage.removeItem('spotify_user');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    isArtist: user?.role === 'artist',
    loading,
    authError,
    setAuthError,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
