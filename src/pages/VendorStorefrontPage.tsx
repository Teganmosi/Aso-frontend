import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vendorApi, productApi, reviewApi } from '../api/client';
import type { PublicVendorProfile, Product, Review } from '../types';
import { 
  MapPin, 
  CheckCircle2, 
  Star, 
  Globe, 
  ShoppingBag, 
  MessageSquare, 
  ShieldCheck, 
  Share2, 
  Clock, 
  Search, 
  SlidersHorizontal,
  Sparkles,
  Phone,
  Check,
  ChevronRight,
  Info,
  Scissors
} from 'lucide-react';
import './VendorStorefrontPage.css';

export const VendorStorefrontPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicVendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'collection' | 'story' | 'reviews'>('collection');
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // In-store Search, Category & Sorting Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'rating'>('featured');

  // Copy Link State
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (slug) {
      loadProfile(slug);
    }
  }, [slug]);

  const loadProfile = async (storeSlug: string) => {
    setLoading(true);
    try {
      const cleanSlug = decodeURIComponent(storeSlug || '').trim();
      if (!cleanSlug) {
        setProfile(null);
        return;
      }
      let data = await vendorApi.getPublicProfile(cleanSlug).catch(() => null);

      // Fallback: if not found directly by exact slug, check all vendors list
      if (!data || !data.store_name) {
        const allVendors = await vendorApi.getVendors().catch(() => []);
        const matched = allVendors.find(
          (v) =>
            v.slug?.toLowerCase() === cleanSlug.toLowerCase() ||
            v.id === cleanSlug ||
            v.store_name?.toLowerCase().includes(cleanSlug.toLowerCase()) ||
            cleanSlug.toLowerCase().includes((v.slug || '').toLowerCase())
        );
        if (matched) {
          data = matched;
        }
      }

      if (data && data.store_name) {
        setProfile(data);
        const vendorQueryKey = data.slug || cleanSlug || data.id;
        loadVendorProducts(vendorQueryKey);
        loadVendorReviews(data.slug || cleanSlug);
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error('Failed to load designer storefront profile for', storeSlug, err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorProducts = async (vendorQueryKey: string) => {
    setProductsLoading(true);
    try {
      const data = await productApi.getPublicProducts({ vendor: vendorQueryKey });
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadVendorReviews = async (vendorSlug: string) => {
    setReviewsLoading(true);
    try {
      const data = await reviewApi.getVendorReviews(vendorSlug);
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleCopyStoreLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Categories extracted dynamically from products
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('All');
    products.forEach((p) => {
      if (p.category?.name) cats.add(p.category.name);
    });
    return Array.from(cats);
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.name?.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category?.name === selectedCategory);
    }

    if (sortBy === 'price-low') {
      list.sort((a, b) => a.base_price_naira - b.base_price_naira);
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => b.base_price_naira - a.base_price_naira);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => {
        const rA = typeof a.average_rating === 'number' ? a.average_rating : parseFloat(a.average_rating || '5');
        const rB = typeof b.average_rating === 'number' ? b.average_rating : parseFloat(b.average_rating || '5');
        return rB - rA;
      });
    }

    return list;
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Rating Distribution breakdown
  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const score = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      counts[score] = (counts[score] || 0) + 1;
    });
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: counts[stars] || 0,
      percentage: Math.round(((counts[stars] || 0) / total) * 100),
    }));
  }, [reviews]);

  if (loading) {
    return (
      <div className="storefront-loading-state">
        <div className="storefront-spinner" />
        <p>Loading designer atelier...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="storefront-empty-state">
        <h2>Designer Storefront Not Found</h2>
        <p>The atelier you are looking for may be temporarily unavailable or unverified.</p>
        <Link to="/" className="btn-primary-emerald">
          <span>Return to Marketplace</span>
        </Link>
      </div>
    );
  }

  const ratingNum = parseFloat(profile.average_rating || '4.9').toFixed(1);

  return (
    <div className="storefront-container">
      {/* Immersive Atelier Banner */}
      <div
        className="storefront-banner"
        style={{
          backgroundImage: `url(${profile.banner_url || '/hero-bg.png'})`,
        }}
      >
        <div className="banner-overlay" />
        <div className="banner-badge-floating">
          <Sparkles size={14} color="#D4AF37" />
          <span>VERIFIED NIGERIAN ATELIER</span>
        </div>
      </div>

      {/* Profile Header Main Card */}
      <div className="storefront-profile-card">
        <div className="profile-header-content">
          <div className="avatar-wrapper">
            {profile.logo_url ? (
              <img
                src={profile.logo_url}
                alt={profile.store_name}
                className="store-logo-img"
              />
            ) : (
              <div className="store-logo-placeholder">
                {profile.store_name.charAt(0)}
              </div>
            )}
          </div>

          <div className="profile-main-meta">
            <div className="title-row">
              <h1 className="store-name-serif">{profile.store_name}</h1>
              {profile.is_verified && (
                <div className="verified-badge-pill" title="Government and Workshop Verified Designer">
                  <CheckCircle2 size={13} />
                  <span>VERIFIED ATELIER</span>
                </div>
              )}
            </div>

            <div className="meta-details-row">
              <div className="meta-item location-meta">
                <MapPin size={15} />
                <span>{profile.city}, {profile.state}</span>
                {profile.landmark && <span className="landmark-tag">• {profile.landmark}</span>}
              </div>

              <div className="meta-item rating-item">
                <Star size={15} className="star-filled" />
                <span className="rating-num">{ratingNum}</span>
                <span className="reviews-count">({profile.review_count || reviews.length} reviews)</span>
              </div>

              {profile.instagram_handle && (
                <div className="meta-item ig-meta">
                  <Globe size={15} />
                  <span>{profile.instagram_handle}</span>
                </div>
              )}
            </div>

            <p className="store-description">{profile.description}</p>

            {/* Acquisition & Action Bar (PRD §43) */}
            <div className="storefront-action-bar">
              <button
                className={`btn-share-store ${copiedLink ? 'copied' : ''}`}
                onClick={handleCopyStoreLink}
                title="Share this store link with clients on Instagram/TikTok/WhatsApp"
              >
                {copiedLink ? (
                  <>
                    <Check size={16} color="#064E3B" />
                    <span>Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>Share Storefront</span>
                  </>
                )}
              </button>

              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Check out ${profile.store_name} on Aso Fashion Marketplace: ${window.location.href}`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn-whatsapp-inquire"
              >
                <Phone size={15} />
                <span>Inquire on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Highlights & Guarantees Strip */}
        <div className="storefront-highlights-strip">
          <div className="highlight-pill">
            <ShoppingBag size={16} color="#064E3B" />
            <div className="highlight-text">
              <strong>{products.length} Garments</strong>
              <span>Exclusive Collection</span>
            </div>
          </div>
          <div className="highlight-pill">
            <Clock size={16} color="#064E3B" />
            <div className="highlight-text">
              <strong>48h SLA Fulfillment</strong>
              <span>Fast Order Dispatch</span>
            </div>
          </div>
          <div className="highlight-pill">
            <Scissors size={16} color="#064E3B" />
            <div className="highlight-text">
              <strong>Bespoke Tailoring</strong>
              <span>Custom Nigerian Fits</span>
            </div>
          </div>
          <div className="highlight-pill">
            <ShieldCheck size={16} color="#064E3B" />
            <div className="highlight-text">
              <strong>Escrow Protection</strong>
              <span>100% Safe Payments</span>
            </div>
          </div>
        </div>

        {/* Storefront Navigation Tabs */}
        <div className="storefront-tab-nav">
          <button
            className={`tab-link ${activeTab === 'collection' ? 'active' : ''}`}
            onClick={() => setActiveTab('collection')}
          >
            <ShoppingBag size={16} />
            <span>Collection ({products.length})</span>
          </button>
          <button
            className={`tab-link ${activeTab === 'story' ? 'active' : ''}`}
            onClick={() => setActiveTab('story')}
          >
            <Info size={16} />
            <span>About Atelier & Sizing</span>
          </button>
          <button
            className={`tab-link ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <MessageSquare size={16} />
            <span>Client Reviews ({profile.review_count || reviews.length})</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="storefront-main-body">
        {/* TAB 1: COLLECTION & PRODUCTS */}
        {activeTab === 'collection' && (
          <div className="storefront-products-section">
            {/* Search, Filter & Sort Controls */}
            <div className="in-store-controls-row">
              {/* Category Pills */}
              <div className="category-filter-pills">
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    className={`cat-pill ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search & Sort Bar */}
              <div className="in-store-search-sort">
                <div className="search-input-wrap">
                  <Search size={16} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search in this store..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="clear-search-btn" onClick={() => setSearchQuery('')}>×</button>
                  )}
                </div>

                <div className="sort-dropdown-wrap">
                  <SlidersHorizontal size={14} />
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="store-sort-select"
                  >
                    <option value="featured">Sort: Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {productsLoading ? (
              <div className="products-grid-loading">
                <div className="storefront-spinner" />
                <p>Loading collection items...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-collection-state">
                <ShoppingBag size={40} color="#9CA3AF" />
                <h3>No garments found</h3>
                <p>No products match your search or category filter in this atelier.</p>
                <button
                  className="btn-reset-filters"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="store-products-grid">
                {filteredProducts.map((product) => {
                  const displayImg =
                    product.primary_image_url ||
                    product.media?.[0]?.url ||
                    '/traditional-men-1.png';
                  const prepDays = product.preparation_time_days || 3;

                  return (
                    <div key={product.id} className="store-product-card">
                      <Link to={`/products/${product.slug || product.id}`} className="product-image-container">
                        <img
                          src={displayImg}
                          alt={product.title}
                          className="product-main-img"
                          loading="lazy"
                        />
                        <div className="product-prep-tag">
                          <Clock size={12} />
                          <span>{prepDays}d prep</span>
                        </div>
                      </Link>

                      <div className="product-info-box">
                        <span className="product-category-chip">
                          {product.category?.name || 'Traditional'}
                        </span>
                        <h3 className="product-title-serif">
                          <Link to={`/products/${product.slug || product.id}`}>
                            {product.title}
                          </Link>
                        </h3>

                        <div className="product-pricing-row">
                          <div className="price-tag-naira">
                            <span className="currency-symbol">₦</span>
                            <span className="amount">{product.base_price_naira.toLocaleString()}</span>
                          </div>

                          <Link
                            to={`/products/${product.slug || product.id}`}
                            className="btn-view-garment"
                          >
                            <span>View</span>
                            <ChevronRight size={14} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ABOUT ATELIER & SIZING */}
        {activeTab === 'story' && (
          <div className="storefront-story-section">
            <div className="story-grid-layout">
              <div className="story-main-card">
                <h2 className="story-section-title">The Master Artisan Behind {profile.store_name}</h2>
                <p className="story-lead-text">
                  Handcrafting bespoke ceremonial apparel and modern Nigerian silhouettes rooted in generational tailoring traditions.
                </p>
                <div className="story-body-paragraphs">
                  <p>
                    Every garment produced at {profile.store_name} is carefully measured, cut, and stitched by master tailors in {profile.city}. We source high-grade Nigerian woven textiles (Aso-Oke, handmade Adire, Swiss Voile, and Italian Cashmere) to deliver exquisite garments that stand out at any high-profile event.
                  </p>
                  <p>
                    Our workshop maintains strict quality assurance on seam finishing, collar stiffness, embroidery longevity, and personalized measurements.
                  </p>
                </div>

                <div className="workshop-address-box">
                  <div className="workshop-icon">
                    <MapPin size={22} color="#064E3B" />
                  </div>
                  <div>
                    <h4>Workshop & Atelier Address</h4>
                    <p>{profile.workshop_address || `${profile.city}, ${profile.state}`}</p>
                    {profile.landmark && <span className="landmark-note">Landmark: {profile.landmark}</span>}
                  </div>
                </div>
              </div>

              {/* Sizing & Bespoke Guidance Card */}
              <div className="story-side-card">
                <h3 className="side-card-title">
                  <Scissors size={18} color="#064E3B" />
                  <span>Bespoke Measurement Guide</span>
                </h3>
                <p className="side-card-desc">
                  We cater to both ready-to-wear sizes (S to XXL) and custom tailored measurements.
                </p>

                <div className="measurement-tips-list">
                  <div className="tip-item">
                    <span className="tip-bullet">1</span>
                    <div>
                      <strong>Chest / Bust:</strong>
                      <span>Measure around the fullest part of your chest with a relaxed tape.</span>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-bullet">2</span>
                    <div>
                      <strong>Kaftan / Agbada Length:</strong>
                      <span>Measure from the base of the neck down to your desired hemline.</span>
                    </div>
                  </div>
                  <div className="tip-item">
                    <span className="tip-bullet">3</span>
                    <div>
                      <strong>Trouser Waist & Inseam:</strong>
                      <span>Measure around your natural waistline and from crotch to ankle.</span>
                    </div>
                  </div>
                </div>

                <div className="guarantee-box">
                  <ShieldCheck size={20} color="#D4AF37" />
                  <span>All bespoke fits include free adjustment guarantee if sizing differs from provided notes.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CLIENT REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="storefront-reviews-section">
            <div className="reviews-summary-card">
              {/* Overall Score Box */}
              <div className="overall-score-box">
                <div className="big-rating-number">{ratingNum}</div>
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i <= Math.round(parseFloat(ratingNum)) ? 'star-filled' : 'star-empty'}
                    />
                  ))}
                </div>
                <span className="total-reviews-caption">
                  Based on {profile.review_count || reviews.length} verified customer orders
                </span>
              </div>

              {/* Distribution Bars */}
              <div className="rating-distribution-bars">
                {ratingDistribution.map((item) => (
                  <div key={item.stars} className="dist-row">
                    <span className="star-label">{item.stars} ★</span>
                    <div className="dist-bar-track">
                      <div
                        className="dist-bar-fill"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                    <span className="dist-count">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div className="reviews-loading-spinner">
                <div className="storefront-spinner" />
                <p>Loading verified client reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-reviews-state">
                <MessageSquare size={36} color="#9CA3AF" />
                <p>No client reviews submitted yet for this atelier.</p>
              </div>
            ) : (
              <div className="reviews-list-grid">
                {reviews.map((rev) => {
                  const customerName =
                    typeof rev.customer === 'object' && rev.customer?.first_name
                      ? `${rev.customer.first_name} ${rev.customer.last_name?.[0] ? rev.customer.last_name[0] + '.' : ''}`
                      : rev.customer_name || 'Verified Customer';

                  return (
                    <div key={rev.id} className="store-review-card">
                      <div className="review-card-top">
                        <div className="reviewer-avatar">
                          {customerName.charAt(0) || 'C'}
                        </div>
                        <div className="reviewer-meta">
                          <div className="reviewer-name-row">
                            <strong className="reviewer-name">
                              {customerName}
                            </strong>
                            <span className="verified-purchase-badge">
                              <CheckCircle2 size={12} />
                              <span>Verified Buyer</span>
                            </span>
                          </div>
                          <div className="review-stars-date">
                            <div className="small-stars">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  size={13}
                                  className={s <= rev.rating ? 'star-filled' : 'star-empty'}
                                />
                              ))}
                            </div>
                            <span className="review-date">
                              {new Date(rev.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="review-comment-text">{rev.comment}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorStorefrontPage;
