import React, { useState } from 'react';
import { Star, X, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function RatingModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  listingId,
  onRatingSuccess
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (sellerId && user && (sellerId.toString() === user._id?.toString() || sellerId.toString() === user.id?.toString())) {
      setError('You cannot rate yourself.');
      return;
    }

    if (!rating || rating < 1) {
      setError('Please select a rating of at least 1 star.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.post('/ratings', {
        sellerId,
        listingId,
        rating,
        feedback
      });

      setSuccess(true);
      if (onRatingSuccess) onRatingSuccess(res);

      setTimeout(() => {
        setSuccess(false);
        setFeedback('');
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-safegreen-800 font-bold text-base">
            <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            <span>Rate Seller: {sellerName}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h4 className="text-lg font-bold text-slate-800">Feedback Recorded!</h4>
              <p className="text-sm text-slate-600 mt-1">
                Your rating helps build trust and safety in SafeMarket.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Star selector */}
              <div className="text-center py-2">
                <span className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Select Rating
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoverRating || rating) >= star
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="block text-xs font-medium text-slate-500 mt-2">
                  {rating === 0
                    ? 'Click stars above to rate (1–5 Stars)'
                    : rating === 5
                    ? '5 Stars – Excellent & Trustworthy'
                    : `${rating} Star${rating > 1 ? 's' : ''}`}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Written Feedback (Optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                  placeholder="Share details about the meetup, item condition, and communication..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 focus:border-safegreen-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 text-sm font-semibold text-white bg-safegreen-600 hover:bg-safegreen-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Submitting...' : 'Submit Rating'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
