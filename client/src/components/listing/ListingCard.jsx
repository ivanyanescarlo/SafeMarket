import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, User } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';

export default function ListingCard({ listing }) {
  if (!listing) return null;

  const imageSrc =
    listing.images && listing.images.length > 0 && listing.images[0]
      ? listing.images[0]
      : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80';

  const seller = listing.sellerId || {};
  const formattedPrice = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(listing.price || 0);

  return (
    <Link
      to={`/product/${listing._id}`}
      className="group flex flex-col bg-white rounded-xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-safegreen-400 transition-all duration-200 overflow-hidden"
    >
      {/* Thumbnail with Risk Badge overlay */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={imageSrc}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute top-2.5 left-2.5">
          <RiskBadge level={listing.riskLevel} size="xs" />
        </div>
        <div className="absolute bottom-2.5 left-2.5">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/60 text-white backdrop-blur-sm">
            {listing.condition || 'Used'}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-3.5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[11px] font-semibold text-safegreen-700 bg-safegreen-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {listing.category?.split(' ')[0] || 'Item'}
          </span>
          <span className="text-xs text-slate-400">
            {listing.createdAt ? new Date(listing.createdAt).toLocaleDateString() : ''}
          </span>
        </div>

        <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug group-hover:text-safegreen-700 transition-colors">
          {listing.title}
        </h3>

        <div className="mt-2 text-base font-bold text-slate-900">
          {formattedPrice}
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[150px]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">
              {listing.location?.cityMunicipality || 'Local'}, {listing.location?.province || 'PH'}
            </span>
          </div>

          {seller.averageRating > 0 && (
            <div className="flex items-center gap-1 font-semibold text-amber-600">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{seller.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
