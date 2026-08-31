import React, { useEffect, useState, useCallback } from 'react';
import { ArrowRight, Star, Sparkles, Store, ShieldCheck, Scissors, Clock } from 'lucide-react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { categoryApi, productApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Category, Product } from '../types';
import { SAMPLE_CATEGORIES, SAMPLE_PRODUCTS } from '../data/sampleData';
import './HomePage.css';

interface HomePageProps {
  onOpenVendorRegister?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenVendorRegister }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const searchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || null;

  const [categories, setCategories] = useState<Category[]>(SAMPLE_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);

  // Sync category state when URL changes
  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  const fetchProducts = useCallback(async (categorySlug?: string | null, search?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (categorySlug) params.category = categorySlug;
      if (search) params.search = search;
      
      const prodData = await productApi.getPublicProducts(params).catch(() => []);
      
      if (Array.isArray(prodData) && prodData.length > 0) {
        setProducts(prodData);
      } else {
        // Filter sample products as fallback
        let filtered = [...SAMPLE_PRODUCTS];
        if (categorySlug) {
          filtered = filtered.filter(p => 
            p.category?.slug?.toLowerCase() === categorySlug.toLowerCase() ||
            p.category?.name?.toLowerCase().includes(categorySlug.toLowerCase())
          );
        }
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(p => 
            p.title.toLowerCase().includes(q) || 
            p.description?.toLowerCase().includes(q) ||
            p.vendor?.store_name?.toLowerCase().includes(q)
          );
        }
        setProducts(filtered);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    categoryApi.getCategories().then((cats) => {
      if (Array.isArray(cats) && cats.length > 0) {
        setCategories(cats);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery, fetchProducts]);

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const isDesigner = user?.is_vendor || !!user?.vendor_profile;
  const safeCategories = Array.isArray(categories) && categories.length > 0 ? categories : SAMPLE_CATEGORIES;
  const safeProducts = Array.isArray(products) ? products : [];

  const vendorsList = React.useMemo(() => {
    const map = new Map<string, any>();
    for (const p of safeProducts) {
      if (p.vendor && p.vendor.slug && !map.has(p.vendor.slug)) {
        map.set(p.vendor.slug, p.vendor);
      }
    }
    return Array.from(map.values());
  }, [safeProducts]);

  return (
    <div className="stitch-homepage">
      {/* ── 1. Editorial Hero Section ── */}
      <section className="editorial-hero">
        <div className="editorial-hero-bg">
          <div className="editorial-hero-overlay"></div>
        </div>

        <div className="editorial-hero-content">
          <div className="hero-eyebrow">
            <Sparkles size={14} className="text-gold" />
            <span>NIGERIAN LUXURY & BESPOKE CRAFTSMANSHIP</span>
          </div>

          <h1 className="editorial-hero-headline">
            Authentic Nigerian <br />
            <span>Craftsmanship.</span>
          </h1>

          <p className="editorial-hero-subtitle">
            A curated digital marketplace connecting discerning patrons with verified master tailors and bespoke fashion houses across Nigeria.
          </p>

          <div className="editorial-hero-actions">
            <button
              onClick={() => {
                document.getElementById('curated-edit')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-editorial-primary"
            >
              <span>Explore The Edit</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => {
                document.getElementById('ateliers')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-editorial-secondary"
            >
              <span>Featured Ateliers</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. The Curated Edit (Catalog Showcase) ── */}
      <section id="curated-edit" className="curated-edit-section">
        <div className="editorial-container">
          <div className="section-header-row">
            <div className="section-title-wrap">
              <span className="section-eyebrow">SPRING / SUMMER CURATION</span>
              <h2 className="section-main-title">
                {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory ? `${selectedCategory.toUpperCase()} COLLECTION` : 'The Curated Edit'}
              </h2>
            </div>

            {(selectedCategory || searchQuery) && (
              <button
                onClick={() => handleCategorySelect(null)}
                className="btn-reset-filters"
              >
                Clear Filters ✕
              </button>
            )}
          </div>

          {/* Minimal Category Tabs */}
          <div className="editorial-category-tabs">
            <button
              onClick={() => handleCategorySelect(null)}
              className={`editorial-tab ${selectedCategory === null ? 'tab-active' : ''}`}
            >
              All Pieces
            </button>
            {safeCategories.map((cat) => (
              <button
                key={cat.id || cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`editorial-tab ${selectedCategory === cat.slug ? 'tab-active' : ''}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="catalog-loading-state">
              <p>Loading pieces...</p>
            </div>
          ) : safeProducts.length === 0 ? (
            <div className="catalog-empty-state">
              <p className="empty-title">No pieces found matching your criteria</p>
              <button onClick={() => handleCategorySelect(null)} className="btn-explore-all">
                Browse Full Catalog
              </button>
            </div>
          ) : (
            <div className="editorial-products-grid">
              {safeProducts.map((prod) => (
                <Link key={prod.id} to={`/products/${prod.slug}`} className="luxury-product-card">
                  <div className="card-image-box">
                    <div
                      className="card-image"
                      style={{ backgroundImage: `url(${prod.primary_image_url || (prod.media && prod.media[0]?.url) || '/traditional-men-1.png'})` }}
                    />
                    {prod.average_rating && (
                      <div className="card-rating-badge">
                        <Star size={11} fill="#D4AF37" color="#D4AF37" />
                        <span>{Number(prod.average_rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-details">
                    <div className="card-meta-top">
                      <span className="card-atelier-name">{prod.vendor?.store_name || 'Bespoke Atelier'}</span>
                      {prod.preparation_time_days && (
                        <span className="card-prep-time">
                          <Clock size={11} /> {prod.preparation_time_days}d bespoke
                        </span>
                      )}
                    </div>

                    <h3 className="card-product-title">{prod.title}</h3>

                    <div className="card-price-row">
                      <span className="card-price-naira">
                        ₦{(prod.base_price_naira ?? (prod.base_price_kobo ? Math.round(prod.base_price_kobo / 100) : 0)).toLocaleString()}
                      </span>
                      <span className="card-view-link">
                        View Piece <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Master Ateliers & Boutiques Spotlight ── */}
      <section id="ateliers" className="ateliers-spotlight-section">
        <div className="editorial-container">
          <div className="section-header-center">
            <span className="section-eyebrow">VERIFIED HOUSES</span>
            <h2 className="section-main-title">Master Ateliers</h2>
            <p className="section-sub-desc">
              Direct access to Nigeria’s premier independent fashion houses and master tailors.
            </p>
          </div>

          <div className="ateliers-grid">
            {vendorsList.length > 0 ? (
              vendorsList.slice(0, 3).map((v) => (
                <Link key={v.id || v.slug} to={`/store/${v.slug}`} className="atelier-card">
                  <div
                    className="atelier-banner"
                    style={{ backgroundImage: `url(${v.banner_url || '/hero-bg.png'})` }}
                  >
                    <div
                      className="atelier-avatar"
                      style={{ backgroundImage: `url(${v.logo_url || '/traditional-men-1.png'})` }}
                    />
                  </div>
                  <div className="atelier-content">
                    <div className="atelier-header-info">
                      <h3 className="atelier-name">{v.store_name}</h3>
                      <p className="atelier-location">
                        {v.city ? `${v.city}, ${v.state || 'Nigeria'}` : 'Lagos, Nigeria'} • {v.average_rating ? `${Number(v.average_rating).toFixed(1)} ★` : '5.0 ★'} ({v.review_count || 1})
                      </p>
                    </div>
                    <p className="atelier-bio">
                      {v.description || 'Premier bespoke Nigerian fashion atelier.'}
                    </p>
                    <div className="atelier-link">
                      <span>Visit Boutique</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <>
                {/* Fallback Atelier 1 */}
                <Link to="/store/lagos-couture" className="atelier-card">
                  <div className="atelier-banner" style={{ backgroundImage: "url('/hero-bg.png')" }}>
                    <div className="atelier-avatar" style={{ backgroundImage: "url('/traditional-men-1.png')" }} />
                  </div>
                  <div className="atelier-content">
                    <div className="atelier-header-info">
                      <h3 className="atelier-name">Lagos Couture House</h3>
                      <p className="atelier-location">Victoria Island, Lagos • 4.9 ★ (38)</p>
                    </div>
                    <p className="atelier-bio">
                      Premier Nigerian bespoke house crafting royal Agbadas & Senator kaftans with heritage Italian wools.
                    </p>
                    <div className="atelier-link">
                      <span>Visit Boutique</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                {/* Fallback Atelier 2 */}
                <Link to="/store/heritage-cuts" className="atelier-card">
                  <div className="atelier-banner" style={{ backgroundImage: "url('/traditional-men-2.png')" }}>
                    <div className="atelier-avatar" style={{ backgroundImage: "url('/traditional-men-3.png')" }} />
                  </div>
                  <div className="atelier-content">
                    <div className="atelier-header-info">
                      <h3 className="atelier-name">Heritage Cuts & Threads</h3>
                      <p className="atelier-location">Maitama, Abuja • 4.8 ★ (24)</p>
                    </div>
                    <p className="atelier-bio">
                      Bespoke African menswear and structured ceremonial suiting handcrafted by master tailors.
                    </p>
                    <div className="atelier-link">
                      <span>Visit Boutique</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                {/* Fallback Atelier 3 */}
                <Link to="/store/adire-house" className="atelier-card">
                  <div className="atelier-banner" style={{ backgroundImage: "url('/adire-1.png')" }}>
                    <div className="atelier-avatar" style={{ backgroundImage: "url('/adire-2.png')" }} />
                  </div>
                  <div className="atelier-content">
                    <div className="atelier-header-info">
                      <h3 className="atelier-name">Adire Mastercraft Atelier</h3>
                      <p className="atelier-location">Ibadan, Oyo State • 5.0 ★ (52)</p>
                    </div>
                    <p className="atelier-bio">
                      Contemporary indigo dyed textiles, modern Adire dresses, and luxury silk-blend creations.
                    </p>
                    <div className="atelier-link">
                      <span>Visit Boutique</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── 4. The Aso Standard (Quiet Luxury Value Pillars) ── */}
      <section className="aso-standard-section">
        <div className="editorial-container">
          <div className="standard-grid">
            <div className="standard-pillar">
              <div className="pillar-icon-box">
                <Scissors size={20} />
              </div>
              <h3 className="pillar-title">Bespoke Precision</h3>
              <p className="pillar-text">
                Every piece is individually handcrafted to exact measurements by verified master tailors.
              </p>
            </div>

            <div className="standard-pillar">
              <div className="pillar-icon-box">
                <ShieldCheck size={20} />
              </div>
              <h3 className="pillar-title">72h Protection Escrow</h3>
              <p className="pillar-text">
                Your payment is securely reserved in escrow until your garment arrives and matches specifications.
              </p>
            </div>

            <div className="standard-pillar">
              <div className="pillar-icon-box">
                <Store size={20} />
              </div>
              <h3 className="pillar-title">Direct Atelier Access</h3>
              <p className="pillar-text">
                Direct transparent access to independent Nigerian design studios without intermediary markup.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Atelier Invitation (Subtle & Elegant) ── */}
      <section className="atelier-invite-section">
        <div className="editorial-container">
          <div className="invite-box">
            <span className="invite-eyebrow">
              {isDesigner ? 'STUDIO MANAGEMENT' : 'PARTNER WITH ASO'}
            </span>
            <h2 className="invite-title">
              {isDesigner ? 'Your Bespoke Fashion Studio is Live' : 'Are You a Fashion Designer in Nigeria?'}
            </h2>
            <p className="invite-text">
              {isDesigner
                ? 'Manage your catalogue, track 48h SLA customer orders, monitor double-entry ledger balances, and request payout withdrawals.'
                : 'Join Nigeria’s premier digital luxury marketplace. Showcase bespoke collections to patrons worldwide with guaranteed digital payments.'}
            </p>

            {isDesigner ? (
              <button onClick={() => navigate('/vendor/dashboard')} className="btn-invite-action">
                <Store size={16} />
                <span>Go to Studio Dashboard</span>
                <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={onOpenVendorRegister} className="btn-invite-action">
                <span>Onboard Your Atelier</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
