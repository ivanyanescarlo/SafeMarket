import React, { useState, useEffect } from 'react';
import { Activity, Search, Shield, Filter } from 'lucide-react';
import api from '../../services/api';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
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

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-safegreen-600" />
            <span>System & Security Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable log of user registrations, seller activations, logins, listing edits, and admin moderations
          </p>
        </div>

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

      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading activity logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No activity logs recorded.</div>
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
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block text-xs">
                      {log.userEmail || log.userId?.email || 'Anonymous / System'}
                    </span>
                    {log.userId?.username && (
                      <span className="text-[10px] text-slate-400">@{log.userId.username}</span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {log.targetType}
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <span className="text-[11px] text-slate-600 block truncate font-mono">
                      {typeof log.details === 'object'
                        ? JSON.stringify(log.details)
                        : String(log.details)}
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
