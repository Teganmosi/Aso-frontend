import React, { useEffect, useState, useMemo } from 'react';
import { 
  Plus, 
  Package, 
  Search, 
  Edit3, 
  Trash2,
  Clock,
  Layers
} from 'lucide-react';
import { categoryApi, productApi, apiErrorMessage } from '../../api/client';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { Category, ProductItem } from '../../types';

/** What the designer sees on each piece. Pieces go live on publish; Aso can take one down. */
const statusLabel = (status: ProductItem['status']): string => ({
  Active: 'Live',
  'Pending Approval': 'Going live',
  'Changes Requested': 'Taken down',
} as Record<string, string>)[status] || status;

interface ProductsListViewProps {
  onAddNewProduct: () => void;
  onEditProduct?: (product: ProductItem) => void;
}

export const ProductsListView: React.FC<ProductsListViewProps> = ({
  onAddNewProduct,
  onEditProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'CHANGES' | 'DRAFT' | 'OUT_OF_STOCK'>('ALL');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  // The table needs a wide screen; phones start on cards.
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'table'));
  useEffect(() => { if (isMobile) setViewMode('grid'); }, [isMobile]);

  const loadVendorProducts = async () => {
    setLoading(true);
    try {
      const [rawProducts, catData] = await Promise.all([
        productApi.getVendorProducts().catch(() => []),
        categoryApi.getCategories().catch(() => []),
      ]);

      setCategories(catData);

      if (rawProducts && rawProducts.length > 0) {
        const mapped: ProductItem[] = rawProducts.map((p) => {
          let statusStr: ProductItem['status'] = 'Active';
          if (p.approval_status === 'REJECTED') {
            // Not live: the designer must edit and resubmit (was wrongly shown as "Active").
            statusStr = 'Changes Requested';
          } else if (p.approval_status === 'PENDING') {
            statusStr = 'Pending Approval';
          } else if (p.status === 'DRAFT') {
            statusStr = 'Draft';
          } else if (p.status === 'PUBLISHED') {
            statusStr = 'Active';
          }

          return {
            id: p.id,
            name: p.title,
            sku: p.slug,
            category: p.category?.name || 'Uncategorized',
            price: p.base_price_naira,
            stock_quantity: 10,
            status: statusStr,
            rejection_reason: p.rejection_reason ?? null,
            image_url: p.primary_image_url || '/placeholder-piece.svg',
            created_at: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            description: p.description,
            preparation_time: `${p.preparation_time_days || 3} Days`,
            raw_product: p,
          };
        });
        setProducts(mapped);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Error fetching vendor products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorProducts();
  }, []);

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from your studio? Shoppers won’t be able to buy it any more. Past orders are kept.`)) {
      return;
    }
    try {
      await productApi.deleteVendorProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      window.alert(apiErrorMessage(err, `We couldn’t remove "${name}". Please try again.`));
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory =
        selectedCategory === 'All Categories' || item.category === selectedCategory;

      let matchesStatus = true;
      if (selectedStatus === 'ACTIVE') matchesStatus = item.status === 'Active';
      else if (selectedStatus === 'PENDING') matchesStatus = item.status === 'Pending Approval';
      else if (selectedStatus === 'CHANGES') matchesStatus = item.status === 'Changes Requested';
      else if (selectedStatus === 'DRAFT') matchesStatus = item.status === 'Draft';
      else if (selectedStatus === 'OUT_OF_STOCK') matchesStatus = item.status === 'Out of Stock';

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  const activeCount = products.filter((p) => p.status === 'Active').length;
  const pendingCount = products.filter((p) => p.status === 'Pending Approval').length;
  const draftCount = products.filter((p) => p.status === 'Draft').length;
  const changesCount = products.filter((p) => p.status === 'Changes Requested').length;
  const hasNoPieces = !loading && products.length === 0;
  const clearFilters = () => { setSearchQuery(''); setSelectedCategory('All Categories'); setSelectedStatus('ALL'); };

  return (
    <div className="products-list-view">
      {/* Top Header */}
      <div className="dashboard-welcome-header">
        <div>
          <h1 className="dashboard-serif-title">Your pieces</h1>
          <p className="dashboard-subtitle">
            Add and edit your pieces. They go live as soon as you publish them.
          </p>
        </div>
        <button className="btn-action-primary" onClick={onAddNewProduct}>
          <Plus size={16} />
          <span>Add a piece</span>
        </button>
      </div>

      {/* Status Filter Tabs (hidden until there is something to filter) */}
      {!hasNoPieces && (<>
      <div className="product-status-tabs-row">
        <button
          className={`status-filter-tab ${selectedStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('ALL')}
        >
          <span>All</span>
          <span className="count-pill">{products.length}</span>
        </button>
        <button
          className={`status-filter-tab ${selectedStatus === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('ACTIVE')}
        >
          <span>Live</span>
          <span className="count-pill count-active">{activeCount}</span>
        </button>
        {/* Pieces no longer wait for review; this only shows for any left over from before. */}
        {pendingCount > 0 && (
          <button
            className={`status-filter-tab ${selectedStatus === 'PENDING' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('PENDING')}
          >
            <span>Going live</span>
            <span className="count-pill count-pending">{pendingCount}</span>
          </button>
        )}
        {changesCount > 0 && (
          <button
            className={`status-filter-tab ${selectedStatus === 'CHANGES' ? 'active' : ''}`}
            onClick={() => setSelectedStatus('CHANGES')}
          >
            <span>Taken down</span>
            <span className="count-pill count-pending">{changesCount}</span>
          </button>
        )}
        <button
          className={`status-filter-tab ${selectedStatus === 'DRAFT' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('DRAFT')}
        >
          <span>Drafts</span>
          <span className="count-pill">{draftCount}</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="products-controls-bar">
        <div className="search-box-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search your pieces"
            aria-label="Search your pieces"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>

        <div className="category-select-wrapper">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="styled-select"
          >
            <option value="All Categories">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="view-mode-toggle">
          <button
            className={`mode-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="Table View"
          >
            <Layers size={16} />
          </button>
          <button
            className={`mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <Package size={16} />
          </button>
        </div>
      </div>
      </>)}

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-state-card">
          <div className="storefront-spinner" />
          <p>Loading your pieces…</p>
        </div>
      ) : hasNoPieces ? (
        <div className="empty-products-card">
          <Package size={48} color="#9CA3AF" />
          <h3>Add your first piece</h3>
          <p>Upload clear photos, set a price and the sizes you make. It goes live on Aso as soon as you publish it.</p>
          <button className="btn-action-primary" onClick={onAddNewProduct}>
            <Plus size={16} />
            <span>Add a piece</span>
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-products-card">
          <Package size={48} color="#9CA3AF" />
          <h3>No pieces match</h3>
          <p>Try another search or tab.</p>
          <button className="btn-action-primary" onClick={clearFilters}>
            <span>Show all pieces</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="products-table-card">
          <table className="styled-inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price (₦)</th>
                <th>Turnaround</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const statusClass =
                  p.status === 'Active'
                    ? 'pill-active'
                    : p.status === 'Pending Approval' || p.status === 'Changes Requested'
                    ? 'pill-pending'
                    : 'pill-draft';

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="product-table-identity">
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="table-product-thumb"
                        />
                        <div>
                          <strong className="table-product-title">{p.name}</strong>
                          <span className="table-sku">SKU: {p.sku}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-category-tag">{p.category}</span>
                    </td>
                    <td>
                      <strong className="table-price">₦ {p.price.toLocaleString()}</strong>
                    </td>
                    <td>
                      <div className="prep-time-badge">
                        <Clock size={12} />
                        <span>{p.preparation_time || '3 Days'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`inventory-status-pill ${statusClass}`}>
                        {statusLabel(p.status)}
                      </span>
                      {p.status === 'Changes Requested' && p.rejection_reason && (
                        <div style={{ fontSize: '0.75rem', color: '#92400E', marginTop: '0.35rem', maxWidth: '240px' }}>
                          {p.rejection_reason} <em>Fix it and save to put it back live.</em>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table-row-actions">
                        <button
                          className="btn-icon-action"
                          onClick={() => onEditProduct && onEditProduct(p)}
                          title="Edit piece"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-icon-action danger"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Remove piece"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="products-grid-view-layout">
          {filteredProducts.map((p) => (
            <div key={p.id} className="grid-product-card">
              <div className="grid-card-img-wrap">
                <img src={p.image_url} alt={p.name} />
                <span className={`grid-status-badge ${p.status === 'Active' ? 'active' : 'pending'}`}>
                  {statusLabel(p.status)}
                </span>
              </div>
              <div className="grid-card-content">
                <span className="grid-cat">{p.category}</span>
                <h4 className="grid-title">{p.name}</h4>
                {p.status === 'Changes Requested' && p.rejection_reason && (
                  <p style={{ fontSize: '0.78rem', color: '#92400E', margin: '0.25rem 0 0.5rem', lineHeight: 1.4 }}>
                    <strong>Why it was taken down:</strong> {p.rejection_reason} Fix it and save to put it back live.
                  </p>
                )}
                <div className="grid-bottom-row">
                  <strong className="grid-price">₦ {p.price.toLocaleString()}</strong>
                  <div className="grid-actions">
                    <button
                      className="btn-icon-action"
                      onClick={() => onEditProduct && onEditProduct(p)}
                      aria-label={`Edit ${p.name}`}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn-icon-action danger"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      aria-label={`Remove ${p.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsListView;
