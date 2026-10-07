import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import api from '../services/api';
import safeMarketLogo from '../assets/safemarket_logo.png';

export default function NewPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || sessionStorage.getItem('passwordResetEmail') || '';
  const token = sessionStorage.getItem('passwordResetToken') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.post('/auth/reset-password', {
        email,
        token,
        password,
        confirmPassword
      });
      sessionStorage.removeItem('passwordResetEmail');
      sessionStorage.removeItem('passwordResetToken');
      navigate('/login', {
        replace: true,
        state: { email, message: result.message }
      });
    } catch (requestError) {
      setError(requestError.message || 'Unable to reset your password. Please request a new code.');
    } finally {
      setLoading(false);
    }
  };

  const canSetPassword = Boolean(email && token);

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10">
        <div className="text-center mb-8">
          <img src={safeMarketLogo} alt="SafeMarket Logo" className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Choose a new password</h1>
          <p className="text-sm text-slate-500 mt-2">Enter and confirm a new password with at least 8 characters.</p>
        </div>

        {error && (
          <div role="alert" className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!canSetPassword ? (
          <div className="text-center text-sm text-slate-600">
            Your reset session is missing or expired. <Link to="/forgot-password" className="font-bold text-safegreen-700 hover:underline">Request a new code</Link>.
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
                placeholder="Enter new password"
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
                placeholder="Confirm your new password"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
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
