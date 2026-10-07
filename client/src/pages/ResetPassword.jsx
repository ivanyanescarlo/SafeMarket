import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, RotateCcw, ArrowRight, Mail } from 'lucide-react';
import api from '../services/api';
import safeMarketLogo from '../assets/safemarket_logo.png';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const email = searchParams.get('email') || '';
  const [requestNotice, setRequestNotice] = useState(
    searchParams.get('notice') === 'account-not-verified'
      ? 'No code was sent. Password reset codes are available for verified accounts only. If you recently created your account, verify it first.'
      : ''
  );
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const verificationInProgress = useRef(false);

  useEffect(() => {
    if (timer <= 0) return undefined;
    const interval = setInterval(() => setTimer((previous) => previous - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const verifyCode = async () => {
    if (!email || otp.length !== 6 || verificationInProgress.current) return;

    verificationInProgress.current = true;
    setError('');
    setLoading(true);

    try {
      const result = await api.post('/auth/verify-reset-otp', { email, otp });
      sessionStorage.setItem('passwordResetEmail', email);
      sessionStorage.setItem('passwordResetToken', result.resetToken);
      navigate('/new-password', { state: { email } });
    } catch (requestError) {
      setError(requestError.message || 'Unable to verify the code. Please try again.');
    } finally {
      verificationInProgress.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    if (otp.length === 6) {
      verifyCode();
    }
  }, [otp]);

  const handleSubmit = (event) => {
    event.preventDefault();
    verifyCode();
  };

  const handleResend = async () => {
    if (timer > 0 || resending || !email) return;
    setResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await api.post('/auth/forgot-password', { email });
      if (!result.codeSent) {
        setRequestNotice('No code was sent. Password reset codes are available for verified accounts only. If you recently created your account, verify it first.');
        return;
      }
      setRequestNotice('');
      setSuccessMsg('A new 6-digit password reset code has been sent to your email.');
      setOtp('');
      setTimer(30);
    } catch (requestError) {
      setError(requestError.message || 'Failed to resend the password reset code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10 text-center relative overflow-hidden">
        <img
          src={safeMarketLogo}
          alt="SafeMarket Logo"
          className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4"
        />

        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Verify Your Reset Code
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-2">
          We sent a 6-digit password reset code to your email address:
        </p>
        <p className="text-sm font-bold text-safegreen-700 mt-0.5 truncate flex items-center justify-center gap-1.5">
          <Mail className="w-4 h-4 text-safegreen-600 inline-block flex-shrink-0" />
          <span>{email || 'your email inbox'}</span>
        </p>

        {successMsg && (
          <div role="status" className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {requestNotice && (
          <div role="status" className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>{requestNotice}</span>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!email ? (
          <div className="mt-6 text-sm text-slate-600">
            This reset request is incomplete. <Link to="/forgot-password" className="font-bold text-safegreen-700 hover:underline">Request a new code</Link>.
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label htmlFor="reset-otp" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  autoFocus
                  required
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono font-bold py-3 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:border-safegreen-600 focus:bg-white transition-all shadow-inner"
                />
                <p className="text-[11px] text-slate-400 mt-2">Code expires in 10 minutes.</p>
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
                    <span>Verify Code & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center justify-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleResend}
                disabled={timer > 0 || resending}
                className="inline-flex items-center gap-1.5 font-bold text-safegreen-700 hover:text-safegreen-800 disabled:text-slate-400 transition-colors"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                <span>{timer > 0 ? `Resend code in ${timer}s` : 'Resend Code via Email'}</span>
              </button>
            </div>
          </>
        )}

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
