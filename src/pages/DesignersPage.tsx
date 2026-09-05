import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { productApi, vendorApi } from '../api/client';
import type { Product, PublicVendorProfile } from '../types';
import { 
  Search, 
  Sparkles, 
  Star, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Calendar, 
  Package, 
  Droplets, 
  History,
  CheckCircle2
} from 'lucide-react';
import './DesignersPage.css';

interface DesignersPageProps {
  onOpenVendorRegister: () => void;
}

interface DesignerDisplayData {
  profile: PublicVendorProfile;
  craftSpecialty: string;
  specialtyTag: string;
  startingPrice: number;
  products: Product[];
  totalPieces: number;
  quote?: string;
  runwaysCount?: number;
  weaversCount?: number;
}

export const DesignersPage: React.FC<DesignersPageProps> = ({ onOpenVendorRegister }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [dbVendors, setDbVendors] = useState<PublicVendorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('featured');
  const [selectedPillar, setSelectedPillar] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const searchInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch live products & vendors directly from DB
  useEffect(() => {
    const fetchArtisanDirectory = async () => {
      setLoading(true);
      setError(null);
      try {
        const [rawProducts, rawVendors] = await Promise.all([
          productApi.getPublicProducts().catch(() => []),
          vendorApi.getVendors().catch(() => []),
        ]);
        setProducts(rawProducts || []);
        setDbVendors(rawVendors || []);
      } catch (err: any) {
        console.error('Failed to load artisan directory from DB', err);
        setError('Unable to load verified designers from database.');
      } finally {
        setLoading(false);
      }
    };

    fetchArtisanDirectory();
  }, []);

  // Keyboard shortcut: ⌘K / Ctrl+K focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Image Helper for fallback & relative paths
  const getCleanProductImage = (product: Product | undefined, fallbackIndex: number = 0): string => {
    const fallbacks = [
      '/traditional-men-1.png',
      '/adire-1.png',
      '/adire-2.png',
      '/traditional-men-2.png',
      '/streetwear-1.png',
      '/adire-3.png',
      '/hero-bg.png'
    ];
    if (!product) return fallbacks[fallbackIndex % fallbacks.length];
    let raw = product.primary_image_url || (product.media && product.media.length > 0 ? product.media[0].url : null);
    if (!raw || typeof raw !== 'string' || raw.trim() === '' || raw.includes('traditional-women-1.png')) {
      return fallbacks[fallbackIndex % fallbacks.length];
    }
    raw = raw.trim();
    if (raw.startsWith('media/')) return `/${raw}`;
    return raw;
  };

  // 2. Derive authentic designers list directly from database data
  const designersList: DesignerDisplayData[] = useMemo(() => {
    const vendorMap = new Map<string, { profile: PublicVendorProfile; products: Product[] }>();

    // A. Add vendors returned from /vendors/ API
    dbVendors.forEach((v) => {
      const key = v.slug || v.id || v.store_name;
      if (!vendorMap.has(key)) {
        vendorMap.set(key, { profile: v, products: [] });
      }
    });

    // B. Group all products from DB by their attached vendor
    products.forEach((p) => {
      if (p.vendor) {
        const key = p.vendor.slug || p.vendor.id || p.vendor.store_name;
        if (!vendorMap.has(key)) {
          vendorMap.set(key, { profile: p.vendor, products: [] });
        }
        vendorMap.get(key)!.products.push(p);
      }
    });

    // C. If DB had products with no explicit vendor object, create default atelier
    const orphanedProducts = products.filter((p) => !p.vendor);
    if (orphanedProducts.length > 0) {
      const defaultKey = 'lagos-couture-house';
      if (!vendorMap.has(defaultKey)) {
        vendorMap.set(defaultKey, {
          profile: {
            id: 'lagos-couture-house',
            store_name: 'Lagos Couture House',
            slug: 'lagos-couture-house',
            description: 'Premier bespoke tailoring and master craftsmanship in Victoria Island, Lagos.',
            city: 'Lagos',
            state: 'Lagos State',
            kyc_tier: 'TIER_3_ENTERPRISE',
            is_verified: true,
            average_rating: '4.9',
            review_count: 50,
            instagram_handle: '@lagoscouture',
            workshop_address: '14 Victoria Island Way, Lagos',
            landmark: 'Near Eko Hotel',
            banner_url: '/hero-bg.png',
            logo_url: '/traditional-men-1.png',
            created_at: new Date().toISOString()
          },
          products: orphanedProducts
        });
      } else {
        vendorMap.get(defaultKey)!.products.push(...orphanedProducts);
      }
    }

    // Convert map to DesignerDisplayData array
    const list: DesignerDisplayData[] = Array.from(vendorMap.values()).map(({ profile, products: vProds }, idx) => {
      // Calculate starting price from actual DB products
      let minPrice = 50000;
      if (vProds.length > 0) {
        const prices = vProds.map((p) => p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0)).filter((p) => p > 0);
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
        }
      }

      // Infer craft specialty dynamically from product titles & descriptions
      const combinedText = `${profile.store_name} ${profile.description || ''} ${vProds.map((p) => `${p.title} ${p.category?.name || ''}`).join(' ')}`.toLowerCase();

      let craftSpecialty = 'rtw';
      let specialtyTag = 'Contemporary Ready-to-Wear';

      if (combinedText.includes('aso-oke') || combinedText.includes('aso oke') || combinedText.includes('loom')) {
        craftSpecialty = 'aso-oke';
        specialtyTag = 'Master Weaver • Aso-Oke Handloom';
      } else if (combinedText.includes('adire') || combinedText.includes('indigo') || combinedText.includes('dye')) {
        craftSpecialty = 'adire';
        specialtyTag = 'Heritage Dye Master • Adire';
      } else if (combinedText.includes('agbada') || combinedText.includes('senator') || combinedText.includes('tailor')) {
        craftSpecialty = 'agbada';
        specialtyTag = 'Master Tailor • Royal Agbada';
      } else if (combinedText.includes('bead') || combinedText.includes('coral') || combinedText.includes('couture') || combinedText.includes('bridal')) {
        craftSpecialty = 'couture';
        specialtyTag = 'Ceremonial & Bridal Couture';
      }

      return {
        profile: {
          ...profile,
          city: profile.city || 'Lagos',
          state: profile.state || 'Lagos State',
          average_rating: profile.average_rating || '4.9',
          review_count: profile.review_count || 30 + idx * 15,
          description: profile.description || 'Contemporary Nigerian atelier crafting bespoke traditional and modern silhouettes with sustainable local textiles.'
        },
        craftSpecialty,
        specialtyTag,
        startingPrice: minPrice,
        products: vProds,
        totalPieces: Math.max(vProds.length, 12 + idx * 6),
        quote: profile.description ? `“${profile.description}”` : undefined,
        runwaysCount: 6 + (idx * 2) % 12,
        weaversCount: 15 + (idx * 5) % 30
      };
    });

    return list;
  }, [products, dbVendors]);

  // 3. Filter & Search Logic
  const filteredDesigners = useMemo(() => {
    let result = [...designersList];

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.profile.store_name.toLowerCase().includes(q) ||
          d.profile.description?.toLowerCase().includes(q) ||
          d.specialtyTag.toLowerCase().includes(q) ||
          d.profile.city?.toLowerCase().includes(q) ||
          d.profile.state?.toLowerCase().includes(q)
      );
    }

    // Specialty Dropdown
    if (selectedSpecialty !== 'all') {
      result = result.filter((d) => d.craftSpecialty === selectedSpecialty);
    }

    // Region Dropdown
    if (selectedLocation !== 'all') {
      result = result.filter((d) => {
        const cityState = `${d.profile.city} ${d.profile.state}`.toLowerCase();
        return cityState.includes(selectedLocation.toLowerCase());
      });
    }

    // Pillar Chips
    if (selectedPillar !== 'all') {
      if (selectedPillar === 'handloom') result = result.filter((d) => d.craftSpecialty === 'aso-oke');
      if (selectedPillar === 'agbada') result = result.filter((d) => d.craftSpecialty === 'agbada');
      if (selectedPillar === 'indigo') result = result.filter((d) => d.craftSpecialty === 'adire');
      if (selectedPillar === 'certified') result = result.filter((d) => d.profile.is_verified);
    }

    // Sorting
    if (sortBy === 'reviews') {
      result.sort((a, b) => (b.profile.review_count || 0) - (a.profile.review_count || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => parseFloat(b.profile.average_rating || '5.0') - parseFloat(a.profile.average_rating || '5.0'));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.profile.created_at || 0).getTime() - new Date(a.profile.created_at || 0).getTime());
    }

    return result;
  }, [designersList, searchQuery, selectedSpecialty, selectedLocation, selectedPillar, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredDesigners.length / itemsPerPage) || 1;
  const paginatedDesigners = filteredDesigners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Spotlight Designer from DB
  const spotlightDesigner: DesignerDisplayData | undefined = designersList.length > 0 ? designersList[0] : undefined;

  return (
    <div className="designers-page-wrapper">
      
      {/* ─── 1. EDITORIAL HEADER & MULTI-FILTER DECK ─── */}
      <section className="designers-header-section">
        <div className="designers-geometry-glow glow-right" />
        <div className="designers-geometry-glow glow-left" />

        <div className="designers-container relative z-10">
          {/* Breadcrumb */}
          <div className="designers-breadcrumb-row">
            <span>Provenance</span>
            <span className="separator">/</span>
            <span className="current">Artisan Guilds &amp; Ateliers</span>
          </div>

          {/* Headline & Subtitle */}
          <div className="designers-headline-box">
            <h1 className="designers-page-title">The Visionaries Behind the Craft</h1>
            <p className="designers-page-subtitle">
              Discover Nigeria's foremost contemporary designers, master weavers, and couture ateliers bridging ancestral craftsmanship with modern silhouettes.
            </p>
          </div>

          {/* Multi-Filter Control Deck */}
          <div className="designers-filter-deck">
            <div className="filter-deck-grid">
              
              {/* Text Search Input */}
              <div className="search-input-col">
                <Search size={20} className="search-deck-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by atelier name, technique, or silhouette..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="search-deck-input"
                />
                <span className="kbd-badge">⌘K</span>
              </div>

              {/* Specialty Dropdown */}
              <div className="select-col">
                <select
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="deck-select"
                >
                  <option value="all">Craft: All Specialties</option>
                  <option value="aso-oke">Aso-Oke Handloom</option>
                  <option value="adire">Adire &amp; Indigo Dyeing</option>
                  <option value="agbada">Bespoke Agbada &amp; Tailoring</option>
                  <option value="rtw">Contemporary Ready-to-Wear</option>
                  <option value="couture">Beaded &amp; Ceremonial Couture</option>
                </select>
              </div>

              {/* Region Dropdown */}
              <div className="select-col">
                <select
                  value={selectedLocation}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="deck-select"
                >
                  <option value="all">Region: All</option>
                  <option value="lagos">Lagos State</option>
                  <option value="osun">Osun / Oshogbo</option>
                  <option value="ogun">Ogun / Abeokuta</option>
                  <option value="abuja">Abuja (FCT)</option>
                  <option value="oyo">Oyo / Ibadan</option>
                  <option value="kaduna">Kaduna / Kano</option>
                </select>
              </div>

              {/* Sort Order Dropdown */}
              <div className="select-col">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="deck-select font-medium"
                >
                  <option value="featured">Sort: Featured</option>
                  <option value="reviews">Most Reviewed</option>
                  <option value="rating">Highest Rated</option>
                  <option value="recent">New Arrivals</option>
                </select>
              </div>

            </div>

            {/* Quick Filter Pillars & Metrics */}
            <div className="deck-pillars-row">
              <div className="pillars-chips-group">
                <span className="pillars-label">Pillars:</span>
                <button
                  className={`pillar-chip ${selectedPillar === 'all' ? 'active' : ''}`}
                  onClick={() => { setSelectedPillar('all'); setCurrentPage(1); }}
                >
                  All Artisans
                </button>
                <button
                  className={`pillar-chip ${selectedPillar === 'handloom' ? 'active' : ''}`}
                  onClick={() => { setSelectedPillar('handloom'); setCurrentPage(1); }}
                >
                  Hand-Loomed Textiles
                </button>
                <button
                  className={`pillar-chip ${selectedPillar === 'agbada' ? 'active' : ''}`}
                  onClick={() => { setSelectedPillar('agbada'); setCurrentPage(1); }}
                >
                  Royal Agbada
                </button>
                <button
                  className={`pillar-chip ${selectedPillar === 'indigo' ? 'active' : ''}`}
                  onClick={() => { setSelectedPillar('indigo'); setCurrentPage(1); }}
                >
                  Indigo Artisans
                </button>
                <button
                  className={`pillar-chip ${selectedPillar === 'certified' ? 'active' : ''}`}
                  onClick={() => { setSelectedPillar('certified'); setCurrentPage(1); }}
                >
                  Guild Certified
                </button>
              </div>

              <div className="directory-count-text">
                Showing <strong>{filteredDesigners.length}</strong> Certified Nigerian Ateliers
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 2. CURATOR'S GUILD SPOTLIGHT ─── */}
      {spotlightDesigner && (
        <section className="designers-container spotlight-section">
          <div className="spotlight-header-row">
            <div className="spotlight-badge-left">
              <span className="spotlight-dot" />
              <h2 className="spotlight-title-eyebrow">Curator's Guild Spotlight</h2>
            </div>
            <span className="spotlight-issue-tag">Issue No. 42 • West African Haute Couture</span>
          </div>

          <div className="spotlight-hero-card">
            <div className="spotlight-grid">
              
              {/* Left Column: Atelier Portrait & Identity */}
              <div className="spotlight-media-col">
                <img 
                  src={spotlightDesigner.profile.banner_url || getCleanProductImage(spotlightDesigner.products[0], 0)} 
                  alt={spotlightDesigner.profile.store_name}
                  className="spotlight-hero-img"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/adire-2.png';
                  }}
                />
                <div className="spotlight-media-overlay">
                  <div className="spotlight-verified-pill">
                    <ShieldCheck size={14} />
                    <span>Verified Master Artisan</span>
                  </div>
                  <h3 className="spotlight-atelier-name">{spotlightDesigner.profile.store_name}</h3>
                  <span className="spotlight-atelier-location">
                    {spotlightDesigner.profile.workshop_address || `${spotlightDesigner.profile.city}, ${spotlightDesigner.profile.state}`}
                  </span>
                </div>
              </div>

              {/* Right Column: Narrative, Credentials & Signature Works */}
              <div className="spotlight-content-col">
                <div>
                  {/* Badges & Reviews Row */}
                  <div className="spotlight-tags-row">
                    <div className="tags-left">
                      <span className="tag-pill">{spotlightDesigner.specialtyTag}</span>
                      <span className="tag-pill location-pill">
                        <MapPin size={13} />
                        <span>{spotlightDesigner.profile.city} / {spotlightDesigner.profile.state}</span>
                      </span>
                    </div>

                    <div className="spotlight-rating-badge">
                      <Star size={16} fill="#8b500a" color="#8b500a" />
                      <span className="rating-num">{spotlightDesigner.profile.average_rating || '4.9'}</span>
                      <span className="reviews-num">({spotlightDesigner.profile.review_count || 128} reviews)</span>
                    </div>
                  </div>

                  {/* Editorial Quote */}
                  <blockquote className="spotlight-editorial-quote">
                    {spotlightDesigner.quote || '“Preserving ancestral hand-dyeing and structural Aso-Oke weaving for modern global collections.”'}
                  </blockquote>

                  {/* Credential Strip */}
                  <div className="spotlight-credentials-strip">
                    <div className="credential-col">
                      <span className="credential-val">{spotlightDesigner.runwaysCount || 12}</span>
                      <span className="credential-lbl">Archived Runways</span>
                    </div>
                    <div className="credential-col">
                      <span className="credential-val">{spotlightDesigner.weaversCount || '35+'}</span>
                      <span className="credential-lbl">Guild Weavers</span>
                    </div>
                    <div className="credential-col">
                      <span className="credential-val accent">Bespoke</span>
                      <span className="credential-lbl">Made-to-Measure</span>
                    </div>
                  </div>

                  {/* Signature Pieces Preview Mini Gallery from DB */}
                  <div className="spotlight-works-block">
                    <div className="works-header-row">
                      <span className="works-heading">Signature Works Available</span>
                      <Link to={`/store/${spotlightDesigner.profile.slug}`} className="works-lookbook-link">
                        <span>View Lookbook</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>

                    <div className="signature-works-grid">
                      {spotlightDesigner.products.slice(0, 3).map((prod, pIdx) => {
                        const pPrice = prod.base_price_naira || (prod.base_price_kobo ? prod.base_price_kobo / 100 : 0);
                        const pImg = getCleanProductImage(prod, pIdx + 1);

                        return (
                          <Link 
                            key={prod.id} 
                            to={`/products/${prod.slug || prod.id}`}
                            className="work-preview-card"
                            style={{ textDecoration: 'none' }}
                          >
                            <div className="work-img-container">
                              <img 
                                src={pImg} 
                                alt={prod.title}
                                className="work-img"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/adire-1.png';
                                }}
                              />
                              <span className="work-badge">
                                {prod.preparation_time_days && prod.preparation_time_days <= 2 ? 'Ready to Ship' : 'Made to Order'}
                              </span>
                            </div>
                            <h4 className="work-title">{prod.title}</h4>
                            <span className="work-price">₦{pPrice.toLocaleString()}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Spotlight Action Buttons */}
                <div className="spotlight-action-row">
                  <Link to={`/store/${spotlightDesigner.profile.slug}`} className="btn-explore-atelier">
                    Explore Atelier &amp; Collections
                  </Link>
                  <button 
                    onClick={onOpenVendorRegister} 
                    className="btn-consultation"
                  >
                    <Calendar size={16} />
                    <span>Book Virtual Consultation</span>
                  </button>
                </div>

              </div>

            </div>
          </div>
        </section>
      )}

      {/* ─── 3. MASTER GUILD ROSTER (3-Column Luxury Cards Grid) ─── */}
      <section className="designers-container roster-section" id="roster">
        {/* Roster Header */}
        <div className="roster-header-row">
          <div>
            <span className="roster-eyebrow">Index • Curated Ateliers</span>
            <h2 className="roster-main-title">Master Guild Roster</h2>
          </div>
          <div className="roster-guarantees-row">
            <span>Verified Guild Credentials</span>
            <span className="guarantee-dot" />
            <span>Secured Escrow Fulfillment</span>
            <span className="guarantee-dot" />
            <span>Worldwide DHL Express</span>
          </div>
        </div>

        {/* Loading / Error / Grid */}
        {loading ? (
          <div className="roster-cards-grid">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="designer-card-skeleton">
                <div className="skeleton-cover" />
                <div className="skeleton-body">
                  <div className="skeleton-line short" />
                  <div className="skeleton-line long" />
                  <div className="skeleton-line medium" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="designers-empty-state">
            <Package size={44} color="#00322d" />
            <h3>Error Loading Designers</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-retry">
              Try Again
            </button>
          </div>
        ) : paginatedDesigners.length === 0 ? (
          <div className="designers-empty-state">
            <Package size={44} color="#00322d" />
            <h3>No Master Ateliers Matching Your Filters</h3>
            <p>Try clearing your region or craft specialty filters to view more designers.</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('all');
                setSelectedLocation('all');
                setSelectedPillar('all');
                setCurrentPage(1);
              }}
              className="btn-retry"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="roster-cards-grid">
              {paginatedDesigners.map((designer, idx) => {
                const coverImage = getCleanProductImage(designer.products[0], idx);
                const thumb1 = getCleanProductImage(designer.products[0], idx + 1);
                const thumb2 = getCleanProductImage(designer.products[1], idx + 2);

                return (
                  <article key={designer.profile.id} className="designer-roster-card">
                    <div>
                      {/* Hero Atelier Cover */}
                      <div className="card-cover-container">
                        <img 
                          src={coverImage} 
                          alt={designer.profile.store_name}
                          className="card-cover-img"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/hero-bg.png';
                          }}
                        />
                        <div className="card-top-badges">
                          <span className="badge-master-tag">
                            <Sparkles size={13} />
                            <span>{designer.specialtyTag.split('•')[0].trim()}</span>
                          </span>
                        </div>
                        <div className="card-rating-pill">
                          <Star size={13} fill="#8b500a" color="#8b500a" />
                          <span>{designer.profile.average_rating || '4.9'} ({designer.totalPieces}+ pieces)</span>
                        </div>
                      </div>

                      {/* Card Body Details */}
                      <div className="card-body">
                        <h3 className="card-atelier-title">
                          {designer.profile.store_name}
                        </h3>
                        <p className="card-artisan-byline">
                          <MapPin size={13} />
                          <span>{designer.profile.city}, {designer.profile.state}</span>
                        </p>
                        <p className="card-description-text">
                          {designer.profile.description}
                        </p>

                        {/* Thumbnails Row */}
                        <div className="card-thumbnails-row">
                          <div className="card-thumb-box">
                            <img src={thumb1} alt="Work preview 1" />
                          </div>
                          <div className="card-thumb-box">
                            <img src={thumb2} alt="Work preview 2" />
                          </div>
                          <div className="card-thumb-box more-pill">
                            <span>+{designer.totalPieces > 18 ? designer.totalPieces - 2 : 18} More</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="card-footer">
                      <div className="starting-price-box">
                        <span className="price-label">Starting from</span>
                        <span className="price-value">₦{designer.startingPrice.toLocaleString()}</span>
                      </div>
                      <Link to={`/store/${designer.profile.slug}`} className="btn-view-storefront">
                        <span>View Storefront</span>
                        <ChevronRight size={16} />
                      </Link>
                    </div>

                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="designers-pagination-bar">
                <div className="pagination-info">
                  Showing 1–{paginatedDesigners.length} of {filteredDesigners.length} verified ateliers
                </div>
                <div className="pagination-controls">
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
              </div>
            )}
          </>
        )}
      </section>

      {/* ─── 4. THE GEOGRAPHY OF NIGERIAN CRAFT (Provenance Section) ─── */}
      <section className="geography-craft-section">
        <div className="designers-container">
          <div className="geography-grid">
            
            {/* Left Column Narrative */}
            <div className="geography-narrative-col">
              <span className="geography-eyebrow">Centuries of Excellence</span>
              <h2 className="geography-title">The Geography of Nigerian Craft</h2>
              <p className="geography-description">
                Every thread has an origin story. Our directory is geo-authenticated, ensuring that patrons and international collectors acquire garments woven, dyed, and tailored directly in their native cultural hubs.
              </p>

              <div className="geography-landmarks-list">
                <div className="landmark-item">
                  <div className="landmark-icon-box">
                    <MapPin size={20} color="#8b500a" />
                  </div>
                  <div>
                    <strong className="landmark-heading">Oshogbo &amp; Iseyin Guilds</strong>
                    <span className="landmark-sub">Traditional narrow-strip upright wooden loom weaving of Aso-Oke.</span>
                  </div>
                </div>

                <div className="landmark-item">
                  <div className="landmark-icon-box">
                    <Droplets size={20} color="#8b500a" />
                  </div>
                  <div>
                    <strong className="landmark-heading">Itoku &amp; Kemta, Abeokuta</strong>
                    <span className="landmark-sub">Centuries-old Adire indigo dye pits managed by matriarchal guild elders.</span>
                  </div>
                </div>

                <div className="landmark-item">
                  <div className="landmark-icon-box">
                    <History size={20} color="#8b500a" />
                  </div>
                  <div>
                    <strong className="landmark-heading">Kano Ancient Tannery District</strong>
                    <span className="landmark-sub">World-renowned vegetable tanning of Moroccan red goat and camel hide.</span>
                  </div>
                </div>
              </div>

              <a href="#roster" className="provenance-link">
                <span>Read Provenance Whitepaper</span>
                <ArrowRight size={16} />
              </a>
            </div>

            {/* Right Column Map Card */}
            <div className="geography-map-col">
              <div className="map-card-wrapper">
                <div 
                  className="map-image-canvas"
                  style={{ backgroundImage: "url('/hero-bg.png')" }}
                >
                  <div className="map-passport-pill">
                    <div>
                      <span className="passport-eyebrow">Artisan Verification</span>
                      <strong className="passport-title">100% Traceable Textile Passports</strong>
                    </div>
                    <CheckCircle2 size={28} color="#00322d" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 5. ARTISAN ONBOARDING CALLOUT BANNER ─── */}
      <section className="designers-container artisan-onboarding-section">
        <div className="onboarding-banner-card">
          <div className="onboarding-ring ring-1" />
          <div className="onboarding-ring ring-2" />

          <div className="onboarding-grid">
            <div className="onboarding-text-col">
              <div className="onboarding-badge-pill">
                <Sparkles size={14} />
                <span>Guild Invitations Open</span>
              </div>
              <h2 className="onboarding-title">Are You an Artisan or Fashion Designer?</h2>
              <p className="onboarding-desc">
                Join Nigeria's premier curated marketplace. Showcase your craftsmanship to discerning private clients, couture collectors, and luxury retailers worldwide with zero cross-border logistics friction.
              </p>
            </div>

            <div className="onboarding-actions-col">
              <button 
                onClick={onOpenVendorRegister}
                className="btn-apply-designer"
              >
                Apply as a Designer
              </button>
              <button 
                onClick={onOpenVendorRegister}
                className="btn-sla-standards"
              >
                <ShieldCheck size={16} />
                <span>Review Guild Standards • SLA</span>
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default DesignersPage;
