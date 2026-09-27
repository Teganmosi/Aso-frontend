import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Heart,
  Search,
  X,
  Store
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product, PublicVendorProfile } from '../../types';
import './MobileHomeView.css';

import type { CategoryPillItem } from './DesktopHomeView';

interface MobileHomeViewProps {
  products: Product[];
  vendors: PublicVendorProfile[];
  loading: boolean;
  selectedCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
  searchQuery: string;
  onSearchSubmit: (q: string) => void;
  onOpenVendorRegister?: () => void;
  isDesigner: boolean;
  categories?: CategoryPillItem[];
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  products,
  vendors,
  loading,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchSubmit,
  onOpenVendorRegister,
  isDesigner,
  categories = [],
}) => {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(searchInput.trim());
  };

  const handleClear = () => {
    setSearchInput('');
    onSearchSubmit('');
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mobile-home-container">
      {/* 1. Mobile Search Bar */}
      <section className="mobile-search-section">
        <form onSubmit={handleFormSubmit} className="mobile-search-pill">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search agbada, gowns, senator..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button type="button" onClick={handleClear} className="search-clear-btn" title="Clear">
              <X size={16} />
            </button>
          )}
        </form>
      </section>

      {/* 2. Hero Card */}
      <section className="mobile-hero-section">
        <div className="mobile-hero-card">
          <div className="mobile-hero-bg">
            <div className="mobile-hero-overlay"></div>
          </div>
                  <div className="mobile-hero-content">
          <h1 className="mobile-hero-title">
            Authentic Nigerian Fashion.<br />
            <em>Made by People Who Know Their Craft.</em>
          </h1>
          <p className="mobile-hero-sub">
            Shop ready-to-wear, traditional pieces, bespoke designs, and statement looks from verified independent Nigerian designers.
          </p>
            <div className="mobile-hero-actions">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('mobile-curated-feed');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-mobile-explore"
              >
                <span>Explore Pieces</span>
                <ArrowRight size={14} />
              </button>
              <Link to="/designers" className="btn-mobile-designers">
                <span>Meet Designers</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Category Horizontal Pills */}
      <section className="mobile-pills-section">
        <div className="mobile-pills-scroll no-scrollbar">
          {categories.map((pill) => {
            const isActive = selectedCategory === pill.slug || (pill.slug === null && !selectedCategory);
            return (
              <button
                key={pill.slug ?? 'all'}
                type="button"
                onClick={() => onCategorySelect(pill.slug)}
                className={`mobile-pill-btn ${isActive ? 'active' : ''}`}
              >
                {pill.mobileName || pill.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Curated Pieces Horizontal Carousel */}
      <section id="mobile-curated-feed" className="mobile-curated-section">
        <div className="mobile-section-header">
          <div>
            <span className="mobile-eyebrow">CURATED FOR YOU</span>
            <h2 className="mobile-section-title">
              {searchQuery
                ? `Search: "${searchQuery}"`
                : selectedCategory
                ? `${selectedCategory.toUpperCase()} COLLECTION`
                : 'Curated Pieces'}
            </h2>
          </div>
          <Link to="/men" className="mobile-see-all-link">
            <span>See all</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="mobile-loading-box">
            <p>Loading pieces...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="mobile-empty-box">
            <p>No pieces found matching your criteria</p>
            <button onClick={() => onCategorySelect(null)} className="btn-mobile-browse-all">
              Browse Full Catalog
            </button>
          </div>
        ) : (
          <div className="mobile-products-carousel no-scrollbar">
            {products.map((prod) => {
              const prepDays = prod.preparation_time_days;
              const priceNaira = prod.base_price_naira ?? (prod.base_price_kobo ? Math.round(prod.base_price_kobo / 100) : 0);
              const isFav = Boolean(favorites[prod.id]);

              return (
                <div key={prod.id} className="mobile-product-card">
                  <Link to={`/products/${prod.slug || prod.id}`} className="mobile-product-media">
                    <img
                      src={prod.primary_image_url || (prod.media && prod.media[0]?.url) || '/traditional-men-1.png'}
                      alt={prod.title}
                      loading="lazy"
                    />
                    <button
                      type="button"
                      onClick={(e) => toggleFavorite(prod.id, e)}
                      className={`mobile-fav-btn ${isFav ? 'fav-active' : ''}`}
                      title="Wishlist"
                    >
                      <Heart size={14} fill={isFav ? '#DC2626' : 'none'} color={isFav ? '#DC2626' : '#1C1B1B'} />
                    </button>
                    {prepDays && prepDays > 0 && (
                      <div className="mobile-sla-chip">
                        <Clock size={10} color="#8B500A" />
                        <span>Made to Order · {prepDays}d</span>
                      </div>
                    )}
                  </Link>

                  <div className="mobile-product-meta">
                    <div className="mobile-designer-name">
                      {prod.vendor?.store_name || 'Independent Designer'}
                    </div>
                    <h3 className="mobile-product-title">
                      <Link to={`/products/${prod.slug || prod.id}`}>{prod.title}</Link>
                    </h3>
                    <div className="mobile-product-price">
                      ₦{priceNaira.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      

      {/* 6. Featured Designers Carousel */}
      <section className="mobile-designers-section">
        <div className="mobile-section-header">
          <div>
            <span className="mobile-eyebrow">VERIFIED TALENT</span>
            <h2 className="mobile-section-title">Featured Designers</h2>
          </div>
          <Link to="/designers" className="mobile-see-all-link">
            <span>See all</span>
            <ChevronRight size={16} />
          </Link>
        </div>

        <div className="mobile-designers-carousel no-scrollbar">
          {vendors.map((v, i) => {
            const reviewCount = v.review_count || 0;
            const ratingNum = v.average_rating ? Number(v.average_rating) : 0;
            const hasValidRating = reviewCount > 0 && ratingNum > 0;

            return (
              <div key={v.id || i} className="mobile-designer-card">
                <div
                  className="mobile-designer-banner"
                  style={{
                    backgroundImage: `url(${v.banner_url || (i === 0 ? '/hero-bg.png' : '/traditional-men-1.png')})`,
                  }}
                >
                  <div className="mobile-designer-avatar">
                    {v.store_name?.slice(0, 2).toUpperCase() || 'AS'}
                  </div>
                </div>
                <div className="mobile-designer-body">
                  <div className="mobile-designer-name-row">
                    <h4>{v.store_name || 'Aso Designer'}</h4>
                    {Boolean(v.is_verified) && (
                      <CheckCircle2 size={13} color="#00322D" />
                    )}
                  </div>
                  <p className="mobile-designer-loc">{v.city ? `${v.city}, Nigeria` : 'Lagos, Nigeria'}</p>
                  <p className="mobile-designer-desc">
                    {v.description ? v.description.slice(0, 65) + '...' : 'Bespoke & Ready-to-Wear Fashion'}
                  </p>
                  {hasValidRating && (
                    <div className="mobile-designer-rating">
                      <span>★ {ratingNum.toFixed(1)} ({reviewCount})</span>
                    </div>
                  )}
                  <Link to={`/store/${v.slug}`} className="btn-mobile-store">
                    <span>View Store</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Why Shop on Aso */}
      <section className="mobile-confidence-section">
        <div className="mobile-confidence-card">
          <span className="mobile-confidence-tag">BUY WITH CONFIDENCE</span>
          <h3 className="mobile-confidence-title">Why Shop on Aso</h3>
          <div className="mobile-confidence-list">
            <div className="mobile-confidence-item">
              <div className="check-dot">✓</div>
              <div>
                <strong>Verified Designers</strong>
                <p>Every designer on Aso goes through a verification process before they can sell on the marketplace.</p>
              </div>
            </div>
            <div className="mobile-confidence-item">
              <div className="check-dot">✓</div>
              <div>
                <strong>Secure Online Payments</strong>
                <p>Pay safely with your debit card or bank transfer without having to send money directly to strangers on social media.</p>
              </div>
            </div>
            <div className="mobile-confidence-item">
              <div className="check-dot">✓</div>
              <div>
                <strong>72h Buyer Protection</strong>
                <p>Your payment remains securely protected while your order is being fulfilled, giving you time to inspect your delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Sell on Aso */}
      <section className="mobile-sell-section">
        <div className="mobile-sell-card">
          <span className="mobile-sell-tag">
            {isDesigner ? 'STUDIO MANAGEMENT' : 'SELL ON ASO'}
          </span>
          <h3 className="mobile-sell-title">
            {isDesigner
              ? 'Your Fashion Studio is Live on Aso'
              : 'Turn Your Instagram & WhatsApp Customers Into Orders'}
          </h3>
          <p className="mobile-sell-desc">
            {isDesigner
              ? 'Manage your live product catalogue, process client orders, track delivery dispatches, and withdraw settlements directly to your Nigerian bank account.'
              : 'Create your own digital storefront on Aso, upload your designs, accept verified online payments, and manage all your customer orders from one place.'}
          </p>
          <button
            type="button"
            onClick={isDesigner ? () => navigate('/vendor/dashboard') : onOpenVendorRegister}
            className="btn-mobile-sell"
          >
            <Store size={15} />
            <span>{isDesigner ? 'Go to Studio Dashboard' : 'Start Selling on Aso'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
};
