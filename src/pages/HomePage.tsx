import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, type HomeFeed } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileHomeView } from '../components/home/MobileHomeView';
import { DesktopHomeView, type CategoryPillItem } from '../components/home/DesktopHomeView';
import type { Product } from '../types';

interface HomePageProps {
  onOpenVendorRegister?: () => void;
}

const ALL_TAXONOMY_CANDIDATES: CategoryPillItem[] = [
  { name: 'All Pieces', mobileName: 'All', slug: null },
  { name: 'Men', mobileName: 'Men', slug: 'men' },
  { name: 'Agbada', mobileName: 'Agbada', slug: 'agbada' },
  { name: 'Senator Suits', mobileName: 'Senator', slug: 'senator' },
  { name: 'Two-Piece Sets', mobileName: 'Two-Piece', slug: 'two-piece' },
  { name: 'Women', mobileName: 'Women', slug: 'women' },
  { name: 'Aso Ebi & Corset Gowns', mobileName: 'Aso Ebi', slug: 'aso-ebi' },
  { name: 'Boubou & Silk Kaftans', mobileName: 'Boubou', slug: 'boubou' },
  { name: 'Iro & Buba', mobileName: 'Iro & Buba', slug: 'iro-buba' },
  { name: 'Traditional & Bridal', mobileName: 'Traditional', slug: 'traditional' },
];

export const matchesCategory = (product: Product, slug: string | null): boolean => {
  if (!slug) return true;
  const s = slug.toLowerCase().trim();
  const catSlug = (product.category?.slug || '').toLowerCase();
  const catName = (product.category?.name || '').toLowerCase();
  const title = (product.title || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();

  if (catSlug === s || catSlug.includes(s) || catName.includes(s)) return true;

  if (s === 'men' || s === 'mens') {
    return (
      catSlug.includes('men') ||
      catName.includes('men') ||
      title.includes('men') ||
      title.includes('agbada') ||
      title.includes('senator') ||
      title.includes('kaftan') ||
      desc.includes('men') ||
      desc.includes('groom')
    );
  }
  if (s === 'women' || s === 'womens') {
    return (
      catSlug.includes('women') ||
      catName.includes('women') ||
      title.includes('women') ||
      title.includes('gown') ||
      title.includes('boubou') ||
      title.includes('corset') ||
      title.includes('iro') ||
      title.includes('buba') ||
      desc.includes('women') ||
      desc.includes('bride')
    );
  }
  if (s === 'agbada') {
    return catSlug.includes('agbada') || catName.includes('agbada') || title.includes('agbada') || desc.includes('agbada');
  }
  if (s === 'senator' || s === 'senator-suits') {
    return catSlug.includes('senator') || catName.includes('senator') || title.includes('senator') || desc.includes('senator');
  }
  if (s === 'two-piece' || s === 'two-piece-sets') {
    return (
      catSlug.includes('two-piece') ||
      catName.includes('two-piece') ||
      title.includes('two-piece') ||
      title.includes('2-piece') ||
      title.includes('two piece') ||
      desc.includes('two-piece') ||
      desc.includes('two piece')
    );
  }
  if (s === 'aso-ebi') {
    return (
      catSlug.includes('aso-ebi') ||
      catSlug.includes('aso ebi') ||
      catName.includes('aso ebi') ||
      catName.includes('aso-ebi') ||
      title.includes('aso ebi') ||
      title.includes('aso-ebi') ||
      title.includes('corset') ||
      desc.includes('aso ebi')
    );
  }
  if (s === 'boubou') {
    return catSlug.includes('boubou') || catName.includes('boubou') || title.includes('boubou') || desc.includes('boubou');
  }
  if (s === 'iro-buba') {
    return catSlug.includes('iro') || catName.includes('iro') || title.includes('iro') || title.includes('buba') || desc.includes('iro');
  }
  if (s === 'traditional' || s === 'bridal') {
    return (
      catSlug.includes('traditional') ||
      catSlug.includes('bridal') ||
      catName.includes('traditional') ||
      catName.includes('bridal') ||
      title.includes('traditional') ||
      title.includes('bridal') ||
      title.includes('native') ||
      title.includes('wedding') ||
      title.includes('aso-oke') ||
      title.includes('aso oke') ||
      desc.includes('traditional')
    );
  }

  return title.includes(s) || desc.includes(s);
};

// ── Home feed cache: the page shows instantly from the last visit, then refreshes quietly ──
let memoryHomeFeed: HomeFeed | null = null;
const CACHE_HOME_KEY = 'aso_cached_home_feed_v2';

function getCachedHomeFeed(): HomeFeed | null {
  if (memoryHomeFeed) return memoryHomeFeed;
  try {
    const raw = sessionStorage.getItem(CACHE_HOME_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.pieces)) {
        memoryHomeFeed = parsed;
        return parsed;
      }
    }
  } catch {}
  return null;
}

const PAGE_SIZE = 24;

export const HomePage: React.FC<HomePageProps> = ({ onOpenVendorRegister }) => {
  const isMobile = useIsMobile(768);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const searchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || null;
  // "See all pieces": the whole catalogue, a page at a time.
  const showAll = searchParams.get('view') === 'all';

  const [homeFeed, setHomeFeed] = useState<HomeFeed | null>(getCachedHomeFeed);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);

  // Browsing (a category, a search or "see all"): pages of 24 with "Load more".
  const browsing = Boolean(selectedCategory || searchQuery || showAll);
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [browsePage, setBrowsePage] = useState(1);
  const [browseHasMore, setBrowseHasMore] = useState(false);
  const [browseTotal, setBrowseTotal] = useState(0);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [homeLoading, setHomeLoading] = useState<boolean>(() => !getCachedHomeFeed());

  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  // Home selection (hand-picked pieces and designers). Small, so it is cheap to refresh.
  useEffect(() => {
    let cancelled = false;
    productApi.getHomeFeed()
      .then((feed) => {
        if (cancelled) return;
        setHomeFeed(feed);
        memoryHomeFeed = feed;
        try {
          sessionStorage.setItem(CACHE_HOME_KEY, JSON.stringify(feed));
        } catch {}
      })
      .catch((err) => console.error('Failed to load home page:', err))
      .finally(() => { if (!cancelled) setHomeLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // First page whenever the category or search changes.
  useEffect(() => {
    if (!browsing) return;
    let cancelled = false;
    setBrowseLoading(true);
    setBrowseProducts([]);
    const params: Record<string, string> = {};
    if (selectedCategory) params.category = selectedCategory;
    if (searchQuery) params.search = searchQuery;
    productApi.getPublicProductsPage(params, 1, PAGE_SIZE)
      .then((res) => {
        if (cancelled) return;
        setBrowseProducts(res.products);
        setBrowseHasMore(res.hasMore);
        setBrowseTotal(res.count);
        setBrowsePage(1);
      })
      .catch((err) => {
        console.error('Failed to load pieces:', err);
        if (!cancelled) { setBrowseProducts([]); setBrowseHasMore(false); setBrowseTotal(0); }
      })
      .finally(() => { if (!cancelled) setBrowseLoading(false); });
    return () => { cancelled = true; };
  }, [browsing, selectedCategory, searchQuery]);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !browseHasMore) return;
    setLoadingMore(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchQuery) params.search = searchQuery;
      const next = browsePage + 1;
      const res = await productApi.getPublicProductsPage(params, next, PAGE_SIZE);
      setBrowseProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...res.products.filter((p) => !seen.has(p.id))];
      });
      setBrowseHasMore(res.hasMore);
      setBrowsePage(next);
    } catch (err) {
      console.error('Failed to load more pieces:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, browseHasMore, selectedCategory, searchQuery, browsePage]);

  // Only show category pills that have at least one live piece.
  const availableCategories = useMemo(() => {
    const withPieces = homeFeed?.categories_with_pieces;
    if (!withPieces) return ALL_TAXONOMY_CANDIDATES.filter((c) => c.slug === null);
    return ALL_TAXONOMY_CANDIDATES.filter((cat) => cat.slug === null || withPieces.includes(cat.slug));
  }, [homeFeed]);

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const handleSearchSubmit = (q: string) => {
    if (q) {
      setSearchParams({ search: q });
    } else {
      setSearchParams({});
    }
  };

  const handleSeeAll = () => {
    setSelectedCategory(null);
    setSearchParams({ view: 'all' });
  };

  const isDesigner = Boolean(user?.is_vendor || user?.vendor_profile);

  const products = browsing ? browseProducts : homeFeed?.pieces ?? [];
  const loading = browsing ? browseLoading : homeLoading && !homeFeed;
  const shared = {
    products,
    vendors: homeFeed?.designers ?? [],
    loading,
    selectedCategory,
    onCategorySelect: handleCategorySelect,
    searchQuery,
    onOpenVendorRegister,
    isDesigner,
    categories: availableCategories,
    browsing,
    showAll,
    totalCount: browseTotal,
    hasMore: browsing && browseHasMore,
    loadingMore,
    onLoadMore: handleLoadMore,
    onSeeAll: handleSeeAll,
  };

  return isMobile ? (
    <MobileHomeView {...shared} onSearchSubmit={handleSearchSubmit} />
  ) : (
    <DesktopHomeView {...shared} />
  );
};

export default HomePage;
