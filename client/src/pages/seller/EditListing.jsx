import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Save
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
    images: ['']
  });

  const [aiAnalysis, setAiAnalysis] = useState(null);
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
            images: l.images && l.images.length > 0 ? l.images : ['']
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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const cleanImages = formData.images.filter((img) => img.trim() !== '');

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
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/seller/listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-safegreen-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Listings</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-2">
          Edit Product Listing
        </h1>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core fields */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Listing Details
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Price (₱ PHP)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              required
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
            />
          </div>

          <CustomSelect
            label="Status"
            name="status"
            value={formData.status}
            options={[
              { label: 'Active (Visible in marketplace)', value: 'active' },
              { label: 'Sold', value: 'sold' },
              { label: 'Inactive / Hidden', value: 'inactive' }
            ]}
            onChange={handleChange}
          />
        </div>

        {/* Product Images with Live Previews */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <ImageUploadPreview
            images={formData.images}
            onChange={(newImages) => setFormData((prev) => ({ ...prev, images: newImages }))}
            maxImages={6}
            label="Product Photos & Live Previews"
            description="Upload or manage photos for this listing. You can inspect live previews and set the cover photo."
          />
        </div>

        {/* Location */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Trading Location
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

        {/* Existing AI Risk Assessment Preview */}
        {aiAnalysis && (
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Current Gemini AI Risk Analysis
            </span>
            <RiskWarningBanner
              riskLevel={aiAnalysis.riskLevel}
              riskIndicators={aiAnalysis.riskIndicators}
              riskSummary={aiAnalysis.riskSummary}
              recommendation={aiAnalysis.recommendation}
            />
            <p className="text-[11px] text-slate-400">
              Note: Updating the title, description, or price will automatically trigger Gemini AI to re-scan for scam flags.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/seller/listings"
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Updating Listing...' : 'Save & Re-screen Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
