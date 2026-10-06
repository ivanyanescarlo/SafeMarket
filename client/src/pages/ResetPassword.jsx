import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import api from '../services/api';
import safeMarketLogo from '../assets/safemarket_logo.png';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const result = await api.post('/auth/reset-password', {
        email,
        token,
        password,
        confirmPassword
      });
      setMessage(result.message);
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset your password. Please request a new link.');
    } finally {
      setLoading(false);
    }
  };

  const linkIsValid = Boolean(email && token);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10">
        <div className="text-center mb-8">
          <img src={safeMarketLogo} alt="SafeMarket Logo" className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reset your password</h1>
          <p className="text-sm text-slate-500 mt-2">Choose a new password with at least 8 characters.</p>
        </div>

        {message && (
          <div role="status" className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{message} <Link to="/login" className="font-bold underline">Log in</Link></span>
          </div>
        )}
        {error && (
          <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!linkIsValid ? (
          <div className="text-center text-sm text-slate-600">
            This reset link is incomplete. <Link to="/forgot-password" className="font-bold text-safegreen-700 hover:underline">Request a new one</Link>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                maxLength={50}
                value={password}
                onChange={(event) => setPassword(event.target.value.replace(/\s/g, ''))}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                type="password"
                maxLength={50}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value.replace(/\s/g, ''))}
                autoComplete="new-password"
                minLength={8}
                required
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || Boolean(message)}
              className="w-full py-3 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? 'Updating Password...' : 'Set New Password'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="font-bold text-safegreen-700 hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
