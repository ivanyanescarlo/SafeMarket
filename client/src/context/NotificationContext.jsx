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
      // 1. Fetch system, message & violation notifications
      const data = await api.get('/notifications');
      let cleanNotifs = (data.notifications || []);

      // If user is Admin, fetch pending reports & high risk AI items for Admin notifications
      if (user.role === 'admin') {
        try {
          const [reportsRes, aiRes] = await Promise.all([
            api.get('/admin/reports?status=pending'),
            api.get('/admin/ai-monitoring?riskLevel=High')
          ]);

          const adminNotifs = [];
          if (reportsRes.success && reportsRes.reports) {
            reportsRes.reports.forEach(r => {
              adminNotifs.push({
                _id: `rep_${r._id}`,
                title: '🚨 Community Scam Report',
                message: `Buyer reported item "${r.listingId?.title || 'Listing'}": ${r.reason || 'Suspicious activity'}`,
                type: 'violation',
                read: r.status === 'resolved' || r.status === 'dismissed',
                createdAt: r.createdAt,
                link: '/admin'
              });
            });
          }

          if (aiRes.success && aiRes.flaggedListings) {
            aiRes.flaggedListings.forEach(item => {
              adminNotifs.push({
                _id: `ai_${item._id}`,
                title: '⚠️ High Risk AI Scam Flag',
                message: `AI detected High Risk indicator on "${item.title}" (₱${item.price?.toLocaleString()}).`,
                type: 'violation',
                read: false,
                createdAt: item.createdAt,
                link: '/admin'
              });
            });
          }

          cleanNotifs = [...adminNotifs, ...cleanNotifs].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
        } catch (adminErr) {
          console.error('Failed to load admin notifications:', adminErr);
        }
      }

      setNotifications(cleanNotifs);
      setUnreadCount(cleanNotifs.filter(n => !n.read).length);
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
    const interval = setInterval(fetchNotifications, 3000);
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
