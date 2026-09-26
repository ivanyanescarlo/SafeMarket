import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Eye, ShieldAlert, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import RiskBadge from '../../components/common/RiskBadge';

export default function AdminReports({ onAction }) {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const res = await api.get(`/reports?${params.toString()}`);
      if (res.success) {
        setReports(res.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const handleResolve = async (reportId, newStatus, shouldDeactivate) => {
    const adminNotes = prompt(
      `Enter admin notes / explanation for status: ${newStatus}:`,
      shouldDeactivate
        ? 'Confirmed scam / fraudulent listing removed upon investigation'
        : 'Reviewed and confirmed compliant'
    );
    if (adminNotes === null) return;

    setActionLoading(reportId);
    try {
      await api.put(`/reports/${reportId}/status`, {
        status: newStatus,
        adminNotes,
        deactivateListing: shouldDeactivate
      });
      fetchReports();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message || 'Failed to update report status.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-rose-600" />
            <span>Community Scam & Safety Reports</span>
          </h2>
          <p className="text-xs text-slate-500">
            Investigate suspicious listings reported by buyers and enforce community safety
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending Review</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Resolved">Resolved</option>
          <option value="Dismissed">Dismissed</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No community reports recorded for this status filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Reported Listing</th>
                <th className="py-3 px-4">Reason & Explanation</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">AI Risk Level</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderator Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((rep) => {
                const listing = rep.listingId || {};
                return (
                  <tr key={rep._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 min-w-[200px]">
                      {listing.title ? (
                        <div>
                          <Link
                            to={`/product/${listing._id}`}
                            target="_blank"
                            className="font-bold text-slate-900 hover:text-safegreen-700 block text-xs"
                          >
                            {listing.title}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            Seller: @{listing.sellerId?.username}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Listing was removed</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="font-bold text-rose-700 block text-xs">
                        {rep.reason}
                      </span>
                      {rep.description ? (
                        <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                          "{rep.description}"
                        </p>
                      ) : (
                        <span className="text-[10px] text-slate-400">No additional notes</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-semibold block">
                        {rep.reporterId?.firstName} {rep.reporterId?.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        @{rep.reporterId?.username}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <RiskBadge level={listing.riskLevel || 'Low'} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rep.status === 'Pending'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : rep.status === 'Resolved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {rep.status === 'Pending' && (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === rep._id}
                            onClick={() => handleResolve(rep._id, 'Resolved', true)}
                            title="Resolve report and take down listing"
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                          >
                            Takedown Item
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === rep._id}
                            onClick={() => handleResolve(rep._id, 'Dismissed', false)}
                            title="Dismiss false report"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          >
                            Dismiss
                          </button>
                        </>
                      )}

                      {rep.status !== 'Pending' && (
                        <button
                          type="button"
                          disabled={actionLoading === rep._id}
                          onClick={() => handleResolve(rep._id, 'Pending', false)}
                          className="text-xs font-semibold text-safegreen-700 hover:underline"
                        >
                          Reopen
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
