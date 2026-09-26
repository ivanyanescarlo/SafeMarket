import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  MessageSquare,
  Star,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Eye
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        const [listingsRes, ratingsRes] = await Promise.all([
          api.get('/listings/seller/my-listings'),
          api.get(`/ratings/seller/${user._id}`)
        ]);

        if (listingsRes.success) setMyListings(listingsRes.listings || []);
        if (ratingsRes.success) setRatings(ratingsRes.ratings || []);
      } catch (err) {
        console.error('Failed to load seller stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?._id) {
      fetchSellerData();
    }
  }, [user]);

  const activeListings = myListings.filter((l) => l.status === 'active');
  const soldListings = myListings.filter((l) => l.status === 'sold');
  const inactiveListings = myListings.filter((l) => l.status === 'inactive' || l.status === 'removed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-safegreen-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-safegreen-700/60 border border-safegreen-500/40 text-safegreen-200 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Seller Mode Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Manage your local listings, check customer reviews, and monitor AI scam compliance in your community.
          </p>
        </div>

        <Link
          to="/seller/create-listing"
          className="px-5 py-3 bg-safegreen-500 hover:bg-safegreen-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post New Listing</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{myListings.length}</p>
          <span className="text-[11px] text-slate-400 block mt-1">All posted inventory</span>
        </div>

        {/* Active Listings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-safegreen-700 uppercase tracking-wider">Active</span>
            <CheckCircle className="w-4 h-4 text-safegreen-600" />
          </div>
          <p className="text-2xl font-extrabold text-safegreen-700 mt-2">{activeListings.length}</p>
          <span className="text-[11px] text-slate-400 block mt-1">Live in marketplace</span>
        </div>

        {/* Sold / Inactive */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sold / Inactive</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">
            {soldListings.length + inactiveListings.length}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">Archived items</span>
        </div>

        {/* Seller Rating */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Seller Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">
            {user?.averageRating > 0 ? user.averageRating.toFixed(1) : 'New'}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">
            {ratings.length} verified ratings
          </span>
        </div>

      </div>

      {/* Main Grid: Recent Listings & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Listings (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              My Recent Listings
            </h2>
            <Link
              to="/seller/listings"
              className="text-xs font-bold text-safegreen-700 hover:underline flex items-center gap-1"
            >
              <span>Manage all listings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading listings...</div>
          ) : myListings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              You haven't posted any second-hand listings yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myListings.slice(0, 5).map((item) => (
                <div key={item._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.images?.[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                        <span className="font-extrabold text-safegreen-800">
                          ₱{item.price?.toLocaleString()}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{item.condition}</span>
                        <span className="text-slate-400">•</span>
                        <span className={`font-semibold ${
                          item.riskLevel === 'High'
                            ? 'text-rose-600'
                            : item.riskLevel === 'Medium'
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}>
                          AI: {item.riskLevel} Risk
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                    <Link
                      to={`/seller/listing/${item._id}/edit`}
                      className="text-xs font-semibold text-safegreen-700 hover:underline px-2 py-1"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Ratings & Shortcuts (1 col) */}
        <div className="space-y-6">
          
          {/* Shortcuts Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Seller Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                to="/seller/create-listing"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-safegreen-50 text-slate-800 hover:text-safegreen-800 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-safegreen-600" />
                  <span>Create New Listing</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/messages"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-safegreen-50 text-slate-800 hover:text-safegreen-800 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Buyer Inquiries</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-safegreen-50 text-slate-800 hover:text-safegreen-800 font-semibold text-xs transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span>View Public Profile</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Customer Reviews Snippet */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Recent Buyer Reviews
            </h3>

            {ratings.length === 0 ? (
              <p className="text-xs text-slate-400">No buyer feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {ratings.slice(0, 3).map((r) => (
                  <div key={r._id} className="p-3 bg-slate-50 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        {r.buyerId?.firstName} {r.buyerId?.lastName}
                      </span>
                      <div className="flex items-center text-amber-500">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold ml-1">{r.rating}</span>
                      </div>
                    </div>
                    {r.feedback && (
                      <p className="text-[11px] text-slate-600 italic">
                        "{r.feedback}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
