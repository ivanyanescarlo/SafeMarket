import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, RotateCcw, ArrowRight, Mail, Smartphone, RefreshCw, Sparkles, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import safeMarketLogo from '../assets/safemarket_logo.png';

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
  const [timer, setTimer] = useState(30); // 30-second cooldown timer
  const [selectedChannel, setSelectedChannel] = useState('both'); // 'email', 'sms', or 'both'
  const [showTryAnotherWay, setShowTryAnotherWay] = useState(false);

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

  const handleResend = async (targetChannel = selectedChannel) => {
    if (timer > 0 || !email) return;
    setResending(true);
    setError('');

    try {
      const data = await resendOtp(email, targetChannel);
      setSuccessMsg(data.message || 'A new 6-digit code has been dispatched.');
      setSelectedChannel(targetChannel);
      setTimer(30); // reset 30-second timer
      setShowTryAnotherWay(false);
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10 text-center relative overflow-hidden">
        
        {/* Logo */}
        <img
          src={safeMarketLogo}
          alt="SafeMarket Logo"
          className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4"
        />

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Verify Your Account
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          We sent a 6-digit One-Time Password (OTP) to your registered contact:
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
              Code expires in 10 minutes. Check your email or phone SMS.
            </p>

            {/* Spam / Junk Folder Reminder */}
            <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-left text-xs text-emerald-900 space-y-1">
              <span className="font-bold block text-emerald-950">⚡ Quick Verification Tip:</span>
              <p>Check your <strong>Spam / Junk</strong> folder if you choose email and do not see the 6-digit code in your main inbox.</p>
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

        {/* Resend & Channel Selector Section */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center justify-center gap-3 text-xs">
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => handleResend(selectedChannel)}
              disabled={timer > 0 || resending}
              className="inline-flex items-center gap-1.5 font-bold text-safegreen-700 hover:text-safegreen-800 disabled:text-slate-400 transition-colors"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              <span>
                {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowTryAnotherWay(!showTryAnotherWay)}
              className="font-semibold text-slate-600 hover:text-safegreen-700 underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
              <span>Try another way</span>
            </button>
          </div>

          {/* Try Another Way Options Panel */}
          {showTryAnotherWay && (
            <div className="w-full mt-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-3 transition-all animate-fadeIn">
              <span className="text-xs font-bold text-slate-800 block border-b border-slate-200 pb-1.5">
                📲 Select How To Receive Verification Code:
              </span>

              <div className="space-y-2">
                <button
                  type="button"
                  disabled={timer > 0 || resending}
                  onClick={() => handleResend('email')}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    selectedChannel === 'email'
                      ? 'bg-white border-safegreen-500 shadow-xs ring-1 ring-safegreen-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-safegreen-700" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Send Code via Email</p>
                      <p className="text-[10px] text-slate-500">Delivered directly to your Gmail/Email inbox</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-safegreen-700 bg-safegreen-50 px-2 py-0.5 rounded-full">Email</span>
                </button>

                <button
                  type="button"
                  disabled={timer > 0 || resending}
                  onClick={() => handleResend('sms')}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    selectedChannel === 'sms'
                      ? 'bg-white border-safegreen-500 shadow-xs ring-1 ring-safegreen-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Send Code via Phone SMS</p>
                      <p className="text-[10px] text-slate-500">Sent to your registered PH mobile number</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">SMS</span>
                </button>

                <button
                  type="button"
                  disabled={timer > 0 || resending}
                  onClick={() => handleResend('both')}
                  className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    selectedChannel === 'both'
                      ? 'bg-white border-safegreen-500 shadow-xs ring-1 ring-safegreen-500/20'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Send Code to Both (Email + SMS)</p>
                      <p className="text-[10px] text-slate-500">Maximum delivery reliability</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">Dual</span>
                </button>
              </div>

              {timer > 0 && (
                <p className="text-[10px] text-amber-700 font-semibold text-center mt-1">
                  ⏳ Please wait {timer}s before requesting another code dispatch.
                </p>
              )}
            </div>
          )}
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
