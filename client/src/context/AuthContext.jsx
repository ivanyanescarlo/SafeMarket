import React, { createContext, useContext, useState, useEffect } from 'react';
import api, { setAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('safemarket_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Fetch fresh profile on mount if token exists
  useEffect(() => {
    const fetchMe = async () => {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('safemarket_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.error('Failed to verify token on startup:', err.message);
        setUser(null);
        setAuthToken(null);
        localStorage.removeItem('safemarket_user');
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (loginId, password) => {
    const data = await api.post('/auth/login', { loginId, password });
    if (data.success) {
      setAuthToken(data.token);
      setUser(data.user);
      localStorage.setItem('safemarket_user', JSON.stringify(data.user));
    }
    return data;
  };

  const register = async (formData) => {
    return await api.post('/auth/register', formData);
  };

  const verifyOtp = async (email, otp) => {
    return await api.post('/auth/verify-otp', { email, otp });
  };

  const resendOtp = async (email, channel = 'both') => {
    return await api.post('/auth/resend-otp', { email, channel });
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    localStorage.removeItem('safemarket_user');
    window.location.href = '/login';
  };

  const refreshUser = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('safemarket_user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const isAdmin = Boolean(user && user.role === 'admin');
  const isSeller = Boolean(
    user && !isAdmin && (user.role === 'seller' || user.sellerProfile?.isSeller)
  );
  const isBuyer = Boolean(user && !isAdmin && user.role === 'buyer' && !user.sellerProfile?.isSeller);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        logout,
        refreshUser,
        isSeller,
        isAdmin,
        isBuyer,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
