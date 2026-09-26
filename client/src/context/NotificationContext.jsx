import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setUnreadMessageCount(0);
      return;
    }

    try {
      // 1. Fetch system & violation notifications (non-message)
      const data = await api.get('/notifications');
      if (data.success) {
        // Filter out any historical 'message' type notifications
        const cleanNotifs = (data.notifications || []).filter(n => n.type !== 'message');
        setNotifications(cleanNotifs);
        setUnreadCount(cleanNotifs.filter(n => !n.read).length);
      }
    } catch (err) {
      // Quiet fail on network hiccups
    }

    try {
      // 2. Fetch direct message unread count exclusively for the message icon
      const msgData = await api.get('/messages/unread-count');
      if (msgData.success) {
        setUnreadMessageCount(msgData.unreadCount || 0);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (!user) return;
    const interval = setInterval(fetchNotifications, 12000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const refreshUnreadMessages = async () => {
    if (!user) return;
    try {
      const msgData = await api.get('/messages/unread-count');
      if (msgData.success) {
        setUnreadMessageCount(msgData.unreadCount || 0);
      }
    } catch (err) {
      // Quiet fail
    }
  };

  // Has unread violations
  const hasUnreadViolation = notifications.some(n => !n.read && n.type === 'violation');
  const violationNotifications = notifications.filter(n => n.type === 'violation');

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        unreadMessageCount,
        hasUnreadViolation,
        violationNotifications,
        fetchNotifications,
        refreshUnreadMessages,
        markAsRead,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
