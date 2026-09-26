import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { vendorApi, productApi, reviewApi } from '../api/client';
import type { PublicVendorProfile, Product, Review } from '../types';
import { 
  MapPin, 
  CheckCircle2, 
  Star, 
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
  ExternalLink
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

  // Lead times calculation from real products
  const leadTimeRange = useMemo(() => {
    const times = products.map((p) => p.preparation_time_days).filter((t): t is number => typeof t === 'number' && t > 0);
    if (times.length === 0) return null;
    const min = Math.min(...times);
    const max = Math.max(...times);
    return min === max ? `${min} days` : `${min}-${max} days`;
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
        <p>Loading designer storefront...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="storefront-empty-state">
        <h2>Designer Storefront Not Found</h2>
        <p>The designer you are looking for may be temporarily unavailable or unverified.</p>
        <Link to="/designers" className="btn-primary-emerald">
          <span>Browse Designer Directory</span>
        </Link>
      </div>
    );
  }

  const totalReviews = profile.review_count || reviews.length;
  const ratingNum = totalReviews > 0 ? parseFloat(profile.average_rating || '0').toFixed(1) : null;

  // WhatsApp link preparation
  const rawPhone = profile.whatsapp_phone || '';
  const cleanPhone = rawPhone.replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
  const hasWhatsApp = Boolean(waPhone && waPhone.length >= 10);

  return (
    <div className="storefront-container">
      {/* Cover Banner */}
      <div
        className="storefront-banner"
        style={{
          backgroundImage: profile.banner_url ? `url(${profile.banner_url})` : 'linear-gradient(135deg, #0C3B2E 0%, #07261E 100%)',
        }}
      >
        <div className="banner-overlay" />
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
              {profile.is_verified ? (
                <div className="badge-verified-designer" title="Verified Nigerian Designer">
                  <CheckCircle2 size={13} />
                  <span>Verified Designer</span>
                </div>
              ) : (
                <div className="badge-verification-progress" title="Application and credentials under review">
                  <Clock size={13} />
                  <span>Verification in Progress</span>
                </div>
              )}
            </div>

            <div className="meta-details-row">
              <div className="meta-item location-meta">
                <MapPin size={15} />
                <span>{profile.city}, {profile.state}</span>
              </div>

              <div className="meta-item rating-item">
                {ratingNum ? (
                  <>
                    <Star size={15} className="star-filled" />
                    <span className="rating-num">{ratingNum}</span>
                    <span className="reviews-count">({totalReviews} review{totalReviews !== 1 ? 's' : ''})</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} color="#D4AF37" />
                    <span className="new-designer-text">New Designer · No reviews yet</span>
                  </>
                )}
              </div>

              {profile.instagram_handle && (
                <a
                  href={`https://instagram.com/${profile.instagram_handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="meta-item ig-link"
                >
                  <span>{profile.instagram_handle.startsWith('@') ? profile.instagram_handle : `@${profile.instagram_handle}`}</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {profile.description && (
              <p className="store-description">{profile.description}</p>
            )}

            {/* Action Bar */}
            <div className="storefront-action-bar">
              <button
                className={`btn-share-store ${copiedLink ? 'copied' : ''}`}
                onClick={handleCopyStoreLink}
                title="Share store link"
              >
                {copiedLink ? (
                  <>
                    <Check size={16} color="#064E3B" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span>Share Storefront</span>
                  </>
                )}
              </button>

              {hasWhatsApp && (
                <a
                  href={`https://wa.me/${waPhone}?text=${encodeURIComponent(`Hello ${profile.store_name}, I am contacting you regarding your pieces on Aso Marketplace: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-whatsapp-inquire"
                >
                  <Phone size={15} />
                  <span>Contact Designer on WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Store Highlights Strip */}
        <div className="storefront-highlights-strip">
          <div className="highlight-pill">
            <ShoppingBag size={16} color="#064E3B" />
            <div className="highlight-text">
              <strong>{products.length} Products</strong>
              <span>Published Pieces</span>
            </div>
          </div>

          {leadTimeRange && (
            <div className="highlight-pill">
              <Clock size={16} color="#064E3B" />
              <div className="highlight-text">
                <strong>{leadTimeRange} Prep Time</strong>
                <span>Direct Designer Dispatch</span>
              </div>
            </div>
          )}

          <div className="highlight-pill">
            <ShieldCheck size={16} color="#064E3B" />
            <div className="highlight-text">
              <strong>Buyer Protection</strong>
              <span>Escrow Payment Security</span>
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
            <span>About {profile.store_name}</span>
          </button>
          <button
            className={`tab-link ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <MessageSquare size={16} />
            <span>Customer Reviews ({totalReviews})</span>
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
                <p>Loading collection pieces...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="empty-collection-state">
                <ShoppingBag size={40} color="#9CA3AF" />
                <h3>No products found</h3>
                <p>{searchQuery || selectedCategory !== 'All' ? 'No pieces match your search or filter in this store.' : 'This designer has not published any pieces yet.'}</p>
                {(searchQuery || selectedCategory !== 'All') && (
                  <button
                    className="btn-reset-filters"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="store-products-grid">
                {filteredProducts.map((product) => {
                  const displayImg =
                    product.primary_image_url ||
                    product.media?.[0]?.url ||
                    '';
                  const prepDays = product.preparation_time_days;

                  return (
                    <div key={product.id} className="store-product-card">
                      <Link to={`/products/${product.slug || product.id}`} className="product-image-container">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={product.title}
                            className="product-main-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="product-img-fallback">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                        {prepDays ? (
                          <div className="product-prep-tag">
                            <Clock size={12} />
                            <span>{prepDays}d prep</span>
                          </div>
                        ) : null}
                      </Link>

                      <div className="product-info-box">
                        {product.category?.name && (
                          <span className="product-category-chip">
                            {product.category.name}
                          </span>
                        )}
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

        {/* TAB 2: ABOUT THE DESIGNER */}
        {activeTab === 'story' && (
          <div className="storefront-story-section">
            <div className="story-grid-layout">
              <div className="story-main-card">
                <h2 className="story-section-title">About {profile.store_name}</h2>
                <div className="story-body-paragraphs">
                  {profile.description ? (
                    <p className="story-lead-text">{profile.description}</p>
                  ) : (
                    <p className="story-lead-text text-muted">Authentic Nigerian fashion from an independent designer on Aso Marketplace.</p>
                  )}
                </div>

                <div className="workshop-address-box">
                  <div className="workshop-icon">
                    <MapPin size={22} color="#064E3B" />
                  </div>
                  <div>
                    <h4>Public Store Location</h4>
                    <p>{profile.city}, {profile.state}</p>
                    <span className="location-verified-note">Verified Nigerian Fashion Store</span>
                  </div>
                </div>
              </div>

              {/* Specialties & Brand Details */}
              <div className="story-side-card">
                <h3 className="side-card-title">
                  <Sparkles size={18} color="#064E3B" />
                  <span>Design Specialties</span>
                </h3>
                <p className="side-card-desc">
                  Categories and garment styles handcrafted by {profile.store_name}.
                </p>

                <div className="specialties-tags-list">
                  {availableCategories.filter(c => c !== 'All').length > 0 ? (
                    availableCategories.filter(c => c !== 'All').map(cat => (
                      <span key={cat} className="specialty-tag">{cat}</span>
                    ))
                  ) : (
                    <span className="specialty-tag">Nigerian Ready-to-Wear</span>
                  )}
                </div>

                <div className="guarantee-box">
                  <ShieldCheck size={20} color="#D4AF37" />
                  <span>All purchases through Aso Marketplace are protected by buyer escrow protection.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="storefront-reviews-section">
            <div className="reviews-summary-card">
              {/* Overall Score Box */}
              <div className="overall-score-box">
                <div className="big-rating-number">{ratingNum || '—'}</div>
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={20}
                      className={ratingNum && i <= Math.round(parseFloat(ratingNum)) ? 'star-filled' : 'star-empty'}
                    />
                  ))}
                </div>
                <span className="total-reviews-caption">
                  {totalReviews > 0 ? `Based on ${totalReviews} verified customer order${totalReviews !== 1 ? 's' : ''}` : 'No customer reviews yet'}
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
              <div className="reviews-loading">
                <div className="storefront-spinner" />
                <p>Loading customer reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="empty-reviews-card">
                <MessageSquare size={36} color="#9CA3AF" />
                <h3>No customer reviews yet</h3>
                <p>Be the first customer to purchase from {profile.store_name} and share your feedback once delivered.</p>
              </div>
            ) : (
              <div className="reviews-list-grid">
                {reviews.map((r) => (
                  <div key={r.id} className="customer-review-card">
                    <div className="review-top-row">
                      <div className="review-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            className={s <= (r.rating || 5) ? 'star-filled' : 'star-empty'}
                          />
                        ))}
                      </div>
                      <span className="review-date">
                        {new Date(r.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="review-comment-text">"{r.comment}"</p>

                    <div className="review-author-meta">
                      <span className="author-name font-bold">{r.user_name || 'Verified Buyer'}</span>
                      <span className="verified-buyer-badge">
                        <CheckCircle2 size={12} /> Verified Purchase
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
