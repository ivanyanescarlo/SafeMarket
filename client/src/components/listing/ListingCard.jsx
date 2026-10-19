import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Star, ShoppingCart, Check } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';
import ListingImage from '../common/ListingImage';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export default function ListingCard({ listing, buyerRatings = [] }) {
  const { addToCart, removeFromCart, isInCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!listing) return null;

  const imageSrc = listing.images?.find(Boolean);

  const seller = listing.sellerId || {};
  const sellerId = seller._id || seller;
  const isOwner = Boolean(user && sellerId?.toString() === user._id?.toString());
  const isSold = listing.status === 'sold';
  const formattedPrice = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(listing.price || 0);

  const inCart = isInCart(listing._id);

  const handleCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOwner) return;
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${listing._id}` } } });
      return;
    }
    if (inCart) {
      removeFromCart(listing._id);
    } else {
      addToCart(listing);
    }
  };

  return (
    <Link
      to={`/product/${listing._id}`}
      className="group flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md hover:border-safegreen-400 transition-all duration-200 overflow-hidden relative"
    >
      {/* Thumbnail with Risk Badge & Quick Save overlay */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <ListingImage
          src={imageSrc}
          alt={listing.title}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5">
          <RiskBadge level={listing.riskLevel} size="xs" />
        </div>

        {!isOwner && !isSold && (
          <div className="absolute top-2.5 right-2.5">
            <button
              type="button"
              onClick={handleCartClick}
              title={inCart ? 'Remove from Cart' : 'Add to Cart'}
              className={`p-2 rounded-xl transition-all shadow-md flex items-center justify-center ${
                inCart
                  ? 'bg-safegreen-600 text-white hover:bg-safegreen-700'
                  : 'bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white hover:text-safegreen-700 hover:scale-110'
              }`}
            >
              {inCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </button>
          </div>
        )}

        {isSold && (
          <div className="absolute top-2.5 right-2.5">
            <span className="rounded-full bg-blue-700 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow">
              Sold
            </span>
          </div>
        )}

        <div className="absolute bottom-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/60 text-white backdrop-blur-sm">
            {listing.condition || 'Used'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="text-[11px] font-bold text-safegreen-700 bg-safegreen-50 border border-safegreen-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
            {listing.category?.split(' ')[0] || 'Item'}
          </span>
          <span className="text-xs text-slate-400">
            {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : ''}
          </span>
        </div>

        <h3 className="font-bold text-slate-900 text-base line-clamp-2 leading-snug group-hover:text-safegreen-700 transition-colors">
          {listing.title}
        </h3>

        <div className="mt-3 text-lg font-black text-safegreen-800">
          {formattedPrice}
        </div>

        {buyerRatings.length > 0 && (
          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
            {buyerRatings.map((rating) => (
              <div key={rating._id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-slate-700">
                    {rating.buyerId
                      ? `${rating.buyerId.firstName} ${rating.buyerId.lastName}`.trim()
                      : 'Buyer'}
                  </span>
                  <div
                    className="flex shrink-0 items-center text-amber-500"
                    aria-label={`${rating.rating} out of 5 stars`}
                  >
                    {[...Array(5)].map((_, index) => (
                      <Star
                        key={index}
                        className={`h-3.5 w-3.5 ${
                          index < rating.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {rating.feedback && (
                  <p className="text-xs italic text-slate-600">"{rating.feedback}"</p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 truncate max-w-[160px]">
            <MapPin className="w-4 h-4 text-safegreen-600 flex-shrink-0" />
            <span className="truncate font-medium text-slate-700">
              {listing.location?.cityMunicipality || 'Local'}, {listing.location?.province || 'PH'}
            </span>
          </div>

          {seller.averageRating > 0 ? (
            <div className="flex items-center gap-1 font-bold text-amber-600">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{seller.averageRating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
