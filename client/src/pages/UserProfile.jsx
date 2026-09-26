import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  User,
  MapPin,
  Star,
  ShieldCheck,
  Package,
  Calendar,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ListingCard from '../components/listing/ListingCard';
import LocationSelector from '../components/common/LocationSelector';

export default function UserProfile() {
  const { id } = useParams();
  const { user: currentUser, refreshUser } = useAuth();

  // If no param id is provided, view current user's own profile
  const profileUserId = id || currentUser?._id;

  const [profileUser, setProfileUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile States
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    profileImage: '',
    mobileNumber: '',
    province: '',
    cityMunicipality: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  const isOwnProfile = currentUser && currentUser._id === profileUserId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!profileUserId) return;
      setLoading(true);
      try {
        const data = await api.get(`/users/${profileUserId}`);
        if (data.success) {
          setProfileUser(data.user);
          setListings(data.listings || []);
          setRatings(data.ratings || []);

          if (isOwnProfile) {
            setEditForm({
              firstName: data.user.firstName || '',
              lastName: data.user.lastName || '',
              bio: data.user.bio || '',
              profileImage: data.user.profileImage || '',
              mobileNumber: data.user.mobileNumber || '',
              province: data.user.location?.province || '',
              cityMunicipality: data.user.location?.cityMunicipality || ''
            });
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [profileUserId, isOwnProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setStatusMsg('');

    try {
      const res = await api.put('/users/profile', editForm);
      if (res.success) {
        setStatusMsg('Profile successfully updated!');
        setProfileUser(res.user);
        setIsEditing(false);
        await refreshUser();
      }
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-safegreen-600 mx-auto" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <h3 className="text-base font-bold text-slate-800">User Profile Not Found</h3>
      </div>
    );
  }

  const isProfileAdmin = profileUser.role === 'admin';
  const isSeller = !isProfileAdmin && (profileUser.role === 'seller' || profileUser.sellerProfile?.isSeller);
  const isBuyer = !isProfileAdmin && !isSeller;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {profileUser.profileImage ? (
              <img
                src={profileUser.profileImage}
                alt=""
                className="w-24 h-24 rounded-full object-cover border-4 border-safegreen-100 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-safegreen-100 text-safegreen-800 flex items-center justify-center font-extrabold text-3xl border-4 border-safegreen-200">
                {profileUser.firstName ? profileUser.firstName[0].toUpperCase() : 'U'}
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {profileUser.firstName} {profileUser.lastName}
                </h1>
                {isProfileAdmin ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Administrator
                  </span>
                ) : isSeller ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Seller
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                    Buyer
                  </span>
                )}
                {profileUser.status === 'active' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Account Active
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400">@{profileUser.username}</p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-safegreen-600 flex-shrink-0" />
                  <span>
                    {profileUser.location?.cityMunicipality}, {profileUser.location?.province}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {profileUser.createdAt ? new Date(profileUser.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' }) : '2026'}
                  </span>
                </div>
              </div>

              {profileUser.bio && (
                <p className="text-xs text-slate-700 italic max-w-xl pt-2">
                  "{profileUser.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Edit Profile or Seller Actions */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Editing' : 'Edit Profile'}</span>
              </button>
            )}

            {isOwnProfile && isProfileAdmin && (
              <Link
                to="/admin"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {isOwnProfile && isBuyer && (
              <Link
                to="/become-seller"
                className="px-4 py-2 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Become a Seller</span>
              </Link>
            )}

            {isOwnProfile && isSeller && (
              <Link
                to="/seller"
                className="px-4 py-2 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Seller Dashboard
              </Link>
            )}
          </div>

        </div>

        {/* Administrator Notice Banner */}
        {isProfileAdmin && (
          <div className="mt-6 pt-6 border-t border-slate-100 p-4 bg-purple-50/70 rounded-2xl border border-purple-100 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-purple-900 space-y-1">
              <span className="font-bold text-sm block">System Administrator Account</span>
              <p>
                This account is designated solely for platform governance, scam prevention supervision, user safety auditing, and content moderation. Administrator accounts do not buy or sell items in the SafeMarket community.
              </p>
            </div>
          </div>
        )}

        {/* Buyer Profile Info Banner */}
        {isBuyer && (
          <div className="mt-6 pt-6 border-t border-slate-100 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <User className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <span className="font-bold text-sm block">Community Buyer</span>
              <p>
                Verified buyer exploring safe local second-hand meetups in {profileUser.location?.cityMunicipality || 'the Philippines'}.
              </p>
            </div>
          </div>
        )}

        {/* Seller Rating Stats Banner */}
        {isSeller && (
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Seller Rating</span>
              <div className="flex items-center justify-center gap-1 text-lg font-extrabold text-amber-500 mt-0.5">
                <Star className="w-5 h-5 fill-amber-400" />
                <span>{profileUser.averageRating > 0 ? profileUser.averageRating.toFixed(1) : 'New'}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Customer Reviews</span>
              <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">
                {profileUser.ratingCount || 0}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Active Items</span>
              <span className="text-lg font-extrabold text-safegreen-700 mt-0.5 block">
                {listings.length}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="text-xs text-slate-400 block font-medium">Seller Status</span>
              <span className="text-xs font-bold text-safegreen-700 mt-2 block">
                Verified Seller
              </span>
            </div>
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL / FORM */}
      {isEditing && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-safegreen-300 shadow-lg animate-fade-in space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Edit Profile Information
          </h3>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Bio / Seller Description
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Profile Image URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={editForm.profileImage}
                    onChange={(e) => setEditForm({ ...editForm, profileImage: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  {editForm.profileImage && (
                    <img
                      src={editForm.profileImage}
                      alt="Avatar preview"
                      className="w-9 h-9 rounded-full object-cover border border-slate-300 flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm({ ...editForm, mobileNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Location Selector */}
            <div>
              <LocationSelector
                selectedProvince={editForm.province}
                selectedCity={editForm.cityMunicipality}
                onChange={({ province, cityMunicipality }) =>
                  setEditForm({ ...editForm, province, cityMunicipality })
                }
                required
              />
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="px-5 py-2 bg-safegreen-600 hover:bg-safegreen-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                {saveLoading ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* User's Listings */}
      {isSeller && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-slate-900">
              Active Listings ({listings.length})
            </h3>
            {isOwnProfile && (
              <Link
                to="/seller/create-listing"
                className="text-xs font-bold text-safegreen-700 hover:underline"
              >
                + Post New Item
              </Link>
            )}
          </div>

          {listings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-400">
              No active listings currently available from this user.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {listings.map((item) => (
                <ListingCard key={item._id} listing={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Seller Reviews & Ratings */}
      {isSeller && (
        <div className="space-y-4">
          <h3 className="text-xl font-extrabold text-slate-900">
            Ratings & Feedback ({ratings.length})
          </h3>

          {ratings.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 text-xs text-slate-400">
              No reviews recorded yet for this seller.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ratings.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                        {rev.buyerId?.firstName ? rev.buyerId.firstName[0].toUpperCase() : 'B'}
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {rev.buyerId?.firstName} {rev.buyerId?.lastName}
                      </span>
                    </div>

                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.feedback && (
                    <p className="text-xs text-slate-600 italic">
                      "{rev.feedback}"
                    </p>
                  )}

                  <span className="text-[10px] text-slate-400 block pt-1">
                    {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
