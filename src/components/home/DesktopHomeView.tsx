import React from 'react';
import { 
  ArrowRight, 
  CheckCircle2, 
  CreditCard, 
  ShieldCheck, 
  Compass, 
  ShoppingBag, 
  Clock, 
  Truck, 
  Store 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product, PublicVendorProfile } from '../../types';
import './DesktopHomeView.css';

export interface CategoryPillItem {
  name: string;
  mobileName?: string;
  slug: string | null;
  count?: number;
}

interface DesktopHomeViewProps {
  products: Product[];
  vendors: PublicVendorProfile[];
  loading: boolean;
  selectedCategory: string | null;
  onCategorySelect: (slug: string | null) => void;
  searchQuery: string;
  onOpenVendorRegister?: () => void;
  isDesigner: boolean;
  categories?: CategoryPillItem[];
}

export const DesktopHomeView: React.FC<DesktopHomeViewProps> = ({
  products,
  vendors,
  loading,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onOpenVendorRegister,
  isDesigner,
  categories = [],
}) => {
  const navigate = useNavigate();

  return (
    <div className="desktop-home-container">
      
      {/* ── 1. EXPANSIVE EDITORIAL HERO (Screenshot 5) ── */}
      <section className="desktop-hero-section">
        <div className="desktop-hero-bg">
          <div className="desktop-hero-overlay"></div>
        </div>

        <div className="desktop-hero-content">
          <h1 className="desktop-hero-headline">
            Authentic Nigerian Fashion.<br />
            <span>Made by People Who Know Their Craft.</span>
          </h1>

          <p className="desktop-hero-subtitle">
            Shop ready-to-wear, traditional pieces, bespoke designs, and statement looks from verified independent Nigerian designers.
          </p>

          <div className="desktop-hero-actions">
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('desktop-collection-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-desktop-primary"
            >
              <span>Explore The Marketplace</span>
              <ArrowRight size={16} />
            </button>

            <Link to="/designers" className="btn-desktop-secondary">
              <span>Explore Designers</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. EXPLORE THE COLLECTION (Screenshot 4) ── */}
      <section id="desktop-collection-section" className="desktop-collection-section">
        <div className="desktop-container">
          <div className="desktop-section-header">
            <span className="desktop-section-eyebrow">MARKETPLACE CURATION</span>
            <h2 className="desktop-section-title">
              {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory ? `${selectedCategory.toUpperCase()} COLLECTION` : 'Explore The Collection'}
            </h2>
          </div>

          {/* Horizontal Category Pill Row */}
          <div className="desktop-category-pills-row no-scrollbar">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.slug || (cat.slug === null && !selectedCategory);
              return (
                <button
                  key={cat.slug ?? 'all'}
                  type="button"
                  onClick={() => onCategorySelect(cat.slug)}
                  className={`desktop-cat-pill ${isActive ? 'active' : ''}`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid (Screenshot 4) */}
          {loading ? (
            <div className="desktop-state-box">
              <p>Loading pieces...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="desktop-state-box">
              <p>No pieces found matching your criteria</p>
              <button onClick={() => onCategorySelect(null)} className="btn-desktop-reset">
                Browse Full Catalog
              </button>
            </div>
          ) : (
            <div className="desktop-products-grid">
              {products.map((prod) => {
                const prepDays = prod.preparation_time_days || 5;
                const priceNaira = prod.base_price_naira ?? (prod.base_price_kobo ? Math.round(prod.base_price_kobo / 100) : 0);

                return (
                  <div key={prod.id} className="desktop-product-card">
                    <Link to={`/products/${prod.slug || prod.id}`} className="desktop-product-media">
                      <img
                        src={prod.primary_image_url || (prod.media && prod.media[0]?.url) || '/traditional-men-1.png'}
                        alt={prod.title}
                        loading="lazy"
                      />
                      <div className="desktop-card-badge-top-right">
                        <span>New Arrival</span>
                      </div>
                      <div className="desktop-card-badge-bottom-left">
                        <span>Made to Order ({prepDays}d)</span>
                      </div>
                    </Link>

                    <div className="desktop-product-details">
                      <div className="desktop-designer-meta">
                        <span className="desktop-designer-name">
                          {prod.vendor?.store_name || 'Independent Designer'}
                        </span>
                        {Boolean(prod.vendor?.is_verified) && (
                          <span className="desktop-verified-chip">✓ Verified</span>
                        )}
                      </div>

                      <h3 className="desktop-prod-title">
                        <Link to={`/products/${prod.slug || prod.id}`}>{prod.title}</Link>
                      </h3>

                      <div className="desktop-prod-price">
                        ₦{priceNaira.toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. FEATURED DESIGNERS (Screenshot 3) ── */}
      <section className="desktop-designers-section">
        <div className="desktop-container">
          <div className="desktop-section-header-center">
            <span className="desktop-section-eyebrow">VERIFIED TALENT</span>
            <h2 className="desktop-section-title">Featured Designers</h2>
            <p className="desktop-section-subtitle">
              Direct access to verified Nigerian fashion houses, independent design hubs, and master tailors nationwide.
            </p>
          </div>

          <div className="desktop-designers-grid">
            {vendors.map((v, i) => (
              <div key={v.id || i} className="desktop-designer-card">
                <div
                  className="desktop-designer-banner"
                  style={{
                    backgroundImage: `url(${v.banner_url || (i === 0 ? '/hero-bg.png' : '/traditional-men-1.png')})`,
                  }}
                >
                  <div className="desktop-designer-avatar">
                    <span>{v.store_name?.slice(0, 2).toUpperCase() || 'VD'}</span>
                  </div>
                </div>

                <div className="desktop-designer-body">
                  <h3 className="desktop-store-name">{v.store_name || 'Aso Designer'}</h3>
                  <p className="desktop-store-location">
                    {v.city ? `${v.city}, ${v.state || 'Lagos State'}` : 'Lagos, Lagos State'}
                    {v.average_rating && Number(v.average_rating) > 0 && v.review_count && v.review_count > 0
                      ? ` • ${Number(v.average_rating).toFixed(1)} ★ (${v.review_count})`
                      : ''}
                  </p>
                  <p className="desktop-store-desc">
                    {v.description || 'Verified Nigerian bespoke fashion designer.'}
                  </p>
                  <Link to={`/store/${v.slug}`} className="desktop-store-link">
                    <span>Visit Designer Storefront</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. HOW ASO WORKS (Screenshot 2) ── */}
      <section className="desktop-how-works-section">
        <div className="desktop-container">
          <div className="desktop-section-header-center">
            <span className="desktop-section-eyebrow">SIMPLE &amp; RELIABLE</span>
            <h2 className="desktop-section-title">How Aso Works</h2>
            <p className="desktop-section-subtitle">
              Discover, order, and receive authentic Nigerian fashion with complete peace of mind.
            </p>
          </div>

          <div className="desktop-how-steps-grid">
            {/* 01 */}
            <div className="desktop-step-card">
              <div className="desktop-step-top">
                <div className="desktop-step-icon-circle">
                  <Compass size={22} color="#004B44" />
                </div>
                <span className="desktop-step-num">01</span>
              </div>
              <h4 className="desktop-step-title">Discover</h4>
              <p className="desktop-step-text">
                Explore pieces from verified independent designers across Nigeria, all in one marketplace.
              </p>
            </div>

            {/* 02 */}
            <div className="desktop-step-card">
              <div className="desktop-step-top">
                <div className="desktop-step-icon-circle">
                  <ShoppingBag size={22} color="#004B44" />
                </div>
                <span className="desktop-step-num">02</span>
              </div>
              <h4 className="desktop-step-title">Order</h4>
              <p className="desktop-step-text">
                Choose your piece, select your ready-to-wear size or submit custom measurements, and securely pay online.
              </p>
            </div>

            {/* 03 */}
            <div className="desktop-step-card">
              <div className="desktop-step-top">
                <div className="desktop-step-icon-circle">
                  <Clock size={22} color="#004B44" />
                </div>
                <span className="desktop-step-num">03</span>
              </div>
              <h4 className="desktop-step-title">We Coordinate</h4>
              <p className="desktop-step-text">
                The designer accepts and prepares your piece while Aso tracks fulfillment and logistics milestones.
              </p>
            </div>

            {/* 04 */}
            <div className="desktop-step-card">
              <div className="desktop-step-top">
                <div className="desktop-step-icon-circle">
                  <Truck size={22} color="#004B44" />
                </div>
                <span className="desktop-step-num">04</span>
              </div>
              <h4 className="desktop-step-title">Receive</h4>
              <p className="desktop-step-text">
                Your order is safely dispatched and delivered directly to your doorstep with tracking updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. WHY SHOP ON ASO (Screenshot 1) ── */}
      <section className="desktop-why-shop-section">
        <div className="desktop-container">
          <div className="desktop-section-header-center">
            <span className="desktop-section-eyebrow">BUY WITH CONFIDENCE</span>
            <h2 className="desktop-section-title">Why Shop on Aso</h2>
          </div>

          <div className="desktop-why-shop-grid">
            {/* Card 1 */}
            <div className="desktop-why-card">
              <div className="desktop-why-icon-box">
                <CheckCircle2 size={24} color="#004B44" />
              </div>
              <h4 className="desktop-why-card-title">Verified Designers</h4>
              <p className="desktop-why-card-text">
                Every designer on Aso goes through a verification process before they can sell on the marketplace.
              </p>
            </div>

            {/* Card 2 */}
            <div className="desktop-why-card">
              <div className="desktop-why-icon-box">
                <CreditCard size={24} color="#004B44" />
              </div>
              <h4 className="desktop-why-card-title">Secure Online Payments</h4>
              <p className="desktop-why-card-text">
                Pay safely with your debit card or bank transfer without having to send money directly to strangers on social media.
              </p>
            </div>

            {/* Card 3 */}
            <div className="desktop-why-card">
              <div className="desktop-why-icon-box">
                <ShieldCheck size={24} color="#004B44" />
              </div>
              <h4 className="desktop-why-card-title">72h Buyer Protection</h4>
              <p className="desktop-why-card-text">
                Your payment remains securely protected while your order is being fulfilled, giving you time to inspect your delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. STUDIO MANAGEMENT BANNER (Screenshot 1 bottom) ── */}
      <section className="desktop-studio-cta-section">
        <div className="desktop-container">
          <div className="desktop-studio-card">
            <span className="desktop-studio-tag">
              {isDesigner ? 'STUDIO MANAGEMENT' : 'SELL ON ASO'}
            </span>
            <h2 className="desktop-studio-title">
              {isDesigner 
                ? 'Your Fashion Studio is Live on Aso' 
                : 'Turn Your Instagram & WhatsApp Customers Into Orders'}
            </h2>
            <p className="desktop-studio-desc">
              {isDesigner
                ? 'Manage your live product catalogue, process client orders, track delivery dispatches, and withdraw settlements directly to your Nigerian bank account.'
                : 'Create your own digital storefront on Aso, upload your designs, accept verified online payments, and manage all your customer orders from one place.'}
            </p>

            <button
              type="button"
              onClick={isDesigner ? () => navigate('/vendor/dashboard') : onOpenVendorRegister}
              className="btn-desktop-studio-action"
            >
              <Store size={16} />
              <span>{isDesigner ? 'Go to Studio Dashboard' : 'Start Selling on Aso'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
