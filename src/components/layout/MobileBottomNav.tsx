import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  LayoutGrid, 
  ShoppingBag, 
  User as UserIcon, 
  Store, 
  X, 
  ChevronRight, 
  Scissors,
  Crown,
  Shirt,
  Gem
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import './MobileBottomNav.css';

export const MobileBottomNav: React.FC = () => {
  const { cartCount } = useCart();
  const { user, openAuthModal } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Close sheet whenever location changes
  useEffect(() => {
    setIsCategorySheetOpen(false);
  }, [location.pathname]);

  // Hide on admin portal routes to avoid clutter
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const isVendor = Boolean(user?.is_vendor || user?.vendor_profile);
  const isVendorRoute = location.pathname.startsWith('/vendor');
  const isCategoryActive = 
    location.pathname.startsWith('/men') || 
    location.pathname.startsWith('/women') || 
    location.pathname.startsWith('/traditional') ||
    location.pathname.startsWith('/designers') ||
    location.pathname.startsWith('/artisans') ||
    location.pathname.startsWith('/categories');

  const handleCategoryClick = (path: string) => {
    setIsCategorySheetOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Category Bottom Sheet Drawer */}
      {isCategorySheetOpen && (
        <div 
          className="aso-category-sheet-backdrop" 
          onClick={() => setIsCategorySheetOpen(false)}
        >
          <div 
            className="aso-category-sheet" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-handle-bar">
              <div className="sheet-handle" />
            </div>

            <div className="sheet-header">
              <div className="sheet-title-group">
                <span className="sheet-eyebrow">BROWSE COLLECTIONS</span>
                <h3 className="sheet-title">Shop by Category</h3>
              </div>
              <button 
                className="sheet-close-btn" 
                onClick={() => setIsCategorySheetOpen(false)}
                aria-label="Close categories"
              >
                <X size={18} />
              </button>
            </div>

            <div className="sheet-category-list">
              {/* Men */}
              <button 
                className="sheet-category-card" 
                onClick={() => handleCategoryClick('/men')}
              >
                <div className="category-card-icon male-icon">
                  <Shirt size={20} className="cat-icon-svg" />
                </div>
                <div className="category-card-info">
                  <h4>Men's Collection</h4>
                  <p>Agbada, Kaftans, Senator Suits &amp; Native Sets</p>
                </div>
                <ChevronRight size={18} className="category-card-arrow" />
              </button>

              {/* Women */}
              <button 
                className="sheet-category-card" 
                onClick={() => handleCategoryClick('/women')}
              >
                <div className="category-card-icon female-icon">
                  <Gem size={20} className="cat-icon-svg" />
                </div>
                <div className="category-card-info">
                  <h4>Women's Collection</h4>
                  <p>Aso Ebi, Iro &amp; Buba, Gowns &amp; Luxury Corsets</p>
                </div>
                <ChevronRight size={18} className="category-card-arrow" />
              </button>

              {/* Traditional */}
              <button 
                className="sheet-category-card" 
                onClick={() => handleCategoryClick('/traditional')}
              >
                <div className="category-card-icon heritage-icon">
                  <Crown size={20} className="cat-icon-svg" />
                </div>
                <div className="category-card-info">
                  <h4>Traditional &amp; Heritage</h4>
                  <p>Ceremonial Aso Oke, Royal Regalia &amp; Cultural Attire</p>
                </div>
                <ChevronRight size={18} className="category-card-arrow" />
              </button>

              {/* Master Designers */}
              <button 
                className="sheet-category-card" 
                onClick={() => handleCategoryClick('/designers')}
              >
                <div className="category-card-icon designer-icon">
                  <Scissors size={20} className="cat-icon-svg" />
                </div>
                <div className="category-card-info">
                  <h4>Master Designers &amp; Ateliers</h4>
                  <p>Bespoke Tailoring, Direct Custom Craft &amp; Consultations</p>
                </div>
                <ChevronRight size={18} className="category-card-arrow" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav className="aso-mobile-bottom-nav" aria-label="Mobile Navigation">
        <div className="mobile-nav-track">
          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => `mobile-nav-item ${isActive && !isCategorySheetOpen ? 'active' : ''}`}
          >
            <div className="nav-icon-container">
              <Home size={22} />
            </div>
            <span className="nav-label">Home</span>
          </NavLink>

          {/* Categories Hub */}
          <button
            type="button"
            className={`mobile-nav-item ${isCategoryActive || isCategorySheetOpen ? 'active' : ''}`}
            onClick={() => setIsCategorySheetOpen(!isCategorySheetOpen)}
            aria-label="Browse Categories"
          >
            <div className="nav-icon-container">
              <LayoutGrid size={22} />
            </div>
            <span className="nav-label">Categories</span>
          </button>

          {/* Cart */}
          <NavLink
            to="/cart"
            className={({ isActive }) => `mobile-nav-item ${isActive && !isCategorySheetOpen ? 'active' : ''}`}
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
              `mobile-nav-item ${(isActive || isVendorRoute) && !isCategorySheetOpen ? 'active' : ''}`
            }
          >
            <div className="nav-icon-container">
              {isVendor ? <Store size={22} /> : <UserIcon size={22} />}
            </div>
            <span className="nav-label">{isVendor ? 'Studio' : 'Profile'}</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
};
