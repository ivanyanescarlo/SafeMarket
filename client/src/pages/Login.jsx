import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loginId, setLoginId] = useState('');
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
        navigate(`/verify-otp?email=${encodeURIComponent(err.email || loginId)}`);
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-safegreen-700 to-safegreen-500 text-white shadow-md shadow-safegreen-200 mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address or Username
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              placeholder="e.g. maria@safemarket.ph or maria_seller"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 focus:border-safegreen-500 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => alert('For password recovery in SafeMarket demo, please contact admin@safemarket.ph or re-register with a new test account.')}
                className="text-xs font-semibold text-safegreen-700 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

        {/* Demo Credentials Box for Evaluation */}
        <div className="mt-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800">Quick Test Credentials:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 pt-1 text-[11px]">
            <button
              type="button"
              onClick={() => { setLoginId('admin@safemarket.ph'); setPassword('Admin123!'); }}
              className="p-1 rounded bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50 text-left font-medium"
            >
              <span className="font-bold text-purple-700 block">Admin</span>
              admin@safemarket.ph
            </button>
            <button
              type="button"
              onClick={() => { setLoginId('maria@safemarket.ph'); setPassword('Password123!'); }}
              className="p-1 rounded bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 text-left font-medium"
            >
              <span className="font-bold text-emerald-700 block">Seller</span>
              maria@safemarket.ph
            </button>
            <button
              type="button"
              onClick={() => { setLoginId('carlo@safemarket.ph'); setPassword('Password123!'); }}
              className="p-1 rounded bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-left font-medium"
            >
              <span className="font-bold text-blue-700 block">Buyer</span>
              carlo@safemarket.ph
            </button>
          </div>
        </div>

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
