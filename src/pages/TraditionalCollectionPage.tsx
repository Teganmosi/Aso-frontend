import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi, categoryApi } from '../api/client';
import type { Product, Category } from '../types';
import { 
  ShieldCheck, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  X, 
  Package, 
  SlidersHorizontal,
  Search,
  Check
} from 'lucide-react';
import './TraditionalCollectionPage.css';

export const TraditionalCollectionPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Data from DB
  const [products, setProducts] = useState<Product[]>([]);
  const [, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') || '');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState<boolean>(false);
  const itemsPerPage = 6;

  // Filter Options
  const CATEGORY_OPTIONS = [
    { id: 'agbada', label: 'Agbada' },
    { id: 'senator', label: 'Senator Sets' },
    { id: 'iro-buba', label: 'Iro & Buba' },
    { id: 'kaftan', label: 'Kaftans' },
    { id: 'aso-oke', label: 'Aso-Oke Heritage' },
    { id: 'boubou', label: 'Grand Boubou' },
  ];

  const LOCATION_OPTIONS = [
    { id: 'all', label: 'All Locations' },
    { id: 'lagos', label: 'Lagos' },
    { id: 'abuja', label: 'Abuja' },
    { id: 'port harcourt', label: 'Port Harcourt' },
    { id: 'ibadan', label: 'Ibadan' },
    { id: 'abeokuta', label: 'Abeokuta' },
  ];

  const SIZE_OPTIONS = ['S', 'M', 'L', 'XL', 'XXL'];

  // 1. Fetch live products from DB
  useEffect(() => {
    const fetchTraditionalCollection = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rawProducts, rawCategories] = await Promise.all([
          productApi.getPublicProducts({ category: 'traditional' }).catch(async () => {
            return await productApi.getPublicProducts().catch(() => []);
          }),
          categoryApi.getCategories().catch(() => []),
        ]);

        setCategories(rawCategories || []);

        if (Array.isArray(rawProducts) && rawProducts.length > 0) {
          // Identify traditional & native wear pieces
          const traditionalFiltered = rawProducts.filter((p) => {
            const catSlug = p.category?.slug?.toLowerCase() || '';
            const catName = p.category?.name?.toLowerCase() || '';
            const title = p.title.toLowerCase();
            const desc = (p.description || '').toLowerCase();

            const isTraditionalCat = catSlug.includes('traditional') || catName.includes('traditional');
            const isTraditionalKeywords =
              title.includes('agbada') ||
              title.includes('senator') ||
              title.includes('iro') ||
              title.includes('buba') ||
              title.includes('kaftan') ||
              title.includes('aso-oke') ||
              title.includes('aso oke') ||
              title.includes('boubou') ||
              title.includes('native') ||
              desc.includes('traditional') ||
              desc.includes('heritage') ||
              desc.includes('ceremony');

            return isTraditionalCat || isTraditionalKeywords || true;
          });

          setProducts(traditionalFiltered.length > 0 ? traditionalFiltered : rawProducts);
        } else {
          setProducts([]);
        }
      } catch (err: any) {
        console.error('Failed to load traditional collection from DB', err);
        setError('Unable to load pieces from the database at this time.');
      } finally {
        setLoading(false);
      }
    };

    fetchTraditionalCollection();
  }, []);

  // Filter Toggle Handlers
  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setMinPrice('');
    setMaxPrice('');
    setSelectedLocation('all');
    setSelectedSize('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Image URL Resolver & Fallbacks
  const getTraditionalProductImage = (product: Product, index: number = 0): string => {
    const fallbacks = [
      '/traditional-men-1.png',
      '/adire-1.png',
      '/traditional-men-3.png',
      '/traditional-men-2.png',
      '/adire-3.png',
      '/traditional-men-4.png',
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
        const text = `${p.title} ${p.description || ''} ${p.category?.name || ''} ${p.category?.slug || ''}`.toLowerCase();
        return selectedCategories.some((cat) => {
          if (cat === 'agbada') return text.includes('agbada');
          if (cat === 'senator') return text.includes('senator');
          if (cat === 'iro-buba') return text.includes('iro') || text.includes('buba') || text.includes('iro & buba');
          if (cat === 'kaftan') return text.includes('kaftan');
          if (cat === 'aso-oke') return text.includes('aso-oke') || text.includes('aso oke');
          if (cat === 'boubou') return text.includes('boubou') || text.includes('bubu');
          return text.includes(cat);
        });
      });
    }

    // Min Price
    if (minPrice.trim() !== '') {
      const minVal = parseFloat(minPrice);
      if (!isNaN(minVal)) {
        result = result.filter((p) => {
          const price = p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0);
          return price >= minVal;
        });
      }
    }

    // Max Price
    if (maxPrice.trim() !== '') {
      const maxVal = parseFloat(maxPrice);
      if (!isNaN(maxVal)) {
        result = result.filter((p) => {
          const price = p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0);
          return price <= maxVal;
        });
      }
    }

    // Location
    if (selectedLocation !== 'all') {
      result = result.filter((p) => {
        const city = p.vendor?.city?.toLowerCase() || '';
        const state = p.vendor?.state?.toLowerCase() || '';
        return city.includes(selectedLocation) || state.includes(selectedLocation);
      });
    }

    // Size
    if (selectedSize !== 'all') {
      result = result.filter((p) => {
        if (p.variants && p.variants.length > 0) {
          return p.variants.some((v) => v.size?.toUpperCase() === selectedSize.toUpperCase());
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
      // Recommended / Popular
      result.sort((a, b) => (b.review_count || 0) - (a.review_count || 0));
    }

    return result;
  }, [products, searchQuery, selectedCategories, minPrice, maxPrice, selectedLocation, selectedSize, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const hasActiveFilters = 
    selectedCategories.length > 0 ||
    minPrice.trim() !== '' ||
    maxPrice.trim() !== '' ||
    selectedLocation !== 'all' ||
    selectedSize !== 'all' ||
    searchQuery.trim().length > 0;

  return (
    <div className="traditional-page-wrapper">
      
      {/* ─── 1. HERO SECTION (Dotted Radial Background) ─── */}
      <section className="traditional-hero-section">
        <div className="traditional-container traditional-hero-inner">
          <div className="traditional-hero-eyebrow">
            <Sparkles size={14} color="#8b500a" />
            <span>AUTHENTIC HERITAGE</span>
          </div>
          <h1 className="traditional-hero-title">Traditional &amp; Native Wear</h1>
          <p className="traditional-hero-subtitle">
            Discover the rich tapestry of Nigerian craftsmanship. From meticulously tailored Agbadas to elegant Iro &amp; Buba sets, each piece embodies centuries of cultural heritage woven into contemporary luxury.
          </p>
        </div>
      </section>

      {/* ─── 2. MAIN LAYOUT: Sidebar Filters + Live Product Grid ─── */}
      <section className="traditional-container traditional-main-section">
        <div className="traditional-layout-grid">
          
          {/* Left Filters Sidebar */}
          <aside className={`traditional-filters-sidebar ${mobileFilterOpen ? 'mobile-drawer-open' : ''}`}>
            <div className="traditional-sidebar-sticky">
              
              {/* Mobile Drawer Header */}
              <div className="mobile-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={18} color="#00322d" />
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#00322d' }}>Filter Pieces</h3>
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
                    Clear All
                  </button>
                )}
              </div>

              {/* Keyword Search */}
              <div className="filter-block">
                <div className="filter-search-box">
                  <Search size={14} color="#707977" />
                  <input
                    type="text"
                    placeholder="Search attire, styles..."
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

              {/* Category Checkbox Filter */}
              <div className="filter-block">
                <h3 className="filter-label">Category</h3>
                <div className="filter-checkbox-list">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <label key={cat.id} className="traditional-checkbox-item">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.id)}
                        onChange={() => toggleCategory(cat.id)}
                        className="traditional-hidden-checkbox"
                      />
                      <span className="traditional-custom-box">
                        {selectedCategories.includes(cat.id) && <Check size={12} strokeWidth={3} />}
                      </span>
                      <span className="checkbox-text">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range Filter */}
              <div className="filter-block">
                <h3 className="filter-label">Price Range</h3>
                <div className="price-inputs-row">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="price-input"
                  />
                  <span className="price-separator">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="price-input"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div className="filter-block">
                <h3 className="filter-label">Location</h3>
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="location-select"
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Filter Pills */}
              <div className="filter-block">
                <h3 className="filter-label">Size</h3>
                <div className="size-pills-row">
                  <button
                    className={`size-pill ${selectedSize === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSize('all');
                      setCurrentPage(1);
                    }}
                  >
                    All
                  </button>
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

              {/* Mobile Drawer Footer */}
              <div className="mobile-drawer-footer">
                <button
                  className="btn-apply-filters-mobile"
                  onClick={() => setMobileFilterOpen(false)}
                >
                  Apply Filters ({filteredProducts.length} Pieces)
                </button>
              </div>

            </div>
          </aside>

          {/* Backdrop for mobile drawer */}
          {mobileFilterOpen && (
            <div 
              className="traditional-drawer-backdrop"
              onClick={() => setMobileFilterOpen(false)}
            />
          )}

          {/* Right Product Grid Area */}
          <main className="traditional-content-main">
            
            {/* Controls Bar */}
            <div className="traditional-controls-row">
              <div className="controls-left">
                <p className="results-count-text">
                  Showing <strong>{filteredProducts.length}</strong> authentic {filteredProducts.length === 1 ? 'piece' : 'pieces'}
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
                  <label htmlFor="traditional-sort-select" className="sort-label-text">Sort by:</label>
                  <select
                    id="traditional-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="traditional-sort-select"
                  >
                    <option value="recommended">Recommended</option>
                    <option value="newest">Newest Arrivals</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grid State Handling */}
            {loading ? (
              /* Loading Skeletons */
              <div className="traditional-products-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="traditional-card-skeleton">
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
              <div className="traditional-empty-box">
                <Package size={44} color="#00322d" />
                <h3>Error Loading Collection</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="btn-retry">
                  Try Again
                </button>
              </div>
            ) : paginatedProducts.length === 0 ? (
              /* Empty State */
              <div className="traditional-empty-box">
                <Package size={44} color="#00322d" />
                <h3>No Pieces Found Matching Your Filters</h3>
                <p>Try clearing some filters or changing your price range to discover more authentic attire.</p>
                <button onClick={clearAllFilters} className="btn-retry">
                  Reset All Filters
                </button>
              </div>
            ) : (
              /* Connected Product Cards */
              <>
                <div className="traditional-products-grid">
                  {paginatedProducts.map((product, idx) => {
                    const priceNaira = product.base_price_naira || (product.base_price_kobo ? product.base_price_kobo / 100 : 0);
                    const isVerified = Boolean(product.vendor?.is_verified);
                    const storeName = product.vendor?.store_name || 'House of Aso';
                    const prepDays = product.preparation_time_days || 3;
                    const imageUrl = getTraditionalProductImage(product, idx);

                    return (
                      <article key={product.id} className="traditional-product-card ambient-shadow">
                        <Link 
                          to={`/products/${product.slug || product.id}`}
                          className="product-link-wrap"
                          title={product.title}
                        >
                          {/* Image Box 3:4 Aspect Ratio */}
                          <div className="product-media-container">
                            <img
                              src={imageUrl}
                              alt={product.title}
                              loading="lazy"
                              className="product-img"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const fallbackImgs = [
                                  '/traditional-men-1.png',
                                  '/adire-1.png',
                                  '/traditional-men-3.png',
                                  '/traditional-men-2.png',
                                ];
                                const fallback = fallbackImgs[idx % fallbackImgs.length];
                                if (!target.src.endsWith(fallback)) {
                                  target.src = fallback;
                                }
                              }}
                            />

                            {/* Verification / Lead Time Badges */}
                            {isVerified ? (
                              <div className="badge-designer-verified">
                                <ShieldCheck size={13} strokeWidth={2.5} />
                                <span>Verified Designer</span>
                              </div>
                            ) : prepDays > 3 ? (
                              <div className="badge-lead-pill">
                                <span>Limited Stock</span>
                              </div>
                            ) : null}
                          </div>

                          {/* Details Box */}
                          <div className="product-details-container">
                            <p className="product-artisan-brand">{storeName}</p>
                            <h3 className="product-item-title">{product.title}</h3>
                            <p className="product-item-price">₦ {priceNaira.toLocaleString()}</p>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>

                {/* Numbered Pagination */}
                {totalPages > 1 && (
                  <div className="traditional-pagination-bar">
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

    </div>
  );
};

export default TraditionalCollectionPage;
