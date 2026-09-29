import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, UserPlus, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LocationSelector from '../components/common/LocationSelector';
import safeMarketLogo from '../assets/safemarket_logo.png';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [rawMobileNumber, setRawMobileNumber] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    province: 'Pangasinan',
    cityMunicipality: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [invalidField, setInvalidField] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Field Refs for auto-focusing on invalid inputs
  const firstNameRef = useRef(null);
  const lastNameRef = useRef(null);
  const usernameRef = useRef(null);
  const mobileRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (invalidField === name) {
      setInvalidField('');
    }
  };

  const handleLocationChange = ({ province, cityMunicipality }) => {
    setFormData((prev) => ({ ...prev, province, cityMunicipality }));
    if (invalidField === 'location') setInvalidField('');
  };

  const focusField = (field, ref, message) => {
    setError(message);
    setInvalidField(field);
    if (ref && ref.current) {
      ref.current.focus();
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInvalidField('');

    if (!formData.firstName.trim()) {
      focusField('firstName', firstNameRef, 'Please enter your First Name.');
      return;
    }

    if (!formData.lastName.trim()) {
      focusField('lastName', lastNameRef, 'Please enter your Last Name.');
      return;
    }

    if (!formData.username.trim()) {
      focusField('username', usernameRef, 'Please enter a Username.');
      return;
    }

    const cleanMobileDigits = rawMobileNumber.replace(/\D/g, '');
    if (cleanMobileDigits.length !== 10) {
      focusField('mobile', mobileRef, 'Please enter a valid 10-digit Philippine mobile number after +63.');
      return;
    }

    if (!formData.email.trim()) {
      focusField('email', emailRef, 'Please enter your Email Address.');
      return;
    }

    if (formData.password.length < 8) {
      focusField('password', passwordRef, 'Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      focusField('confirmPassword', confirmPasswordRef, 'Passwords do not match.');
      return;
    }

    if (!formData.province || !formData.cityMunicipality) {
      focusField('location', null, 'Please select both your Province and City/Municipality.');
      return;
    }

    const fullMobileNumber = `+63${cleanMobileDigits}`;
    setLoading(true);

    try {
      const data = await register({ ...formData, mobileNumber: fullMobileNumber });
      if (data.success) {
        // Redirect to OTP verification screen with user email
        navigate(`/verify-otp?email=${encodeURIComponent(data.email)}`);
      }
    } catch (err) {
      const msg = err.message || 'Registration failed. Please check your information.';
      setError(msg);
      if (msg.toLowerCase().includes('username')) {
        focusField('username', usernameRef, msg);
      } else if (msg.toLowerCase().includes('email')) {
        focusField('email', emailRef, msg);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 sm:p-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <img
            src={safeMarketLogo}
            alt="SafeMarket Logo"
            className="w-16 h-16 rounded-2xl object-contain mx-auto mb-4"
          />
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Join SafeMarket
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Create your account to discover and trade second-hand items securely in your local Philippine community.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Section: Account Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-safegreen-800 border-b border-slate-100 pb-1">
              1. Account Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  First Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  ref={firstNameRef}
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  placeholder="First name"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                    invalidField === 'firstName'
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-safegreen-500 focus:border-safegreen-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  ref={lastNameRef}
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Last name"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                    invalidField === 'lastName'
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-safegreen-500 focus:border-safegreen-500'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Username <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  ref={usernameRef}
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Username"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                    invalidField === 'username'
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-safegreen-500 focus:border-safegreen-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-300 rounded-l-lg text-sm font-bold text-slate-700 select-none">
                    +63
                  </span>
                  <input
                    ref={mobileRef}
                    type="tel"
                    value={rawMobileNumber}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.startsWith('0')) val = val.substring(1);
                      if (val.startsWith('63')) val = val.substring(2);
                      if (val.length <= 10) setRawMobileNumber(val);
                      if (invalidField === 'mobile') setInvalidField('');
                    }}
                    required
                    placeholder="9171234567"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-r-lg text-sm text-slate-800 focus:outline-none focus:ring-2 font-bold transition-all ${
                      invalidField === 'mobile'
                        ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                        : 'border-slate-300 focus:ring-safegreen-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500 font-bold ml-0.5">*</span>
              </label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Email address"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all ${
                  invalidField === 'email'
                    ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:ring-safegreen-500 focus:border-safegreen-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Password <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="At least 8 characters"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 pr-10 transition-all ${
                    invalidField === 'password'
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-safegreen-500 focus:border-safegreen-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <input
                  ref={confirmPasswordRef}
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="Confirm password"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 pr-10 transition-all ${
                    invalidField === 'confirmPassword'
                      ? 'border-rose-500 ring-2 ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:ring-safegreen-500 focus:border-safegreen-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Section: Location Information */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1">
              <MapPin className="w-3.5 h-3.5 text-safegreen-700" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-safegreen-800">
                2. Community Trading Location
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              SafeMarket uses your general city/municipality to show local deals near you. We do <span className="font-semibold text-slate-700">not</span> require your exact home address.
            </p>

            <LocationSelector
              selectedProvince={formData.province}
              selectedCity={formData.cityMunicipality}
              onChange={handleLocationChange}
              required
            />
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Verify OTP</span>
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-safegreen-700 hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
