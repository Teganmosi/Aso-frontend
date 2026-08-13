import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Search, ShoppingBag, User as UserIcon, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import './Navbar.css';

import { Logo, type LogoOption } from './Logo';

interface NavbarProps {
  onOpenVendorRegister: () => void;
  logoOption?: LogoOption;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenVendorRegister, logoOption = 2 }) => {
  const { user, openAuthModal, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="stitch-navbar-header">
      <div className="stitch-navbar-container">
        {/* Brand Logo */}
        <a href="/" className="stitch-brand-logo">
          <Logo showTagline={true} option={logoOption} />
        </a>

        {/* Desktop Search Bar */}
        <div className="stitch-search-wrapper">
          <Search size={16} className="stitch-search-icon" />
          <input
            type="text"
            className="stitch-search-input"
            placeholder="Search designers, styles, or pieces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Desktop Nav Links */}
        <nav className="stitch-nav-links">
          <a href="#men" className="stitch-nav-link">Men</a>
          <a href="#women" className="stitch-nav-link">Women</a>
          <a href="#traditional" className="stitch-nav-link">Traditional</a>
          <a href="#streetwear" className="stitch-nav-link">Streetwear</a>
          <a href="/store/lagos-couture" className="stitch-nav-link stitch-nav-highlight">Designers</a>
        </nav>

        {/* Action Icons */}
        <div className="stitch-navbar-actions">
          {/* Cart Icon */}
          <a href="#cart" onClick={(e) => e.preventDefault()} className="stitch-icon-btn" title="Cart">
            <ShoppingBag size={20} />
          </a>

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
                  <a href="/store/lagos-couture" className="dropdown-item">
                    <span>View Storefront</span>
                  </a>
                  <a href="/vendor/dashboard" className="dropdown-item">
                    <span>Vendor Dashboard</span>
                  </a>
                  <button
                    className="dropdown-item dropdown-item-sell"
                    onClick={onOpenVendorRegister}
                  >
                    <span>Register as a Designer</span>
                  </button>
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
            />
          </div>

          <nav className="mobile-nav-links" onClick={() => setMobileMenuOpen(false)}>
            <a href="#men" className="mobile-nav-link">Men Collection</a>
            <a href="#women" className="mobile-nav-link">Women Collection</a>
            <a href="#traditional" className="mobile-nav-link">Traditional Bespoke</a>
            <a href="#streetwear" className="mobile-nav-link">Lagos Streetwear</a>
            <a href="/store/lagos-couture" className="mobile-nav-link">Fashion Houses</a>
            
            <hr className="mobile-drawer-divider" />

            <button className="mobile-designer-btn" onClick={onOpenVendorRegister}>
              Register as a Designer
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
