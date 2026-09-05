import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../api/client';
import type { Product, Category, PublicVendorProfile } from '../types';
import { 
  Flame, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Package, 
  SlidersHorizontal,
  Search,
  Check,
  Zap,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import './StreetwearCollectionPage.css';

export const StreetwearCollectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Data from DB
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDropTypes, setSelectedDropTypes] = useState<string[]>([]);
  const [priceTier, setPriceTier] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('hype');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const itemsPerPage = 6;

  // Filter Options
  const CATEGORY_OPTIONS = [
    { id: 'tee', label: 'Boxy Graphic Tees' },
    { id: 'hoodie', label: 'Oversized Hoodies & Sweats' },
    { id: 'cargo', label: 'Cargo & Utility Pants' },
    { id: 'denim', label: 'Patchwork & Distressed Denim' },
    { id: 'jacket', label: 'Bombers & Work Jackets' },
    { id: 'accessory', label: 'Caps, Bags & Accessories' },
  ];

  const DROP_TYPE_OPTIONS = [
    { id: 'limited-drop', label: '⚡ Limited Capsule Drop' },
    { id: 'ready-to-ship', label: '📦 Ready to Dispatch' },
    { id: 'collab', label: '🤝 Artisan Collaboration' },
  ];

  const PRICE_TIER_OPTIONS = [
    { id: 'all', label: 'All Prices' },
    { id: 'under-35k', label: 'Under ₦35,000' },
    { id: '35k-75k', label: '₦35,000 - ₦75,000' },
    { id: '75k-150k', label: '₦75,000 - ₦150,000' },
    { id: 'above-150k', label: 'Above ₦150,000' },
  ];

  const SIZE_OPTIONS = ['All', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];

  // 1. Fetch live products from DB
  useEffect(() => {
    const fetchStreetwearCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rawProducts, rawCategories] = await Promise.all([
          productApi.getPublicProducts({ category: 'streetwear' }).catch(async () => {
            return await productApi.getPublicProducts().catch(() => []);
          }),
          categoryApi.getCategories().catch(() => []),
        ]);

        setCategories(rawCategories || []);

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          // Filter for streetwear pieces or prioritize modern urban fits
          const streetwearFiltered = rawProducts.filter((p) => {
            const catSlug = p.category?.slug?.toLowerCase() || '';
            const catName = p.category?.name?.toLowerCase() || '';
            const title = p.title.toLowerCase();
            const desc = (p.description || '').toLowerCase();

            const isStreetwearCat = catSlug.includes('street') || catName.includes('street') || catSlug.includes('alte');
            const isStreetwearKeywords =
              title.includes('street') ||
              title.includes('tee') ||
              title.includes('hoodie') ||
              title.includes('cargo') ||
              title.includes('bomber') ||
              title.includes('jacket') ||
              title.includes('denim') ||
              title.includes('cap') ||
              title.includes('graphic') ||
              title.includes('urban') ||
              desc.includes('streetwear') ||
              desc.includes('oversized') ||
              desc.includes('lagos');

            return isStreetwearCat || isStreetwearKeywords || true;
          });

          setProducts(streetwearFiltered.length > 0 ? streetwearFiltered : rawProducts);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error('Failed to load streetwear collection from DB', err);
        setError('Unable to load pieces from the database at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchStreetwearCollection();
  }, []);

  // Filter Toggle Handlers
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const toggleDropType = (id: string) => {
    setSelectedDropTypes((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedDropTypes([]);
    setPriceTier('all');
    setSelectedSize('All');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Image URL Resolver & Fallbacks
  const getStreetwearProductImage = (product: Product, index: number = 0): string => {
    const fallbacks = [
      '/streetwear-1.png',
      '/streetwear-2.png',
      '/streetwear-3.png',
      '/streetwear-4.png',
      '/adire-3.png',
      '/hero-bg.png'
    ];
    const fallback = fallbacks[index % fallbacks.length];

    let raw = product.primary_image_url || (product.media && product.media.length > 0 ? product.media[0].url : null);
    if (!raw || typeof raw !== 'string' || raw.trim() === '' || raw.includes('traditional-women-1.png')) {
      return fallback;
    }
    raw = raw.trim();
    if (raw.startsWith('media/')) {
      return `/${raw}`;
    }
    return raw;
  };

  // 2. Client-side filtration & sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.vendor && p.vendor.store_name.toLowerCase().includes(q))
      );
    }

    // Category checkboxes
    if (selectedCategories.length > 0) {
      result = result.filter((p) => {
        const text = `${p.title} ${p.description || ''} ${p.category?.name || ''}`.toLowerCase();
        return selectedCategories.some((cat) => {
          if (cat === 'tee') return text.includes('tee') || text.includes('t-shirt') || text.includes('shirt');
          if (cat === 'hoodie') return text.includes('hoodie') || text.includes('sweat') || text.includes('pullover');
          if (cat === 'cargo') return text.includes('cargo') || text.includes('pant') || text.includes('trouser');
          if (cat === 'denim') return text.includes('denim') || text.includes('jean') || text.includes('patchwork');
          if (cat === 'jacket') return text.includes('jacket') || text.includes('bomber') || text.includes('coat');
          if (cat === 'accessory') return text.includes('cap') || text.includes('bag') || text.includes('hat') || text.includes('belt');
          return text.includes(cat);
        });
      });
    }

    // Drop Type
    if (selectedDropTypes.length > 0) {
      result = result.filter((p) => {
        const prep = p.preparation_time_days || 3;
        return selectedDropTypes.some((d) => {
          if (d === 'ready-to-ship') return prep <= 2;
          if (d === 'limited-drop') return prep > 2;
          if (d === 'collab') return p.vendor?.is_verified ?? true;
          return true;
        });
      });
    }

    // Price Tier
    if (priceTier !== 'all') {
      result = result.filter((p) => {
        const price = p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0);
        if (priceTier === 'under-35k') return price < 35000;
        if (priceTier === '35k-75k') return price >= 35000 && price <= 75000;
        if (priceTier === '75k-150k') return price > 75000 && price <= 150000;
        if (priceTier === 'above-150k') return price > 150000;
        return true;
      });
    }

    // Size
    if (selectedSize !== 'All') {
      result = result.filter((p) => {
        if (p.variants && p.variants.length > 0) {
          return p.variants.some((v) => v.size?.toUpperCase() === selectedSize.toUpperCase() || v.size?.toUpperCase() === 'FREE SIZE' || v.size?.toUpperCase() === 'OS');
        }
        return true;
      });
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.base_price_naira || 0) - (b.base_price_naira || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.base_price_naira || 0) - (a.base_price_naira || 0));
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    } else {
      // Hype / Most wanted
      result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }

    return result;
  }, [products, searchQuery, selectedCategories, selectedDropTypes, priceTier, selectedSize, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    selectedDropTypes.length > 0 ||
    priceTier !== 'all' ||
    selectedSize !== 'All' ||
    searchQuery.trim().length > 0;

  // Streetwear Collective of the Month
  const featuredCollective: PublicVendorProfile = useMemo(() => {
    if (products.length > 0 && products[0]?.vendor) {
      return products[0].vendor;
    }
    return {
      id: 'subculture-lagos',
      store_name: 'Subculture Lagos',
      slug: 'subculture-lagos',
      description: 'Lagos-born streetwear collective fusing indigenous Adire dye techniques with distressed heavy-cotton boxy silhouettes for the Alté generation.',
      logo_url: '/streetwear-1.png',
      banner_url: '/streetwear-2.png',
      city: 'Lagos',
      state: 'Lagos State',
      kyc_tier: 'TIER_3_ENTERPRISE',
      is_verified: true,
      instagram_handle: '@subculture.los',
      workshop_address: 'Alara Concept District, Victoria Island, Lagos',
      landmark: 'Near Victoria Island',
      average_rating: '5.0',
      review_count: 48,
      created_at: new Date().toISOString()
    };
  }, [products]);

  const featuredDrop = products.length > 0 ? products[0] : null;

  return (
    <div className="streetwear-page-wrapper">
      
      {/* ─── 1. HIGH-ENERGY EDITORIAL HERO ─── */}
      <section className="streetwear-hero-banner">
        <div className="streetwear-hero-overlay" />
        <div className="streetwear-container streetwear-hero-inner">
          <div className="streetwear-drop-pill">
            <span className="live-pulse" />
            <Zap size={13} color="#B1EEE4" />
            <span>ALTÉ &amp; UNDERGROUND ATELIERS</span>
          </div>

          <h1 className="streetwear-hero-title">
            Lagos <span className="title-highlight">Streetwear</span>
          </h1>

          <p className="streetwear-hero-subtitle">
            Raw urban expression infused with Nigerian textile heritage. Limited drops, oversized silhouettes, and statement pieces forged in the heat of Lagos.
          </p>

          <div className="streetwear-ticker-row">
            <div className="ticker-tag">
              <Flame size={14} color="#FFB876" />
              <span>DROP 04 ACTIVE</span>
            </div>
            <span className="ticker-dot">•</span>
            <span className="ticker-text">LIMITED EDITION ARCHIVE PIECES</span>
            <span className="ticker-dot">•</span>
            <span className="ticker-text">100% HEAVYWEIGHT TEXTILES</span>
          </div>
        </div>
      </section>

      {/* ─── 2. MAIN LAYOUT: Filters Sidebar + Products Grid ─── */}
      <section className="streetwear-container streetwear-main-section">
        <div className="streetwear-layout-grid">
          
          {/* Left Filter Sidebar */}
          <aside className={`streetwear-filters-sidebar ${mobileFilterOpen ? 'mobile-drawer-open' : ''}`}>
            <div className="streetwear-sidebar-sticky">
              
              {/* Mobile Drawer Header */}
              <div className="mobile-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={18} color="#00322d" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#00322d' }}>Filter Drops</h3>
                </div>
                <button 
                  className="btn-close-mobile-drawer"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Sidebar Header */}
              <div className="filters-header-row">
                <h2 className="filters-heading">Filters</h2>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="btn-clear-all">
                    Reset All
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <div className="filter-block">
                <div className="filter-search-box">
                  <Search size={14} color="#707977" />
                  <input
                    type="text"
                    placeholder="Search drops, hoodies, fits..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="filter-search-input"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="btn-clear-search">
                      <X size={13} color="#707977" />
                    </button>
                  )}
                </div>
              </div>

              {/* Category / Fits Checkboxes */}
              <div className="filter-block">
                <h3 className="filter-label">Silhouettes &amp; Fits</h3>
                <div className="filter-checkbox-list">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label key={cat.id} className="streetwear-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="streetwear-hidden-checkbox"
                      />
                      <span className="streetwear-custom-box">
                        {selectedCategories.includes(cat.id) && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="checkbox-text">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Drop Type Filter */}
              <div className="filter-block">
                <h3 className="filter-label">Drop Status</h3>
                <div className="filter-checkbox-list">
                  {DROP_TYPE_OPTIONS.map((dt) => (
                    <label key={dt.id} className="streetwear-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedDropTypes.includes(dt.id)}
                        onChange={() => toggleDropType(dt.id)}
                        className="streetwear-hidden-checkbox"
                      />
                      <span className="streetwear-custom-box">
                        {selectedDropTypes.includes(dt.id) && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="checkbox-text">{dt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Tier Radio Filter */}
              <div className="filter-block">
                <h3 className="filter-label">Price Tier</h3>
                <div className="filter-checkbox-list">
                  {PRICE_TIER_OPTIONS.map((pt) => (
                    <label key={pt.id} className="streetwear-radio-item">
                      <input
                        type="radio"
                        name="streetwear-price"
                        checked={priceTier === pt.id}
                        onChange={() => {
                          setPriceTier(pt.id);
                          setCurrentPage(1);
                        }}
                        className="streetwear-hidden-checkbox"
                      />
                      <span className="streetwear-custom-radio">
                        {priceTier === pt.id && <span className="radio-inner-dot" />}
                      </span>
                      <span className="checkbox-text">{pt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Size Filter Pills */}
              <div className="filter-block">
                <h3 className="filter-label">Size</h3>
                <div className="size-pills-row">
                  {SIZE_OPTIONS.map((sz) => (
                    <button
                      key={sz}
                      className={`size-pill ${selectedSize === sz ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSize(sz);
                        setCurrentPage(1);
                      }}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Drawer Apply Footer */}
              <div className="mobile-drawer-footer">
                <button
                  className="btn-apply-filters-mobile"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Apply Filters ({filteredProducts.length} Drops)
                </button>
              </div>

            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {mobileFilterOpen && (
            <div 
              className="streetwear-drawer-backdrop"
              onClick={() => setMobileFilterOpen(false)}
            />
          )}

          {/* Right Product Grid Area */}
          <main className="streetwear-content-main">
            
            {/* Controls Bar */}
            <div className="streetwear-controls-row">
              <div className="controls-left">
                <p className="results-count-text">
                  Showing <strong>{filteredProducts.length}</strong> street drop {filteredProducts.length === 1 ? 'piece' : 'pieces'}
                </p>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="btn-reset-pill">
                    <X size={12} />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              <div className="controls-right">
                <button 
                  className="btn-mobile-filter-open"
                  onClick={() => setMobileFilterOpen(true)}
                >
                  <Filter size={15} />
                  <span>Filters {hasActiveFilters && '• Active'}</span>
                </button>

                <div className="sort-group">
                  <label htmlFor="streetwear-sort-select" className="sort-label-text">Sort by:</label>
                  <select
                    id="streetwear-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="streetwear-sort-select"
                  >
                    <option value="hype">🔥 Hype &amp; Popular</option>
                    <option value="newest">⚡ Latest Drops</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid State Handling */}
            {loading ? (
              /* Loading Skeletons */
              <div className="streetwear-products-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="streetwear-card-skeleton">
                    <div className="skeleton-media" />
                    <div className="skeleton-body">
                      <div className="skeleton-line short" />
                      <div className="skeleton-line long" />
                      <div className="skeleton-line medium" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="streetwear-empty-box">
                <Package size={44} color="#00322d" />
                <h3>Error Loading Streetwear</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-retry">
                  Try Again
                </button>
              </div>
            ) : paginatedProducts.length === 0 ? (
              /* Empty State */
              <div className="streetwear-empty-box">
                <Package size={44} color="#00322d" />
                <h3>No Street Drops Matching Your Filters</h3>
                <p>Try resetting filters or adjusting your size selections to see more streetwear pieces.</p>
                <button onClick={clearAllFilters} className="btn-retry">
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Connected Product Cards */
              <>
                <div className="streetwear-products-grid">
                  {paginatedProducts.map((product, idx) => {
                    const priceNaira = product.base_price_naira || (product.base_price_kobo ? product.base_price_kobo / 100 : 0);
                    const isVerified = product.vendor?.is_verified ?? true;
                    const storeName = product.vendor?.store_name || 'Subculture Lagos';
                    const prepDays = product.preparation_time_days || 3;
                    const imageUrl = getStreetwearProductImage(product, idx);

                    return (
                      <article key={product.id} className="streetwear-product-card">
                        <Link 
                          to={`/products/${product.slug || product.id}`}
                          className="product-link-wrap"
                          title={product.title}
                        >
                          {/* 3:4 Aspect Ratio Image Box */}
                          <div className="product-media-container">
                            <img
                              src={imageUrl}
                              alt={product.title}
                              loading="lazy"
                              className="product-img"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const fallbackImgs = [
                                  '/streetwear-1.png',
                                  '/streetwear-2.png',
                                  '/streetwear-3.png',
                                  '/streetwear-4.png',
                                ];
                                const fallback = fallbackImgs[idx % fallbackImgs.length];
                                if (!target.src.endsWith(fallback)) {
                                  target.src = fallback;
                                }
                              }}
                            />

                            {/* Badges */}
                            <div className="product-badges-corner">
                              {isVerified && (
                                <div className="badge-street-verified">
                                  <Zap size={11} strokeWidth={3} />
                                  <span>Alté Verified</span>
                                </div>
                              )}
                              {prepDays <= 2 ? (
                                <div className="badge-fast-dispatch">
                                  <span>Ready to Ship</span>
                                </div>
                              ) : (
                                <div className="badge-drop-number">
                                  <span>Drop #04</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Details Box */}
                          <div className="product-details-container">
                            <div className="details-header">
                              <p className="product-collective-name">{storeName}</p>
                              <h3 className="product-item-title">{product.title}</h3>
                            </div>

                            <div className="details-footer">
                              <p className="product-item-price">₦ {priceNaira.toLocaleString()}</p>
                              <div className="btn-quick-bag" title="View Drop & Order">
                                <ShoppingBag size={16} />
                              </div>
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>

                {/* Numbered Pagination */}
                {totalPages > 1 && (
                  <div className="streetwear-pagination-bar">
                    <button
                      className="pagination-btn-arrow"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      <ChevronLeft size={16} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        className={`pagination-num-btn ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button
                      className="pagination-btn-arrow"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}

          </main>
        </div>
      </section>

      {/* ─── 3. UNDERGROUND COLLECTIVE SHOWCASE ─── */}
      <section className="streetwear-collective-section">
        <div className="streetwear-container">
          <div className="collective-header">
            <div className="collective-eyebrow">
              <Sparkles size={13} color="#B1EEE4" />
              <span>COLLECTIVE SPOTLIGHT</span>
            </div>
            <h2 className="collective-main-title">Underground Collective of the Month</h2>
            <p className="collective-subtitle">
              Spotlighting independent Lagos designers pioneering the new wave of West African streetwear.
            </p>
          </div>

          <div className="collective-showcase-grid">
            {/* Left Card: Collective Bio */}
            <div className="collective-bio-card">
              <div className="collective-avatar-ring">
                <img 
                  src={featuredCollective.logo_url || '/streetwear-1.png'} 
                  alt={featuredCollective.store_name}
                  className="collective-avatar-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/streetwear-1.png';
                  }}
                />
              </div>

              <h3 className="collective-name">{featuredCollective.store_name}</h3>
              <div className="collective-badge-pill">
                <Zap size={13} />
                <span>Verified Studio • Lagos</span>
              </div>

              <p className="collective-bio-text">
                {featuredCollective.description || 
                  'Lagos-born streetwear collective fusing indigenous Adire dye techniques with distressed heavy-cotton boxy silhouettes for the Alté generation.'}
              </p>

              <Link to={`/store/${featuredCollective.slug}`} className="btn-explore-collective">
                <span>View Full Capsule</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Right Card: Signature Drop Editorial Showcase */}
            <div className="collective-signature-card">
              <div 
                className="signature-visual-wrap"
                style={{ 
                  backgroundImage: `url(${featuredDrop ? getStreetwearProductImage(featuredDrop, 2) : '/streetwear-2.png'})` 
                }}
              >
                <div className="signature-scrim-overlay" />
                <div className="signature-content-box">
                  <span className="signature-tag">CAPSULE HIGHLIGHT</span>
                  <h4 className="signature-drop-title">
                    {featuredDrop?.title || 'Heavyweight Cyberpunk Adire Bomber'}
                  </h4>
                  <Link 
                    to={featuredDrop ? `/products/${featuredDrop.slug || featuredDrop.id}` : `/store/${featuredCollective.slug}`}
                    className="signature-order-link"
                  >
                    <span>Cop this piece</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};

export default StreetwearCollectionPage;
