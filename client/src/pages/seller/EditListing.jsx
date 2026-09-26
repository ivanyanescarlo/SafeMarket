import React, { useState, useEffect } from 'react';
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

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();

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
            price: l.price || '',
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Test / Run Gemini AI Listing Risk Analyzer Preview
  const handleAnalyzeWithGemini = async () => {
    if (!formData.title && !formData.description) {
      setError('Please provide at least a Title or Description to analyze with Gemini AI.');
      return;
    }

    setAnalyzingAi(true);
    setError('');

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
      setError(err.message || 'Gemini AI risk screening failed.');
    } finally {
      setAnalyzingAi(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

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
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-safegreen-600 mx-auto" />
        <p className="text-xs text-slate-500 mt-3">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          Update product specifications, price, photos, or status. Gemini AI automatically re-screens updates for buyer protection.
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
              name="title"
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
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                placeholder="₱ 25,000"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
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
              value={formData.description}
              onChange={handleChange}
              rows={5}
              required
              placeholder="Describe physical condition, functional status, accessories included, reason for selling, and preferred meetup spots..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 leading-relaxed"
            />
          </div>

          {/* Optional Specs */}
          <div className="pt-2 border-t border-slate-100">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Optional Item Specifications
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Apple, Sony, Samsung..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Model / Specs</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g. M2 16GB 512GB"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Age of Item</label>
                <input
                  type="text"
                  name="itemAge"
                  value={formData.itemAge}
                  onChange={handleChange}
                  placeholder="e.g. 6 months used"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
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

        {/* Gemini AI Risk Analyzer Section */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Gemini 3.8 Flash AI Listing Risk Analyzer
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Scans pricing, title, description, and conditions to evaluate scam risk for buyer safety.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeWithGemini}
              disabled={analyzingAi}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzingAi ? 'Scanning with AI...' : 'Re-screen with Gemini AI'}</span>
            </button>
          </div>

          {/* AI Banner Display */}
          {aiAnalysis && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <RiskWarningBanner
                riskLevel={aiAnalysis.riskLevel}
                riskIndicators={aiAnalysis.riskIndicators}
                riskSummary={aiAnalysis.riskSummary}
                recommendation={aiAnalysis.recommendation}
              />
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
