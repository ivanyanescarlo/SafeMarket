import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import safeMarketLogo from '../assets/safemarket_logo.png';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginId, setLoginId] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(loginId, password);
      if (data.success) {
        const user = data.user;
        // Role based redirection
        if (user.role === 'admin') {
          navigate('/admin');
        } else {
          // Buyer or Seller
          const from = location.state?.from?.pathname || '/';
          navigate(from);
        }
      }
    } catch (err) {
      if (err.requiresVerification) {
        // Redirect to OTP verification screen
        navigate(`/verify-otp?email=${encodeURIComponent(err.email || loginId)}`, {
          state: { email: err.email || loginId }
        });
      } else {
        setError(err.message || 'Invalid username/email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={safeMarketLogo}
            alt="SafeMarket Logo"
            className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4"
          />
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Welcome to SafeMarket
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Secure peer-to-peer marketplace with Gemini AI scam detection.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {location.state?.message && (
          <div role="status" className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            {location.state.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address or Username
            </label>
            <input
              type="text"
              maxLength={50}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              placeholder="Email address or username"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 focus:border-safegreen-500 transition-all"
            />
          </div>

          <div>
            <div className="mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                maxLength={50}
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                required
                placeholder="Enter password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 focus:border-safegreen-500 pr-10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="mt-1 text-left">
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-safegreen-700 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Logging In...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Log In to SafeMarket</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          New to SafeMarket?{' '}
          <Link to="/register" className="font-bold text-safegreen-700 hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
