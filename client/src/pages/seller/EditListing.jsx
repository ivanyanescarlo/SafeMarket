import React, { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  ArrowLeft,
  Save,
  Info,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import LocationSelector from '../../components/common/LocationSelector';
import RiskWarningBanner from '../../components/listing/RiskWarningBanner';
import GoogleSearchSources from '../../components/listing/GoogleSearchSources';
import ImageUploadPreview from '../../components/common/ImageUploadPreview';
import CustomSelect from '../../components/common/CustomSelect';

const CATEGORIES = [
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
  'Brand New',
  'Like New',
  'Lightly Used',
  'Well Used',
  'Heavily Used'
];

const ITEM_AGE_OPTIONS = [
  'Brand New / Unused',
  'Less than 1 Month (Few Days)',
  '1 to 3 Months',
  '4 to 6 Months',
  '7 to 11 Months',
  '1 Year',
  '1.5 Years (1 Year 6 Months)',
  '2 Years',
  '2.5 Years (2 Years 6 Months)',
  '3+ Years',
  '5+ Years'
];

const MAX_LISTING_PRICE = 599999;

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const titleInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: CATEGORIES[0],
    condition: 'Lightly Used',
    brand: '',
    model: '',
    itemAge: '',
    additionalDetails: '',
    province: '',
    cityMunicipality: '',
    status: 'active',
    images: []
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const data = await api.get(`/listings/${id}`);
        if (data.success && data.listing) {
          const l = data.listing;
          setFormData({
            title: l.title || '',
            description: l.description || '',
            price: l.price ? String(l.price) : '',
            category: l.category || CATEGORIES[0],
            condition: l.condition || 'Lightly Used',
            brand: l.brand || '',
            model: l.model || '',
            itemAge: l.itemAge || '',
            additionalDetails: l.additionalDetails || '',
            province: l.location?.province || '',
            cityMunicipality: l.location?.cityMunicipality || '',
            status: l.status || 'active',
            images: l.images && l.images.length > 0 ? l.images : []
          });

          setAiAnalysis({
            riskLevel: l.riskLevel,
            riskIndicators: l.riskIndicators,
            riskSummary: l.riskSummary,
            recommendation: l.recommendation
          });
        }
      } catch (err) {
        setError('Failed to load listing for editing.');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const handleDigitsOnlyKeyDown = (e) => {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) ||
      (e.ctrlKey || e.metaKey)
    ) {
      return;
    }
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'price') {
      const sanitized = value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '');
      if (Number(sanitized) > MAX_LISTING_PRICE) {
        setError('Maximum price limit is ₱599,999.');
        return;
      }
      setFormData((prev) => ({ ...prev, price: sanitized }));
      setError((currentError) =>
        currentError === 'Maximum price limit is ₱599,999.' ? '' : currentError
      );
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnalyzeListing = async () => {
    setError('');
    if (!titleInputRef.current.reportValidity()) return;
    if (!descriptionInputRef.current.reportValidity()) return;

    setAnalyzingAi(true);

    try {
      const res = await api.post('/ai/analyze-listing', {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price) || 0,
        category: formData.category,
        condition: formData.condition,
        location: { province: formData.province, cityMunicipality: formData.cityMunicipality },
        brand: formData.brand,
        model: formData.model
      });

      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
      }
    } catch (err) {
      setError(err.message || 'SafeMarket AI risk screening failed.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (!formData.itemAge) {
      setError('Please select the item age / ownership duration.');
      setSaving(false);
      return;
    }

    if (Number(formData.price) > MAX_LISTING_PRICE) {
      setError('Maximum price limit is ₱599,999.');
      setSaving(false);
      return;
    }

    try {
      const cleanImages = formData.images.filter((img) => img && img.trim() !== '');

      const res = await api.put(`/listings/${id}`, {
        ...formData,
        price: Number(formData.price),
        images: cleanImages.length > 0 ? cleanImages : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800']
      });

      if (res.success) {
        navigate(`/product/${id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to update listing.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-5" aria-hidden="true">
        <div className="h-8 w-1/2 bg-slate-200 rounded animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/seller/listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-safegreen-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Listings</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
          Edit Product Listing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Update product specifications, price, photos, or status. SafeMarket AI automatically re-screens updates for buyer protection.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Product Information */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider text-safegreen-800">
            1. Listing Overview & Details
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              maxLength={50}
              name="title"
              ref={titleInputRef}
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g., iPhone 15 Pro Max 256GB Natural Titanium (Complete Box)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Price (₱ PHP) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={7}
                name="price"
                value={String(formData.price).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                onKeyDown={handleDigitsOnlyKeyDown}
                onChange={handleChange}
                required
                placeholder="₱ 25,000"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
              <p className="mt-1 text-[11px] text-slate-500">Maximum price: ₱599,999</p>
            </div>

            <CustomSelect
              label="Category"
              name="category"
              value={formData.category}
              options={CATEGORIES}
              onChange={handleChange}
              required
            />

            <CustomSelect
              label="Condition"
              name="condition"
              value={formData.condition}
              options={CONDITIONS}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Description & Items Included <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="description"
              ref={descriptionInputRef}
              value={formData.description}
              onChange={handleChange}
              rows={5}
              required
              placeholder="Describe physical condition, functional status, accessories included, reason for selling, and preferred meetup spots..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 leading-relaxed"
            />
          </div>

          {/* Item Specs */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Item Specifications & History
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Brand
                </label>
                <input
                  type="text"
                  maxLength={50}
                  name="brand"
                  autoComplete="off"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Apple, Sony, Samsung..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Model / Specs
                </label>
                <input
                  type="text"
                  maxLength={50}
                  name="model"
                  autoComplete="off"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. M2 16GB 512GB"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Item Age / Ownership Duration <span className="text-rose-500">*</span>
                </label>
                
                <CustomSelect
                  label={null}
                  name="itemAge"
                  value={formData.itemAge}
                  onChange={handleChange}
                  options={ITEM_AGE_OPTIONS}
                  placeholder="Select item age / ownership duration"
                  required
                  buttonClassName="rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          <CustomSelect
            label="Listing Visibility Status"
            name="status"
            value={formData.status}
            options={[
              { label: 'Active (Visible in marketplace catalog)', value: 'active' },
              { label: 'Sold (Mark as sold)', value: 'sold' },
              { label: 'Inactive / Hidden (Private draft)', value: 'inactive' }
            ]}
            onChange={handleChange}
          />
        </div>

        {/* Photos & Live Previews */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <ImageUploadPreview
            images={formData.images}
            onChange={(newImages) => setFormData((prev) => ({ ...prev, images: newImages }))}
            maxImages={6}
            label="2. Product Photos & Cover Image Selection"
            description="Upload product images or paste photo URLs. You can drag or reorder photos to set the main cover image."
          />
        </div>

        {/* Location Selector */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider text-safegreen-800">
            3. Local Meetup & Trading Location
          </h2>
          <LocationSelector
            selectedProvince={formData.province}
            selectedCity={formData.cityMunicipality}
            onChange={({ province, cityMunicipality }) =>
              setFormData((prev) => ({ ...prev, province, cityMunicipality }))
            }
            required
          />
        </div>

        {/* SafeMarket AI Risk Analyzer Section */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  SafeMarket AI Listing Risk Analyzer
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Scans pricing, title, description, and conditions to evaluate scam risk for buyer safety.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeListing}
              disabled={analyzingAi}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzingAi ? 'Scanning with SafeMarket AI...' : 'Re-screen with SafeMarket AI'}</span>
            </button>
          </div>
          <p className="text-xs text-emerald-200/80">
            SafeMarket AI is checking this listing for safety. This may take a little longer during busy periods.
          </p>

          {/* AI Banner Display */}
          {aiAnalysis && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <RiskWarningBanner
                riskLevel={aiAnalysis.riskLevel}
                riskIndicators={aiAnalysis.riskIndicators}
                riskSummary={aiAnalysis.riskSummary}
                recommendation={aiAnalysis.recommendation}
                analysisSourceStatus={aiAnalysis.analysisSourceStatus}
              />
              <GoogleSearchSources analysis={aiAnalysis} listing={formData} />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            to="/seller/listings"
            className="px-5 py-3 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3.5 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-safegreen-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save & Re-screen Listing'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
