import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Eye, ShieldAlert, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import RiskBadge from '../../components/common/RiskBadge';
import ReasonActionModal from '../../components/common/ReasonActionModal';

export default function AdminReports({ onAction }) {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reportAction, setReportAction] = useState(null);

  const fetchReports = async (showLoading = true) => {
    if (showLoading) setLoading(true);
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
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const refreshInterval = setInterval(() => fetchReports(false), 5000);
    return () => clearInterval(refreshInterval);
  }, [statusFilter]);

  const handleResolve = (reportId, newStatus, shouldDeactivate) => {
    const listingTitle = reports.find((report) => report._id === reportId)?.listingId?.title || 'this listing';
    const isNoViolation = newStatus === 'Dismissed';
    setReportAction({
      reportId,
      newStatus,
      shouldDeactivate,
      title: isNoViolation ? 'Mark Report: No Violation' : 'Take Down Listing',
      description: isNoViolation
        ? `Confirm that no violation was found for "${listingTitle}". The listing will remain active.`
        : `Confirm removal of "${listingTitle}" from the marketplace.`,
      confirmLabel: isNoViolation ? 'Confirm No Violation' : 'Confirm Takedown',
      confirmClassName: isNoViolation ? 'bg-slate-700 hover:bg-slate-800' : 'bg-rose-600 hover:bg-rose-700',
      initialReason: shouldDeactivate
        ? 'Confirmed scam / fraudulent listing removed upon investigation'
        : isNoViolation
        ? 'Reviewed; no violation found. Listing remains active.'
        : 'Confirmed scam / fraudulent listing removed upon investigation'
    });
  };

  const confirmReportAction = async (adminNotes) => {
    if (!reportAction) return;
    const { reportId, newStatus, shouldDeactivate } = reportAction;
    setActionLoading(reportId);
    try {
      await api.put(`/reports/${reportId}/status`, {
        status: newStatus,
        adminNotes,
        deactivateListing: shouldDeactivate
      });
      setReportAction(null);
      fetchReports();
      if (onAction) onAction();
    } catch (err) {
      throw new Error(err.message || 'Failed to update report status.');
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
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
        >
          <option value="Pending">Pending Review</option>
          <option value="Reviewed">Reviewed</option>
          <option value="Resolved">Resolved</option>
          <option value="Dismissed">No Violation</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3" aria-hidden="true">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No community reports recorded for this status filter.
          </div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Report #</th>
                <th className="py-3 px-4">Reported Listing</th>
                <th className="py-3 px-4">Reason & Explanation</th>
                <th className="py-3 px-4">Reporter</th>
                <th className="py-3 px-4">AI Risk Level</th>
                <th className="py-3 px-4">Reported At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderator Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((rep, index) => {
                const listing = rep.listingId || {};
                return (
                  <tr key={rep._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-md border border-safegreen-200 bg-safegreen-50 px-2.5 py-1 font-bold text-safegreen-800">
                        Report #{index + 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 min-w-[200px]">
                      {listing.title ? (
                        <div>
                          <Link
                            to={`/product/${listing._id}`}
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

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                      {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : '—'}
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
                        {rep.status === 'Dismissed' ? 'No Violation' : rep.status}
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
                            title="Mark the report as reviewed with no violation; keep listing active"
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                          >
                            No Violation
                          </button>
                        </>
                      )}

                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {reportAction && (
        <ReasonActionModal
          key={`${reportAction.reportId}-${reportAction.newStatus}`}
          title={reportAction.title}
          description={reportAction.description}
          initialReason={reportAction.initialReason}
          reasonLabel="Moderator notes"
          confirmLabel={reportAction.confirmLabel}
          confirmClassName={reportAction.confirmClassName}
          onCancel={() => setReportAction(null)}
          onConfirm={confirmReportAction}
        />
      )}

    </div>
  );
}
