import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi, vendorApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileHomeView } from '../components/home/MobileHomeView';
import { DesktopHomeView, type CategoryPillItem } from '../components/home/DesktopHomeView';
import type { Product, PublicVendorProfile } from '../types';

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

// ── In-Memory & Session Storage Cache for 0ms Instant Home Loading ──
let memoryCachedCatalog: Product[] | null = null;
let memoryCachedVendors: PublicVendorProfile[] | null = null;
const CACHE_CATALOG_KEY = 'aso_cached_home_catalog';
const CACHE_VENDORS_KEY = 'aso_cached_home_vendors';

function getInitialCachedCatalog(): Product[] {
  if (memoryCachedCatalog && memoryCachedCatalog.length > 0) return memoryCachedCatalog;
  try {
    const raw = sessionStorage.getItem(CACHE_CATALOG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCachedCatalog = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

function getInitialCachedVendors(): PublicVendorProfile[] {
  if (memoryCachedVendors && memoryCachedVendors.length > 0) return memoryCachedVendors;
  try {
    const raw = sessionStorage.getItem(CACHE_VENDORS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCachedVendors = parsed;
        return parsed;
      }
    }
  } catch {}
  return [];
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenVendorRegister }) => {
  const isMobile = useIsMobile(768);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const searchQuery = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || null;

  const [allProducts, setAllProducts] = useState<Product[]>(getInitialCachedCatalog);
  const [products, setProducts] = useState<Product[]>(getInitialCachedCatalog);
  const [featuredVendors, setFeaturedVendors] = useState<PublicVendorProfile[]>(getInitialCachedVendors);
  const [loading, setLoading] = useState<boolean>(() => getInitialCachedCatalog().length === 0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);

  useEffect(() => {
    setSelectedCategory(urlCategory);
  }, [urlCategory]);

  // Optimized SWR Data Fetching: 0ms instant display with silent background revalidation
  const refreshCatalog = useCallback(async (categorySlug?: string | null, search?: string) => {
    // Only show visible loading state if we have zero cached products to display
    if (products.length === 0) {
      setLoading(true);
    }

    try {
      const params: Record<string, string> = {};
      if (categorySlug) params.category = categorySlug;
      if (search) params.search = search;

      const [allData, filteredData] = await Promise.all([
        // If not searching or filtering, fetch base catalog
        (!categorySlug && !search) ? productApi.getPublicProducts({}).catch(() => []) : Promise.resolve(null),
        (categorySlug || search) ? productApi.getPublicProducts(params).catch(() => []) : Promise.resolve(null)
      ]);

      if (allData && Array.isArray(allData)) {
        setAllProducts(allData);
        setProducts(allData);
        memoryCachedCatalog = allData;
        try {
          sessionStorage.setItem(CACHE_CATALOG_KEY, JSON.stringify(allData));
        } catch {}
      } else if (filteredData && Array.isArray(filteredData)) {
        let result = filteredData;
        // Fallback filter if backend returns empty
        if (result.length === 0 && allProducts.length > 0) {
          result = allProducts.filter((p) => {
            const matchesCat = categorySlug ? matchesCategory(p, categorySlug) : true;
            const matchesSearch = search
              ? (p.title || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(search.toLowerCase()) ||
                (p.vendor?.store_name || '').toLowerCase().includes(search.toLowerCase())
              : true;
            return matchesCat && matchesSearch;
          });
        }
        setProducts(result);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [products.length, allProducts]);

  // Load featured vendors with SWR caching
  useEffect(() => {
    vendorApi.getVendors().then((vList) => {
      if (Array.isArray(vList) && vList.length > 0) {
        setFeaturedVendors(vList);
        memoryCachedVendors = vList;
        try {
          sessionStorage.setItem(CACHE_VENDORS_KEY, JSON.stringify(vList));
        } catch {}
      }
    }).catch(() => {});
  }, []);

  // Trigger catalog fetch whenever filter/search changes
  useEffect(() => {
    refreshCatalog(selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  // Only show categories that currently have at least 1 product available
  const availableCategories = useMemo(() => {
    if (allProducts.length === 0) {
      return [{ name: 'All Pieces', mobileName: 'All', slug: null }];
    }

    return ALL_TAXONOMY_CANDIDATES.filter((cat) => {
      if (cat.slug === null) return true;
      return allProducts.some((p) => matchesCategory(p, cat.slug));
    });
  }, [allProducts]);

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

  const isDesigner = Boolean(user?.is_vendor || user?.vendor_profile);

  return isMobile ? (
    <MobileHomeView
      products={products}
      vendors={featuredVendors}
      loading={loading}
      selectedCategory={selectedCategory}
      onCategorySelect={handleCategorySelect}
      searchQuery={searchQuery}
      onSearchSubmit={handleSearchSubmit}
      onOpenVendorRegister={onOpenVendorRegister}
      isDesigner={isDesigner}
      categories={availableCategories}
    />
  ) : (
    <DesktopHomeView
      products={products}
      vendors={featuredVendors}
      loading={loading}
      selectedCategory={selectedCategory}
      onCategorySelect={handleCategorySelect}
      searchQuery={searchQuery}
      onOpenVendorRegister={onOpenVendorRegister}
      isDesigner={isDesigner}
      categories={availableCategories}
    />
  );
};

export default HomePage;
