import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Compass, Scissors, ShoppingBag, User as UserIcon, Store } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './MobileBottomNav.css';

export const MobileBottomNav: React.FC = () => {
  const { cartCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const location = useLocation();

  // Hide on admin portal routes to avoid clutter
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isVendor = Boolean(user?.is_vendor || user?.vendor_profile);
  const isVendorRoute = location.pathname.startsWith('/vendor');

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

        {/* Discover / Explore */}
        <NavLink
          to="/traditional"
          className={({ isActive }) =>
            `mobile-nav-item ${isActive || location.pathname.startsWith('/men') || location.pathname.startsWith('/women') ? 'active' : ''}`
          }
        >
          <div className="nav-icon-container">
            <Compass size={22} />
          </div>
          <span className="nav-label">Discover</span>
        </NavLink>

        {/* Designers & Artisans */}
        <NavLink
          to="/designers"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <Scissors size={22} />
          </div>
          <span className="nav-label">Designers</span>
        </NavLink>

        {/* Cart */}
        <NavLink
          to="/cart"
          className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="nav-icon-container">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="mobile-nav-badge">{cartCount}</span>}
          </div>
          <span className="nav-label">Cart</span>
        </NavLink>

        {/* Profile / Studio */}
        <NavLink
          to={user ? (isVendor ? '/vendor/dashboard' : '/profile') : '/profile'}
          onClick={(e) => {
            if (!user) {
              e.preventDefault();
              openAuthModal('login', 'customer');
            }
          }}
          className={({ isActive }) =>
            `mobile-nav-item ${isActive || isVendorRoute ? 'active' : ''}`
          }
        >
          <div className="nav-icon-container">
            {isVendor ? <Store size={22} /> : <UserIcon size={22} />}
          </div>
          <span className="nav-label">{isVendor ? 'Studio' : 'Profile'}</span>
        </NavLink>
      </div>
    </nav>
  );
};
