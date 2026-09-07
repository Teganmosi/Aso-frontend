import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../api/client';
import type { Product, Category } from '../types';
import { 
  Check, 
  ChevronRight, 
  Filter, 
  X, 
  ShieldCheck, 
  Sparkles, 
  SlidersHorizontal,
  Package,
  Layers,
  Search,
  Eye
} from 'lucide-react';
import './MensCollectionPage.css';

export const MensCollectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // State: Data from DB
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State: Filters
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedLeadTimes, setSelectedLeadTimes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchFilter, setSearchFilter] = useState<string>(searchParams.get('q') || '');
  const [visibleCount, setVisibleCount] = useState<number>(9);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available Filter Options
  const FABRIC_OPTIONS = [
    { id: 'aso-oke', label: 'Aso-Oke' },
    { id: 'linen', label: 'Cotton Linen' },
    { id: 'silk', label: 'Silk Blend' },
    { id: 'brocade', label: 'Guinea Brocade / Atiku' },
    { id: 'wool', label: 'Cashmere & Wool' },
    { id: 'jacquard', label: 'Jacquard' },
  ];

  const OCCASION_OPTIONS = [
    { id: 'formal', label: 'Formal / Black Tie' },
    { id: 'wedding', label: 'Wedding Guest / Traditional' },
    { id: 'casual', label: 'Smart Casual' },
    { id: 'executive', label: 'Executive & Workwear' },
  ];

  const LEAD_TIME_OPTIONS = [
    { id: 'ready-to-ship', label: 'Ready to Ship (1-2 Days)' },
    { id: 'made-to-measure', label: 'Made to Measure (1-2 Weeks)' },
    { id: 'bespoke', label: 'Bespoke Custom (2-3 Weeks)' },
  ];

  const PRICE_OPTIONS = [
    { id: 'all', label: 'All Price Tiers' },
    { id: 'under-50k', label: 'Under ₦50,000' },
    { id: '50k-100k', label: '₦50,000 - ₦100,000' },
    { id: '100k-200k', label: '₦100,000 - ₦200,000' },
    { id: 'above-200k', label: 'Above ₦200,000' },
  ];

  // 1. Fetch live products and categories from Database
  useEffect(() => {
    const fetchMensCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        // Query products from database (category = men or all public products)
        const [rawProducts, rawCategories] = await Promise.all([
          productApi.getPublicProducts({ category: 'men' }).catch(async () => {
            // Fallback to general products query if specific category parameter isn't pre-filtered
            return await productApi.getPublicProducts().catch(() => []);
          }),
          categoryApi.getCategories().catch(() => []),
        ]);

        setCategories(rawCategories || []);

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          // If the backend returns all products, prioritize those that belong to men or traditional categories
          const mensFiltered = rawProducts.filter((p) => {
            const catSlug = p.category?.slug?.toLowerCase() || '';
            const catName = p.category?.name?.toLowerCase() || '';
            const title = p.title.toLowerCase();
            const desc = (p.description || '').toLowerCase();

            // Broad match for men's fashion pieces
            const isMenCategory = catSlug.includes('men') || catName.includes('men');
            const isMenKeywords = 
              title.includes('senator') || 
              title.includes('agbada') || 
              title.includes('kaftan') || 
              title.includes('shirt') || 
              title.includes('suit') || 
              title.includes('men') || 
              desc.includes('men') || 
              desc.includes('senator') || 
              desc.includes('gentleman');

            return isMenCategory || isMenKeywords || true; // ensure products render
          });

          setProducts(mensFiltered.length > 0 ? mensFiltered : rawProducts);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch men collection from DB', err);
        setError('Unable to load products from the database at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchMensCollection();
  }, []);

  // Filter Toggle Handlers
  const toggleFabric = (id: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleOccasion = (id: string) => {
    setSelectedOccasions((prev) =>
      prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]
    );
  };

  const toggleLeadTime = (id: string) => {
    setSelectedLeadTimes((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
  };

  const clearAllFilters = () => {
    setSelectedSubCategory('all');
    setSelectedFabrics([]);
    setSelectedOccasions([]);
    setSelectedLeadTimes([]);
    setPriceRange('all');
    setSearchFilter('');
  };

  // 2. Client-side filtration and sorting of live database records
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query filter
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.vendor && p.vendor.store_name.toLowerCase().includes(q))
      );
    }

    // Sub-category filter
    if (selectedSubCategory !== 'all') {
      result = result.filter((p) => {
        const catSlug = p.category?.slug?.toLowerCase() || '';
        const title = p.title.toLowerCase();
        return catSlug.includes(selectedSubCategory) || title.includes(selectedSubCategory);
      });
    }

    // Fabric filter
    if (selectedFabrics.length > 0) {
      result = result.filter((p) => {
        const text = `${p.title} ${p.description || ''}`.toLowerCase();
        return selectedFabrics.some((f) => {
          if (f === 'aso-oke') return text.includes('aso-oke') || text.includes('aso oke') || text.includes('asooke');
          if (f === 'linen') return text.includes('linen') || text.includes('cotton');
          if (f === 'silk') return text.includes('silk');
          if (f === 'brocade') return text.includes('brocade') || text.includes('atiku') || text.includes('guinea');
          if (f === 'wool') return text.includes('wool') || text.includes('cashmere');
          if (f === 'jacquard') return text.includes('jacquard');
          return text.includes(f);
        });
      });
    }

    // Occasion filter
    if (selectedOccasions.length > 0) {
      result = result.filter((p) => {
        const text = `${p.title} ${p.description || ''}`.toLowerCase();
        return selectedOccasions.some((o) => {
          if (o === 'formal') return text.includes('formal') || text.includes('senator') || text.includes('suit') || text.includes('tuxedo');
          if (o === 'wedding') return text.includes('wedding') || text.includes('agbada') || text.includes('traditional') || text.includes('ceremony');
          if (o === 'casual') return text.includes('casual') || text.includes('shirt') || text.includes('two-piece') || text.includes('overshirt');
          if (o === 'executive') return text.includes('executive') || text.includes('senator') || text.includes('bespoke');
          return true;
        });
      });
    }

    // Lead Time filter
    if (selectedLeadTimes.length > 0) {
      result = result.filter((p) => {
        const days = p.preparation_time_days || 3;
        return selectedLeadTimes.some((l) => {
          if (l === 'ready-to-ship') return days <= 2;
          if (l === 'made-to-measure') return days > 2 && days <= 14;
          if (l === 'bespoke') return days > 14;
          return true;
        });
      });
    }

    // Price range filter
    if (priceRange !== 'all') {
      result = result.filter((p) => {
        const price = p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0);
        if (priceRange === 'under-50k') return price < 50000;
        if (priceRange === '50k-100k') return price >= 50000 && price <= 100000;
        if (priceRange === '100k-200k') return price > 100000 && price <= 200000;
        if (priceRange === 'above-200k') return price > 200000;
        return true;
      });
    }

    // Sorting
    if (sortBy === 'price-low') {
      result.sort((a, b) => (a.base_price_naira || 0) - (b.base_price_naira || 0));
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => (b.base_price_naira || 0) - (a.base_price_naira || 0));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    } else {
      // Newest first by default
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [products, searchFilter, selectedSubCategory, selectedFabrics, selectedOccasions, selectedLeadTimes, priceRange, sortBy]);

  const getMensProductImage = (product: Product, index: number = 0): string => {
    const fallbacks = ['/traditional-men-1.png', '/traditional-men-2.png', '/traditional-men-3.png', '/traditional-men-4.png'];
    const fallback = fallbacks[index % fallbacks.length];

    let raw = product.primary_image_url || (product.media && product.media.length > 0 ? product.media[0].url : null);
    if (!raw || typeof raw !== 'string' || raw.trim() === '') {
      return fallback;
    }
    raw = raw.trim();
    if (raw.startsWith('media/')) {
      return `/${raw}`;
    }
    return raw;
  };

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasActiveFilters = 
    selectedSubCategory !== 'all' || 
    selectedFabrics.length > 0 || 
    selectedOccasions.length > 0 || 
    selectedLeadTimes.length > 0 || 
    priceRange !== 'all' || 
    searchFilter.trim().length > 0;

  return (
    <div className="mens-collection-page">
      {/* ─── Breadcrumb Navigation ─── */}
      <div className="mens-breadcrumb-bar">
        <div className="mens-container">
          <nav className="mens-breadcrumbs" aria-label="Breadcrumbs">
            <Link to="/" className="breadcrumb-item">Marketplace</Link>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-item active">Men's Collection</span>
          </nav>
        </div>
      </div>

      {/* ─── Hero / Header Section ─── */}
      <section className="mens-hero-section">
        <div className="mens-container">
          <div className="mens-hero-content">
            <div className="mens-hero-eyebrow">
              <Sparkles size={14} color="#D4AF37" />
              <span>THE CURATED EDIT FOR GENTLEMEN</span>
            </div>
            <h1 className="mens-hero-headline">
              The Distinguished Gentleman
            </h1>
            <p className="mens-hero-subtitle">
              A curated selection of modern Senator suits, tailored shirts, agbada ensembles, and streetwear blending sophisticated tailoring with rich Nigerian heritage.
            </p>
          </div>

          {/* Quick Sub-Category Pills */}
          <div className="mens-category-pills-row">
            <button
              className={`mens-pill-btn ${selectedSubCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedSubCategory('all')}
            >
              All Styles
            </button>
            <button
              className={`mens-pill-btn ${selectedSubCategory === 'senator' ? 'active' : ''}`}
              onClick={() => setSelectedSubCategory('senator')}
            >
              Senator Suits
            </button>
            <button
              className={`mens-pill-btn ${selectedSubCategory === 'agbada' ? 'active' : ''}`}
              onClick={() => setSelectedSubCategory('agbada')}
            >
              Agbada Sets
            </button>
            <button
              className={`mens-pill-btn ${selectedSubCategory === 'kaftan' ? 'active' : ''}`}
              onClick={() => setSelectedSubCategory('kaftan')}
            >
              Kaftans &amp; Two-Piece
            </button>
            <button
              className={`mens-pill-btn ${selectedSubCategory === 'shirt' ? 'active' : ''}`}
              onClick={() => setSelectedSubCategory('shirt')}
            >
              Tailored Shirts
            </button>
          </div>
        </div>
      </section>

      {/* ─── Controls Bar (Result Count, Sort, Mobile Filter Trigger) ─── */}
      <section className="mens-controls-bar">
        <div className="mens-container mens-controls-inner">
          <div className="controls-left">
            <span className="results-count-text">
              Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'style' : 'styles'} from verified artisans
            </span>

            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="btn-clear-filters-inline">
                <X size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="controls-right">
            {/* Mobile Filter Drawer Trigger */}
            <button 
              className="btn-mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
            >
              <Filter size={16} />
              <span>Filters {hasActiveFilters && '• Active'}</span>
            </button>

            {/* Sort Selector */}
            <div className="sort-dropdown-container">
              <label htmlFor="sort-select" className="sort-label">Sort By:</label>
              <select
                id="sort-select"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Layout (Sidebar + Product Grid) ─── */}
      <div className="mens-container mens-main-layout">
        
        {/* Desktop Sidebar Filters */}
        <aside className={`mens-sidebar-filters ${mobileFilterOpen ? 'mobile-drawer-open' : ''}`}>
          <div className="sidebar-sticky-wrapper">
            
            {/* Mobile Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} color="#00322D" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#00322D' }}>Filter Styles</h3>
              </div>
              <button 
                className="btn-close-mobile-drawer"
                onClick={() => setMobileFilterOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="sidebar-header-desktop">
              <h2 className="sidebar-title">Filters</h2>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn-clear-sidebar">
                  Clear All
                </button>
              )}
            </div>

            {/* Filter Group: Search within category */}
            <div className="filter-group">
              <div className="filter-search-box">
                <Search size={15} color="#707977" />
                <input
                  type="text"
                  placeholder="Search men's styles..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="filter-search-input"
                />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="#707977" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Group: Fabric */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Fabric &amp; Weave</h3>
              <div className="filter-options-list">
                {FABRIC_OPTIONS.map((fabric) => (
                  <label key={fabric.id} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedFabrics.includes(fabric.id)}
                      onChange={() => toggleFabric(fabric.id)}
                      className="filter-checkbox-input"
                    />
                    <span className="checkbox-custom">
                      {selectedFabrics.includes(fabric.id) && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="filter-label-text">{fabric.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Occasion */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Occasion</h3>
              <div className="filter-options-list">
                {OCCASION_OPTIONS.map((occ) => (
                  <label key={occ.id} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedOccasions.includes(occ.id)}
                      onChange={() => toggleOccasion(occ.id)}
                      className="filter-checkbox-input"
                    />
                    <span className="checkbox-custom">
                      {selectedOccasions.includes(occ.id) && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="filter-label-text">{occ.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Lead Time & Availability */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Lead Time</h3>
              <div className="filter-options-list">
                {LEAD_TIME_OPTIONS.map((lt) => (
                  <label key={lt.id} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={selectedLeadTimes.includes(lt.id)}
                      onChange={() => toggleLeadTime(lt.id)}
                      className="filter-checkbox-input"
                    />
                    <span className="checkbox-custom">
                      {selectedLeadTimes.includes(lt.id) && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="filter-label-text">{lt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filter Group: Price Tier */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Price Range</h3>
              <div className="filter-options-list">
                {PRICE_OPTIONS.map((p) => (
                  <label key={p.id} className="filter-radio-label">
                    <input
                      type="radio"
                      name="price-tier"
                      checked={priceRange === p.id}
                      onChange={() => setPriceRange(p.id)}
                      className="filter-radio-input"
                    />
                    <span className="radio-custom">
                      {priceRange === p.id && <span className="radio-dot" />}
                    </span>
                    <span className="filter-label-text">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Mobile Apply Button */}
            <div className="mobile-drawer-footer">
              <button
                className="btn-apply-mobile-filters"
                onClick={() => setMobileFilterOpen(false)}
              >
                Apply Filters ({filteredProducts.length} Results)
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile drawer */}
        {mobileFilterOpen && (
          <div 
            className="mobile-drawer-backdrop"
            onClick={() => setMobileFilterOpen(false)}
          />
        )}

        {/* ─── Product Grid Area ─── */}
        <main className="mens-grid-content">
          {loading ? (
            /* Loading Skeleton Grid */
            <div className="mens-products-grid">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="product-card-skeleton">
                  <div className="skeleton-image" />
                  <div className="skeleton-details">
                    <div className="skeleton-line short" />
                    <div className="skeleton-line long" />
                    <div className="skeleton-line medium" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="mens-empty-state">
              <Package size={48} color="#00322D" />
              <h3>Error Loading Collection</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn-empty-reset">
                Try Again
              </button>
            </div>
          ) : displayedProducts.length === 0 ? (
            /* Empty State */
            <div className="mens-empty-state">
              <div className="empty-icon-circle">
                <Layers size={36} color="#00322D" />
              </div>
              <h3>No Styles Found Matching Your Criteria</h3>
              <p>Try adjusting your fabric, occasion, or price filters to discover more handcrafted pieces.</p>
              <button onClick={clearAllFilters} className="btn-empty-reset">
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Connected Live Product Grid */
            <>
              <div className="mens-products-grid">
                {displayedProducts.map((product, idx) => {
                  const priceNaira = product.base_price_naira || (product.base_price_kobo ? product.base_price_kobo / 100 : 0);
                  const isVerified = Boolean(product.vendor?.is_verified);
                  const storeName = product.vendor?.store_name || 'Lagos Tailoring Co.';
                  const prepDays = product.preparation_time_days || 3;
                  const imageUrl = getMensProductImage(product, idx);

                  return (
                    <article key={product.id} className="mens-product-card group">
                      <Link 
                        to={`/products/${product.slug || product.id}`} 
                        className="product-card-link"
                        title={product.title}
                      >
                        {/* Image Container with Aspect Ratio [3/4] */}
                        <div className="product-image-box">
                          <img
                            src={imageUrl}
                            alt={product.title}
                            loading="lazy"
                            className="product-main-img"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const fallbackImgs = ['/traditional-men-1.png', '/traditional-men-2.png', '/traditional-men-3.png', '/traditional-men-4.png'];
                              const fallback = fallbackImgs[idx % fallbackImgs.length];
                              if (!target.src.endsWith(fallback)) {
                                target.src = fallback;
                              }
                            }}
                          />

                          {/* Top Badges */}
                          <div className="product-badges-overlay">
                            {isVerified && (
                              <div className="badge-verified-designer">
                                <ShieldCheck size={13} strokeWidth={2.5} />
                                <span>Verified Designer</span>
                              </div>
                            )}

                            {prepDays <= 2 && (
                              <div className="badge-lead-time">
                                <span>Ready to Ship</span>
                              </div>
                            )}

                            {prepDays > 2 && prepDays <= 14 && (
                              <div className="badge-lead-time neutral">
                                <span>Made to Measure</span>
                              </div>
                            )}
                          </div>

                          {/* Quick View Hover Action */}
                          <div className="product-hover-action">
                            <span className="btn-hover-view">
                              <Eye size={14} />
                              <span>View Craft Details</span>
                            </span>
                          </div>
                        </div>

                        {/* Card Body Information */}
                        <div className="product-info-box">
                          <p className="product-vendor-name">
                            {storeName}
                          </p>
                          <h3 className="product-title-text">
                            {product.title}
                          </h3>
                          <div className="product-price-row">
                            <span className="product-price-naira">
                              ₦{priceNaira.toLocaleString()}
                            </span>
                            {product.average_rating ? (
                              <span className="product-rating-snippet">
                                ★ {parseFloat(String(product.average_rating)).toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {/* Load More Button */}
              {visibleCount < filteredProducts.length && (
                <div className="load-more-section">
                  <button
                    className="btn-load-more-styles"
                    onClick={() => setVisibleCount((prev) => prev + 6)}
                  >
                    <span>Load More Styles ({filteredProducts.length - visibleCount} remaining)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default MensCollectionPage;
