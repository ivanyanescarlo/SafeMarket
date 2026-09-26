import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import RiskBadge from '../../components/common/RiskBadge';

export default function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchMyListings = async () => {
    try {
      const data = await api.get('/listings/seller/my-listings');
      if (data.success) {
        setListings(data.listings || []);
      }
    } catch (err) {
      console.error('Failed to load listings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyListings();
  }, []);

  const handleMarkAsSold = async (id) => {
    if (!confirm('Mark this listing as Sold?')) return;
    setActionLoading(id);
    try {
      await api.put(`/listings/${id}`, { status: 'sold' });
      fetchMyListings();
    } catch (err) {
      alert(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm('Are you sure you want to deactivate/delete this listing?')) return;
    setActionLoading(id);
    try {
      await api.delete(`/listings/${id}`);
      fetchMyListings();
    } catch (err) {
      alert(err.message || 'Failed to deactivate listing.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Manage My Listings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View, edit, deactivate, or mark items as sold
          </p>
        </div>

        <Link
          to="/seller/create-listing"
          className="px-4 py-2.5 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-safegreen-200 flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Item</span>
        </Link>
      </div>

      {/* Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading your listings...
          </div>
        ) : listings.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No Listings Yet</h3>
            <p className="text-xs text-slate-500 mt-1">Start selling your pre-loved goods today.</p>
            <Link
              to="/seller/create-listing"
              className="mt-4 inline-block px-4 py-2 bg-safegreen-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Post a Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">AI Risk Screening</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listings.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 flex items-center gap-3">
                      <img
                        src={item.images?.[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                        alt=""
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="min-w-0 max-w-xs">
                        <Link
                          to={`/product/${item._id}`}
                          className="font-bold text-slate-900 hover:text-safegreen-700 truncate block text-xs"
                        >
                          {item.title}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {item.condition} • {item.location?.cityMunicipality}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.category}
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      ₱{item.price?.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4">
                      <RiskBadge level={item.riskLevel} />
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'sold'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/product/${item._id}`}
                        title="View Public Listing"
                        className="p-1.5 inline-block text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/seller/listing/${item._id}/edit`}
                        title="Edit Details"
                        className="p-1.5 inline-block text-slate-600 hover:text-safegreen-700 rounded-lg hover:bg-slate-100"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>

                      {item.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleMarkAsSold(item._id)}
                          title="Mark as Sold"
                          disabled={actionLoading === item._id}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(item._id)}
                        title="Deactivate Listing"
                        disabled={actionLoading === item._id}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
