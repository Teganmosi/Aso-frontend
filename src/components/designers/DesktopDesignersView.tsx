import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PublicVendorProfile } from '../../types';
import { 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  MapPin, 
  ArrowRight,
  Package,
  Building2,
  CreditCard,
  Search,
  X
} from 'lucide-react';
import './DesktopDesignersView.css';

interface DesktopDesignersViewProps {
  vendors: PublicVendorProfile[];
  loading: boolean;
  error: string | null;
  onOpenVendorRegister?: () => void;
}

export const DesktopDesignersView: React.FC<DesktopDesignersViewProps> = ({
  vendors,
  loading,
  error,
  onOpenVendorRegister
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredDesigners = useMemo(() => {
    return vendors.filter((v) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (v.store_name || '').toLowerCase().includes(q);
        const matchesLocation = `${v.city || ''} ${v.state || ''}`.toLowerCase().includes(q);
        const matchesDesc = (v.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesLocation && !matchesDesc) return false;
      }

      if (activeFilter === 'verified') return v.is_verified === true;
      if (activeFilter !== 'all') {
        return v.categories && v.categories.some(c => c.toLowerCase() === activeFilter.toLowerCase());
      }
      return true;
    });
  }, [vendors, activeFilter, searchQuery]);

  const featuredDesigner = useMemo(() => {
    if (vendors.length === 0) return null;
    const arike = vendors.find(v => v.slug === 'the-arike-style');
    if (arike) return arike;
    return vendors.find(v => v.is_verified) || vendors[0];
  }, [vendors]);

  const activeCategories = useMemo(() => {
    const catSet = new Set<string>();
    vendors.forEach((v) => {
      if (v.categories) {
        v.categories.forEach(c => catSet.add(c));
      }
    });
    return Array.from(catSet);
  }, [vendors]);

  return (
    <div className="desktop-designers-page-wrapper">
      {/* 1. Hero Section */}
      <section className="desktop-designers-hero">
        <div className="desktop-designers-container">
          <div className="desktop-hero-badge-wrap">
            <span className="desktop-hero-overline">THE DESIGNER DIRECTORY</span>
          </div>
          <h1 className="desktop-hero-headline">Nigerian Designers &amp; Fashion Houses</h1>
          <p className="desktop-hero-lead">
            Direct access to verified Nigerian fashion houses, independent design hubs, and master tailors nationwide.
          </p>

          <div className="desktop-hero-trust-strip">
            <div className="desktop-trust-item">
              <ShieldCheck size={16} color="#D4AF37" />
              <span>Verified Artisans</span>
            </div>
            <div className="desktop-trust-item">
              <Sparkles size={16} color="#064E3B" />
              <span>Bespoke &amp; Ready-to-Wear</span>
            </div>
            <div className="desktop-trust-item">
              <ShoppingBag size={16} color="#064E3B" />
              <span>Direct Storefront Access</span>
            </div>
          </div>
        </div>
      </section>

      <div className="desktop-designers-container">
        {/* 2. Designer Filters & Search Bar */}
        <section className="desktop-designers-filter-section" aria-label="Designer filters">
          <div className="desktop-filter-pills-row">
            <button
              type="button"
              className={`desktop-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Designers
            </button>
            <button
              type="button"
              className={`desktop-filter-pill ${activeFilter === 'verified' ? 'active' : ''}`}
              onClick={() => setActiveFilter('verified')}
            >
              <ShieldCheck size={14} color={activeFilter === 'verified' ? '#FFFFFF' : '#D4AF37'} />
              <span>Verified Only</span>
            </button>

            {activeCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`desktop-filter-pill ${activeFilter === cat ? 'active' : ''}`}
                onClick={() => setActiveFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="desktop-designer-search-wrap">
            <Search size={18} className="desktop-search-icon-inside" />
            <input
              type="text"
              className="desktop-designer-search-input"
              placeholder="Search by brand name, city, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="desktop-search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>

        {/* 3. Featured Designer Spotlight */}
        {featuredDesigner && activeFilter === 'all' && !searchQuery && (
          <section className="desktop-featured-designer-section" aria-label="Featured Designer">
            <div className="desktop-featured-designer-card">
              <div className="desktop-featured-card-content">
                <div className="desktop-featured-top-badge-row">
                  <span className="desktop-featured-tag">SPOTLIGHT DESIGNER</span>
                  {featuredDesigner.is_verified && (
                    <span className="desktop-verified-badge-gold">
                      <ShieldCheck size={14} />
                      <span>Verified House</span>
                    </span>
                  )}
                </div>
                
                <h2 className="desktop-featured-store-name">{featuredDesigner.store_name}</h2>

                <div className="desktop-featured-location">
                  <MapPin size={14} />
                  <span>{featuredDesigner.city}, {featuredDesigner.state}</span>
                </div>

                <p className="desktop-featured-description">
                  {featuredDesigner.description || 'Authentic Nigerian fashion from an independent Lagos-based designer.'}
                </p>

                <div className="desktop-featured-pricing-action-row">
                  <div className="desktop-featured-pricing">
                    {featuredDesigner.starting_price_naira ? (
                      <>
                        <span className="desktop-price-prefix">Pricing Starting</span>
                        <span className="desktop-price-val">₦{featuredDesigner.starting_price_naira.toLocaleString()}</span>
                      </>
                    ) : (
                      <>
                        <span className="desktop-price-prefix">Collection</span>
                        <span className="desktop-price-val">Bespoke &amp; RTW</span>
                      </>
                    )}
                  </div>

                  <Link to={`/store/${featuredDesigner.slug}`} className="desktop-btn-explore-collection">
                    <span>Visit Storefront</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>

              <div className="desktop-featured-card-media">
                {featuredDesigner.preview_images && featuredDesigner.preview_images.length > 0 ? (
                  <div className="desktop-featured-image-mosaic">
                    {featuredDesigner.preview_images.slice(0, 2).map((imgUrl, i) => (
                      <div key={i} className="desktop-mosaic-image-wrapper">
                        <img src={imgUrl} alt={`${featuredDesigner.store_name} piece`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="desktop-featured-image-single">
                    <img
                      src={featuredDesigner.banner_url || featuredDesigner.logo_url || '/female-work-suit.jpg'}
                      alt={featuredDesigner.store_name}
                    />
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* 4. Designer Directory */}
        <section className="desktop-designer-directory-section" aria-label="Designer Directory">
          <div className="desktop-directory-header">
            <div>
              <h2 className="desktop-directory-title">Verified Fashion Houses</h2>
              <p className="desktop-directory-subtitle">Browse designers and independent master tailors on Aso.</p>
            </div>
            <span className="desktop-directory-count">
              {filteredDesigners.length} {filteredDesigners.length === 1 ? 'brand' : 'brands'}
            </span>
          </div>

          {loading && (
            <div className="desktop-designers-grid">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="desktop-designer-skeleton-card" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="desktop-directory-error-card">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && filteredDesigners.length === 0 && (
            <div className="desktop-directory-empty-card">
              <h3>No designers match your search</h3>
              <p>Try adjusting your search criteria or explore all verified designers.</p>
              <button
                type="button"
                className="desktop-btn-reset-filters"
                onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {!loading && !error && filteredDesigners.length > 0 && (
            <div className="desktop-designers-grid">
              {filteredDesigners.map((designer, idx) => {
                const fallbackCover = idx % 2 === 0 ? '/hero-bg.png' : '/traditional-men-1.png';
                const bannerSrc = designer.banner_url || (designer.preview_images && designer.preview_images[0]) || fallbackCover;
                const initials = designer.store_name ? designer.store_name.slice(0, 2).toUpperCase() : 'AS';

                return (
                  <article key={designer.id || idx} className="desktop-designer-directory-card">
                    <div className="desktop-card-media-banner">
                      <img 
                        src={bannerSrc} 
                        alt={designer.store_name}
                        className="desktop-card-banner-img"
                        loading="lazy"
                      />
                      <div className="desktop-card-banner-gradient"></div>
                      
                      <div className="desktop-card-brand-avatar">
                        {designer.logo_url ? (
                          <img src={designer.logo_url} alt={designer.store_name} />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>

                      {designer.is_verified && (
                        <div className="desktop-card-verified-badge" title="Verified Designer">
                          <ShieldCheck size={13} color="#FFFFFF" />
                          <span>Verified</span>
                        </div>
                      )}
                    </div>

                    <div className="desktop-card-body">
                      <div className="desktop-card-header-top">
                        <h3 className="desktop-card-store-name">
                          <Link to={`/store/${designer.slug}`}>{designer.store_name}</Link>
                        </h3>
                      </div>

                      <div className="desktop-card-meta-location">
                        <MapPin size={13} />
                        <span>{designer.city || 'Lagos'}, {designer.state || 'Lagos State'}</span>
                      </div>

                      <p className="desktop-card-bio">
                        {designer.description || 'Authentic Nigerian bespoke and ready-to-wear fashion from verified independent designers.'}
                      </p>

                      <div className="desktop-card-stats-row">
                        <div className="desktop-stat-col">
                          <span className="desktop-stat-label">Collection</span>
                          <strong className="desktop-stat-value">{designer.product_count ?? 12} pieces</strong>
                        </div>
                        <div className="desktop-stat-col">
                          <span className="desktop-stat-label">Starting</span>
                          <strong className="desktop-stat-value">
                            {designer.starting_price_naira 
                              ? `₦${designer.starting_price_naira.toLocaleString()}`
                              : 'Bespoke'}
                          </strong>
                        </div>
                      </div>

                      <Link to={`/store/${designer.slug}`} className="desktop-btn-view-store">
                        <span>Visit Storefront</span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 5. Seller CTA */}
        <section className="desktop-seller-cta-section" aria-label="Become a Designer">
          <div className="desktop-seller-cta-card">
            <span className="desktop-cta-overline">STUDIO MANAGEMENT</span>
            <h2 className="desktop-cta-heading">Your Fashion Studio is Live on Aso</h2>
            <p className="desktop-cta-description">
              Direct access to serious clients looking for verified Nigerian fashion houses, bespoke tailoring, and ready-to-wear collections.
            </p>

            {onOpenVendorRegister ? (
              <button
                type="button"
                className="desktop-btn-become-designer"
                onClick={onOpenVendorRegister}
              >
                <span>Apply as a Designer</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <Link to="/vendor/register" className="desktop-btn-become-designer">
                <span>Apply as a Designer</span>
                <ArrowRight size={16} />
              </Link>
            )}

            <div className="desktop-why-sell-grid">
              <div className="desktop-why-sell-item">
                <div className="desktop-why-sell-icon">
                  <Building2 size={22} color="#064E3B" />
                </div>
                <h3>National Reach</h3>
                <p>Showcase pieces to shoppers across Nigeria and the diaspora.</p>
              </div>

              <div className="desktop-why-sell-item">
                <div className="desktop-why-sell-icon">
                  <Package size={22} color="#064E3B" />
                </div>
                <h3>Order &amp; Milestones</h3>
                <p>Manage custom measurements, production milestones, and deliveries.</p>
              </div>

              <div className="desktop-why-sell-item">
                <div className="desktop-why-sell-icon">
                  <CreditCard size={22} color="#064E3B" />
                </div>
                <h3>Guaranteed Payouts</h3>
                <p>Protected transactions with direct deposits into your local bank account.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
