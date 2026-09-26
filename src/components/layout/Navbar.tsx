import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Search, ShoppingBag, User as UserIcon, LogOut, ChevronDown, Menu, X, MapPin, Sparkles, Store, ShieldCheck } from 'lucide-react';
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

  const isVendor = Boolean(user?.is_vendor || user?.vendor_profile);
  const isVerified = Boolean(user?.vendor_profile?.is_verified);

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
          <Link to="/designers" className="stitch-nav-link stitch-nav-highlight">Designers</Link>
        </nav>

        {/* Action Icons & Status */}
        <div className="stitch-navbar-actions">
          {/* Quick Staff Admin Portal Pill */}
          {user?.is_staff && (
            <Link
              to="/admin"
              className="navbar-admin-pill"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#7F1D1D',
                color: '#FFF',
                padding: '0.45rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(127, 29, 29, 0.25)'
              }}
            >
              <ShieldCheck size={14} color="#FCA5A5" />
              <span>Admin Desk</span>
            </Link>
          )}

          {/* Quick Vendor Action Button */}
          {isVendor ? (
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
              <span>{isVerified ? 'Verified Studio' : 'Seller Dashboard'}</span>
            </Link>
          ) : !user?.is_staff ? (
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
          ) : null}

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
                    {user.is_staff && (
                      <span style={{ display: 'inline-block', marginTop: '0.25rem', background: '#FEF2F2', color: '#991B1B', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', textTransform: 'uppercase' }}>
                        Staff Administrator
                      </span>
                    )}
                  </div>
                  <hr className="dropdown-divider" />
                  {user.is_staff && (
                    <>
                      <Link to="/admin" className="dropdown-item" style={{ color: '#991B1B', fontWeight: 600 }}>
                        <ShieldCheck size={15} color="#991B1B" />
                        <span>Platform Admin Desk</span>
                      </Link>
                      <hr className="dropdown-divider" />
                    </>
                  )}
                  <Link to="/profile" className="dropdown-item">
                    <MapPin size={15} />
                    <span>My Profile & Orders</span>
                  </Link>
                  <Link to="/cart" className="dropdown-item">
                    <ShoppingBag size={15} />
                    <span>My Cart {cartCount > 0 && `(${cartCount})`}</span>
                  </Link>
                  <hr className="dropdown-divider" />
                  {isVendor ? (
                    <Link to="/vendor/dashboard" className="dropdown-item">
                      <Store size={15} color="#064E3B" />
                      <span>Seller Dashboard {isVerified && '★'}</span>
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
            <Link to="/designers" className="mobile-nav-link">Master Designers &amp; Ateliers</Link>
            <Link to="/cart" className="mobile-nav-link">
              Cart {cartCount > 0 && <span className="mobile-cart-count">({cartCount})</span>}
            </Link>

            <hr className="mobile-drawer-divider" />

            {user ? (
              <>
                {user.is_staff && (
                  <Link to="/admin" className="mobile-nav-link" style={{ fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#991B1B" />
                    <span>Platform Admin Desk</span>
                  </Link>
                )}
                <Link to="/profile" className="mobile-nav-link">My Profile & Orders</Link>
                {isVendor ? (
                  <Link to="/vendor/dashboard" className="mobile-nav-link" style={{ fontWeight: 700, color: '#064E3B' }}>
                    Seller Dashboard {isVerified && '(Verified)'}
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
