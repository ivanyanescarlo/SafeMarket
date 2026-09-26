import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Package,
  Flag,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import AdminUsers from './AdminUsers';
import AdminListings from './AdminListings';
import AdminReports from './AdminReports';
import AdminAiMonitoring from './AdminAiMonitoring';
import AdminActivityLogs from './AdminActivityLogs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/stats');
      if (data.success) {
        setStats(data.stats);
        setRecentLogs(data.recentLogs || []);
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: 'Users', icon: Users, badge: stats?.users?.total },
    { id: 'listings', label: 'Listings', icon: Package, badge: stats?.listings?.total },
    { id: 'reports', label: 'Reports', icon: Flag, badge: stats?.reports?.pending, badgeColor: 'bg-rose-500' },
    { id: 'ai', label: 'AI Risk Monitor', icon: Sparkles, badge: stats?.listings?.highRisk, badgeColor: 'bg-amber-500' },
    { id: 'logs', label: 'Activity Logs', icon: ShieldAlert }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-bold mb-2">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            SafeMarket Moderation & Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Oversee Philippine community trading, review Gemini AI scam indicators, moderate reported items, and manage platform safety.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-safegreen-600 text-white shadow-md shadow-safegreen-200'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] text-white font-extrabold ${
                  tab.badgeColor || 'bg-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Counters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Users</span>
              <p className="text-3xl font-extrabold text-slate-900 mt-2">{stats?.users?.total || 0}</p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                <span>{stats?.users?.sellers || 0} Sellers</span>
                <span>•</span>
                <span>{stats?.users?.buyers || 0} Buyers</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Listings</span>
              <p className="text-3xl font-extrabold text-safegreen-700 mt-2">{stats?.listings?.total || 0}</p>
              <span className="text-[11px] text-slate-400 block mt-2">
                {stats?.listings?.active || 0} currently active
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Pending Reports</span>
              <p className="text-3xl font-extrabold text-rose-600 mt-2">{stats?.reports?.pending || 0}</p>
              <span className="text-[11px] text-slate-400 block mt-2">
                Out of {stats?.reports?.total || 0} total reports
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600">AI High Risk Flags</span>
              <p className="text-3xl font-extrabold text-amber-600 mt-2">{stats?.listings?.highRisk || 0}</p>
              <span className="text-[11px] text-slate-400 block mt-2">
                {stats?.listings?.mediumRisk || 0} Medium risk items
              </span>
            </div>

          </div>

          {/* Quick Overview Tables: Recent Activity & Pending Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Recent Audit Activities */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-safegreen-600" />
                  <span>Recent System & Security Logs</span>
                </h3>
                <button
                  onClick={() => setActiveTab('logs')}
                  className="text-xs font-bold text-safegreen-700 hover:underline"
                >
                  View All
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {recentLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No logs recorded yet.</p>
                ) : (
                  recentLogs.slice(0, 6).map((log) => (
                    <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{log.action}</span>
                        <span className="text-slate-400 block text-[10px]">
                          {log.userEmail || 'System'} • {log.targetType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* AI Philosophy & Moderation Guide */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>SafeMarket Scam Prevention Policy</span>
              </h3>

              <div className="text-xs text-emerald-900/90 space-y-2.5 leading-relaxed">
                <p>
                  <strong>Gemini AI Role:</strong> The AI provides real-time warning indicators and risk scores. It does NOT automatically ban users or erase listings.
                </p>
                <p>
                  <strong>Administrator Role:</strong> Human administrators review flagged listings and reported scam complaints to make final moderation decisions.
                </p>
                <p>
                  <strong>No Payment Integration:</strong> SafeMarket never handles customer funds, credit cards, or escrow. Peer-to-peer buyers and sellers must always inspect items locally.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('reports')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Review Pending Reports ({stats?.reports?.pending || 0})
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. USERS MANAGEMENT TAB */}
      {activeTab === 'users' && <AdminUsers onAction={fetchStats} />}

      {/* 3. LISTINGS MODERATION TAB */}
      {activeTab === 'listings' && <AdminListings onAction={fetchStats} />}

      {/* 4. REPORTS MODERATION TAB */}
      {activeTab === 'reports' && <AdminReports onAction={fetchStats} />}

      {/* 5. GEMINI AI RISK MONITORING TAB */}
      {activeTab === 'ai' && <AdminAiMonitoring onAction={fetchStats} />}

      {/* 6. ACTIVITY LOGS TAB */}
      {activeTab === 'logs' && <AdminActivityLogs />}

    </div>
  );
}
