import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  User as UserIcon, 
  Store, 
  Package, 
  Clock, 
  Wallet 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './MobileBottomNav.css';

export const MobileBottomNav: React.FC = () => {
  const { cartCount } = useCart();
  const location = useLocation();

  // Hide on admin portal routes to avoid clutter
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isVendorRoute = location.pathname.startsWith('/vendor');

  const isCategoryActive = 
    location.pathname.startsWith('/categories') ||
    location.pathname.startsWith('/category') ||
    location.pathname.startsWith('/men') || 
    location.pathname.startsWith('/women') || 
    location.pathname.startsWith('/traditional') ||
    location.pathname.startsWith('/designers');

  // ═══════════════════════════════════════════════════════════════
  // 1. VENDOR STUDIO BOTTOM NAV (Active on /vendor routes)
  // ═══════════════════════════════════════════════════════════════
  if (isVendorRoute) {
    return (
      <nav className="aso-mobile-bottom-nav studio-mode" aria-label="Studio Mobile Navigation">
        <div className="mobile-nav-track">
          {/* Overview */}
          <NavLink
            to="/vendor/dashboard"
            end
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <Store size={21} />
            </div>
            <span className="nav-label">Overview</span>
          </NavLink>

          {/* Pieces */}
          <NavLink
            to="/vendor/products"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <Package size={21} />
            </div>
            <span className="nav-label">Pieces</span>
          </NavLink>

          {/* Profile / Studio Profile (Center Tab) */}
          <NavLink
            to="/vendor/profile"
            className={({ isActive }) => `mobile-nav-item ${isActive || location.pathname.startsWith('/vendor/settings') ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <UserIcon size={21} />
            </div>
            <span className="nav-label">Profile</span>
          </NavLink>

          {/* Orders */}
          <NavLink
            to="/vendor/orders"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <Clock size={21} />
            </div>
            <span className="nav-label">Orders</span>
          </NavLink>

          {/* Earnings / Balance */}
          <NavLink
            to="/vendor/earnings"
            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <Wallet size={21} />
            </div>
            <span className="nav-label">Earnings</span>
          </NavLink>
        </div>
      </nav>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. CUSTOMER MARKETPLACE BOTTOM NAV (Active on marketplace routes)
  // ═══════════════════════════════════════════════════════════════
  return (
    <nav className="aso-mobile-bottom-nav" aria-label="Mobile Navigation">
      <div className="mobile-nav-track">
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <Home size={22} />
          </div>
          <span className="nav-label">Home</span>
        </NavLink>

        {/* Categories Dedicated Page */}
        <NavLink
          to="/categories"
          className={() => `mobile-nav-item ${isCategoryActive ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <LayoutGrid size={22} />
          </div>
          <span className="nav-label">Categories</span>
        </NavLink>

        {/* Bag / Cart */}
        <NavLink
          to="/cart"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="mobile-nav-badge">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="nav-label">Bag</span>
        </NavLink>

        {/* Account Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <UserIcon size={22} />
          </div>
          <span className="nav-label">Account</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
