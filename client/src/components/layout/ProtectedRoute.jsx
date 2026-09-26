import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, roleRequired }) {
  const { user, loading, isSeller, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-safegreen-600"></div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin role check
  if (roleRequired === 'admin' && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Seller role check (Admin is not a seller)
  if (roleRequired === 'seller' && !isSeller) {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/become-seller" replace />;
  }

  return children;
}
