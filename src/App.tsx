import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { HomePage } from './pages/HomePage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { VendorStorefrontPage } from './pages/VendorStorefrontPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { ProfilePage } from './pages/ProfilePage';
import './styles/global.css';

const AppContent: React.FC = () => {
  const { openAuthModal } = useAuth();
  const handleOpenDesignerRegister = () => openAuthModal('register', 'designer');

  return (
    <div className="app-main-layout">
      <Navbar
        onOpenVendorRegister={handleOpenDesignerRegister}
        logoOption={2}
      />

      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage onOpenVendorRegister={handleOpenDesignerRegister} />} />
          <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
          <Route path="/store/:slug" element={<VendorStorefrontPage />} />
          <Route path="/products/:identifier" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>

      <Footer logoOption={2} onOpenVendorRegister={handleOpenDesignerRegister} />

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
