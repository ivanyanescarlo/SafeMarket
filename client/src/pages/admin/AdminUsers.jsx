import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import ReasonActionModal from '../../components/common/ReasonActionModal';

export default function AdminUsers({ onAction }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [suspendUser, setSuspendUser] = useState(null);
  const [blockUser, setBlockUser] = useState(null);
  const [suspensionDuration, setSuspensionDuration] = useState('7');
  const [suspensionUnit, setSuspensionUnit] = useState('day');
  const [suspensionReason, setSuspensionReason] = useState('Policy violation / suspicious activity');
  const [suspensionError, setSuspensionError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'All') params.set('role', roleFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      if (res.success) {
        const visibleUsers = (res.users || []).filter(
          (u) => u._id !== currentUser?._id && u.role !== 'admin'
        );
        setUsers(visibleUsers);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleSuspendUser = (user) => {
    setSuspendUser(user);
    setSuspensionDuration('7');
    setSuspensionUnit('day');
    setSuspensionReason('Policy violation / suspicious activity');
    setSuspensionError('');
  };

  const submitSuspension = async (event) => {
    event.preventDefault();
    const duration = Number(suspensionDuration);
    if (!Number.isInteger(duration) || duration <= 0) {
      setSuspensionError('Enter a whole number greater than zero.');
      return;
    }

    if (!suspensionReason.trim()) {
      setSuspensionError('Enter a reason for the suspension.');
      return;
    }

    setActionLoading(suspendUser._id);
    try {
      await api.put(`/admin/users/${suspendUser._id}/status`, {
        status: 'suspended',
        duration,
        durationUnit: suspensionUnit,
        reason: suspensionReason.trim()
      });
      setSuspendUser(null);
      fetchUsers();
      if (onAction) onAction();
    } catch (err) {
      setSuspensionError(err.message || 'Failed to suspend user.');
    } finally {
      setActionLoading(null);
    }
  };

  const confirmBlockUser = async (reason) => {
    if (!blockUser) return;
    setActionLoading(blockUser._id);
    try {
      await api.put(`/admin/users/${blockUser._id}/status`, {
        status: 'blocked',
        reason
      });
      setBlockUser(null);
      fetchUsers();
      if (onAction) onAction();
    } catch (err) {
      throw new Error(err.message || 'Failed to block user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestoreUser = async (user) => {
    const reason = prompt(
      `Please provide a reason for restoring @${user.username}:`,
      'Account restored after review'
    );
    if (reason === null) return;

    setActionLoading(user._id);
    try {
      await api.put(`/admin/users/${user._id}/status`, {
        status: 'active',
        reason
      });
      fetchUsers();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message || 'Failed to restore user.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      {/* Top Filter Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            User Account Management
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Only accounts that have completed email verification are shown.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={50}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, username, email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
          </form>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="All">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-6 space-y-3" aria-hidden="true">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No users match your criteria.</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact & Location</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered</th>
                <th className="py-3 px-4 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 flex items-center gap-2.5">
                    {u.profileImage ? (
                      <img
                        src={u.profileImage}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-bold text-xs">
                        {u.firstName ? u.firstName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="text-[10px] text-slate-400">@{u.username}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-700">
                    <span className="block font-medium">{u.email}</span>
                    <span className="text-[11px] text-slate-400">
                      {u.location?.cityMunicipality}, {u.location?.province}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className="inline-block px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                    >
                      {u.role === 'admin' ? 'Administrator' : u.role === 'seller' ? 'Seller' : 'Buyer'}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        u.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : u.status === 'blocked'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {u.status === 'blocked' ? 'Blocked' : u.status === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2 flex-wrap justify-end">
                      {u.status === 'active' ? (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === u._id}
                            onClick={() => handleSuspendUser(u)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                          >
                            Suspend
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === u._id}
                            onClick={() => setBlockUser(u)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          >
                            Block
                          </button>
                        </>
                      ) : u.status === 'suspended' ? (
                        <>
                          <button
                            type="button"
                            disabled={actionLoading === u._id}
                            onClick={() => handleRestoreUser(u)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          >
                            Unsuspend
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading === u._id}
                            onClick={() => setBlockUser(u)}
                            className="px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          >
                            Block
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={actionLoading === u._id}
                          onClick={() => handleRestoreUser(u)}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        >
                          Unblock
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {suspendUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="presentation">
          <form
            onSubmit={submitSuspension}
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suspension-dialog-title"
          >
            <div>
              <h3 id="suspension-dialog-title" className="text-base font-bold text-slate-900">
                Suspend @{suspendUser.username}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Choose how long the account should be suspended.</p>
            </div>

            <div>
              <label htmlFor="suspension-duration" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Duration
              </label>
              <div className="flex gap-2">
                <input
                  id="suspension-duration"
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={suspensionDuration}
                  onChange={(event) => setSuspensionDuration(event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500"
                />
                <select
                  aria-label="Suspension duration unit"
                  value={suspensionUnit}
                  onChange={(event) => setSuspensionUnit(event.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
                >
                  <option value="day">Day(s)</option>
                  <option value="month">Month(s)</option>
                  <option value="year">Year(s)</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="suspension-reason" className="mb-1.5 block text-xs font-semibold text-slate-700">
                Reason
              </label>
              <textarea
                id="suspension-reason"
                rows={3}
                maxLength={500}
                required
                value={suspensionReason}
                onChange={(event) => setSuspensionReason(event.target.value)}
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
            </div>

            {suspensionError && <p role="alert" className="text-xs font-medium text-rose-700">{suspensionError}</p>}

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                disabled={actionLoading === suspendUser._id}
                onClick={() => setSuspendUser(null)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading === suspendUser._id}
                className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {actionLoading === suspendUser._id ? 'Suspending...' : 'Confirm Suspension'}
              </button>
            </div>
          </form>
        </div>
      )}

      {blockUser && (
        <ReasonActionModal
          key={blockUser._id}
          title={`Block @${blockUser.username}`}
          description="This permanently blocks the account. Add the reason that will be recorded for this action."
          initialReason="Permanent violation / severe policy breach"
          confirmLabel="Confirm Block"
          onCancel={() => setBlockUser(null)}
          onConfirm={confirmBlockUser}
        />
      )}

    </div>
  );
}
