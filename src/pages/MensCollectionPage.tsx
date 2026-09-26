import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productApi } from '../api/client';
import type { Product } from '../types';
import { CollectionProductCard } from '../components/collection/CollectionProductCard';
import { CollectionSkeletonGrid } from '../components/collection/CollectionSkeletonGrid';
import { 
  X, 
  SlidersHorizontal,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import './MensCollectionPage.css';

// Canonical Categories under Men's Collection
interface CategoryOption {
  id: string;
  label: string;
  slug: string; // Empty string means all Men's pieces
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'all', label: 'All', slug: '' },
  { id: 'senator', label: 'Senator', slug: 'senator-suits' },
  { id: 'agbada', label: 'Agbada', slug: 'agbada' },
  { id: 'two-piece', label: 'Kaftans & Two-Piece', slug: 'two-piece-sets' },
  { id: 'shirts', label: 'Shirts', slug: 'shirts' },
];

// Price filter tiers (Converted to Kobo for backend contract: N1 = 100 Kobo)
interface PriceTierOption {
  id: string;
  label: string;
  minKobo?: number;
  maxKobo?: number;
}

const PRICE_OPTIONS: PriceTierOption[] = [
  { id: 'all', label: 'All Prices' },
  { id: 'under-50k', label: 'Under ₦50,000', maxKobo: 5000000 },
  { id: '50k-100k', label: '₦50,000 – ₦100,000', minKobo: 5000000, maxKobo: 10000000 },
  { id: '100k-200k', label: '₦100,000 – ₦200,000', minKobo: 10000000, maxKobo: 20000000 },
  { id: 'above-200k', label: 'Above ₦200,000', minKobo: 20000000 },
];

// Lead time / Preparation SLA filter options
interface LeadTimeOption {
  id: string;
  label: string;
  minDays?: number;
  maxDays?: number;
}

const LEAD_TIME_OPTIONS: LeadTimeOption[] = [
  { id: 'all', label: 'All Lead Times' },
  { id: 'ready-to-ship', label: 'Ready to Ship (≤ 3 Days)', maxDays: 3 },
  { id: 'made-to-measure', label: 'Made to Measure (4–7 Days)', minDays: 4, maxDays: 7 },
  { id: 'bespoke', label: 'Bespoke Custom (> 7 Days)', minDays: 8 },
];

// Supported Backend Sorting
const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest Arrivals' },
  { id: 'price_asc', label: 'Price: Low to High' },
  { id: 'price_desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Highest Rated' },
];

export const MensCollectionPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialCategory = searchParams.get('category') || '';
  const initialSort = searchParams.get('sort') || 'newest';
  const initialMinPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined;
  const initialMaxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined;
  const initialMinLead = searchParams.get('min_lead_time') ? Number(searchParams.get('min_lead_time')) : undefined;
  const initialMaxLead = searchParams.get('max_lead_time') ? Number(searchParams.get('max_lead_time')) : undefined;
  const initialVendor = searchParams.get('vendor') || '';
  const initialSearch = searchParams.get('q') || '';

  // Active Filter State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSort, setSelectedSort] = useState<string>(initialSort);
  const [selectedPriceTier, setSelectedPriceTier] = useState<string>(() => {
    if (initialMinPrice === 5000000 && initialMaxPrice === 10000000) return '50k-100k';
    if (initialMinPrice === 10000000 && initialMaxPrice === 20000000) return '100k-200k';
    if (initialMinPrice === 20000000) return 'above-200k';
    if (initialMaxPrice === 5000000) return 'under-50k';
    return 'all';
  });
  const [selectedLeadTime, setSelectedLeadTime] = useState<string>(() => {
    if (initialMaxLead === 3) return 'ready-to-ship';
    if (initialMinLead === 4 && initialMaxLead === 7) return 'made-to-measure';
    if (initialMinLead === 8) return 'bespoke';
    return 'all';
  });
  const [selectedVendor, setSelectedVendor] = useState<string>(initialVendor);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Data & Request State
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<boolean>(false);

  // Sync state into URL query params
  const updateUrlParams = useCallback((paramsUpdate: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(paramsUpdate).forEach(([key, val]) => {
        if (val === null || val === '') {
          next.delete(key);
        } else {
          next.set(key, val);
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // Fetch from Real Backend API
  const loadCollection = useCallback(async () => {
    setLoading(true);
    setApiError(false);

    try {
      // Resolve price params
      const activePriceObj = PRICE_OPTIONS.find(p => p.id === selectedPriceTier);
      const minKobo = activePriceObj?.minKobo;
      const maxKobo = activePriceObj?.maxKobo;

      // Resolve lead time params
      const activeLeadObj = LEAD_TIME_OPTIONS.find(l => l.id === selectedLeadTime);
      const minLeadDays = activeLeadObj?.minDays;
      const maxLeadDays = activeLeadObj?.maxDays;

      const apiParams: any = {
        collection: 'men',
        sort: selectedSort,
      };

      if (selectedCategory) {
        apiParams.category = selectedCategory;
      }
      if (selectedVendor) {
        apiParams.vendor = selectedVendor;
      }
      if (initialSearch) {
        apiParams.search = initialSearch;
      }
      if (minKobo !== undefined) {
        apiParams.min_price = minKobo;
      }
      if (maxKobo !== undefined) {
        apiParams.max_price = maxKobo;
      }
      if (minLeadDays !== undefined) {
        apiParams.min_lead_time = minLeadDays;
      }
      if (maxLeadDays !== undefined) {
        apiParams.max_lead_time = maxLeadDays;
      }

      const results = await productApi.getPublicProducts(apiParams);
      setProducts(results || []);
    } catch (err) {
      console.error('API Error loading Men collection:', err);
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedSort, selectedPriceTier, selectedLeadTime, selectedVendor, initialSearch]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Handlers for User Interactions
  const handleCategorySelect = (categorySlug: string) => {
    setSelectedCategory(categorySlug);
    updateUrlParams({ category: categorySlug || null });
  };

  const handleSortChange = (newSort: string) => {
    setSelectedSort(newSort);
    updateUrlParams({ sort: newSort !== 'newest' ? newSort : null });
  };

  const handlePriceSelect = (tierId: string) => {
    setSelectedPriceTier(tierId);
    const tier = PRICE_OPTIONS.find(p => p.id === tierId);
    updateUrlParams({
      min_price: tier?.minKobo ? String(tier.minKobo) : null,
      max_price: tier?.maxKobo ? String(tier.maxKobo) : null,
    });
  };

  const handleLeadTimeSelect = (leadId: string) => {
    setSelectedLeadTime(leadId);
    const lead = LEAD_TIME_OPTIONS.find(l => l.id === leadId);
    updateUrlParams({
      min_lead_time: lead?.minDays ? String(lead.minDays) : null,
      max_lead_time: lead?.maxDays ? String(lead.maxDays) : null,
    });
  };

  const clearAllFilters = () => {
    setSelectedCategory('');
    setSelectedPriceTier('all');
    setSelectedLeadTime('all');
    setSelectedVendor('');
    setSelectedSort('newest');
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  // Has active non-default filters
  const hasActiveFilters = Boolean(
    selectedCategory || 
    selectedPriceTier !== 'all' || 
    selectedLeadTime !== 'all' || 
    selectedVendor ||
    selectedSort !== 'newest'
  );

  // Dynamic Product Count Copy
  const productCountText = useMemo(() => {
    if (loading) return 'Loading pieces...';
    if (products.length === 0) return '0 pieces';

    const allVerified = products.every((p) => p.vendor?.is_verified === true);
    if (allVerified) {
      return `Showing ${products.length} pieces from verified designers`;
    }
    return `Showing ${products.length} pieces`;
  }, [products, loading]);

  // Extract unique active designers from loaded catalog to offer dynamic designer filter
  const availableDesigners = useMemo(() => {
    const map = new Map<string, { name: string; slug: string }>();
    products.forEach((p) => {
      if (p.vendor?.slug && p.vendor?.store_name) {
        map.set(p.vendor.slug, { name: p.vendor.store_name, slug: p.vendor.slug });
      }
    });
    return Array.from(map.values());
  }, [products]);

  return (
    <div className="mens-collection-page">
      <div className="mens-container">
        {/* Minimal Breadcrumb */}
        <nav className="mens-breadcrumb-bar" aria-label="Breadcrumb">
          <ol className="mens-breadcrumbs">
            <li>
              <Link to="/" className="breadcrumb-item">Marketplace</Link>
            </li>
            <li className="breadcrumb-separator" aria-hidden="true">→</li>
            <li className="breadcrumb-item active" aria-current="page">Men's Collection</li>
          </ol>
        </nav>

        {/* Hero Section — Clean & Editorial, Zero Fake Claims */}
        <header className="mens-hero-section">
          <div className="mens-hero-content">
            <span className="mens-hero-overline">THE CURATED MEN'S EDIT</span>
            <h1 className="mens-hero-heading">The Modern Nigerian Gentleman</h1>
            <p className="mens-hero-description">
              Explore Senator suits, agbada, kaftans, tailored shirts, and contemporary menswear from independent Nigerian designers.
            </p>
          </div>
        </header>

        {/* Canonical Category Navigation */}
        <nav className="mens-category-nav" aria-label="Men's Garment Categories">
          <div className="category-tabs-scroll">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategory === cat.slug ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.slug)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Utility Bar: Dynamic Count, Filter Drawer Trigger, and Sort By */}
        <div className="collection-utility-bar">
          <div className="utility-left">
            <button
              type="button"
              className="btn-filter-toggle"
              onClick={() => setMobileFilterOpen(true)}
              aria-label="Open Filter Controls"
            >
              <SlidersHorizontal size={16} />
              <span>Filters</span>
              {hasActiveFilters && <span className="active-dot" />}
            </button>

            <span className="collection-count-label" role="status" aria-live="polite">
              {productCountText}
            </span>
          </div>

          <div className="utility-right">
            <label htmlFor="collection-sort-select" className="sort-label">Sort By:</label>
            <select
              id="collection-sort-select"
              className="sort-dropdown"
              value={selectedSort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Content Layout: Sidebar Filters (Desktop) + Products Grid */}
        <div className="collection-layout">
          {/* Desktop Filter Sidebar */}
          <aside className="collection-sidebar-desktop" aria-label="Filters">
            <div className="sidebar-header">
              <span className="sidebar-title">Filters</span>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn-clear-inline"
                  onClick={clearAllFilters}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <h4 className="filter-group-heading">Price Range</h4>
              <div className="filter-options-list">
                {PRICE_OPTIONS.map((tier) => (
                  <label key={tier.id} className="filter-radio-item">
                    <input
                      type="radio"
                      name="price-filter"
                      checked={selectedPriceTier === tier.id}
                      onChange={() => handlePriceSelect(tier.id)}
                    />
                    <span>{tier.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Lead Time Filter */}
            <div className="filter-group">
              <h4 className="filter-group-heading">Lead Time</h4>
              <div className="filter-options-list">
                {LEAD_TIME_OPTIONS.map((lead) => (
                  <label key={lead.id} className="filter-radio-item">
                    <input
                      type="radio"
                      name="lead-filter"
                      checked={selectedLeadTime === lead.id}
                      onChange={() => handleLeadTimeSelect(lead.id)}
                    />
                    <span>{lead.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Designer / Store Filter (Only displayed if designers exist in active catalog) */}
            {availableDesigners.length > 0 && (
              <div className="filter-group">
                <h4 className="filter-group-heading">Designer</h4>
                <div className="filter-options-list">
                  <label className="filter-radio-item">
                    <input
                      type="radio"
                      name="designer-filter"
                      checked={selectedVendor === ''}
                      onChange={() => {
                        setSelectedVendor('');
                        updateUrlParams({ vendor: null });
                      }}
                    />
                    <span>All Designers</span>
                  </label>
                  {availableDesigners.map((d) => (
                    <label key={d.slug} className="filter-radio-item">
                      <input
                        type="radio"
                        name="designer-filter"
                        checked={selectedVendor === d.slug}
                        onChange={() => {
                          setSelectedVendor(d.slug);
                          updateUrlParams({ vendor: d.slug });
                        }}
                      />
                      <span>{d.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Catalog Grid Area */}
          <main className="collection-main-area">
            {/* Scenario 1: Loading State */}
            {loading && <CollectionSkeletonGrid count={6} />}

            {/* Scenario 2: API Error State */}
            {!loading && apiError && (
              <div className="collection-state-card error-state" role="alert">
                <AlertCircle size={44} className="state-icon error-icon" />
                <h2 className="state-heading">We couldn't load the men's collection.</h2>
                <p className="state-description">Please try again.</p>
                <button
                  type="button"
                  className="btn-state-action"
                  onClick={loadCollection}
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Scenario 3: Empty State (API Success, 0 Results) */}
            {!loading && !apiError && products.length === 0 && (
              <div className="collection-state-card empty-state">
                <h2 className="state-heading">No pieces found</h2>
                <p className="state-description">
                  Try adjusting your filters or explore the full men's collection.
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="btn-state-action"
                    onClick={clearAllFilters}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {/* Scenario 4: Real Products Grid */}
            {!loading && !apiError && products.length > 0 && (
              <div className="collection-grid">
                {products.map((product) => (
                  <CollectionProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Drawer / Slide-Out */}
      {mobileFilterOpen && (
        <div className="mobile-filter-backdrop" onClick={() => setMobileFilterOpen(false)}>
          <div className="mobile-filter-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Filter Men's Collection</h3>
              <button
                type="button"
                className="btn-drawer-close"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              {/* Category */}
              <div className="drawer-section">
                <h4>Category</h4>
                <div className="drawer-options-wrap">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`drawer-chip ${selectedCategory === cat.slug ? 'active' : ''}`}
                      onClick={() => handleCategorySelect(cat.slug)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="drawer-section">
                <h4>Price Range</h4>
                <div className="filter-options-list">
                  {PRICE_OPTIONS.map((tier) => (
                    <label key={tier.id} className="filter-radio-item">
                      <input
                        type="radio"
                        name="mobile-price"
                        checked={selectedPriceTier === tier.id}
                        onChange={() => handlePriceSelect(tier.id)}
                      />
                      <span>{tier.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Lead Time */}
              <div className="drawer-section">
                <h4>Lead Time</h4>
                <div className="filter-options-list">
                  {LEAD_TIME_OPTIONS.map((lead) => (
                    <label key={lead.id} className="filter-radio-item">
                      <input
                        type="radio"
                        name="mobile-lead"
                        checked={selectedLeadTime === lead.id}
                        onChange={() => handleLeadTimeSelect(lead.id)}
                      />
                      <span>{lead.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="drawer-footer">
              <button
                type="button"
                className="btn-drawer-reset"
                onClick={clearAllFilters}
              >
                Reset
              </button>
              <button
                type="button"
                className="btn-drawer-apply"
                onClick={() => setMobileFilterOpen(false)}
              >
                Show Results
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MensCollectionPage;
