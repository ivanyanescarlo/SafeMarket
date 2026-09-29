import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Package,
  Flag,
  Sparkles,
  Activity,
  ShieldAlert,
  PieChart as PieIcon,
  TrendingUp
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import safeMarketLogo from '../../assets/safemarket_logo.png';
import AdminUsers from './AdminUsers';
import AdminListings from './AdminListings';
import AdminReports from './AdminReports';
import AdminAiMonitoring from './AdminAiMonitoring';
import AdminActivityLogs from './AdminActivityLogs';

const PIE_COLORS = [
  '#059669', // safegreen
  '#2563eb', // blue
  '#d97706', // amber
  '#7c3aed', // purple
  '#e11d48', // rose
  '#0d9488', // teal
  '#4f46e5', // indigo
  '#ea580c'  // orange
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, listingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/listings?limit=100')
      ]);

      if (statsRes.success) {
        setStats(statsRes.stats);
        setRecentLogs(statsRes.recentLogs || []);
      }

      if (listingsRes.success && listingsRes.listings) {
        const counts = {};
        listingsRes.listings.forEach((item) => {
          const cat = item.category || 'Other';
          counts[cat] = (counts[cat] || 0) + 1;
        });

        const formattedPie = Object.keys(counts).map((key) => ({
          name: key,
          value: counts[key]
        }));
        setCategoryData(formattedPie);
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
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'listings', label: 'Listings', icon: Package },
    { id: 'reports', label: 'Reports', icon: Flag },
    { id: 'ai', label: 'AI Risk Monitor', icon: Sparkles },
    { id: 'logs', label: 'Activity Logs', icon: ShieldAlert }
  ];

  // Dynamic activity trend from database stats
  const trendData = useMemo(() => {
    if (stats?.weeklyTrend && Array.isArray(stats.weeklyTrend)) {
      return stats.weeklyTrend;
    }
    return [
      { day: 'Mon', listings: 0, users: 0 },
      { day: 'Tue', listings: 0, users: 0 },
      { day: 'Wed', listings: 0, users: 0 },
      { day: 'Thu', listings: 0, users: 0 },
      { day: 'Fri', listings: 0, users: 0 },
      { day: 'Sat', listings: 0, users: 0 },
      { day: 'Sun', listings: 0, users: 0 }
    ];
  }, [stats?.weeklyTrend]);

  const defaultPieData = categoryData.length > 0 ? categoryData : [
    { name: 'Phones & Gadgets', value: 35 },
    { name: 'Computers & Laptops', value: 25 },
    { name: 'Electronics', value: 15 },
    { name: 'Vehicles', value: 10 },
    { name: 'Furniture', value: 15 }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 sticky top-24">
          <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2.5">
            <img
              src={safeMarketLogo}
              alt="SafeMarket Logo"
              className="w-8 h-8 rounded-xl object-contain"
            />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Admin</h2>
            </div>
          </div>

          <nav className="space-y-1.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-safegreen-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-bold flex items-center justify-center text-xs">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'A'}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.firstName} {user?.lastName}</p>
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block uppercase">Admin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="lg:col-span-9 space-y-8 min-w-0">
          
          {/* 1. DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              {/* Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registered Users</span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{stats?.users?.total || 0}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{stats?.users?.sellers || 0} Sellers</span>
                    <span>•</span>
                    <span>{stats?.users?.buyers || 0} Buyers</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Listings</span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{stats?.listings?.total || 0}</p>
                  <span className="text-[11px] text-slate-400 block mt-2">
                    {stats?.listings?.active || 0} currently active
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Reports</span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{stats?.reports?.pending || 0}</p>
                  <span className="text-[11px] text-slate-400 block mt-2">
                    Out of {stats?.reports?.total || 0} total reports
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI High Risk Flags</span>
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">{stats?.listings?.highRisk || 0}</p>
                  <span className="text-[11px] text-slate-400 block mt-2">
                    {stats?.listings?.mediumRisk || 0} Medium risk items
                  </span>
                </div>

              </div>

              {/* Charts Section under Total Board: Left Line Chart & Right Pie Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: Listings & Activity Trend */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-safegreen-600" />
                      <span>Weekly Marketplace Activity</span>
                    </h3>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="listings" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="New Listings" />
                        <Line type="monotone" dataKey="users" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="New Registrations" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Product Category Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <PieIcon className="w-4 h-4 text-safegreen-600" />
                      <span>Product Category Share</span>
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium">Most Listed Items</span>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={defaultPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {defaultPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value, name) => [`${value} items`, name]} />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Audit Security Logs Card */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-safegreen-600" />
                    <span>Recent Security & Audit Logs</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('logs')}
                    className="text-xs font-bold text-safegreen-700 dark:text-safegreen-400 hover:underline"
                  >
                    View All Logs
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center">No logs recorded yet.</p>
                  ) : (
                    recentLogs.slice(0, 8).map((log) => (
                      <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.action}</span>
                          <span className="text-slate-400 block text-[10px]">
                            {(log.userId?.firstName ? `${log.userId.firstName} ${log.userId.lastName || ''}` : log.userId?.username || log.username || 'System').replace(/^@/, '')} • {log.targetType}
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

            </div>
          )}

          {/* 2. USERS MANAGEMENT TAB */}
          {activeTab === 'users' && <AdminUsers onAction={fetchStats} />}

          {/* 3. LISTINGS MODERATION TAB */}
          {activeTab === 'listings' && <AdminListings onAction={fetchStats} />}

          {/* 4. REPORTS MODERATION TAB */}
          {activeTab === 'reports' && <AdminReports onAction={fetchStats} />}

          {/* 5. AI RISK MONITORING TAB */}
          {activeTab === 'ai' && <AdminAiMonitoring onAction={fetchStats} />}

          {/* 6. ACTIVITY LOGS TAB */}
          {activeTab === 'logs' && <AdminActivityLogs />}

        </div>

      </div>

    </div>
  );
}
