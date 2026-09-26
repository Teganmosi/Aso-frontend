import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { PublicVendorProfile } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  MapPin, 
  X,
  Store,
  ChevronRight
} from 'lucide-react';
import './MobileDesignersView.css';

interface MobileDesignersViewProps {
  vendors: PublicVendorProfile[];
  loading: boolean;
  error: string | null;
  onOpenVendorRegister?: () => void;
}

export const MobileDesignersView: React.FC<MobileDesignersViewProps> = ({
  vendors,
  loading,
  error,
  onOpenVendorRegister
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter logic
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
      if (activeFilter === 'lagos') return (v.city || '').toLowerCase().includes('lagos') || (v.state || '').toLowerCase().includes('lagos');
      if (activeFilter === 'abuja') return (v.city || '').toLowerCase().includes('abuja') || (v.state || '').toLowerCase().includes('abuja');
      if (activeFilter !== 'all') {
        return v.categories && v.categories.some(c => c.toLowerCase() === activeFilter.toLowerCase());
      }
      return true;
    });
  }, [vendors, activeFilter, searchQuery]);

  // Verified Spotlight Designers for Top Story Avatars
  const spotlightDesigners = useMemo(() => {
    return vendors.filter(v => v.is_verified).slice(0, 6);
  }, [vendors]);

  return (
    <div className="mobile-app-screen mobile-designers-screen">
      {/* 1. Native Mobile App Header */}
      <header className="mobile-app-header">
        <div className="mobile-app-header-top">
          <div>
            <h1 className="mobile-app-title">Designers</h1>
            <span className="mobile-app-subtitle">{vendors.length} Verified Fashion Houses</span>
          </div>
          {onOpenVendorRegister && (
            <button 
              type="button" 
              className="mobile-join-btn"
              onClick={onOpenVendorRegister}
            >
              Sell on Aso
            </button>
          )}
        </div>

        {/* 2. Native Search Bar */}
        <div className="mobile-search-bar">
          <Search size={17} className="mobile-search-icon" />
          <input
            type="text"
            className="mobile-search-input"
            placeholder="Search designers, houses, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="mobile-clear-btn" 
              onClick={() => setSearchQuery('')}
              aria-label="Clear"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* 3. Horizontal Filter Chips */}
        <div className="mobile-filter-scroll">
          <button
            type="button"
            className={`mobile-chip ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All Houses
          </button>
          <button
            type="button"
            className={`mobile-chip ${activeFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setActiveFilter('verified')}
          >
            <ShieldCheck size={13} color={activeFilter === 'verified' ? '#FFFFFF' : '#D4AF37'} />
            <span>Verified</span>
          </button>
          <button
            type="button"
            className={`mobile-chip ${activeFilter === 'lagos' ? 'active' : ''}`}
            onClick={() => setActiveFilter('lagos')}
          >
            Lagos
          </button>
          <button
            type="button"
            className={`mobile-chip ${activeFilter === 'abuja' ? 'active' : ''}`}
            onClick={() => setActiveFilter('abuja')}
          >
            Abuja
          </button>
        </div>
      </header>

      {/* 4. Native Featured Story Avatars (Instagram/Farfetch Style) */}
      {!searchQuery && spotlightDesigners.length > 0 && (
        <section className="mobile-stories-section">
          <span className="mobile-section-label">FEATURED HOUSES</span>
          <div className="mobile-stories-track">
            {spotlightDesigners.map((designer) => {
              const initials = designer.store_name ? designer.store_name.slice(0, 2).toUpperCase() : 'AS';
              return (
                <Link 
                  key={designer.id} 
                  to={`/store/${designer.slug}`} 
                  className="mobile-story-item"
                >
                  <div className="mobile-story-ring">
                    <div className="mobile-story-avatar">
                      {designer.logo_url ? (
                        <img src={designer.logo_url} alt={designer.store_name} />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                  </div>
                  <span className="mobile-story-name">{designer.store_name}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Native Designer Feed */}
      <main className="mobile-designer-feed">
        {loading && (
          <div className="mobile-loading-list">
            {[1, 2, 3].map((n) => (
              <div key={n} className="mobile-designer-skeleton" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="mobile-error-box">
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && filteredDesigners.length === 0 && (
          <div className="mobile-empty-state">
            <Store size={36} color="#9CA3AF" />
            <h3>No Designers Found</h3>
            <p>Try searching for a different name or clear your filters.</p>
            <button 
              type="button" 
              className="mobile-reset-btn"
              onClick={() => { setActiveFilter('all'); setSearchQuery(''); }}
            >
              Show All Designers
            </button>
          </div>
        )}

        {!loading && !error && filteredDesigners.map((designer, idx) => {
          const fallbackCover = idx % 2 === 0 ? '/hero-bg.png' : '/traditional-men-1.png';
          const bannerImg = designer.banner_url || (designer.preview_images && designer.preview_images[0]) || fallbackCover;
          const initials = designer.store_name ? designer.store_name.slice(0, 2).toUpperCase() : 'AS';

          return (
            <article key={designer.id || idx} className="mobile-app-designer-card">
              {/* Card Header (Brand + Location + Action) */}
              <div className="mobile-card-top">
                <div className="mobile-card-brand">
                  <div className="mobile-brand-avatar">
                    {designer.logo_url ? (
                      <img src={designer.logo_url} alt={designer.store_name} />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>
                  <div className="mobile-brand-info">
                    <div className="mobile-brand-name-row">
                      <h2 className="mobile-brand-name">{designer.store_name}</h2>
                      {designer.is_verified && (
                        <ShieldCheck size={14} color="#064E3B" className="verified-icon" />
                      )}
                    </div>
                    <div className="mobile-brand-location">
                      <MapPin size={11} />
                      <span>{designer.city || 'Lagos'}, {designer.state || 'Lagos State'}</span>
                    </div>
                  </div>
                </div>

                <Link to={`/store/${designer.slug}`} className="mobile-view-store-pill">
                  <span>Visit</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {/* Showcase Banner / Media Feed */}
              <Link to={`/store/${designer.slug}`} className="mobile-card-media-wrap">
                <div 
                  className="mobile-card-banner"
                  style={{ backgroundImage: `url(${bannerImg})` }}
                >
                  <div className="mobile-banner-gradient" />
                  
                  {/* Floating Chips */}
                  <div className="mobile-banner-chips">
                    <span className="mobile-chip-dark">
                      {designer.product_count ?? 8} Pieces
                    </span>
                    <span className="mobile-chip-gold">
                      {designer.starting_price_naira 
                        ? `From ₦${designer.starting_price_naira.toLocaleString()}`
                        : 'Bespoke Available'}
                    </span>
                  </div>
                </div>
              </Link>

              {/* Description Snippet */}
              {designer.description && (
                <p className="mobile-card-description">
                  {designer.description}
                </p>
              )}
            </article>
          );
        })}
      </main>

      {/* 6. Mobile Seller Prompt Card */}
      {onOpenVendorRegister && (
        <section className="mobile-designer-join-card">
          <div className="mobile-join-content">
            <span className="mobile-join-tag">FOR FASHION HOUSES</span>
            <h3>Open Your Digital Studio on Aso</h3>
            <p>Showcase bespoke tailoring and ready-to-wear collections to thousands of clients.</p>
            <button 
              type="button" 
              className="mobile-btn-apply"
              onClick={onOpenVendorRegister}
            >
              Apply as a Verified Designer
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
