import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();
const ADMIN_READ_NOTIFICATIONS_KEY = 'safemarket_admin_read_notifications';

const getAdminReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(ADMIN_READ_NOTIFICATIONS_KEY) || '[]'));
  } catch {
    return new Set();
  }
};

const saveAdminReadNotificationIds = (ids) => {
  localStorage.setItem(ADMIN_READ_NOTIFICATIONS_KEY, JSON.stringify([...ids]));
};

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
      if (user.role !== 'seller') {
        cleanNotifs = cleanNotifs.filter((notification) => notification.type !== 'violation');
      }

      // If user is Admin, fetch pending reports & high risk AI items for Admin notifications
      if (user.role === 'admin') {
        try {
          const [reportsRes, aiRes] = await Promise.all([
            api.get('/reports?status=Pending'),
            api.get('/admin/ai-monitoring?riskLevel=High')
          ]);

          const adminNotifs = [];
          const readIds = getAdminReadNotificationIds();
          if (reportsRes.success && reportsRes.reports) {
            reportsRes.reports.forEach(r => {
              const notificationId = `rep_${r._id}`;
              adminNotifs.push({
                _id: notificationId,
                title: '🚨 Community Scam Report',
                message: `Buyer reported item "${r.listingId?.title || 'Listing'}": ${r.reason || 'Suspicious activity'}`,
                type: 'report',
                read: readIds.has(notificationId),
                createdAt: r.createdAt,
                link: r.listingId?._id ? `/product/${r.listingId._id}` : '/admin'
              });
            });
          }

          if (aiRes.success && aiRes.flaggedListings) {
            aiRes.flaggedListings.forEach(item => {
              const notificationId = `ai_${item._id}`;
              adminNotifs.push({
                _id: notificationId,
                title: '⚠️ High Risk AI Scam Flag',
                message: `AI detected High Risk indicator on "${item.title}" (₱${item.price?.toLocaleString()}).`,
                type: 'ai_risk',
                read: readIds.has(notificationId),
                createdAt: item.createdAt,
                link: `/product/${item._id}`
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
    if (id.startsWith('rep_') || id.startsWith('ai_')) {
      const readIds = getAdminReadNotificationIds();
      readIds.add(id);
      saveAdminReadNotificationIds(readIds);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return;
    }

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
    const virtualIds = notifications
      .filter((notification) => notification._id.startsWith('rep_') || notification._id.startsWith('ai_'))
      .map((notification) => notification._id);
    if (virtualIds.length > 0) {
      const readIds = getAdminReadNotificationIds();
      virtualIds.forEach((id) => readIds.add(id));
      saveAdminReadNotificationIds(readIds);
    }

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
