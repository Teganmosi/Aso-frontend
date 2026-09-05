import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Search, ShoppingBag, User as UserIcon, LogOut, ChevronDown, Menu, X, MapPin, Sparkles, Store, Clock } from 'lucide-react';
import './Navbar.css';

import { Logo, type LogoOption } from './Logo';

interface NavbarProps {
  onOpenVendorRegister: () => void;
  logoOption?: LogoOption;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVendorRegister, logoOption = 2 }) => {
  const { user, openAuthModal, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    } else {
      navigate('/');
    }
  };

  const isApprovedVendor = Boolean(user?.is_vendor || user?.vendor_profile?.status === 'APPROVED');
  const isPendingVendor = Boolean(!isApprovedVendor && user?.vendor_profile?.status === 'PENDING');

  return (
    <header className="stitch-navbar-header">
      <div className="stitch-navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="stitch-brand-logo">
          <Logo showTagline={true} option={logoOption} />
        </Link>

        {/* Desktop Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="stitch-search-wrapper">
          <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }} title="Search">
            <Search size={16} className="stitch-search-icon" />
          </button>
          <input
            type="text"
            className="stitch-search-input"
            placeholder="Search designers, styles, or pieces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* Desktop Nav Links */}
        <nav className="stitch-nav-links">
          <Link to="/men" className="stitch-nav-link">Men</Link>
          <Link to="/women" className="stitch-nav-link">Women</Link>
          <Link to="/traditional" className="stitch-nav-link">Traditional</Link>
          <Link to="/streetwear" className="stitch-nav-link">Streetwear</Link>
          <Link to="/designers" className="stitch-nav-link stitch-nav-highlight">Designers</Link>
        </nav>

        {/* Action Icons & Status */}
        <div className="stitch-navbar-actions">
          {/* Quick Vendor Action Button */}
          {isApprovedVendor ? (
            <Link
              to="/vendor/dashboard"
              className="navbar-designer-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#064E3B',
                color: '#FFF',
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(6, 78, 59, 0.2)'
              }}
            >
              <Store size={14} color="#D4AF37" />
              <span>Seller Dashboard</span>
            </Link>
          ) : isPendingVendor ? (
            <Link
              to="/vendor/dashboard"
              className="navbar-designer-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#D97706',
                color: '#FFF',
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.2)'
              }}
            >
              <Clock size={14} color="#FFF" />
              <span>Application Pending</span>
            </Link>
          ) : (
            <button
              onClick={onOpenVendorRegister}
              className="navbar-sell-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: 'transparent',
                border: '1px solid #D1D5DB',
                color: '#374151',
                padding: '0.4rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sparkles size={13} color="#D4AF37" />
              <span>Sell on Aso</span>
            </button>
          )}

          {/* Cart Icon with Badge */}
          <Link to="/cart" className="stitch-icon-btn stitch-cart-btn" title="Shopping Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* User Account / Auth Dropdown */}
          {user ? (
            <div className="user-dropdown-wrapper">
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <div className="user-avatar-circle">
                  {user.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div className="dropdown-menu-card" onClick={() => setDropdownOpen(false)}>
                  <div className="dropdown-user-header">
                    <p className="dropdown-user-name">{user.first_name} {user.last_name}</p>
                    <p className="dropdown-user-email">{user.email}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  <Link to="/profile" className="dropdown-item">
                    <MapPin size={15} />
                    <span>My Profile & Orders</span>
                  </Link>
                  <Link to="/cart" className="dropdown-item">
                    <ShoppingBag size={15} />
                    <span>My Cart {cartCount > 0 && `(${cartCount})`}</span>
                  </Link>
                  <hr className="dropdown-divider" />
                  {isApprovedVendor ? (
                    <Link to="/vendor/dashboard" className="dropdown-item">
                      <Store size={15} color="#064E3B" />
                      <span>Seller Dashboard</span>
                    </Link>
                  ) : isPendingVendor ? (
                    <Link to="/vendor/dashboard" className="dropdown-item" style={{ color: '#D97706' }}>
                      <Clock size={15} color="#D97706" />
                      <span>Application Status (Pending)</span>
                    </Link>
                  ) : (
                    <button
                      className="dropdown-item dropdown-item-sell"
                      onClick={onOpenVendorRegister}
                    >
                      <Sparkles size={15} color="#D4AF37" />
                      <span>Become a Designer</span>
                    </button>
                  )}
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item dropdown-logout-btn" onClick={logout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="stitch-icon-btn" onClick={() => openAuthModal('login')} title="Sign In">
              <UserIcon size={20} />
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="stitch-mobile-drawer">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="mobile-search-wrapper">
            <Search size={16} className="stitch-search-icon" />
            <input
              type="text"
              className="stitch-search-input"
              placeholder="Search designers, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <nav className="mobile-nav-links" onClick={() => setMobileMenuOpen(false)}>
            <Link to="/men" className="mobile-nav-link">Men Collection</Link>
            <Link to="/women" className="mobile-nav-link">Women Collection</Link>
            <Link to="/traditional" className="mobile-nav-link">Traditional Bespoke</Link>
            <Link to="/streetwear" className="mobile-nav-link">Lagos Streetwear</Link>
            <Link to="/designers" className="mobile-nav-link">Master Designers &amp; Ateliers</Link>
            <Link to="/cart" className="mobile-nav-link">
              Cart {cartCount > 0 && <span className="mobile-cart-count">({cartCount})</span>}
            </Link>

            <hr className="mobile-drawer-divider" />

            {user ? (
              <>
                <Link to="/profile" className="mobile-nav-link">My Profile & Orders</Link>
                {isApprovedVendor ? (
                  <Link to="/vendor/dashboard" className="mobile-nav-link" style={{ fontWeight: 700, color: '#064E3B' }}>
                    Seller Dashboard
                  </Link>
                ) : isPendingVendor ? (
                  <Link to="/vendor/dashboard" className="mobile-nav-link" style={{ fontWeight: 600, color: '#D97706' }}>
                    Application Status (Pending)
                  </Link>
                ) : (
                  <button className="mobile-designer-btn" onClick={onOpenVendorRegister}>
                    Become a Designer
                  </button>
                )}
                <button className="mobile-nav-link" onClick={logout} style={{ color: '#DC2626', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  Log Out
                </button>
              </>
            ) : (
              <button className="mobile-designer-btn" onClick={onOpenVendorRegister}>
                Become a Designer
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
