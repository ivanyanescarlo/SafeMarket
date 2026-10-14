import React, { useState, useEffect, useRef } from 'react';
import { Activity, Search } from 'lucide-react';
import api from '../../services/api';

export default function AdminActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('All');
  const [dateFilterValue, setDateFilterValue] = useState('');
  const [timeFilterValue, setTimeFilterValue] = useState('');
  const [timePeriodFilterValue, setTimePeriodFilterValue] = useState('AM');
  const [loading, setLoading] = useState(true);
  const hoursInputRef = useRef(null);
  const minutesInputRef = useRef(null);
  const [timeHours = '', timeMinutes = ''] = timeFilterValue.split(':');

  const updateTimeSegment = (segment, value, shouldAdvance = true) => {
    const digits = value.replace(/\D/g, '').slice(0, 2);
    const nextHours = segment === 'hours' ? digits : timeHours;
    const nextMinutes = segment === 'minutes' ? digits : timeMinutes;
    setTimeFilterValue(nextHours || nextMinutes ? `${nextHours}:${nextMinutes}` : '');

    if (shouldAdvance && segment === 'hours' && digits.length === 2) {
      minutesInputRef.current?.focus();
    }
  };

  const handleTimeSegmentKeyDown = (event, segment) => {
    if (event.key === 'ArrowRight' && segment === 'hours') {
      event.preventDefault();
      minutesInputRef.current?.focus();
    } else if (event.key === 'ArrowLeft' && segment === 'minutes') {
      event.preventDefault();
      hoursInputRef.current?.focus();
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const currentValue = Number(segment === 'hours' ? timeHours : timeMinutes);
      const min = segment === 'hours' ? 1 : 0;
      const max = segment === 'hours' ? 12 : 59;
      const step = event.key === 'ArrowUp' ? 1 : -1;
      const nextValue = Number.isNaN(currentValue)
        ? min
        : ((currentValue - min + step + (max - min + 1)) % (max - min + 1)) + min;
      updateTimeSegment(segment, String(nextValue).padStart(2, '0'), false);
    }
  };

  const getCombinedDateTime = () => {
    if (!dateFilterValue) return '';
    const base = new Date(dateFilterValue);
    if (timeFilterValue) {
      let [hours, minutes] = timeFilterValue.split(':').map(Number);
      if (Number.isNaN(hours) || Number.isNaN(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return '';
      if (timePeriodFilterValue === 'PM' && hours < 12) hours += 12;
      if (timePeriodFilterValue === 'AM' && hours === 12) hours = 0;
      base.setHours(hours, minutes, 0, 0);
    }
    return base.toISOString();
  };

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
  }, [targetTypeFilter, dateFilterValue, timeFilterValue, timePeriodFilterValue]);

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
    const ip = (log.ip || '').toLowerCase();
    const url = (log.url || '').toLowerCase();
    const email = (log.userId?.email || log.email || '').toLowerCase();
    const details = (
      typeof log.details === 'object'
        ? JSON.stringify(log.details)
        : String(log.details || '')
    ).toLowerCase();

    return (
      userStr.toLowerCase().includes(query) ||
      email.includes(query) ||
      action.includes(query) ||
      targetType.includes(query) ||
      ip.includes(query) ||
      url.includes(query) ||
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDateFilterValue('');
                setTimeFilterValue('');
                setTimePeriodFilterValue('AM');
              }}
              className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Reset
            </button>

            <input
              type="date"
              value={dateFilterValue}
              onChange={(e) => setDateFilterValue(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-slate-300 rounded-xl text-[11px] font-semibold"
            />

            <div className="inline-flex items-center overflow-hidden rounded-xl border border-slate-300 bg-slate-50 focus-within:ring-2 focus-within:ring-safegreen-500">
              <input
                ref={hoursInputRef}
                type="text"
                inputMode="numeric"
                placeholder="__"
                value={timeHours}
                maxLength={2}
                onChange={(e) => updateTimeSegment('hours', e.target.value)}
                onKeyDown={(e) => handleTimeSegmentKeyDown(e, 'hours')}
                aria-label="Hours"
                className="w-7 bg-transparent py-1 pl-2 text-right text-[11px] font-semibold focus:outline-none"
              />
              <span aria-hidden="true" className="py-1 text-[11px] font-semibold">:</span>
              <input
                ref={minutesInputRef}
                type="text"
                inputMode="numeric"
                placeholder="__"
                value={timeMinutes}
                maxLength={2}
                onChange={(e) => updateTimeSegment('minutes', e.target.value)}
                onKeyDown={(e) => handleTimeSegmentKeyDown(e, 'minutes')}
                aria-label="Minutes"
                className="w-7 bg-transparent py-1 pr-2 text-left text-[11px] font-semibold focus:outline-none"
              />
              <select
                value={timePeriodFilterValue}
                onChange={(e) => setTimePeriodFilterValue(e.target.value)}
                aria-label="AM or PM"
                className="border-l border-slate-300 bg-slate-100 px-1.5 py-1 text-[11px] font-semibold focus:outline-none"
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={50}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, user, IP, URL..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
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
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3" aria-hidden="true">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No activity logs match your search.</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">URL</th>
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
                      minute: '2-digit',
                      hour12: false
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

                  <td className="py-3 px-4 text-slate-600">
                    {log.userId?.email || log.email || '—'}
                  </td>

                  {/* 4. Target Type */}
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {log.targetType}
                  </td>

                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono">
                    {log.ip || '—'}
                  </td>

                  <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono" title={log.url || ''}>
                    {log.url || '—'}
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
