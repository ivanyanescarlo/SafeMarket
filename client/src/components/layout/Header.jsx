import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  MessageSquare,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  PlusCircle,
  Package,
  ShieldAlert,
  ChevronDown,
  Check,
  AlertTriangle,
  ShoppingCart,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import safeMarketLogo from '../../assets/safemarket_logo.png';

export default function Header() {
  const { user, isSeller, isAdmin, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const { cartCount } = useCart();
  const {
    unreadCount,
    unreadMessageCount,
    hasUnreadViolation,
    notifications,
    markAsRead,
    markAllAsRead
  } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setProfileOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-6">
          
          {/* 1. SafeMarket Logo */}
          <Link to={isAdmin ? "/admin" : "/"} className="flex items-center gap-2.5 flex-shrink-0 group">
            <img
              src={safeMarketLogo}
              alt="SafeMarket Logo"
              className="w-10 h-10 rounded-xl object-contain group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Safe<span className="text-safegreen-600">Market</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-500 tracking-wider uppercase">
                {isAdmin ? 'Admin' : 'Secure PH Marketplace'}
              </span>
            </div>
          </Link>

          {/* 2. Search Bar (Hidden for Admin) */}
          {!isAdmin ? (
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-xl relative hidden md:block"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search second-hand phones, laptops, bikes, furniture..."
                  className="w-full pl-10 pr-20 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-safegreen-500 focus:border-safegreen-500 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-safegreen-600 hover:bg-safegreen-700 text-white text-xs font-semibold rounded-full transition-colors shadow-xs"
                >
                  Search
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 max-w-xl hidden md:block" />
          )}

          {/* 3. Navigation Links & Action Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            
            {/* Quick Explore Products (Hidden for Admin) */}
            {!isAdmin && (
              <Link
                to="/products"
                className="text-sm font-semibold text-slate-700 hover:text-safegreen-600 px-2.5 py-1.5 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1"
              >
                Browse
              </Link>
            )}

            {/* Role-Specific Action Button */}
            {user && (
              isAdmin ? null : isSeller ? (
                <Link
                  to="/seller/create-listing"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-safegreen-50 hover:bg-safegreen-100 text-safegreen-700 border border-safegreen-200 rounded-lg text-xs font-bold transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Sell Item</span>
                </Link>
              ) : (
                <Link
                  to="/become-seller"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Become a Seller</span>
                </Link>
              )
            )}

            {/* Shopping Cart / Saved Items Icon (Buyers / Sellers only) */}
            {!isAdmin && (
              <Link
                to="/cart"
                title="Saved Cart"
                className="relative p-2 text-slate-600 hover:text-safegreen-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-slate-950 bg-amber-400 rounded-full border-2 border-white shadow-xs">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Messages Icon: Hidden for Admin accounts (Admins communicate only via official Notes) */}
            {user && !isAdmin && (
              <Link
                to="/messages"
                title="Messages"
                className="relative p-2 text-slate-600 hover:text-safegreen-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessageCount > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-blue-600 rounded-full border-2 border-white shadow-xs animate-pulse">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications Icon: Shows system, report, and violation warnings */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setNotifOpen(!notifOpen)}
                  title={hasUnreadViolation ? "Safety Violation Notice" : "Notifications"}
                  className={`relative p-2 rounded-full transition-colors focus:outline-none ${
                    hasUnreadViolation
                      ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 ring-2 ring-rose-400'
                      : 'text-slate-600 hover:text-safegreen-600 hover:bg-slate-100'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className={`absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white rounded-full border-2 border-white animate-pulse ${
                      hasUnreadViolation ? 'bg-rose-700 ring-1 ring-white' : 'bg-rose-600'
                    }`}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">Notifications</span>
                        {unreadCount > 0 && (
                          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            hasUnreadViolation ? 'bg-rose-100 text-rose-800' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs font-semibold text-safegreen-700 hover:text-safegreen-800 flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Unread Violation Alert Banner */}
                    {hasUnreadViolation && (
                      <div className="p-3 bg-rose-50 border-b border-rose-200 flex items-start gap-2.5 text-rose-900 text-xs">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold block">Policy or Safety Warning</span>
                          <span>You have received a safety or policy violation notice. Please review below.</span>
                        </div>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.slice(0, 8).map((notif) => {
                          const isViolation = notif.type === 'violation';
                          return (
                            <div
                              key={notif._id}
                              onClick={() => {
                                if (!notif.read) markAsRead(notif._id);
                                if (notif.link) navigate(notif.link);
                                setNotifOpen(false);
                              }}
                              className={`p-3.5 text-left transition-colors cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${
                                isViolation
                                  ? 'bg-rose-50/70 border-l-4 border-l-rose-500'
                                  : !notif.read
                                  ? 'bg-emerald-50/50'
                                  : ''
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                                isViolation ? 'bg-rose-600 ring-2 ring-rose-200' : 'bg-safegreen-500 opacity-90'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {isViolation && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-200 text-rose-900">
                                      Violation
                                    </span>
                                  )}
                                  <h5 className={`text-xs font-bold leading-tight ${isViolation ? 'text-rose-950 font-extrabold' : 'text-slate-900'}`}>
                                    {notif.title}
                                  </h5>
                                </div>
                                <p className={`text-xs mt-0.5 line-clamp-2 ${isViolation ? 'text-rose-800' : 'text-slate-600'}`}>
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-xs font-semibold text-safegreen-700 hover:underline"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. PROFILE ICON – STRICT REQUIREMENT: MUST BE THE LAST ICON ON THE RIGHT SIDE OF THE HEADER */}
            {user ? (
              <div className="relative ml-1" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setProfileOpen(!profileOpen)}
                  aria-label="User Profile Menu"
                  className="flex items-center gap-1.5 p-1 rounded-full hover:ring-2 hover:ring-safegreen-400 transition-all focus:outline-none"
                >
                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.firstName}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-bold text-xs border border-safegreen-200">
                      {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
                    {/* User Identity Header */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          isAdmin
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : isSeller
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-blue-100 text-blue-800 border-blue-200'
                        }`}>
                          {isAdmin ? 'Admin' : isSeller ? 'Seller' : 'Buyer'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {user.location?.cityMunicipality || 'Local'}
                        </span>
                      </div>
                    </div>

                    <div className="py-1 text-sm text-slate-700">
                      {isAdmin ? (
                        <>
                          <Link
                            to="/admin"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-purple-50 transition-colors text-purple-700 font-bold"
                          >
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span>Admin Profile</span>
                          </Link>
                        </>
                      ) : isSeller ? (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/seller"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors text-safegreen-700 font-semibold"
                          >
                            <LayoutDashboard className="w-4 h-4 text-safegreen-600" />
                            <span>Seller Dashboard</span>
                          </Link>
                          <Link
                            to="/seller/listings"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                          >
                            <Package className="w-4 h-4 text-slate-400" />
                            <span>My Listings</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 transition-colors"
                          >
                            <User className="w-4 h-4 text-slate-400" />
                            <span>My Profile</span>
                          </Link>
                          <Link
                            to="/become-seller"
                            className="flex items-center gap-2.5 px-4 py-2 hover:bg-emerald-50 transition-colors text-safegreen-700 font-semibold"
                          >
                            <ShieldCheck className="w-4 h-4 text-safegreen-600" />
                            <span>Become a Seller</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Unauthenticated Profile Icon / Actions
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-safegreen-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-bold text-white bg-safegreen-600 hover:bg-safegreen-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                >
                  Register
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
