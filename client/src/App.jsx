import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { CartProvider } from './context/CartContext';

// Layout
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Public & General Pages
import Home from './pages/Home';
import ProductCatalog from './pages/ProductCatalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import UserProfile from './pages/UserProfile';
import BecomeSeller from './pages/BecomeSeller';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';

// Seller Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import CreateListing from './pages/seller/CreateListing';
import MyListings from './pages/seller/MyListings';
import EditListing from './pages/seller/EditListing';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
              <Header />

              <main className="flex-1">
                <Routes>
                  {/* Public Marketplace Routes */}
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<ProductCatalog />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-otp" element={<VerifyOtp />} />

                {/* Profile (Public or Personal) */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/profile/:id" element={<UserProfile />} />

                {/* Authenticated Messages & Notifications */}
                <Route
                  path="/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />

                {/* Become a Seller Flow (Buyer to Seller) */}
                <Route
                  path="/become-seller"
                  element={
                    <ProtectedRoute>
                      <BecomeSeller />
                    </ProtectedRoute>
                  }
                />

                {/* Seller Mode Protected Routes */}
                <Route
                  path="/seller"
                  element={
                    <ProtectedRoute roleRequired="seller">
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/listings"
                  element={
                    <ProtectedRoute roleRequired="seller">
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/create-listing"
                  element={
                    <ProtectedRoute roleRequired="seller">
                      <CreateListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/listing/:id/edit"
                  element={
                    <ProtectedRoute roleRequired="seller">
                      <EditListing />
                    </ProtectedRoute>
                  }
                />

                {/* Administrator Protected Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute roleRequired="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>
        </CartProvider>
      </NotificationProvider>
    </AuthProvider>
    </BrowserRouter>
  );
}
