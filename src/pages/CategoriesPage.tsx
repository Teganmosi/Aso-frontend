import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  ChevronRight,
  Loader,
  Clock
} from 'lucide-react';
import { categoryApi, productApi } from '../api/client';
import type { Category, Product } from '../types';
import './CategoriesPage.css';

interface DepartmentDisplay {
  id: string;
  name: string;
  slug: string;
  viewAll: string;
  products: Product[];
}

export const CategoriesPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<DepartmentDisplay[]>([]);
  const [activeDept, setActiveDept] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    const loadMarketplaceCatalog = async () => {
      setLoading(true);
      try {
        const [rawCategories, rawProducts] = await Promise.all([
          categoryApi.getCategories().catch(() => []),
          productApi.getPublicProducts().catch(() => []),
        ]);

        if (!isMounted) return;

        const categoriesList: Category[] = Array.isArray(rawCategories) ? rawCategories : [];
        const productsList: Product[] = Array.isArray(rawProducts) ? rawProducts : [];

        // Build a map of category ID & slug to its root department
        // e.g., 'womens-suits-blazers' -> parent is 'Women'
        const categoryToDeptMap = new Map<string, { deptName: string; deptSlug: string; viewAll: string }>();

        const rootCategories = categoriesList.filter((c) => !c.parent || c.parent === null);

        rootCategories.forEach((root) => {
          const rSlug = (root.slug || root.name).toLowerCase();
          let viewAll = `/products?collection=${rSlug}`;
          if (rSlug === 'women' || rSlug.startsWith('women')) viewAll = '/women';
          else if (rSlug === 'men' || rSlug.startsWith('men')) viewAll = '/men';
          else if (rSlug.includes('traditional') || rSlug.includes('heritage')) viewAll = '/traditional';

          const deptInfo = {
            deptName: root.name,
            deptSlug: rSlug,
            viewAll,
          };

          // Register root itself
          categoryToDeptMap.set(root.id, deptInfo);
          categoryToDeptMap.set(rSlug, deptInfo);

          // Register all children of this root
          const children: Category[] = (root.children && root.children.length > 0)
            ? root.children
            : categoriesList.filter((c) => c.parent === root.id || c.parent_name === root.name);

          children.forEach((child) => {
            const cSlug = (child.slug || child.name).toLowerCase();
            categoryToDeptMap.set(child.id, deptInfo);
            categoryToDeptMap.set(cSlug, deptInfo);
          });
        });

        // Group actual published products into their strict department
        const deptGroups = new Map<string, { id: string; name: string; slug: string; viewAll: string; products: Product[] }>();

        productsList.forEach((prod) => {
          const pCatId = prod.category?.id || '';
          const pCatSlug = (prod.category?.slug || '').toLowerCase().trim();
          const pTitle = prod.title.toLowerCase();
          const pDesc = (prod.description || '').toLowerCase();

          // 1. Strict exact lookup in categoryToDeptMap
          let dept = categoryToDeptMap.get(pCatId) || categoryToDeptMap.get(pCatSlug);

          // 2. Fallback heuristic only if not mapped
          if (!dept) {
            if (pCatSlug.startsWith('women') || pTitle.includes('female') || pTitle.includes('women') || pDesc.includes('female suit')) {
              dept = { deptName: 'Women', deptSlug: 'women', viewAll: '/women' };
            } else if (pCatSlug.includes('traditional') || pTitle.includes('igbo') || pTitle.includes('agbada') || pTitle.includes('aso-oke') || pTitle.includes('aso oke')) {
              dept = { deptName: 'Traditional & Heritage', deptSlug: 'traditional', viewAll: '/traditional' };
            } else if (pCatSlug.startsWith('men') || pTitle.includes('senator') || pTitle.includes('men') || pTitle.includes('kaftan')) {
              dept = { deptName: 'Men', deptSlug: 'men', viewAll: '/men' };
            } else {
              dept = { deptName: 'Contemporary Collections', deptSlug: 'contemporary', viewAll: '/products' };
            }
          }

          if (!deptGroups.has(dept.deptSlug)) {
            deptGroups.set(dept.deptSlug, {
              id: dept.deptSlug,
              name: dept.deptName,
              slug: dept.deptSlug,
              viewAll: dept.viewAll,
              products: [],
            });
          }

          deptGroups.get(dept.deptSlug)!.products.push(prod);
        });

        // Convert to array in prioritized order: Men, Women, Traditional, Others
        const prioritizedOrder = ['men', 'women', 'traditional', 'contemporary'];
        const sortedGroups: DepartmentDisplay[] = [];

        prioritizedOrder.forEach((orderSlug) => {
          for (const [key, group] of deptGroups.entries()) {
            if (key.includes(orderSlug) && !sortedGroups.includes(group)) {
              sortedGroups.push(group);
            }
          }
        });

        // Append any remaining departments
        for (const group of deptGroups.values()) {
          if (!sortedGroups.includes(group)) {
            sortedGroups.push(group);
          }
        }

        setDepartments(sortedGroups);
      } catch (err) {
        console.error('Failed to load catalog', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadMarketplaceCatalog();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper for image fallback
  const getProductImage = (prod: Product): string => {
    if (prod.primary_image_url && prod.primary_image_url.trim() !== '') {
      return prod.primary_image_url.startsWith('media/') ? `/${prod.primary_image_url}` : prod.primary_image_url;
    }
    if (prod.media && prod.media.length > 0 && prod.media[0].url) {
      const u = prod.media[0].url;
      return u.startsWith('media/') ? `/${u}` : u;
    }
    const t = prod.title.toLowerCase();
    if (t.includes('senator')) return '/traditional-men-1.png';
    if (t.includes('igbo') || t.includes('traditional')) return '/traditional-men-2.png';
    if (t.includes('suit') || t.includes('female')) return '/female-executive-suit.jpg';
    return '/traditional-men-3.png';
  };

  // Helper for price
  const formatPrice = (prod: Product): string => {
    const amount = prod.base_price_naira || (prod.base_price_kobo ? prod.base_price_kobo / 100 : 0);
    return `₦${amount.toLocaleString()}`;
  };

  // Total published pieces in catalog
  const totalPieces = useMemo(() => {
    return departments.reduce((acc, d) => acc + d.products.length, 0);
  }, [departments]);

  // Filtered view based on active tab and search
  const visibleDepartments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return departments
      .map((dept) => {
        if (activeDept !== 'all' && dept.slug !== activeDept) return null;

        const filteredProds = dept.products.filter((p) => {
          if (!q) return true;
          return (
            p.title.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.vendor?.store_name && p.vendor.store_name.toLowerCase().includes(q)) ||
            (p.category?.name && p.category.name.toLowerCase().includes(q))
          );
        });

        if (filteredProds.length === 0) return null;

        return {
          ...dept,
          products: filteredProds,
        };
      })
      .filter(Boolean) as DepartmentDisplay[];
  }, [departments, activeDept, searchQuery]);

  return (
    <div className="categories-page-layout">
      {/* ── 1. Clean Header Banner ── */}
      <section className="categories-hero-banner">
        <div className="categories-hero-inner">
          <h1 className="categories-title">
            Explore All Categories
          </h1>

          <p className="categories-subtitle">
            Authentic Nigerian luxury pieces, precision tailored by verified master designers.
          </p>

          {/* Search Input */}
          <div className="categories-search-box">
            <Search size={18} color="#6B7280" />
            <input
              type="text"
              className="categories-search-input"
              placeholder="Search pieces, styles, or designers..."
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

      {/* ── 2. Department Tabs (Only departments with live pieces in DB) ── */}
      {departments.length > 0 && (
        <nav className="categories-dept-nav-wrapper" aria-label="Department Navigation">
          <div className="categories-dept-container">
            <button
              type="button"
              className={`dept-pill-btn ${activeDept === 'all' ? 'active' : ''}`}
              onClick={() => setActiveDept('all')}
            >
              <span>All Pieces ({totalPieces})</span>
            </button>
            {departments.map((dept) => (
              <button
                key={dept.slug}
                type="button"
                className={`dept-pill-btn ${activeDept === dept.slug ? 'active' : ''}`}
                onClick={() => setActiveDept(dept.slug)}
              >
                <span>{dept.name} ({dept.products.length})</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* ── 3. Main Product Grid (Clicking ANY cloth opens the product page directly to buy) ── */}
      <main className="categories-main-container">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '35vh', gap: '1rem' }}>
            <Loader size={28} className="spin text-emerald" />
            <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Loading live marketplace pieces...</p>
          </div>
        ) : visibleDepartments.length === 0 ? (
          <div className="categories-empty-state">
            <p>
              {searchQuery
                ? `No pieces found matching "${searchQuery}".`
                : 'New designer collections are currently in tailoring. Check back shortly.'}
            </p>
            {searchQuery && (
              <button
                type="button"
                className="categories-reset-btn"
                onClick={() => {
                  setSearchQuery('');
                  setActiveDept('all');
                }}
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          visibleDepartments.map((dept) => (
            <section key={dept.slug} className="category-dept-section">
              {/* Department Header */}
              <div className="dept-section-header">
                <div className="dept-title-group">
                  <h2>{dept.name}</h2>
                  <p>{dept.products.length} {dept.products.length === 1 ? 'curated piece available' : 'curated pieces available'}</p>
                </div>
                <Link to={dept.viewAll} className="dept-view-all-link">
                  <span>View All {dept.name.split(' ')[0]} Pieces</span>
                  <ArrowRight size={15} />
                </Link>
              </div>

              {/* 2-Column Product Grid (Mobile-First Tap Targets) */}
              <div className="categories-grid">
                {dept.products.map((prod) => (
                  <Link
                    key={prod.id}
                    to={`/products/${prod.slug}`}
                    className="category-page-card"
                    title={`View ${prod.title}`}
                  >
                    {/* Media Container */}
                    <div className="category-card-media">
                      <img
                        src={getProductImage(prod)}
                        alt={prod.title}
                        className="category-card-img"
                        loading="lazy"
                      />
                      <div className="category-card-badge">
                        <Clock size={11} />
                        <span>Made to Order · {prod.preparation_time_days || 5}d</span>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="category-card-body">
                      {prod.vendor?.store_name && (
                        <span className="category-card-vendor">
                          {prod.vendor.store_name}
                        </span>
                      )}
                      <h3 className="category-card-title">{prod.title}</h3>
                      
                      <div className="category-card-footer">
                        <span className="category-price-from">{formatPrice(prod)}</span>
                        <span className="category-explore-cta">
                          <span>Buy Now</span>
                          <ChevronRight size={13} />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  );
};

export default CategoriesPage;
