import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Trash2, MessageSquare, ArrowRight, ShieldCheck, MapPin, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import RiskBadge from '../components/common/RiskBadge';
import api from '../services/api';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const totalValue = cart.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  const formattedTotal = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(totalValue);

  const handleMessageSeller = async (item) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/product/${item._id}` } } });
      return;
    }

    const sellerId = item.sellerId?._id || item.sellerId;
    if (sellerId === user._id) {
      alert('You are the seller of this listing.');
      return;
    }

    try {
      const res = await api.post('/messages/start', {
        receiverId: sellerId,
        listingId: item._id,
        initialMessage: `Hi! I saved your "${item.title}" in my SafeMarket Cart. Is this still available for meetup in ${item.location?.cityMunicipality || 'your area'}?`
      });

      if (res.success && res.conversation) {
        navigate(`/messages?conversationId=${res.conversation._id}`);
      }
    } catch (err) {
      alert(err.message || 'Failed to connect with seller.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-safegreen-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Continue Browsing Marketplace</span>
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-bold">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                My Saved Cart ({cart.length})
              </h1>
              <p className="text-xs text-slate-500">
                Review saved items, compare Gemini AI scam risk ratings, and message sellers for local meetups.
              </p>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Cart</span>
            </button>
          )}
        </div>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Your Cart is Empty</h2>
          <p className="text-xs text-slate-500">
            Click "Add to Cart" on any product to save items here, compare prices, and arrange local meetups safely.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {cart.map((item) => {
              const formattedPrice = new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                maximumFractionDigits: 0
              }).format(item.price || 0);

              const image = item.images && item.images.length > 0
                ? item.images[0]
                : 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400';

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center">
                    <img
                      src={image}
                      alt={item.title}
                      className="w-20 h-20 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-safegreen-700 uppercase tracking-wider">
                          {item.category}
                        </span>
                        {item.riskLevel && <RiskBadge riskLevel={item.riskLevel} />}
                      </div>

                      <Link
                        to={`/product/${item._id}`}
                        className="text-sm font-bold text-slate-900 hover:text-safegreen-700 block line-clamp-1"
                      >
                        {item.title}
                      </Link>

                      <div className="text-base font-extrabold text-safegreen-800">
                        {formattedPrice}
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location?.cityMunicipality}, {item.location?.province}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <button
                      onClick={() => handleMessageSeller(item)}
                      className="px-4 py-2 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message Seller</span>
                    </button>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary Card */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
                Cart Summary
              </h3>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Total Items Saved:</span>
                <span className="font-bold text-slate-900">{cart.length} items</span>
              </div>

              <div className="flex items-center justify-between text-sm font-bold text-slate-900 border-t border-slate-100 pt-3">
                <span>Estimated Value:</span>
                <span className="text-xl font-extrabold text-safegreen-800">{formattedTotal}</span>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-safegreen-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-safegreen-800">
                  <ShieldCheck className="w-4 h-4 text-safegreen-600" />
                  Local Meetup Reminder
                </span>
                <p className="text-[11px] text-safegreen-800/90 leading-tight">
                  No payment is processed in the cart. Message sellers to arrange safe in-person meetups in shopping malls!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
