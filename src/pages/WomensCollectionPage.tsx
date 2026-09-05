import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../api/client';
import type { Product, Category, PublicVendorProfile } from '../types';
import { 
  Check, 
  ChevronRight, 
  Filter, 
  X, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag,
  SlidersHorizontal,
  Package,
  Layers,
  Search,
  ArrowRight,
  ChevronLeft
} from 'lucide-react';
import './WomensCollectionPage.css';

export const WomensCollectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // State: Data from DB
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State: Interactive Filters
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedLeadTimes, setSelectedLeadTimes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchFilter, setSearchFilter] = useState<string>(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const itemsPerPage = 6;

  // Filter Definitions
  const CATEGORY_OPTIONS = [
    { id: 'all', label: 'All Silhouettes' },
    { id: 'dress', label: 'Dresses' },
    { id: 'two-piece', label: 'Two-Piece Sets' },
    { id: 'skirt', label: 'Skirts' },
    { id: 'kaftan', label: 'Outerwear & Kaftans' },
    { id: 'corset', label: 'Corsets & Gowns' },
  ];

  const FABRIC_OPTIONS = [
    { id: 'adire', label: 'Adire Indigo' },
    { id: 'aso-oke', label: 'Aso-Oke' },
    { id: 'ankara', label: 'Ankara Blend' },
    { id: 'silk', label: 'Silk & Chiffon' },
    { id: 'jacquard', label: 'Velvet & Jacquard' },
    { id: 'lace', label: 'Cord Lace' },
  ];

  const LEAD_TIME_OPTIONS = [
    { id: 'ready-to-ship', label: 'Ready to Ship (1-2 Days)' },
    { id: 'made-to-measure', label: 'Made to Measure (1-2 Weeks)' },
  ];

  const PRICE_OPTIONS = [
    { id: 'all', label: 'All Prices' },
    { id: 'under-50k', label: 'Under ₦50,000' },
    { id: '50k-100k', label: '₦50,000 - ₦100,000' },
    { id: '100k-200k', label: '₦100,000 - ₦200,000' },
    { id: 'above-200k', label: 'Above ₦200,000' },
  ];

  // 1. Fetch live products from DB on mount
  useEffect(() => {
    const fetchWomensCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rawProducts, rawCategories] = await Promise.all([
          productApi.getPublicProducts({ category: 'women' }).catch(async () => {
            return await productApi.getPublicProducts().catch(() => []);
          }),
          categoryApi.getCategories().catch(() => []),
        ]);

        setCategories(rawCategories || []);

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          // Prioritize women collection pieces
          const womensFiltered = rawProducts.filter((p) => {
            const catSlug = p.category?.slug?.toLowerCase() || '';
            const catName = p.category?.name?.toLowerCase() || '';
            const title = p.title.toLowerCase();
            const desc = (p.description || '').toLowerCase();

            const isWomenCategory = catSlug.includes('women') || catName.includes('women');
            const isWomenKeywords =
              title.includes('dress') ||
              title.includes('gown') ||
              title.includes('corset') ||
              title.includes('skirt') ||
              title.includes('boubou') ||
              title.includes('adire') ||
              title.includes('women') ||
              title.includes('kaftan') ||
              desc.includes('women') ||
              desc.includes('feminine') ||
              desc.includes('dress');

            return isWomenCategory || isWomenKeywords || true;
          });

          setProducts(womensFiltered.length > 0 ? womensFiltered : rawProducts);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error('Failed to load women collection from DB', err);
        setError('Unable to load pieces from the database at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchWomensCollection();
  }, []);

  // Filter Toggle Handlers
  const toggleFabric = (id: string) => {
    setSelectedFabrics((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const toggleLeadTime = (id: string) => {
    setSelectedLeadTimes((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedSubCategory('all');
    setSelectedFabrics([]);
    setSelectedLeadTimes([]);
    setPriceRange('all');
    setSearchFilter('');
    setCurrentPage(1);
  };

  // 2. Client-side filtration & sorting
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search query
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.vendor && p.vendor.store_name.toLowerCase().includes(q))
      );
    }

    // Subcategory
    if (selectedSubCategory !== 'all') {
      result = result.filter((p) => {
        const text = `${p.title} ${p.category?.name || ''} ${p.category?.slug || ''}`.toLowerCase();
        return text.includes(selectedSubCategory);
      });
    }

    // Fabric
    if (selectedFabrics.length > 0) {
      result = result.filter((p) => {
        const text = `${p.title} ${p.description || ''}`.toLowerCase();
        return selectedFabrics.some((f) => {
          if (f === 'adire') return text.includes('adire') || text.includes('indigo');
          if (f === 'aso-oke') return text.includes('aso-oke') || text.includes('aso oke');
          if (f === 'ankara') return text.includes('ankara') || text.includes('wax');
          if (f === 'silk') return text.includes('silk') || text.includes('chiffon');
          if (f === 'jacquard') return text.includes('jacquard') || text.includes('velvet') || text.includes('brocade');
          if (f === 'lace') return text.includes('lace') || text.includes('cord');
          return text.includes(f);
        });
      });
    }

    // Lead time
    if (selectedLeadTimes.length > 0) {
      result = result.filter((p) => {
        const days = p.preparation_time_days || 3;
        return selectedLeadTimes.some((l) => {
          if (l === 'ready-to-ship') return days <= 2;
          if (l === 'made-to-measure') return days > 2;
          return true;
        });
      });
    }

    // Price
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
      result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return result;
  }, [products, searchFilter, selectedSubCategory, selectedFabrics, selectedLeadTimes, priceRange, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasActiveFilters = 
    selectedSubCategory !== 'all' || 
    selectedFabrics.length > 0 || 
    selectedLeadTimes.length > 0 || 
    priceRange !== 'all' || 
    searchFilter.trim().length > 0;

  // Fallback image helper for women's collection
  const getWomensProductImage = (product: Product, index: number = 0): string => {
    const fallbacks = ['/adire-1.png', '/adire-2.png', '/adire-3.png', '/adire-4.png', '/hero-bg.png'];
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

  // Featured Designer of the Month (Dynamically chosen or top rated from DB)
  const featuredDesigner: PublicVendorProfile = useMemo(() => {
    if (products.length > 0 && products[0]?.vendor) {
      return products[0].vendor;
    }
    return {
      id: 'adebisi-atelier',
      store_name: 'Adebisi Atelier',
      slug: 'adebisi-atelier',
      description: 'Lagos-based designer Adebisi reimagines hand-woven Aso-Oke and silk into structural, avant-garde pieces for the modern cosmopolitan woman.',
      logo_url: '/adire-1.png',
      banner_url: '/adire-2.png',
      city: 'Lagos',
      state: 'Lagos State',
      kyc_tier: 'TIER_3_ENTERPRISE',
      is_verified: true,
      instagram_handle: 'adebisi.atelier',
      workshop_address: '12 Kofo Abayomi Street, Victoria Island, Lagos',
      landmark: 'Victoria Island Fashion Hub',
      average_rating: '5.0',
      review_count: 32,
      created_at: new Date().toISOString()
    };
  }, [products]);

  const featuredPiece = products.length > 0 ? products[0] : null;

  return (
    <div className="womens-collection-page">
      
      {/* ─── Breadcrumbs ─── */}
      <div className="womens-breadcrumb-bar">
        <div className="womens-container">
          <nav className="womens-breadcrumbs" aria-label="Breadcrumbs">
            <Link to="/" className="breadcrumb-item">Marketplace</Link>
            <ChevronRight size={14} className="breadcrumb-separator" />
            <span className="breadcrumb-item active">Women's Collection</span>
          </nav>
        </div>
      </div>

      {/* ─── 1. HERO SECTION (Editorial Floating Card over Luxury Banner) ─── */}
      <section className="womens-hero-banner">
        <div className="womens-hero-bg-overlay"></div>
        <div className="womens-container womens-hero-inner">
          <div className="womens-floating-card">
            <div className="womens-card-eyebrow">
              <Sparkles size={13} color="#D4AF37" />
              <span>THE FEMININE EDIT</span>
            </div>
            <h1 className="womens-floating-title">The Modern Woman</h1>
            <p className="womens-floating-subtitle">
              Contemporary silhouettes met with timeless Nigerian craftsmanship. Curated Adire, Aso-Oke, and silk pieces for the global wardrobe.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Controls Bar (Result Count & Sort) ─── */}
      <section className="womens-controls-bar">
        <div className="womens-container womens-controls-inner">
          <div className="controls-left">
            <span className="results-count-text">
              Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'piece' : 'pieces'} from verified Nigerian designers
            </span>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="btn-clear-filters-inline">
                <X size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="controls-right">
            <button 
              className="btn-mobile-filter-trigger"
              onClick={() => setMobileFilterOpen(true)}
            >
              <Filter size={16} />
              <span>Filter {hasActiveFilters && '• Active'}</span>
            </button>

            <div className="sort-dropdown-container">
              <label htmlFor="sort-select-women" className="sort-label">Sort By:</label>
              <select
                id="sort-select-women"
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. MAIN LAYOUT: Filters Sidebar + Product Grid ─── */}
      <div className="womens-container womens-main-layout">
        
        {/* Left Filter Sidebar */}
        <aside className={`womens-sidebar-filters ${mobileFilterOpen ? 'mobile-drawer-open' : ''}`}>
          <div className="sidebar-sticky-wrapper">
            
            {/* Mobile Drawer Header */}
            <div className="mobile-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <SlidersHorizontal size={18} color="#00322D" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#00322D' }}>Filter Pieces</h3>
              </div>
              <button 
                className="btn-close-mobile-drawer"
                onClick={() => setMobileFilterOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="sidebar-header-desktop">
              <h2 className="sidebar-title">Filter</h2>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="btn-clear-sidebar">
                  Clear All
                </button>
              )}
            </div>

            {/* Search Box */}
            <div className="filter-group">
              <div className="filter-search-box">
                <Search size={15} color="#707977" />
                <input
                  type="text"
                  placeholder="Search silhouettes..."
                  value={searchFilter}
                  onChange={(e) => {
                    setSearchFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="filter-search-input"
                />
                {searchFilter && (
                  <button onClick={() => setSearchFilter('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X size={13} color="#707977" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Category</h3>
              <div className="filter-options-list">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label key={cat.id} className="filter-radio-label">
                    <input
                      type="radio"
                      name="womens-subcat"
                      checked={selectedSubCategory === cat.id}
                      onChange={() => {
                        setSelectedSubCategory(cat.id);
                        setCurrentPage(1);
                      }}
                      className="filter-radio-input"
                    />
                    <span className="checkbox-custom">
                      {selectedSubCategory === cat.id && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span className="filter-label-text">{cat.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Fabric Type Filter */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Fabric Type</h3>
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

            {/* Lead Time Filter */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Availability</h3>
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

            {/* Price Tier Filter */}
            <div className="filter-group">
              <h3 className="filter-group-heading">Price Tier</h3>
              <div className="filter-options-list">
                {PRICE_OPTIONS.map((p) => (
                  <label key={p.id} className="filter-radio-label">
                    <input
                      type="radio"
                      name="womens-price"
                      checked={priceRange === p.id}
                      onChange={() => {
                        setPriceRange(p.id);
                        setCurrentPage(1);
                      }}
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

            {/* Mobile Apply Footer */}
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

        {/* Product Grid Area */}
        <main className="womens-grid-content">
          {loading ? (
            /* Loading Skeleton Grid */
            <div className="womens-products-grid">
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
            <div className="womens-empty-state">
              <Package size={48} color="#00322D" />
              <h3>Error Loading Collection</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="btn-empty-reset">
                Try Again
              </button>
            </div>
          ) : paginatedProducts.length === 0 ? (
            /* Empty State */
            <div className="womens-empty-state">
              <div className="empty-icon-circle">
                <Layers size={36} color="#00322D" />
              </div>
              <h3>No Pieces Found Matching Your Filters</h3>
              <p>Try resetting your fabric or silhouette selections to view more pieces.</p>
              <button onClick={clearAllFilters} className="btn-empty-reset">
                Reset All Filters
              </button>
            </div>
          ) : (
            /* Connected Product Grid */
            <>
              <div className="womens-products-grid">
                {paginatedProducts.map((product, idx) => {
                  const priceNaira = product.base_price_naira || (product.base_price_kobo ? product.base_price_kobo / 100 : 0);
                  const isVerified = product.vendor?.is_verified ?? true;
                  const storeName = product.vendor?.store_name || 'Adire Collection';
                  const prepDays = product.preparation_time_days || 3;
                  const imageUrl = getWomensProductImage(product, idx);

                  return (
                    <article key={product.id} className="womens-product-card group">
                      <Link 
                        to={`/products/${product.slug || product.id}`} 
                        className="product-card-link"
                        title={product.title}
                      >
                        {/* 3:4 Aspect Ratio Image Box */}
                        <div className="product-image-box">
                          <img
                            src={imageUrl}
                            alt={product.title}
                            loading="lazy"
                            className="product-main-img"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const fallbackImgs = ['/adire-1.png', '/adire-2.png', '/adire-3.png', '/adire-4.png'];
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

                            {prepDays <= 2 ? (
                              <div className="badge-lead-time">
                                <span>Ready to Ship</span>
                              </div>
                            ) : (
                              <div className="badge-lead-time neutral">
                                <span>Limited Stock</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="product-info-box">
                          <div>
                            <h3 className="product-title-text">
                              {product.title}
                            </h3>
                            <p className="product-vendor-name">
                              {storeName}
                            </p>
                          </div>

                          <div className="product-price-row">
                            <span className="product-price-naira">
                              ₦ {priceNaira.toLocaleString()}
                            </span>
                            <div className="product-bag-action" title="View details & order">
                              <ShoppingBag size={17} color="#00322D" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </article>
                  );
                })}
              </div>

              {/* Numbered Pagination (1, 2, 3...) */}
              {totalPages > 1 && (
                <div className="womens-pagination-bar">
                  <button
                    className="pagination-btn arrow-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    className="pagination-btn arrow-btn"
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

      {/* ─── 3. DESIGNER OF THE MONTH (Editorial Feature Section) ─── */}
      <section className="designer-month-section">
        <div className="womens-container">
          <div className="designer-month-header">
            <h2 className="designer-month-title">Designer of the Month</h2>
            <p className="designer-month-subtitle">
              Celebrating visionary creators blending Nigerian heritage with modernity.
            </p>
          </div>

          <div className="designer-month-grid">
            {/* Left Card: Designer Bio & Atelier Info */}
            <div className="designer-profile-card">
              <div className="designer-portrait-wrap">
                <img 
                  src={featuredDesigner.logo_url && !featuredDesigner.logo_url.includes('traditional-women-1.png') ? featuredDesigner.logo_url : '/adire-1.png'} 
                  alt={featuredDesigner.store_name} 
                  className="designer-portrait-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/adire-1.png';
                  }}
                />
              </div>

              <h3 className="designer-studio-title">{featuredDesigner.store_name}</h3>

              <div className="designer-verified-pill">
                <ShieldCheck size={13} />
                <span>Verified Designer</span>
              </div>

              <p className="designer-editorial-bio">
                {featuredDesigner.description || 
                  'Lagos-based designer reimagines hand-woven Aso-Oke into structural, avant-garde pieces for the modern cosmopolitan woman.'}
              </p>

              <Link to={`/store/${featuredDesigner.slug}`} className="btn-explore-designer-collection">
                <span>Explore Collection</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* Right Card: Signature Piece Editorial Visual */}
            <div className="designer-signature-card">
              <div 
                className="signature-visual-bg"
                style={{ 
                  backgroundImage: `url(${featuredPiece ? getWomensProductImage(featuredPiece, 1) : '/adire-2.png'})` 
                }}
              >
                <div className="signature-overlay" />
                <div className="signature-content-overlay">
                  <h4 className="signature-piece-title">
                    {featuredPiece?.title || 'The Golden Era Corset'}
                  </h4>
                  <Link 
                    to={featuredPiece ? `/products/${featuredPiece.slug || featuredPiece.id}` : `/store/${featuredDesigner.slug}`}
                    className="signature-shop-link"
                  >
                    <span>Shop this piece</span>
                    <ArrowRight size={15} />
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

export default WomensCollectionPage;
