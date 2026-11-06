import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ChevronRight,
  Loader
} from 'lucide-react';
import { categoryApi, productApi } from '../api/client';
import type { Category, Product } from '../types';
import './CategoriesPage.css';

interface DisplayCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  path: string;
  parentSlug: string;
  startingPrice: string;
  productCount: number;
}

interface DepartmentGroup {
  id: string;
  name: string;
  slug: string;
  viewAll: string;
  categories: DisplayCategory[];
}

export const CategoriesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<DepartmentGroup[]>([]);
  const [activeDept, setActiveDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadBackendData = async () => {
      setLoading(true);
      try {
        const [rawCategories, rawProducts] = await Promise.all([
          categoryApi.getCategories().catch(() => []),
          productApi.getPublicProducts().catch(() => []),
        ]);

        if (!isMounted) return;

        const categoriesList: Category[] = Array.isArray(rawCategories) ? rawCategories : [];
        const productsList: Product[] = Array.isArray(rawProducts) ? rawProducts : [];

        // Helper to get fallback images by category name/slug
        const getFallbackImage = (name: string, slug: string, parentSlug: string): string => {
          const s = `${name} ${slug} ${parentSlug}`.toLowerCase();
          if (s.includes('agbada')) return '/traditional-men-2.png';
          if (s.includes('senator')) return '/traditional-men-1.png';
          if (s.includes('boubou') || s.includes('kaftan')) return '/adire-1.png';
          if (s.includes('aso-oke') || s.includes('aso oke')) return '/traditional-men-4.png';
          if (s.includes('corset') || s.includes('suit') || s.includes('blazer')) return '/female-executive-suit.jpg';
          if (s.includes('iro') || s.includes('buba') || s.includes('two-piece') || s.includes('co-ord')) return '/adire-2.png';
          if (s.includes('dress') || s.includes('gown')) return '/adire-4.png';
          if (s.includes('women')) return '/female-executive-suit.jpg';
          if (s.includes('men')) return '/traditional-men-1.png';
          return '/adire-3.png';
        };

        // Strict department routing (checking 'women' first to prevent 'women'.includes('men') bug)
        const resolveCategoryPath = (childSlug: string, parentSlug: string): string => {
          const p = parentSlug.toLowerCase();
          if (p === 'women' || p.startsWith('women')) return `/women?category=${childSlug}`;
          if (p === 'men' || p.startsWith('men')) return `/men?category=${childSlug}`;
          if (p.includes('traditional') || p.includes('heritage')) return `/traditional?category=${childSlug}`;
          return `/products?category=${childSlug}`;
        };

        const resolveDepartmentViewAll = (parentSlug: string): string => {
          const p = parentSlug.toLowerCase();
          if (p === 'women' || p.startsWith('women')) return '/women';
          if (p === 'men' || p.startsWith('men')) return '/men';
          if (p.includes('traditional') || p.includes('heritage')) return '/traditional';
          return `/products?collection=${parentSlug}`;
        };

        // Match product to a category
        const isProductInCat = (p: Product, catSlug: string, catName: string): boolean => {
          const pCatSlug = (p.category?.slug || '').toLowerCase().trim();
          const pCatName = (p.category?.name || '').toLowerCase().trim();
          const cSlug = catSlug.toLowerCase().trim();
          const cName = catName.toLowerCase().trim();

          if (pCatSlug === cSlug || pCatName === cName) return true;
          if (pCatSlug && (pCatSlug.includes(cSlug) || cSlug.includes(pCatSlug))) return true;
          return false;
        };

        // Root categories (Men, Women, Traditional, etc.)
        const rootCategories = categoriesList.filter((c) => !c.parent || c.parent === null);

        const groups: DepartmentGroup[] = [];

        rootCategories.forEach((root) => {
          const children: Category[] = (root.children && root.children.length > 0)
            ? root.children
            : categoriesList.filter((c) => c.parent === root.id || c.parent_name === root.name);

          const displayChildren: DisplayCategory[] = [];

          if (children.length > 0) {
            children.forEach((child) => {
              const childSlug = child.slug || child.name.toLowerCase().replace(/\s+/g, '-');
              const matchingProds = productsList.filter((p) => isProductInCat(p, childSlug, child.name));

              // ── STRICT DB RULE: ONLY show category if it has published products in DB ──
              if (matchingProds.length === 0) return;

              const prices = matchingProds
                .map((p) => p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0))
                .filter((pr) => pr > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const startingPrice = minPrice > 0 ? `From ₦${minPrice.toLocaleString()}` : '';

              const firstProdImg = matchingProds[0]?.primary_image_url ||
                (matchingProds[0]?.media && matchingProds[0].media.length > 0 ? matchingProds[0].media[0].url : null);
              const finalImg = child.image_url || firstProdImg || getFallbackImage(child.name, childSlug, root.slug);

              displayChildren.push({
                id: child.id,
                name: child.name,
                slug: childSlug,
                description: child.description || '',
                imageUrl: finalImg,
                path: resolveCategoryPath(childSlug, root.slug),
                parentSlug: root.slug,
                startingPrice,
                productCount: matchingProds.length,
              });
            });
          } else {
            // Root category without children (e.g. direct category)
            const rootSlug = root.slug || root.name.toLowerCase().replace(/\s+/g, '-');
            const matchingProds = productsList.filter((p) => isProductInCat(p, rootSlug, root.name));

            // Only show if it has published products in DB
            if (matchingProds.length > 0) {
              const prices = matchingProds
                .map((p) => p.base_price_naira || (p.base_price_kobo ? p.base_price_kobo / 100 : 0))
                .filter((pr) => pr > 0);
              const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
              const startingPrice = minPrice > 0 ? `From ₦${minPrice.toLocaleString()}` : '';

              const firstProdImg = matchingProds[0]?.primary_image_url ||
                (matchingProds[0]?.media && matchingProds[0].media.length > 0 ? matchingProds[0].media[0].url : null);
              const finalImg = root.image_url || firstProdImg || getFallbackImage(root.name, rootSlug, '');

              displayChildren.push({
                id: root.id,
                name: root.name,
                slug: rootSlug,
                description: root.description || '',
                imageUrl: finalImg,
                path: resolveCategoryPath(rootSlug, rootSlug),
                parentSlug: rootSlug,
                startingPrice,
                productCount: matchingProds.length,
              });
            }
          }

          // ── ONLY display department if it has at least one active category with products ──
          if (displayChildren.length > 0) {
            groups.push({
              id: root.id,
              name: root.name,
              slug: root.slug || root.name.toLowerCase().replace(/\s+/g, '-'),
              viewAll: resolveDepartmentViewAll(root.slug),
              categories: displayChildren,
            });
          }
        });

        setDepartments(groups);
      } catch (err) {
        console.error('Failed to load categories from backend API', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBackendData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Calculate total active child categories with real products
  const allDisplayCategories = useMemo(() => {
    return departments.flatMap((dept) => dept.categories);
  }, [departments]);

  // Client-side search and department filter
  const filteredCategories = useMemo(() => {
    return allDisplayCategories.filter((cat) => {
      const matchesDept = activeDept === 'all' || cat.parentSlug === activeDept;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        cat.name.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [allDisplayCategories, activeDept, searchQuery]);

  const currentDeptInfo = departments.find((d) => d.slug === activeDept);

  return (
    <div className="categories-page-layout">
      {/* Hero Banner */}
      <section className="categories-hero-banner">
        <div className="categories-hero-inner">
          <h1 className="categories-title">
            Explore All Categories
          </h1>

          <p className="categories-subtitle">
            Discover authentic African luxury fashion, tailored pieces, and contemporary native wear from verified designers.
          </p>

          {/* Search Categories */}
          <div className="categories-search-box">
            <Search size={18} color="#6B7280" />
            <input
              type="text"
              className="categories-search-input"
              placeholder="Search category (e.g. Agbada, Corset, Aso Oke, Kaftan)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="categories-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Primary Sticky Department Switcher (Generated strictly from departments that have active products) */}
      {departments.length > 0 && (
        <nav className="categories-dept-nav-wrapper" aria-label="Department Categories">
          <div className="categories-dept-container">
            <button
              type="button"
              className={`dept-pill-btn ${activeDept === 'all' ? 'active' : ''}`}
              onClick={() => setActiveDept('all')}
            >
              <span>All Categories ({allDisplayCategories.length})</span>
            </button>
            {departments.map((dept) => (
              <button
                key={dept.slug}
                type="button"
                className={`dept-pill-btn ${activeDept === dept.slug ? 'active' : ''}`}
                onClick={() => setActiveDept(dept.slug)}
              >
                <span>{dept.name}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* Main Categories Display */}
      <main className="categories-main-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '30vh', gap: '1rem' }}>
            <Loader size={28} className="spin text-emerald" />
            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading active categories from catalog...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="categories-empty-state">
            <p>New designer collections dropping soon. No categories currently active.</p>
          </div>
        ) : activeDept === 'all' && searchQuery.trim() === '' ? (
          /* Structured All-Departments View */
          departments.map((dept) => {
            if (dept.categories.length === 0) return null;

            return (
              <section key={dept.slug} className="category-dept-section">
                <div className="dept-section-header">
                  <div className="dept-title-group">
                    <h2>{dept.name}</h2>
                    <p>{dept.categories.length} curated categories available</p>
                  </div>
                  <Link to={dept.viewAll} className="dept-view-all-link">
                    <span>View All Pieces</span>
                    <ArrowRight size={15} />
                  </Link>
                </div>

                <div className="categories-grid">
                  {dept.categories.map((cat) => (
                    <Link key={cat.id} to={cat.path} className="category-page-card">
                      <div className="category-card-media">
                        <img src={cat.imageUrl} alt={cat.name} className="category-card-img" loading="lazy" />
                      </div>

                      <div className="category-card-body">
                        <h3 className="category-card-title">{cat.name}</h3>
                        {cat.description && (
                          <p className="category-card-desc">{cat.description}</p>
                        )}
                        <div className="category-card-footer">
                          {cat.startingPrice ? (
                            <span className="category-price-from">{cat.startingPrice}</span>
                          ) : (
                            <span className="category-price-from" style={{ color: '#64748B', fontSize: '0.8rem' }}>
                              {cat.productCount} {cat.productCount === 1 ? 'piece' : 'pieces'}
                            </span>
                          )}
                          <span className="category-explore-cta">
                            <span>Explore</span>
                            <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          /* Filtered View (e.g. Specific Department or Search Active) */
          <section className="category-dept-section">
            <div className="dept-section-header">
              <div className="dept-title-group">
                <h2>
                  {currentDeptInfo
                    ? currentDeptInfo.name
                    : searchQuery
                    ? `Search: "${searchQuery}"`
                    : 'Curated Categories'}
                </h2>
                <p>{filteredCategories.length} curated categories available</p>
              </div>
              {currentDeptInfo && (
                <Link to={currentDeptInfo.viewAll} className="dept-view-all-link">
                  <span>View All {currentDeptInfo.name} Pieces</span>
                  <ArrowRight size={15} />
                </Link>
              )}
            </div>

            {filteredCategories.length === 0 ? (
              <div className="categories-empty-state">
                <p>No categories found matching your selection.</p>
                <button
                  type="button"
                  className="categories-reset-btn"
                  onClick={() => {
                    setActiveDept('all');
                    setSearchQuery('');
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="categories-grid">
                {filteredCategories.map((cat) => (
                  <Link key={cat.id} to={cat.path} className="category-page-card">
                    <div className="category-card-media">
                      <img src={cat.imageUrl} alt={cat.name} className="category-card-img" loading="lazy" />
                    </div>

                    <div className="category-card-body">
                      <h3 className="category-card-title">{cat.name}</h3>
                      {cat.description && (
                        <p className="category-card-desc">{cat.description}</p>
                      )}
                      <div className="category-card-footer">
                        {cat.startingPrice ? (
                          <span className="category-price-from">{cat.startingPrice}</span>
                        ) : (
                          <span className="category-price-from" style={{ color: '#64748B', fontSize: '0.8rem' }}>
                            {cat.productCount} {cat.productCount === 1 ? 'piece' : 'pieces'}
                          </span>
                        )}
                        <span className="category-explore-cta">
                          <span>Explore</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default CategoriesPage;
