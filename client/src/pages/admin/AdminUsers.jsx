import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminUsers({ onAction }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

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

  const handleSuspendUser = async (user) => {
    const daysInput = prompt(`How many days should @${user.username} be suspended?`, '7');
    if (daysInput === null) return;

    const days = Number(daysInput);
    if (!Number.isFinite(days) || days <= 0) {
      alert('Please enter a valid number of days greater than zero.');
      return;
    }

    const reason = prompt(
      `Please provide a reason for suspending @${user.username}:`,
      'Policy violation / suspicious activity'
    );
    if (reason === null) return;

    setActionLoading(user._id);
    try {
      await api.put(`/admin/users/${user._id}/status`, {
        status: 'suspended',
        days,
        reason
      });
      fetchUsers();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message || 'Failed to suspend user.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlockUser = async (user) => {
    const reason = prompt(
      `This will permanently block @${user.username}. Enter a reason:`,
      'Permanent violation / severe policy breach'
    );
    if (reason === null) return;

    setActionLoading(user._id);
    try {
      await api.put(`/admin/users/${user._id}/status`, {
        status: 'blocked',
        reason
      });
      fetchUsers();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message || 'Failed to block user.');
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
                            onClick={() => handleBlockUser(u)}
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
                            onClick={() => handleBlockUser(u)}
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

    </div>
  );
}
