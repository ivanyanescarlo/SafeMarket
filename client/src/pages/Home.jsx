import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Sparkles,
  Smartphone,
  Laptop,
  Tv,
  Car,
  Home as HomeIcon,
  Shirt,
  Gamepad2,
  Bike,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import ListingCard from '../components/listing/ListingCard';

const POPULAR_CATEGORIES = [
  { name: 'Mobile Phones & Gadgets', label: 'Phones & Gadgets', icon: Smartphone, color: 'bg-blue-50 text-blue-700' },
  { name: 'Computers & Laptops', label: 'Computers', icon: Laptop, color: 'bg-purple-50 text-purple-700' },
  { name: 'Electronics & Appliances', label: 'Electronics', icon: Tv, color: 'bg-emerald-50 text-emerald-700' },
  { name: 'Vehicles & Auto Parts', label: 'Vehicles', icon: Car, color: 'bg-amber-50 text-amber-700' },
  { name: 'Home & Furniture', label: 'Furniture', icon: HomeIcon, color: 'bg-orange-50 text-orange-700' },
  { name: 'Fashion & Apparel', label: 'Fashion', icon: Shirt, color: 'bg-pink-50 text-pink-700' },
  { name: 'Hobbies, Games & Toys', label: 'Gaming & Toys', icon: Gamepad2, color: 'bg-indigo-50 text-indigo-700' },
  { name: 'Sports & Outdoors', label: 'Sports & Bikes', icon: Bike, color: 'bg-teal-50 text-teal-700' },
];

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const listingsRes = await api.get('/listings?limit=12');
        if (listingsRes.success) {
          setListings(listingsRes.listings || []);
        }
      } catch (err) {
        console.error('Home load error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('search', searchKeyword.trim());
    navigate(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-safegreen-900 via-safegreen-800 to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-safegreen-700/60 border border-safegreen-500/40 text-safegreen-200 text-xs font-bold backdrop-blur-sm">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>AI-Protected Local Second-Hand Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Buy & Sell Locally with <span className="text-safegreen-400">Scam Prevention</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Trade second-hand gadgets, vehicles, and home essentials within your Philippine community. Every listing is analyzed by <strong className="text-white">Gemini AI</strong> to flag unrealistic prices and advance-deposit scams.
          </p>

          {/* Search Box Card */}
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 sm:p-2.5 shadow-2xl border border-white/20 text-slate-800">
            <form onSubmit={handleHeroSearch} className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-3.5 py-2">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder="Search second-hand phones, laptops, bikes, furniture..."
                  className="w-full text-sm sm:text-base text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-safegreen-900/40 flex-shrink-0"
              >
                Search Listings
              </button>
            </form>
          </div>

          {/* Trust badges */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-safegreen-400" />
              Verified Local Profiles
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-safegreen-400" />
              Real-Time Gemini AI Risk Screening
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-safegreen-400" />
              No Advance Payment Traps
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Categories Bar */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Explore by Category
            </h2>
            <Link
              to="/products"
              className="text-xs font-bold text-safegreen-700 hover:text-safegreen-800 flex items-center gap-1"
            >
              <span>See all categories</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {POPULAR_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.name}
                  to={`/products?category=${encodeURIComponent(cat.name)}`}
                  className="flex flex-col items-center justify-center p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-safegreen-400 hover:shadow-md transition-all text-center group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${cat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {cat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured Recent Listings */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Fresh Second-Hand Listings
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pre-screened listings by local community sellers
              </p>
            </div>
            <Link
              to="/products"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              View Catalog
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No active listings yet</h3>
              <p className="text-xs text-slate-500 mt-1">Be the first to list an item in your area!</p>
              <Link
                to="/seller/create-listing"
                className="mt-4 inline-block px-4 py-2 bg-safegreen-600 text-white font-bold text-xs rounded-lg"
              >
                Post a Listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {listings.map((item) => (
                <ListingCard key={item._id} listing={item} />
              ))}
            </div>
          )}
        </section>

        {/* SafeMarket Scam Prevention Feature Highlight */}
        <section className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 rounded-3xl p-6 sm:p-10 border border-emerald-200 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-safegreen-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-safegreen-200">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Gemini AI Risk Screening</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Every product title, description, and price is scanned by Google Gemini AI to highlight high-pressure tactics or impossible prices.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-200">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Advance Deposit Warnings</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  SafeMarket explicitly flags requests for unverified downpayments or shipping fees before you have held the item in person.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-200">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Local Philippine Trading</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Browse products filtered by your exact Province and City. Meet at shopping mall security hubs or local public venues.
                </p>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
