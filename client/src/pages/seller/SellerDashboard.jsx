import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  MessageSquare,
  Star,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Eye,
  Calendar as CalendarIcon,
  ChevronDown,
  DollarSign,
  X,
  Filter
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salesDateRange, setSalesDateRange] = useState();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const popoverRef = useRef(null);

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

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeListings = myListings.filter((l) => l.status === 'active');
  const soldListings = myListings.filter((l) => l.status === 'sold');
  const inactiveListings = myListings.filter((l) => l.status === 'inactive' || l.status === 'removed');

  const filteredSoldListings = salesDateRange?.from
    ? soldListings.filter(l => {
        const dateStr = l.soldAt ? l.soldAt : l.updatedAt;
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);

        const afterStart = salesDateRange.from ? d >= startOfDay(salesDateRange.from) : true;
        const beforeEnd = salesDateRange.to ? d <= endOfDay(salesDateRange.to) : (salesDateRange.from ? d >= startOfDay(salesDateRange.from) && d <= endOfDay(salesDateRange.from) : true);
        return afterStart && beforeEnd;
      })
    : soldListings;

  const totalSalesAmount = filteredSoldListings.reduce((sum, item) => sum + (item.price || 0), 0);
  const grandTotalEarnings = soldListings.reduce((sum, item) => sum + (item.price || 0), 0);

  const chartData = useMemo(() => {
    const salesByDate = {};
    filteredSoldListings.forEach(item => {
      const dateStr = item.soldAt ? item.soldAt : item.updatedAt;
      const formatted = format(new Date(dateStr), 'MMM dd');
      if (!salesByDate[formatted]) salesByDate[formatted] = 0;
      salesByDate[formatted] += (item.price || 0);
    });
    return Object.keys(salesByDate).map(date => ({
      date,
      earnings: salesByDate[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredSoldListings]);

  const maxDate = new Date();
  const minDate = user?.createdAt ? new Date(user.createdAt) : undefined;

  // Preset Date Range Setters
  const handlePreset = (preset) => {
    const today = new Date();
    if (preset === 'today') {
      setSalesDateRange({ from: today, to: today });
    } else if (preset === '7days') {
      setSalesDateRange({ from: subDays(today, 6), to: today });
    } else if (preset === '30days') {
      setSalesDateRange({ from: subDays(today, 29), to: today });
    } else if (preset === 'all') {
      setSalesDateRange(undefined);
    }
    setIsCalendarOpen(false);
  };

  // Label text for date range button
  const dateRangeLabel = useMemo(() => {
    if (!salesDateRange?.from) return 'All Time Sales';
    if (!salesDateRange.to || salesDateRange.from.toDateString() === salesDateRange.to.toDateString()) {
      return format(salesDateRange.from, 'MMMM d, yyyy');
    }
    return `${format(salesDateRange.from, 'MMM d, yyyy')} - ${format(salesDateRange.to, 'MMM d, yyyy')}`;
  }, [salesDateRange]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-safegreen-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-safegreen-500/20 border border-safegreen-400/30 text-safegreen-300 text-xs font-bold mb-3 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verified Seller Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Track your second-hand product performance, manage sales history analytics, and respond to local buyers safely.
          </p>
        </div>

        <Link
          to="/seller/create-listing"
          className="px-5 py-3 bg-safegreen-500 hover:bg-safegreen-400 text-slate-950 font-extrabold text-sm rounded-2xl shadow-lg shadow-safegreen-900/30 transition-all flex items-center gap-2 flex-shrink-0"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post New Item</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Earnings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales Earned</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              ₱
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">₱{grandTotalEarnings.toLocaleString()}</p>
          <span className="text-[11px] text-emerald-600 font-semibold block mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> All-time completed sales
          </span>
        </div>

        {/* Active Inventory */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-safegreen-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Products</span>
            <div className="w-8 h-8 rounded-xl bg-safegreen-50 text-safegreen-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-safegreen-800 mt-3">{activeListings.length}</p>
          <span className="text-[11px] text-slate-400 block mt-1">Currently live for trading</span>
        </div>

        {/* Total Items Sold */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Items Sold</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3">{soldListings.length}</p>
          <span className="text-[11px] text-slate-400 block mt-1">Successfully marked sold</span>
        </div>

        {/* Seller Rating */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Seller Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3">
            {user?.averageRating > 0 ? user.averageRating.toFixed(1) : 'New'}
          </p>
          <span className="text-[11px] text-slate-400 block mt-1">
            {ratings.length} verified review{ratings.length !== 1 ? 's' : ''}
          </span>
        </div>

      </div>

      {/* Analytics & Sales History Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Header with Range Popover Dropdown */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Sales History & Performance Analytics
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Filter earnings and sold items by specific date ranges
            </p>
          </div>

          {/* Sleek Date Range Dropdown Popover */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 transition-all flex items-center gap-2.5 shadow-xs focus:ring-2 focus:ring-safegreen-500"
            >
              <CalendarIcon className="w-4 h-4 text-safegreen-600" />
              <span>{dateRangeLabel}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Calendar Card */}
            {isCalendarOpen && (
              <div className="absolute right-0 mt-2 z-50 bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 w-auto min-w-[320px] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Select Date Range</span>
                  <button onClick={() => setIsCalendarOpen(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
                  <button onClick={() => handlePreset('today')} className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-safegreen-100 hover:text-safegreen-800 text-slate-700 rounded-lg transition-colors">Today</button>
                  <button onClick={() => handlePreset('7days')} className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-safegreen-100 hover:text-safegreen-800 text-slate-700 rounded-lg transition-colors">Last 7 Days</button>
                  <button onClick={() => handlePreset('30days')} className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-safegreen-100 hover:text-safegreen-800 text-slate-700 rounded-lg transition-colors">Last 30 Days</button>
                  <button onClick={() => handlePreset('all')} className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-safegreen-100 hover:text-safegreen-800 text-slate-700 rounded-lg transition-colors">All Time</button>
                </div>

                <div className="flex justify-center scale-95 transform -my-2">
                  <DayPicker
                    mode="range"
                    selected={salesDateRange}
                    onSelect={(range) => {
                      setSalesDateRange(range);
                    }}
                    disabled={{ after: maxDate, before: minDate }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSalesDateRange(undefined);
                      setIsCalendarOpen(false);
                    }}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    Reset Filter
                  </button>
                  <button
                    onClick={() => setIsCalendarOpen(false)}
                    className="px-3 py-1.5 bg-safegreen-600 text-white rounded-xl text-xs font-bold hover:bg-safegreen-700"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Summary Bar & Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Summary Box */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-6 text-white space-y-4 shadow-md">
            <div>
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Filtered Period Earnings</span>
              <p className="text-3xl font-black text-white mt-1">₱{totalSalesAmount.toLocaleString()}</p>
            </div>
            
            <div className="pt-3 border-t border-emerald-800/60 flex items-center justify-between text-xs text-emerald-200 font-semibold">
              <span>Items Sold in Range:</span>
              <span className="font-extrabold text-white text-base">{filteredSoldListings.length}</span>
            </div>
          </div>

          {/* Chart View */}
          <div className="lg:col-span-2 h-44 w-full bg-slate-50/70 border border-slate-100 rounded-2xl p-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `₱${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                    formatter={(val) => [`₱${val.toLocaleString()}`, 'Earnings']}
                  />
                  <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                No sales data recorded for the selected filter range.
              </div>
            )}
          </div>
        </div>

        {/* Filtered Sold Items Grid */}
        <div>
          <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-3">
            Sold Items ({filteredSoldListings.length})
          </h3>

          {filteredSoldListings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No items match this date filter range.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSoldListings.map((item) => (
                <div key={item._id} className="flex items-center gap-3 p-3.5 border border-slate-200/70 rounded-2xl bg-slate-50/50 hover:bg-slate-100/80 transition-all group">
                  <img
                    src={item.images?.[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200'}
                    alt=""
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-safegreen-700 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs font-black text-safegreen-700 mt-0.5">
                      ₱{item.price?.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Sold: {item.soldAt ? format(new Date(item.soldAt), 'MMM d, yyyy') : format(new Date(item.updatedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Main Grid: My Recent Listings & Customer Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Listings (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-black text-slate-900">
              My Active & Recent Listings
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
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                      item.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status}
                    </span>
                    <Link
                      to={`/seller/listing/${item._id}/edit`}
                      className="text-xs font-bold text-safegreen-700 hover:underline px-2 py-1"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Reviews Snippet */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Recent Buyer Reviews
            </h3>
            <Link to={`/profile/${user._id}`} className="text-xs font-bold text-safegreen-700 hover:underline">
              View All
            </Link>
          </div>

          {ratings.length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No buyer feedback received yet.</p>
          ) : (
            <div className="space-y-3">
              {ratings.slice(0, 4).map((r) => (
                <div key={r._id} className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {r.buyerId?.firstName} {r.buyerId?.lastName}
                    </span>
                    <div className="flex items-center text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold ml-1">{r.rating}</span>
                    </div>
                  </div>
                  {r.listingId?.title && (
                    <p className="text-[11px] text-slate-500 font-semibold truncate">
                      Bought: {r.listingId.title}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    {r.feedback ? (
                      <p className="text-[11px] text-slate-600 italic truncate max-w-[180px]">
                        "{r.feedback}"
                      </p>
                    ) : <span />}
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {format(new Date(r.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
