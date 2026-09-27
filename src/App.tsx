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
import { MensCollectionPage } from './pages/MensCollectionPage';
import { WomensCollectionPage } from './pages/WomensCollectionPage';
import { TraditionalCollectionPage } from './pages/TraditionalCollectionPage';
import { DesignersPage } from './pages/DesignersPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { VendorStorefrontPage } from './pages/VendorStorefrontPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPortalPage } from './pages/AdminPortalPage';
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
