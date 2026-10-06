import React, { useState, useEffect } from 'react';
import { Activity, Search } from 'lucide-react';
import api from '../../services/api';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (targetTypeFilter !== 'All') params.set('targetType', targetTypeFilter);

      const res = await api.get(`/admin/logs?${params.toString()}`);
      if (res.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter]);

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    
    // Construct clean user string without @ and email
    let userStr = 'System';
    if (log.userId?.firstName) {
      userStr = `${log.userId.firstName} ${log.userId.lastName || ''}`;
    } else if (log.userId?.username) {
      userStr = log.userId.username;
    } else if (log.username) {
      userStr = log.username;
    }

    const action = (log.action || '').toLowerCase();
    const targetType = (log.targetType || '').toLowerCase();
    const details = (
      typeof log.details === 'object'
        ? JSON.stringify(log.details)
        : String(log.details || '')
    ).toLowerCase();

    return (
      userStr.toLowerCase().includes(query) ||
      action.includes(query) ||
      targetType.includes(query) ||
      details.includes(query)
    );
  });

  const getCleanUserDisplay = (log) => {
    if (log.userId?.firstName) {
      return `${log.userId.firstName} ${log.userId.lastName || ''}`.trim();
    }
    if (log.userId?.username) {
      return log.userId.username.replace(/^@/, '');
    }
    if (log.username) {
      return log.username.replace(/^@/, '');
    }
    return 'System';
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      {/* Top Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-safegreen-600" />
            <span>System & Security Audit Logs</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={50}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, user, details..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
          </div>

          {/* Event Filter */}
          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="All">All Event Types</option>
            <option value="User">User Events</option>
            <option value="Listing">Listing Events</option>
            <option value="Report">Report Events</option>
            <option value="Auth">Authentication Events</option>
            <option value="System">System Events</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activity logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No activity logs match your search.</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                  {/* 1. Timestamp */}
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-medium">
                    {new Date(log.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>

                  {/* 2. Action */}
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>

                  {/* 3. User - Clean display without email and without @ */}
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {getCleanUserDisplay(log)}
                  </td>

                  {/* 4. Target Type */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {log.targetType}
                  </td>

                  {/* 5. Details */}
                  <td className="py-3 px-4 max-w-sm">
                    <span className="text-[11px] text-slate-600 block truncate font-mono">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details)
                        : String(log.details || '')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
