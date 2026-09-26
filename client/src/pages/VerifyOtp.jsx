import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, AlertCircle, CheckCircle, RotateCcw, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerifyOtp() {
  const { verifyOtp, resendOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Extract email from query parameter or state
  const queryParams = new URLSearchParams(location.search);
  const emailParam = queryParams.get('email') || location.state?.email || '';

  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60); // 60s cooldown for resend button

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      return;
    }

    if (!email) {
      setError('Email address is missing. Please restart registration or login.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await verifyOtp(email, otp.trim());
      if (data.success) {
        setSuccessMsg('Account verified successfully! Redirecting to SafeMarket...');
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;
    setResending(true);
    setError('');

    try {
      const data = await resendOtp(email);
      setSuccessMsg(data.message || 'A new 6-digit code has been dispatched to your email/mobile.');
      setTimer(60); // reset timer
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10 text-center">
        
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-100 text-safegreen-700 shadow-sm mb-4">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Verify Your Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          We sent a 6-digit One-Time Password (OTP) to:
        </p>
        <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">
          {email || 'your registered contact'}
        </p>

        {/* Success Feedback */}
        {successMsg && (
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="mt-6 space-y-5">
          {!emailParam && (
            <div className="text-left">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Enter 6-Digit Code
            </label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-safegreen-600 focus:bg-white transition-all shadow-inner"
            />
            <p className="text-[11px] text-slate-400 mt-2">
              Code expires in 10 minutes. Check your inbox or SMS.
            </p>

            {/* Spam / Junk Folder Reminder */}
            <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600">
              <span className="font-bold block text-slate-800 mb-0.5">📩 Didn't see the email?</span>
              Please check your <strong>Spam / Junk</strong> folder or <strong>Promotions tab</strong>, as automated security codes can sometimes be filtered there.
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Code...</span>
            ) : (
              <>
                <span>Verify OTP & Enter Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Resend Section */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center justify-center gap-2 text-xs">
          <p className="text-slate-500">Didn't receive the verification code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={timer > 0 || resending}
            className="inline-flex items-center gap-1.5 font-bold text-safegreen-700 hover:text-safegreen-800 disabled:text-slate-400 transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend Verification Code'}
            </span>
          </button>
        </div>

        <div className="mt-4 text-xs text-slate-400">
          Return to{' '}
          <Link to="/login" className="text-slate-600 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
