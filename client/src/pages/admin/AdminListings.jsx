import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Trash2, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';
import api from '../../services/api';
import RiskBadge from '../../components/common/RiskBadge';

export default function AdminListings({ onAction }) {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (riskFilter !== 'All') params.set('riskLevel', riskFilter);

      const res = await api.get(`/admin/listings?${params.toString()}`);
      if (res.success) {
        setListings(res.listings || []);
      }
    } catch (err) {
      console.error('Failed to load admin listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [statusFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleModerate = async (listing, newStatus) => {
    let reason = '';
    if (newStatus === 'removed') {
      reason = prompt(
        'Reason for taking down this listing:',
        'Violated SafeMarket scam prevention policies / advance deposit request'
      );
      if (reason === null) return;
    } else {
      if (!confirm(`Set status of "${listing.title}" to ${newStatus}?`)) return;
    }

    setActionLoading(listing._id);
    try {
      await api.put(`/admin/listings/${listing._id}/moderate`, {
        status: newStatus,
        removalReason: reason
      });
      fetchListings();
      if (onAction) onAction();
    } catch (err) {
      alert(err.message || 'Failed to moderate listing.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Marketplace Listings Moderation
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product title..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
          </form>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="All">All Risk Levels</option>
            <option value="High">High Risk Only</option>
            <option value="Medium">Medium Risk Only</option>
            <option value="Low">Low Risk Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="removed">Removed by Admin</option>
            <option value="sold">Sold</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No listings found matching criteria.</div>
        ) : (
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Seller</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">AI Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((item) => (
                <tr
                  key={item._id}
                  onDoubleClick={() => navigate(`/product/${item._id}`)}
                  title="Double click to view product details"
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                >
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                      alt=""
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0 max-w-xs">
                      <span className="font-bold text-slate-900 hover:text-safegreen-700 truncate block text-xs">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {item.category} • {item.location?.cityMunicipality}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-800">
                    <span className="font-semibold block">{item.sellerId?.firstName} {item.sellerId?.lastName}</span>
                    <span className="text-[10px] text-slate-400">@{item.sellerId?.username}</span>
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900">
                    ₱{item.price?.toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    <RiskBadge level={item.riskLevel} />
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'removed'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.status}
                    </span>
                    {item.removalReason && (
                      <span className="text-[9px] text-rose-600 block italic max-w-xs truncate mt-0.5">
                        {item.removalReason}
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right space-x-2">
                    {item.status !== 'removed' ? (
                      <button
                        type="button"
                        disabled={actionLoading === item._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModerate(item, 'removed');
                        }}
                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold border border-rose-200"
                      >
                        Take Down
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={actionLoading === item._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleModerate(item, 'active');
                        }}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200"
                      >
                        Restore
                      </button>
                    )}
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
