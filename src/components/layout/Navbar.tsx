import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Search, ShoppingBag, User as UserIcon, LogOut, ChevronDown, Menu, X, MapPin } from 'lucide-react';
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

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="stitch-navbar-header">
      <div className="stitch-navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="stitch-brand-logo">
          <Logo showTagline={true} option={logoOption} />
        </Link>

        {/* Desktop Search Bar */}
        <div className="stitch-search-wrapper">
          <Search size={16} className="stitch-search-icon" />
          <input
            type="text"
            className="stitch-search-input"
            placeholder="Search designers, styles, or pieces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </div>

        {/* Desktop Nav Links */}
        <nav className="stitch-nav-links">
          <a href="/#men" className="stitch-nav-link">Men</a>
          <a href="/#women" className="stitch-nav-link">Women</a>
          <a href="/#traditional" className="stitch-nav-link">Traditional</a>
          <a href="/#streetwear" className="stitch-nav-link">Streetwear</a>
          <a href="/#designers" className="stitch-nav-link stitch-nav-highlight">Designers</a>
        </nav>

        {/* Action Icons */}
        <div className="stitch-navbar-actions">
          {/* Cart Icon with Badge */}
          <Link to="/cart" className="stitch-icon-btn stitch-cart-btn" title="Cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>

          {/* User Account / Auth */}
          {user ? (
            <div className="user-dropdown-wrapper">
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
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
                    <span>My Profile & Addresses</span>
                  </Link>
                  <Link to="/cart" className="dropdown-item">
                    <ShoppingBag size={15} />
                    <span>My Cart {cartCount > 0 && `(${cartCount})`}</span>
                  </Link>
                  {user.is_vendor && (
                    <>
                      <hr className="dropdown-divider" />
                      <Link to="/vendor/dashboard" className="dropdown-item">
                        <span>Vendor Dashboard</span>
                      </Link>
                    </>
                  )}
                  {!user.is_vendor && (
                    <button
                      className="dropdown-item dropdown-item-sell"
                      onClick={onOpenVendorRegister}
                    >
                      <span>Become a Designer</span>
                    </button>
                  )}
                  <button className="dropdown-item dropdown-logout-btn" onClick={logout}>
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="stitch-icon-btn" onClick={() => openAuthModal('login')} title="Account">
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
          <div className="mobile-search-wrapper">
            <Search size={16} className="stitch-search-icon" />
            <input
              type="text"
              className="stitch-search-input"
              placeholder="Search designers, styles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
            />
          </div>

          <nav className="mobile-nav-links" onClick={() => setMobileMenuOpen(false)}>
            <a href="/#men" className="mobile-nav-link">Men Collection</a>
            <a href="/#women" className="mobile-nav-link">Women Collection</a>
            <a href="/#traditional" className="mobile-nav-link">Traditional Bespoke</a>
            <a href="/#streetwear" className="mobile-nav-link">Lagos Streetwear</a>
            <a href="/#designers" className="mobile-nav-link">Fashion Houses</a>
            <Link to="/cart" className="mobile-nav-link">
              Cart {cartCount > 0 && <span className="mobile-cart-count">({cartCount})</span>}
            </Link>

            <hr className="mobile-drawer-divider" />

            {user ? (
              <>
                <Link to="/profile" className="mobile-nav-link">My Profile</Link>
                {user.is_vendor && <Link to="/vendor/dashboard" className="mobile-nav-link">Vendor Dashboard</Link>}
              </>
            ) : (
              <button className="mobile-designer-btn" onClick={onOpenVendorRegister}>
                Register as a Designer
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};
