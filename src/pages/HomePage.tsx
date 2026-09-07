import React, { useEffect, useState, useCallback } from 'react';
import { 
  ArrowRight, 
  Star, 
  Sparkles, 
  Store, 
  ShieldCheck, 
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Compass,
  Truck
} from 'lucide-react';
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
      
      {/* ─── 1. HERO SECTION (Broad + Premium Positioning) ─── */}
      <section className="editorial-hero">
        <div className="editorial-hero-bg">
          <div className="editorial-hero-overlay"></div>
        </div>

        <div className="editorial-hero-content">
          <div className="hero-eyebrow">
            <Sparkles size={14} className="text-gold" />
            <span>AUTHENTIC NIGERIAN FASHION MARKETPLACE</span>
          </div>

          <h1 className="editorial-hero-headline">
            Authentic Nigerian Fashion. <br />
            <span>Made by People Who Know Their Craft.</span>
          </h1>

          <p className="editorial-hero-subtitle">
            Shop ready-to-wear, traditional pieces, bespoke designs, and statement looks from verified independent Nigerian designers.
          </p>

          <div className="editorial-hero-actions">
            <button
              onClick={() => {
                document.getElementById('curated-edit')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn-editorial-primary"
            >
              <span>Explore The Marketplace</span>
              <ArrowRight size={16} />
            </button>

            <Link
              to="/designers"
              className="btn-editorial-secondary"
            >
              <span>Explore Designers</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 2. THE CURATED MARKETPLACE (Live Products) ─── */}
      <section id="curated-edit" className="curated-edit-section">
        <div className="editorial-container">
          <div className="section-header-row">
            <div className="section-title-wrap">
              <span className="section-eyebrow">MARKETPLACE CURATION</span>
              <h2 className="section-main-title">
                {searchQuery ? `Search Results for "${searchQuery}"` : selectedCategory ? `${selectedCategory.toUpperCase()} COLLECTION` : 'Explore The Collection'}
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

          {/* Category Tabs */}
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
              {safeProducts.map((prod) => {
                const prepDays = prod.preparation_time_days || 3;
                const priceNaira = prod.base_price_naira ?? (prod.base_price_kobo ? Math.round(prod.base_price_kobo / 100) : 0);
                const ratingNum = prod.average_rating ? Number(prod.average_rating) : 0;
                const reviewCount = prod.review_count || 0;

                return (
                  <Link key={prod.id} to={`/products/${prod.slug || prod.id}`} className="luxury-product-card">
                    <div className="card-image-box">
                      <div
                        className="card-image"
                        style={{ backgroundImage: `url(${prod.primary_image_url || (prod.media && prod.media[0]?.url) || '/traditional-men-1.png'})` }}
                      />
                      
                      {/* Fixed Rating Badge: Only show real rating, never show 0.0 */}
                      {ratingNum > 0 ? (
                        <div className="card-rating-badge">
                          <Star size={11} fill="#D4AF37" color="#D4AF37" />
                          <span>{ratingNum.toFixed(1)} {reviewCount > 0 && `(${reviewCount})`}</span>
                        </div>
                      ) : (
                        <div className="card-rating-badge new-badge">
                          <span>New Arrival</span>
                        </div>
                      )}

                      {/* Commercial Delivery / Lead Time Badge */}
                      <div className="card-leadtime-badge">
                        {prepDays <= 2 ? 'Ready to Ship' : `Made to Order (${prepDays}d)`}
                      </div>
                    </div>

                    <div className="card-details">
                      <div className="card-meta-top">
                        <span className="card-atelier-name">{prod.vendor?.store_name || 'Artisan Designer'}</span>
                        {Boolean(prod.vendor?.is_verified) && (
                          <span className="card-verified-dot" title="Verified Designer">✓ Verified</span>
                        )}
                      </div>

                      <h3 className="card-product-title">{prod.title}</h3>

                      <div className="card-price-row">
                        <span className="card-price-naira">
                          ₦{priceNaira.toLocaleString()}
                        </span>
                        <span className="card-view-link">
                          View Piece <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── 4. FEATURED DESIGNERS SPOTLIGHT ─── */}
      <section id="designers" className="ateliers-spotlight-section">
        <div className="editorial-container">
          <div className="section-header-center">
            <span className="section-eyebrow">VERIFIED TALENT</span>
            <h2 className="section-main-title">Featured Designers</h2>
            <p className="section-sub-desc">
              Direct access to verified Nigerian fashion houses, independent design hubs, and master tailors nationwide.
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
                      {v.description || 'Verified Nigerian bespoke fashion designer.'}
                    </p>
                    <div className="atelier-link">
                      <span>Visit Designer Storefront</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <>
                {/* Fallback Designer 1 */}
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
                      Premier Nigerian house crafting modern Agbadas, Senator suits &amp; bespoke ceremonial menswear.
                    </p>
                    <div className="atelier-link">
                      <span>Visit Designer Storefront</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                {/* Fallback Designer 2 */}
                <Link to="/store/heritage-cuts" className="atelier-card">
                  <div className="atelier-banner" style={{ backgroundImage: "url('/traditional-men-2.png')" }}>
                    <div className="atelier-avatar" style={{ backgroundImage: "url('/traditional-men-3.png')" }} />
                  </div>
                  <div className="atelier-content">
                    <div className="atelier-header-info">
                      <h3 className="atelier-name">Heritage Cuts &amp; Threads</h3>
                      <p className="atelier-location">Maitama, Abuja • 4.8 ★ (24)</p>
                    </div>
                    <p className="atelier-bio">
                      Structured African menswear, Senator sets, and contemporary traditional tailoring.
                    </p>
                    <div className="atelier-link">
                      <span>Visit Designer Storefront</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>

                {/* Fallback Designer 3 */}
                <Link to="/store/adire-house" className="atelier-card">
                  <div className="atelier-banner" style={{ backgroundImage: "url('/adire-1.png')" }}>
                    <div className="atelier-avatar" style={{ backgroundImage: "url('/adire-2.png')" }} />
                  </div>
                  <div className="atelier-content">
                    <div className="atelier-header-info">
                      <h3 className="atelier-name">Adire Craft Collective</h3>
                      <p className="atelier-location">Ibadan, Oyo State • 5.0 ★ (52)</p>
                    </div>
                    <p className="atelier-bio">
                      Contemporary indigo dyed textiles, modern Adire dresses, and vibrant silk-blend creations.
                    </p>
                    <div className="atelier-link">
                      <span>Visit Designer Storefront</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── 5. HOW ASO WORKS (New Clear 4-Step Marketplace Walkthrough) ─── */}
      <section className="how-aso-works-section">
        <div className="editorial-container">
          <div className="section-header-center">
            <span className="section-eyebrow">SIMPLE &amp; RELIABLE</span>
            <h2 className="section-main-title">How Aso Works</h2>
            <p className="section-sub-desc">
              Discover, order, and receive authentic Nigerian fashion with complete peace of mind.
            </p>
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <div className="step-num-badge">01</div>
              <div className="step-icon-box"><Compass size={22} color="#00322D" /></div>
              <h3 className="step-title">Discover</h3>
              <p className="step-desc">
                Explore pieces from verified independent designers across Nigeria, all in one marketplace.
              </p>
            </div>

            <div className="how-step-card">
              <div className="step-num-badge">02</div>
              <div className="step-icon-box"><ShoppingBag size={22} color="#00322D" /></div>
              <h3 className="step-title">Order</h3>
              <p className="step-desc">
                Choose your piece, select your ready-to-wear size or submit custom measurements, and securely pay online.
              </p>
            </div>

            <div className="how-step-card">
              <div className="step-num-badge">03</div>
              <div className="step-icon-box"><Clock size={22} color="#00322D" /></div>
              <h3 className="step-title">We Coordinate</h3>
              <p className="step-desc">
                The designer accepts and prepares your piece while Aso tracks fulfillment and logistics milestones.
              </p>
            </div>

            <div className="how-step-card">
              <div className="step-num-badge">04</div>
              <div className="step-icon-box"><Truck size={22} color="#00322D" /></div>
              <h3 className="step-title">Receive</h3>
              <p className="step-desc">
                Your order is safely dispatched and delivered directly to your doorstep with tracking updates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. WHY SHOP ON ASO (Marketplace Trust Pillars) ─── */}
      <section className="aso-standard-section">
        <div className="editorial-container">
          <div className="section-header-center" style={{ marginBottom: '2.5rem' }}>
            <span className="section-eyebrow">BUY WITH CONFIDENCE</span>
            <h2 className="section-main-title">Why Shop on Aso</h2>
          </div>

          <div className="standard-grid">
            <div className="standard-pillar">
              <div className="pillar-icon-box">
                <CheckCircle2 size={22} color="#00322D" />
              </div>
              <h3 className="pillar-title">Verified Designers</h3>
              <p className="pillar-text">
                Every designer on Aso goes through a verification process before they can sell on the marketplace.
              </p>
            </div>

            <div className="standard-pillar">
              <div className="pillar-icon-box">
                <CreditCard size={22} color="#00322D" />
              </div>
              <h3 className="pillar-title">Secure Online Payments</h3>
              <p className="pillar-text">
                Pay safely with your debit card or bank transfer without having to send money directly to strangers on social media.
              </p>
            </div>

            <div className="standard-pillar">
              <div className="pillar-icon-box">
                <ShieldCheck size={22} color="#00322D" />
              </div>
              <h3 className="pillar-title">72h Buyer Protection</h3>
              <p className="pillar-text">
                Your payment remains securely protected while your order is being fulfilled, giving you time to inspect your delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. DESIGNER ONBOARDING CTA (Commercial & WhatsApp/IG Focused) ─── */}
      <section className="atelier-invite-section">
        <div className="editorial-container">
          <div className="invite-box">
            <span className="invite-eyebrow">
              {isDesigner ? 'STUDIO MANAGEMENT' : 'SELL ON ASO'}
            </span>
            <h2 className="invite-title">
              {isDesigner 
                ? 'Your Fashion Studio is Live on Aso' 
                : 'Turn Your Instagram & WhatsApp Customers Into Orders.'}
            </h2>
            <p className="invite-text">
              {isDesigner
                ? 'Manage your live product catalogue, process client orders, track delivery dispatches, and withdraw settlements directly to your Nigerian bank account.'
                : 'Create your own digital storefront on Aso, upload your designs, accept verified online payments, and manage all your customer orders from one place.'}
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              {isDesigner ? (
                <button onClick={() => navigate('/vendor/dashboard')} className="btn-invite-action">
                  <Store size={16} />
                  <span>Go to Studio Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={onOpenVendorRegister} className="btn-invite-action">
                  <span>Start Selling on Aso</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
