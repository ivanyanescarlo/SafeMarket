import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  MessageSquare,
  Package,
  ShieldCheck,
  Star,
  ShieldAlert,
  Info,
  AlertTriangle
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // 'all' | 'violations'
  const navigate = useNavigate();

  const getIcon = (type) => {
    switch (type) {
      case 'violation':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'seller_activation':
        return <ShieldCheck className="w-5 h-5 text-safegreen-600" />;
      case 'rating':
        return <Star className="w-5 h-5 text-amber-500 fill-amber-400" />;
      case 'report_update':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'listing_update':
        return <Package className="w-5 h-5 text-purple-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredNotifications = filter === 'violations'
    ? notifications.filter(n => n.type === 'violation')
    : notifications;

  const violationCount = notifications.filter(n => n.type === 'violation').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-safegreen-100 text-safegreen-800">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">
                Notifications
              </h1>
              <p className="text-xs text-slate-500">
                Updates on your listings, messages, reviews, and community safety
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-1.5 bg-safegreen-50 hover:bg-safegreen-100 text-safegreen-700 border border-safegreen-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 border-b border-slate-100 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filter === 'all'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Notifications ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('violations')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
              filter === 'violations'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Violations & Warnings ({violationCount})</span>
          </button>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              {filter === 'violations' ? (
                <>
                  <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                  <p className="text-sm font-bold text-slate-700">No violations on record</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your account is in good standing with zero safety or policy penalties.
                  </p>
                </>
              ) : (
                <>
                  <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No notifications yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    You will be notified when you receive inquiries, reviews, or safety updates.
                  </p>
                </>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isViolation = notif.type === 'violation';
              return (
                <div
                  key={notif._id}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif._id);
                    if (notif.link) navigate(notif.link);
                  }}
                  className={`p-5 flex items-start gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                    isViolation
                      ? 'bg-rose-50/70 border-l-4 border-l-rose-500'
                      : !notif.read
                      ? 'bg-emerald-50/40'
                      : 'bg-white'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    isViolation ? 'bg-rose-100 text-rose-600' : 'bg-slate-100'
                  }`}>
                    {getIcon(notif.type)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isViolation && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-200 text-rose-900 border border-rose-300">
                            Policy Violation
                          </span>
                        )}
                        <h4 className={`text-sm font-bold ${isViolation ? 'text-rose-950 font-extrabold' : 'text-slate-900'}`}>
                          {notif.title}
                        </h4>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(notif.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${isViolation ? 'text-rose-900 font-medium' : 'text-slate-600'}`}>
                      {notif.message}
                    </p>

                    {isViolation && (
                      <div className="mt-3 p-3 bg-white border border-rose-200 rounded-xl text-xs space-y-1 shadow-2xs">
                        <span className="font-extrabold text-[10px] text-rose-700 uppercase tracking-wider block">
                          📋 Official Admin Moderation & Violation Note:
                        </span>
                        <p className="text-rose-950 font-bold italic">
                          "{notif.message}"
                        </p>
                        {notif.link && (
                          <div className="pt-1">
                            <span className="text-[11px] font-bold text-safegreen-700 hover:underline inline-flex items-center gap-1">
                              View Affected Item Status →
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {!notif.read && (
                    <span className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                      isViolation ? 'bg-rose-600' : 'bg-safegreen-600'
                    }`} />
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
