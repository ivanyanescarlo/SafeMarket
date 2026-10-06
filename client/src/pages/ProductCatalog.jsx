import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import api from '../services/api';
import ListingCard from '../components/listing/ListingCard';
import LocationSelector from '../components/common/LocationSelector';
import CustomSelect from '../components/common/CustomSelect';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Mobile Phones & Gadgets',
  'Computers & Laptops',
  'Electronics & Appliances',
  'Vehicles & Auto Parts',
  'Home & Furniture',
  'Fashion & Apparel',
  'Hobbies, Games & Toys',
  'Sports & Outdoors',
  'Books & Education',
  'Other Second-Hand'
];

const CONDITIONS = [
  'All',
  'Brand New',
  'Like New',
  'Lightly Used',
  'Well Used',
  'Heavily Used'
];

const RISK_LEVELS = ['All', 'Low', 'Medium', 'High'];

export default function ProductCatalog() {
  const { isAdmin } = useAuth();
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States initialized from URL
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [condition, setCondition] = useState(searchParams.get('condition') || 'All');
  const [province, setProvince] = useState(searchParams.get('province') || '');
  const [cityMunicipality, setCityMunicipality] = useState(searchParams.get('city') || '');
  const [riskLevel, setRiskLevel] = useState(searchParams.get('riskLevel') || 'All');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if URL search query changes
  useEffect(() => {
    if (searchParams.get('category')) {
      setCategory(searchParams.get('category'));
    }
    if (searchParams.get('province')) {
      setProvince(searchParams.get('province'));
    }
  }, [searchParams]);

  // Fetch listings from MongoDB Express API
  const fetchListings = async (searchValue = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchValue) params.set('search', searchValue);
      if (category && category !== 'All') params.set('category', category);
      if (condition && condition !== 'All') params.set('condition', condition);
      if (province && province !== 'All') params.set('province', province);
      if (cityMunicipality && cityMunicipality !== 'All') params.set('cityMunicipality', cityMunicipality);
      if (riskLevel && riskLevel !== 'All') params.set('riskLevel', riskLevel);
      if (sort) params.set('sort', sort);

      // Keep URL in sync
      setSearchParams(params, { replace: true });

      const data = await api.get(`/listings?${params.toString()}`);
      if (data.success) {
        setListings(data.listings || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== search) {
      setSearch(urlSearch);
      fetchListings(urlSearch);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [category, condition, sort, province, cityMunicipality, riskLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchListings();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('All');
    setCondition('All');
    setProvince('');
    setCityMunicipality('');
    setRiskLevel('All');
    setSort('newest');
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-safegreen-700 bg-safegreen-50 border border-safegreen-200 px-3 py-1 rounded-full">
            Second-Hand Marketplace
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
            Philippine Verified Items
          </h1>
        </div>

        {/* Search input in catalog */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-[420px]">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              maxLength={50}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-safegreen-600 hover:bg-safegreen-700 text-white font-extrabold text-sm rounded-2xl shadow-md shadow-safegreen-200 transition-all"
          >
            Find
          </button>
          {/* Mobile Filter toggle */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="md:hidden p-3 bg-slate-100 text-slate-700 rounded-2xl hover:bg-slate-200"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Filters Sidebar */}
        <div className={`md:block ${mobileFilterOpen ? 'block' : 'hidden'} md:col-span-1 space-y-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm`}>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-safegreen-600" />
              Filter Listings
            </span>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-safegreen-700 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>

          {/* Sort Selector */}
          <CustomSelect
            label="Sort By"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            options={[
              { label: 'Newest First', value: 'newest' },
              { label: 'Price: Low to High', value: 'price_asc' },
              { label: 'Price: High to Low', value: 'price_desc' },
              { label: 'Most Viewed', value: 'views' }
            ]}
            buttonClassName="!py-2 !rounded-lg !text-xs !bg-slate-50"
          />

          {/* Category Filter */}
          <CustomSelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            options={CATEGORIES}
            buttonClassName="!py-2 !rounded-lg !text-xs !bg-slate-50"
          />

          {/* Condition Filter */}
          <CustomSelect
            label="Condition"
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            options={CONDITIONS}
            buttonClassName="!py-2 !rounded-lg !text-xs !bg-slate-50"
          />

          {/* Gemini AI Risk Level Filter */}
          <CustomSelect
            label="AI Risk Level"
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            options={RISK_LEVELS.map((r) => ({
              label: r === 'All' ? 'All Risk Levels' : `${r} Risk Only`,
              value: r
            }))}
            buttonClassName="!py-2 !rounded-lg !text-xs !bg-slate-50"
          />

          {/* Location Filter */}
          <div className="pt-2 border-t border-slate-100">
            <LocationSelector
              selectedProvince={province}
              selectedCity={cityMunicipality}
              onChange={({ province, cityMunicipality }) => {
                setProvince(province);
                setCityMunicipality(cityMunicipality);
              }}
            />
          </div>
        </div>

        {/* Listings Grid Area */}
        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No matching items found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try loosening your filters, changing your city, or clearing price limits.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-safegreen-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {listings.map((item) => (
                <ListingCard key={item._id} listing={item} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
