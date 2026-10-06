import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Upload,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
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

const ITEM_AGE_OPTIONS = [
  '-- Select Item Age (Optional) --',
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

export default function CreateListing() {
  const { user } = useAuth();
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
    images: []
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Restrict price input to digits 0-9 ONLY (blocks '-', '+', 'e', 'E', '.', etc.)
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
      const sanitized = value.replace(/[^0-9]/g, '');
      setFormData((prev) => ({ ...prev, price: sanitized }));
      return;
    }
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
    setError('');

    if (!formData.title || !formData.description || formData.price === '') {
      setError('Title, description, and price are required.');
      return;
    }

    if (Number(formData.price) > 999999) {
      setError('Maximum price limit is ₱999,999.');
      return;
    }

    if (!formData.province || !formData.cityMunicipality) {
      setError('Please select both your Province and City / Municipality for meetup trading location.');
      return;
    }

    if (!aiAnalysis) {
      setError('Please run the Gemini AI Listing Risk Analyzer before publishing.');
      return;
    }

    const cleanImages = formData.images.filter((img) => img.trim() !== '');
    if (cleanImages.length === 0) {
      // provide default high quality placeholder
      cleanImages.push('https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80');
    }

    setSubmitting(true);

    try {
      const res = await api.post('/listings', {
        ...formData,
        price: Number(formData.price),
        images: cleanImages
      });

      if (res.success) {
        navigate(`/product/${res.listing._id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-safegreen-700 bg-safegreen-50 px-3 py-1 rounded-full">
          SafeMarket Seller Center
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
          Create Second-Hand Listing
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Post an item with instant Gemini AI scam risk screening to protect peer-to-peer buyers and sellers.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Product Information Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            1. Basic Item Details
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Product Title
            </label>
            <input
              type="text"
              maxLength={50}
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Sony WH-1000XM4 Wireless Headphones (Midnight Blue)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Price (₱ PHP)
              </label>
              <input
                type="text"
                inputMode="numeric"
                name="price"
                value={formData.price}
                onKeyDown={handleDigitsOnlyKeyDown}
                onChange={handleChange}
                required
                placeholder="e.g. 8500"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500 font-bold text-slate-800"
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
              label="Item Condition"
              name="condition"
              value={formData.condition}
              options={CONDITIONS}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Detailed Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Describe condition, battery health, scratches, reason for selling (RFS), inclusions, and preferred public meetup mall..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-safegreen-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Tip: Honest details help Gemini AI rate your listing as Low Risk!
            </p>
          </div>
        </div>

        {/* Specifications & History */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            2. Specifications & History
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Brand
              </label>
              <input
                type="text"
                maxLength={50}
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                placeholder="e.g. Sony, Apple, Nike"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Model
              </label>
              <input
                type="text"
                maxLength={50}
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g. WH-1000XM4"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Item Age / Ownership Duration
              </label>
              <select
                name="itemAge"
                value={formData.itemAge}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    itemAge: val.startsWith('--') ? '' : val
                  }));
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 shadow-2xs"
              >
                {ITEM_AGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Images with Live Previews */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <ImageUploadPreview
            images={formData.images}
            onChange={(newImages) => setFormData((prev) => ({ ...prev, images: newImages }))}
            maxImages={6}
            label="3. Product Photos & Live Previews"
            description="Upload photos directly from your device. Every photo you input displays an instant preview below."
          />
        </div>

        {/* Location Selector */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            4. Meetup Trading Location
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

        {/* GEMINI AI LISTING RISK ANALYZER INTERACTIVE PREVIEW */}
        <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 rounded-3xl p-6 sm:p-8 border-2 border-emerald-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-safegreen-600 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Gemini AI Listing Risk Analyzer
                </h3>
                <p className="text-xs text-slate-600">
                  Analyze your drafted title, description, and price for scam flags before publishing
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAnalyzeWithGemini}
              disabled={analyzingAi}
              className="px-4 py-2 bg-white border border-safegreen-400 text-safegreen-800 hover:bg-safegreen-100 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-safegreen-600" />
              <span>{analyzingAi ? 'Screening with Gemini...' : 'Analyze Listing Risk'}</span>
            </button>
          </div>

          {aiAnalysis && (
            <div className="animate-fade-in pt-2">
              <RiskWarningBanner
                riskLevel={aiAnalysis.riskLevel}
                riskIndicators={aiAnalysis.riskIndicators}
                riskSummary={aiAnalysis.riskSummary}
                recommendation={aiAnalysis.recommendation}
              />
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Link
            to="/seller"
            className="px-5 py-3 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3.5 bg-safegreen-600 hover:bg-safegreen-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-safegreen-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span>Publishing Listing...</span>
            ) : (
              <>
                <span>Publish to SafeMarket</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
