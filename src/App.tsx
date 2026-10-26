import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { Suspense, lazy } from 'react';

// Lazy-loaded route bundles for optimal initial load speed
const MensCollectionPage = lazy(() => import('./pages/MensCollectionPage').then(m => ({ default: m.MensCollectionPage })));
const WomensCollectionPage = lazy(() => import('./pages/WomensCollectionPage').then(m => ({ default: m.WomensCollectionPage })));
const TraditionalCollectionPage = lazy(() => import('./pages/TraditionalCollectionPage').then(m => ({ default: m.TraditionalCollectionPage })));
const DesignersPage = lazy(() => import('./pages/DesignersPage').then(m => ({ default: m.DesignersPage })));
const VendorDashboardPage = lazy(() => import('./pages/VendorDashboardPage').then(m => ({ default: m.VendorDashboardPage })));
const VendorStorefrontPage = lazy(() => import('./pages/VendorStorefrontPage').then(m => ({ default: m.VendorStorefrontPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then(m => ({ default: m.CartPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AdminPortalPage = lazy(() => import('./pages/AdminPortalPage').then(m => ({ default: m.AdminPortalPage })));

const RouteFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
    <div style={{
      width: '32px',
      height: '32px',
      border: '3px solid rgba(6,78,59,0.15)',
      borderTopColor: '#064E3B',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
  </div>
);
import './styles/global.css';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isVendorRoute = location.pathname.startsWith('/vendor');
  const isAdminRoute = location.pathname.startsWith('/admin');
  const { openAuthModal } = useAuth();
  const handleOpenDesignerRegister = () => openAuthModal('register', 'designer');

  return (
    <div className="app-main-layout">
      {!isVendorRoute && !isAdminRoute && (
        <Navbar
          onOpenVendorRegister={handleOpenDesignerRegister}
          logoOption={2}
        />
      )}

      <main className="app-content">
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Marketplace & Customer Discovery */}
          <Route path="/" element={<HomePage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/men" element={<MensCollectionPage />} />
          <Route path="/categories/men" element={<MensCollectionPage />} />
          <Route path="/products/men" element={<MensCollectionPage />} />
          <Route path="/women" element={<WomensCollectionPage />} />
          <Route path="/categories/women" element={<WomensCollectionPage />} />
          <Route path="/products/women" element={<WomensCollectionPage />} />
          <Route path="/traditional" element={<TraditionalCollectionPage />} />
          <Route path="/categories/traditional" element={<TraditionalCollectionPage />} />
          <Route path="/products/traditional" element={<TraditionalCollectionPage />} />
          <Route path="/designers" element={<DesignersPage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/artisans" element={<DesignersPage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/directory" element={<DesignersPage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/products" element={<HomePage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/search" element={<HomePage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/categories/:slug" element={<HomePage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          
          {/* Product Details */}
          <Route path="/products/:identifier" element={<ProductDetailPage />} />

          {/* Designer Storefronts */}
          <Route path="/store/:slug" element={<VendorStorefrontPage />} />
          <Route path="/designer/:slug" element={<VendorStorefrontPage />} />
          <Route path="/designers/store/:slug" element={<VendorStorefrontPage />} />

          {/* Cart & Checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CartPage />} />

          {/* Customer Account & Order Tracking */}
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/account" element={<ProfilePage />} />
          <Route path="/orders" element={<ProfilePage />} />
          <Route path="/orders/:id" element={<ProfilePage />} />

          {/* Designer / Vendor Studio Portal */}
          <Route path="/vendor" element={<VendorDashboardPage />} />
          <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="/vendor/products" element={<VendorDashboardPage />} />
          <Route path="/vendor/orders" element={<VendorDashboardPage />} />
          <Route path="/vendor/earnings" element={<VendorDashboardPage />} />
          <Route path="/vendor/profile" element={<VendorDashboardPage />} />
          <Route path="/vendor/settings" element={<VendorDashboardPage />} />

          {/* Platform Staff & Admin Desk */}
          <Route path="/admin" element={<AdminPortalPage />} />
          <Route path="/admin-portal" element={<AdminPortalPage />} />
        </Routes>
        </Suspense>
      </main>

      {!isVendorRoute && !isAdminRoute && (
        <Footer logoOption={2} onOpenVendorRegister={handleOpenDesignerRegister} />
      )}

      {/* Mobile Bottom Navigation Bar (Visible on Mobile) */}
      <MobileBottomNav />

      {/* PWA Smart Install Prompt (Android & iOS) */}
      <PWAInstallPrompt />

      {/* Global Auth Modal (Handles Customer & Designer Login / Registration) */}
      <AuthModal />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
