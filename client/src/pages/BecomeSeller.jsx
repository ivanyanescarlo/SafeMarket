import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckSquare,
  Square,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Store,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function BecomeSeller() {
  const { user, isSeller, isAdmin, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const [guidelines, setGuidelines] = useState({
    secondHand: false,
    accurateDesc: false,
    reasonablePrice: false,
    noProhibited: false,
    noScamming: false
  });
  const [sellerBio, setSellerBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');
  const [verificationDocumentType, setVerificationDocumentType] = useState('');
  const [verificationFrontImage, setVerificationFrontImage] = useState('');
  const [verificationBackImage, setVerificationBackImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  // Administrators cannot become sellers
  if (isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Administrator Account Notice
        </h2>
        <p className="text-slate-600 mt-2 text-sm max-w-md mx-auto">
          You are signed in with an Administrator account. Administrators maintain platform security, inspect audit logs, and oversee scam prevention—they do not operate as marketplace sellers or buyers.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/admin"
            className="px-5 py-2.5 bg-purple-600 text-white font-bold text-sm rounded-xl hover:bg-purple-700 transition-colors shadow-sm"
          >
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // If already a seller, display seller mode status
  if (isSeller && !activatedSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-safegreen-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">
          Seller Mode is Active!
        </h2>
        <p className="text-slate-600 mt-2 text-sm max-w-md mx-auto">
          Your account is authorized to post second-hand listings, manage inventory, and interact with local buyers.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            to="/seller"
            className="px-5 py-2.5 bg-safegreen-600 text-white font-bold text-sm rounded-xl hover:bg-safegreen-700 transition-colors shadow-sm"
          >
            Go to Seller Dashboard
          </Link>
          <Link
            to="/seller/create-listing"
            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
          >
            Create New Listing
          </Link>
        </div>
      </div>
    );
  }

  const allGuidelinesChecked =
    guidelines.secondHand &&
    guidelines.accurateDesc &&
    guidelines.reasonablePrice &&
    guidelines.noProhibited &&
    guidelines.noScamming;

  const handleActivateSellerMode = async () => {
    if (!agreementChecked) {
      setError('Accept the SafeMarket Seller Agreement before activating Seller Mode.');
      setStep(1);
      return;
    }

    if (!allGuidelinesChecked) {
      setError('Check all five SafeMarket Listing Guidelines before activating Seller Mode.');
      setStep(2);
      return;
    }

    if (!verificationDocumentType || !verificationFrontImage || !verificationBackImage) {
      setError('Choose a verification document type and attach both the front and back images.');
      setStep(3);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/users/become-seller', {
        agreementAccepted: agreementChecked,
        guidelinesAccepted: allGuidelinesChecked,
        guidelines,
        bio: sellerBio,
        profileImage,
        verificationDocumentType,
        verificationFrontImage,
        verificationBackImage
      });

      if (res.success) {
        setActivatedSuccess(true);
        await refreshUser();
      }
    } catch (err) {
      setError(err.message || 'Failed to activate Seller Mode.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationImage = (side, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Upload a JPG, PNG, or WebP image.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Verification images must be 2 MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (side === 'front') {
          setVerificationFrontImage(reader.result);
        } else {
          setVerificationBackImage(reader.result);
        }
        setError('');
      } else {
        setError('Could not read the selected verification image.');
      }
    };
    reader.onerror = () => setError('Could not read the selected verification image.');
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      {/* Progress Stepper */}
      <div className="mb-10">
        <div className="flex items-center justify-between relative max-w-xl mx-auto">
          {[
            { num: 1, title: 'Agreement' },
            { num: 2, title: 'Guidelines' },
            { num: 3, title: 'Profile' },
            { num: 4, title: 'Activate' }
          ].map((item, idx) => (
            <div key={item.num} className="flex flex-col items-center relative z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  step === item.num
                    ? 'bg-safegreen-600 text-white shadow-md shadow-safegreen-200 ring-4 ring-safegreen-100'
                    : step > item.num || activatedSuccess
                    ? 'bg-safegreen-100 text-safegreen-700 border border-safegreen-300'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }`}
              >
                {step > item.num || activatedSuccess ? '✓' : item.num}
              </div>
              <span className={`text-[11px] font-semibold mt-1.5 ${
                step === item.num ? 'text-safegreen-800 font-bold' : 'text-slate-500'
              }`}>
                {item.title}
              </span>
            </div>
          ))}
          {/* Connector line */}
          <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS MODAL / SCREEN */}
      {activatedSuccess ? (
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 text-center animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-safegreen-600 mb-5">
            <Sparkles className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            Seller Mode Activated!
          </h2>
          <p className="text-slate-600 mt-2 text-sm max-w-lg mx-auto">
            Welcome to the SafeMarket seller community! You now have full access to create listings with real-time Gemini AI risk analysis, communicate with buyers, and build a verified rating.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
            <Link
              to="/seller/create-listing"
              className="py-3 px-4 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center justify-center gap-2"
            >
              <span>Create Your First Listing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/seller"
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm rounded-xl transition-all flex items-center justify-center"
            >
              Go to Seller Dashboard
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90">
          
          {/* STEP 1: SELLER AGREEMENT */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-safegreen-700 bg-safegreen-50 px-2.5 py-1 rounded-full">
                  Step 1 of 4
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  SafeMarket Seller Agreement
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  To ensure a safe community for all Philippine buyers and sellers, please review and agree to our basic code of conduct.
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3.5 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <span className="text-safegreen-600 font-bold">1.</span>
                  <p><strong>Follow SafeMarket Rules:</strong> Comply with all local community standards and marketplace conduct guidelines.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-safegreen-600 font-bold">2.</span>
                  <p><strong>Truthful Listing Information:</strong> Disclose authentic condition, exact model, and honest history of items.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-safegreen-600 font-bold">3.</span>
                  <p><strong>No Scamming or Fraud:</strong> Never request unverified advance reservation deposits, fake shipping fees, or counterfeit goods.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-safegreen-600 font-bold">4.</span>
                  <p><strong>Honest Communication:</strong> Keep all discussions within SafeMarket messages and arrange safe public face-to-face meetups.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-safegreen-600 font-bold">5.</span>
                  <p><strong>No Prohibited Goods:</strong> Strictly avoid weapons, stolen property, illegal drugs, or unauthorized pirated items.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-dashed border-safegreen-300 bg-safegreen-50/50 cursor-pointer hover:bg-safegreen-50 transition-colors">
                <input
                  type="checkbox"
                  checked={agreementChecked}
                  onChange={(e) => setAgreementChecked(e.target.checked)}
                  className="w-5 h-5 rounded text-safegreen-600 focus:ring-safegreen-500 mt-0.5"
                />
                <span className="text-sm font-semibold text-slate-800">
                  I agree to the SafeMarket Seller Agreement and promise to uphold safety and honesty in all transactions.
                </span>
              </label>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!agreementChecked}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <span>Continue to Guidelines</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: LISTING GUIDELINES */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-safegreen-700 bg-safegreen-50 px-2.5 py-1 rounded-full">
                  Step 2 of 4
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  Listing Guidelines Confirmation
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please verify each guideline below before activating seller privileges.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'secondHand',
                    text: 'Items listed must be second-hand/used products appropriate for the marketplace.'
                  },
                  {
                    key: 'accurateDesc',
                    text: 'Product descriptions must be accurate and not intentionally misleading.'
                  },
                  {
                    key: 'reasonablePrice',
                    text: 'Prices must be reasonable and honestly represented.'
                  },
                  {
                    key: 'noProhibited',
                    text: 'Sellers must not list prohibited or inappropriate items.'
                  },
                  {
                    key: 'noScamming',
                    text: 'Sellers must not use listings to intentionally scam or deceive buyers.'
                  }
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      guidelines[item.key]
                        ? 'bg-emerald-50/70 border-safegreen-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={guidelines[item.key]}
                      onChange={(e) =>
                        setGuidelines((prev) => ({ ...prev, [item.key]: e.target.checked }))
                      }
                      className="w-5 h-5 rounded text-safegreen-600 focus:ring-safegreen-500 mt-0.5"
                    />
                    <span className="text-xs sm:text-sm font-medium text-slate-800">
                      {item.text}
                    </span>
                  </label>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={!allGuidelinesChecked}
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center gap-2 disabled:opacity-40"
                >
                  <span>Continue to Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONAL SELLER PROFILE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-safegreen-700 bg-safegreen-50 px-2.5 py-1 rounded-full">
                  Step 3 of 4
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  Seller Profile & Verification
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Add an optional seller bio and an image that supports your seller identity.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <strong>Verification images:</strong> Choose a document type and upload clear front and back images (JPG, PNG, or WebP, up to 2 MB each). Do not upload payment or bank details.
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="verificationDocumentType" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Verification Document
                  </label>
                  <select
                    id="verificationDocumentType"
                    value={verificationDocumentType}
                    onChange={(e) => setVerificationDocumentType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500"
                  >
                    <option value="">Choose document type</option>
                    <option value="Business ID">Business ID</option>
                    <option value="Business card">Business card</option>
                    <option value="Other seller proof">Other seller proof</option>
                  </select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="verificationFrontImage" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Front of ID / Document
                    </label>
                    <input
                      id="verificationFrontImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleVerificationImage('front', e)}
                      className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-safegreen-50 file:px-4 file:py-2 file:font-semibold file:text-safegreen-700"
                    />
                    {verificationFrontImage && (
                      <img
                        src={verificationFrontImage}
                        alt="Front of seller verification document"
                        className="mt-3 max-h-48 rounded-xl border border-slate-200 object-contain"
                      />
                    )}
                  </div>
                  <div>
                    <label htmlFor="verificationBackImage" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      Back of ID / Document
                    </label>
                    <input
                      id="verificationBackImage"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleVerificationImage('back', e)}
                      className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-safegreen-50 file:px-4 file:py-2 file:font-semibold file:text-safegreen-700"
                    />
                    {verificationBackImage && (
                      <img
                        src={verificationBackImage}
                        alt="Back of seller verification document"
                        className="mt-3 max-h-48 rounded-xl border border-slate-200 object-contain"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Seller Bio (Optional)
                  </label>
                  <textarea
                    value={sellerBio}
                    onChange={(e) => setSellerBio(e.target.value)}
                    rows={3}
                    placeholder="e.g. Passionate gadget and bicycle hobbyist. All items tested before meetup in local malls."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-safegreen-500 focus:border-safegreen-500 resize-none"
                  />
                </div>

              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-2.5 bg-safegreen-600 hover:bg-safegreen-700 text-white font-bold text-sm rounded-xl shadow-md shadow-safegreen-200 transition-all flex items-center gap-2"
                >
                  <span>Continue to Confirmation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: ACTIVATE SELLER MODE */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-safegreen-700 bg-safegreen-50 px-2.5 py-1 rounded-full">
                  Step 4 of 4
                </span>
                <h3 className="text-2xl font-bold text-slate-900 mt-2">
                  You are ready to become a SafeMarket Seller
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Please review the summary below before activating seller privileges.
                </p>
              </div>

              {/* Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs text-safegreen-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-safegreen-600" />
                  <span>Seller Agreement Accepted</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-safegreen-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-safegreen-600" />
                  <span>Listing Guidelines Accepted (5/5 requirements verified)</span>
                </div>
                <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                  <p><strong>Account:</strong> {user?.firstName} {user?.lastName} (@{user?.username})</p>
                  <p><strong>Trading Region:</strong> {user?.location?.cityMunicipality}, {user?.location?.province}</p>
                  <p><strong>Verification:</strong> {verificationDocumentType} ({verificationFrontImage ? 'front attached' : 'front required'}, {verificationBackImage ? 'back attached' : 'back required'})</p>
                  {sellerBio && <p className="mt-1 italic">"{sellerBio}"</p>}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  disabled={loading || !verificationDocumentType || !verificationFrontImage || !verificationBackImage}
                  onClick={handleActivateSellerMode}
                  className="px-6 py-3 bg-safegreen-600 hover:bg-safegreen-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-safegreen-200 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Activating Seller Mode...</span>
                  ) : (
                    <>
                      <Store className="w-4 h-4" />
                      <span>Activate Seller Mode</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
