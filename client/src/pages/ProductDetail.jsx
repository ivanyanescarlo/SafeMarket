import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Star,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Flag,
  Share2,
  Calendar,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  UserCheck,
  ShoppingCart,
  Check
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import RiskWarningBanner from '../components/listing/RiskWarningBanner';
import ReportModal from '../components/common/ReportModal';
import RatingModal from '../components/common/RatingModal';
import ListingCard from '../components/listing/ListingCard';

export default function ProductDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { addToCart, removeFromCart, isInCart } = useCart();
  const navigate = useNavigate();

  const [listing, setListing] = useState(null);
  const [otherListings, setOtherListings] = useState([]);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/listings/${id}`);
        if (data.success) {
          setListing(data.listing);
          setOtherListings(data.otherSellerListings || []);
        }
      } catch (err) {
        console.error('Failed to load listing:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  const handleStartMessage = async (customMessage = null) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${id}` } } });
      return;
    }

    if (listing.sellerId._id === user._id) {
      alert('You are the seller of this listing.');
      return;
    }

    setMsgLoading(true);
    const defaultMsg = `Hi ${listing.sellerId.firstName}! I am interested in buying "${listing.title}" (${formattedPrice}). Is this still available for meetup in ${listing.location?.cityMunicipality || 'your area'}?`;
    
    try {
      const res = await api.post('/messages/start', {
        receiverId: listing.sellerId._id,
        listingId: listing._id,
        initialMessage: typeof customMessage === 'string' && customMessage.trim() ? customMessage : defaultMsg
      });

      if (res.success && res.conversation) {
        navigate(`/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to start message.');
    } finally {
      setMsgLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-safegreen-600 mx-auto mb-4" />
        <p className="text-slate-500 text-sm">Scanning & loading listing details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800">Listing Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">
          This product may have been sold or removed by administrators.
        </p>
        <Link
          to="/products"
          className="mt-4 inline-block px-4 py-2 bg-safegreen-600 text-white rounded-xl text-xs font-bold"
        >
          Browse Other Listings
        </Link>
      </div>
    );
  }

  const seller = listing.sellerId || {};
  const formattedPrice = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(listing.price || 0);

  const images = listing.images && listing.images.length > 0
    ? listing.images
    : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&auto=format&fit=crop&q=80'];

  const isOwner = user && user._id === seller._id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Back button */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-safegreen-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to marketplace catalog</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Image Gallery (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative">
            <img
              src={images[activeImageIdx]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-semibold">
              Condition: {listing.condition}
            </div>
          </div>

          {/* Thumbnails if multiple */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeImageIdx === idx
                      ? 'border-safegreen-600 ring-2 ring-safegreen-100'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Description Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Item Description
            </h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {listing.description}
            </p>

            {/* Additional details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
              {listing.brand && (
                <div>
                  <span className="text-slate-400 block">Brand</span>
                  <span className="font-semibold text-slate-800">{listing.brand}</span>
                </div>
              )}
              {listing.model && (
                <div>
                  <span className="text-slate-400 block">Model</span>
                  <span className="font-semibold text-slate-800">{listing.model}</span>
                </div>
              )}
              {listing.itemAge && (
                <div>
                  <span className="text-slate-400 block">Age of Item</span>
                  <span className="font-semibold text-slate-800">{listing.itemAge}</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-slate-800">{listing.category}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Views</span>
                <span className="font-semibold text-slate-800">{listing.views || 1} views</span>
              </div>
              <div>
                <span className="text-slate-400 block">Listed On</span>
                <span className="font-semibold text-slate-800">
                  {new Date(listing.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Seller Profile, Pricing, Gemini AI Risk Warning & Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Seller Card (Prominently displayed at the top) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Seller Profile
            </h3>

            <div className="flex items-center gap-3.5">
              {seller.profileImage ? (
                <img
                  src={seller.profileImage}
                  alt={seller.firstName}
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-bold text-base border border-safegreen-200">
                  {seller.firstName ? seller.firstName[0].toUpperCase() : 'S'}
                </div>
              )}

              <div className="flex-1">
                <Link
                  to={`/profile/${seller._id}`}
                  className="text-sm font-bold text-slate-900 hover:text-safegreen-700 hover:underline block"
                >
                  {seller.firstName} {seller.lastName}
                </Link>
                <span className="text-xs text-slate-400">@{seller.username}</span>

                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span>{seller.averageRating > 0 ? seller.averageRating.toFixed(1) : 'New Seller'}</span>
                  </div>
                  {seller.ratingCount > 0 && (
                    <span className="text-[11px] text-slate-400">
                      ({seller.ratingCount} reviews)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {seller.bio && (
              <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                "{seller.bio}"
              </p>
            )}

            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex items-center justify-between">
                <span>General Area:</span>
                <span className="font-semibold text-slate-800">
                  {seller.location?.cityMunicipality}, {seller.location?.province}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Member Since:</span>
                <span className="font-semibold text-slate-800">
                  {seller.createdAt ? new Date(seller.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '2026'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between text-xs text-safegreen-700 font-bold uppercase tracking-wider">
              <span>{listing.category}</span>
              <span className="text-slate-400 font-normal">
                ID: {listing._id.slice(-6)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {listing.title}
            </h1>

            <div className="text-3xl font-extrabold text-safegreen-800">
              {formattedPrice}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 pt-1">
              <MapPin className="w-4 h-4 text-safegreen-600 flex-shrink-0" />
              <span>
                Meetup Area: <strong>{listing.location?.cityMunicipality}, {listing.location?.province}</strong>
              </span>
            </div>

            {/* GEMINI AI LISTING RISK ANALYZER WARNING BANNER */}
            <div className="pt-2">
              <RiskWarningBanner
                riskLevel={listing.riskLevel}
                riskIndicators={listing.riskIndicators}
                riskSummary={listing.riskSummary}
                recommendation={listing.recommendation}
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2.5">
              {!isOwner ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleStartMessage(`Hi ${seller.firstName}! 🙋‍♂️ I am interested in buying your "${listing.title}" (${formattedPrice}). Is this still available for meetup in ${listing.location?.cityMunicipality || 'your area'}?`)}
                    disabled={msgLoading}
                    className="w-full py-3.5 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{msgLoading ? 'Connecting...' : "🙋‍♂️ I'm Interested! Send Inquiry"}</span>
                  </button>

                  {isInCart(listing._id) ? (
                    <button
                      type="button"
                      onClick={() => removeFromCart(listing._id)}
                      className="w-full py-3 px-4 bg-emerald-100 border border-emerald-300 text-safegreen-900 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4 text-safegreen-700" />
                      <span>Saved in Cart (Click to Remove)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => addToCart(listing)}
                      className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart / Save Item</span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setReportModalOpen(true)}
                      className="py-2.5 px-3 bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report Listing</span>
                    </button>

                    {isAdmin ? (
                      <Link
                        to="/admin/listings"
                        className="py-2.5 px-3 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                        <span>Admin Console</span>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setRatingModalOpen(true)}
                        className="py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Rate Seller</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-xs font-bold text-slate-700 block">
                    You posted this listing
                  </span>
                  <Link
                    to={`/seller/listing/${listing._id}/edit`}
                    className="mt-2 inline-block px-4 py-1.5 bg-safegreen-600 text-white rounded-lg text-xs font-bold"
                  >
                    Edit Listing
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Safety Reminder Box */}
          <div className="p-4 rounded-2xl bg-safegreen-50 border border-safegreen-200 text-xs text-safegreen-900 space-y-1.5">
            <span className="font-bold flex items-center gap-1.5 text-safegreen-800">
              <ShieldCheck className="w-4 h-4 text-safegreen-600" />
              SafeMarket Safe Trading Tips
            </span>
            <ul className="list-disc list-inside space-y-1 text-safegreen-800/90 text-[11px]">
              <li>Inspect items in daylight inside commercial shopping malls.</li>
              <li>Test power, serial numbers, and functions before handing payment.</li>
              <li>SafeMarket does not collect payments or handle escrow.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* More listings from this seller */}
      {otherListings.length > 0 && (
        <div className="pt-8 border-t border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            More from this Seller
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {otherListings.map((item) => (
              <ListingCard key={item._id} listing={item} />
            ))}
          </div>
        </div>
      )}

      {/* Report Listing Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        listingId={listing._id}
        listingTitle={listing.title}
      />

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        sellerId={seller._id}
        sellerName={`${seller.firstName} ${seller.lastName}`}
        listingId={listing._id}
        onRatingSuccess={() => {
          // Re-fetch listing or update local state
        }}
      />
    </div>
  );
}
