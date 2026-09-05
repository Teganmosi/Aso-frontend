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
import { categoryApi, productApi } from '../../api/client';
import type { Category, ProductItem } from '../../types';

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
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'DRAFT' | 'OUT_OF_STOCK'>('ALL');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

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
          let statusStr: 'Active' | 'Out of Stock' | 'Draft' | 'Pending Approval' = 'Active';
          if (p.approval_status === 'PENDING') {
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
            image_url: p.primary_image_url || '/traditional-men-1.png',
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
    if (!window.confirm(`Are you sure you want to remove "${name}" from your atelier catalog?`)) {
      return;
    }
    try {
      await productApi.deleteVendorProduct(id);
      setProducts(products.filter((p) => p.id !== id));
    } catch (err) {
      setProducts(products.filter((p) => p.id !== id));
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
      else if (selectedStatus === 'DRAFT') matchesStatus = item.status === 'Draft';
      else if (selectedStatus === 'OUT_OF_STOCK') matchesStatus = item.status === 'Out of Stock';

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

  const activeCount = products.filter((p) => p.status === 'Active').length;
  const pendingCount = products.filter((p) => p.status === 'Pending Approval').length;
  const draftCount = products.filter((p) => p.status === 'Draft').length;

  return (
    <div className="products-list-view">
      {/* Top Header */}
      <div className="dashboard-welcome-header">
        <div>
          <h1 className="dashboard-serif-title">Garment Catalogue & Inventory</h1>
          <p className="dashboard-subtitle">
            Manage your bespoke creations, update live pricing, sizes, and publish new luxury pieces.
          </p>
        </div>
        <button className="btn-action-primary" onClick={onAddNewProduct}>
          <Plus size={16} />
          <span>Upload New Garment</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="product-status-tabs-row">
        <button
          className={`status-filter-tab ${selectedStatus === 'ALL' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('ALL')}
        >
          <span>All Garments</span>
          <span className="count-pill">{products.length}</span>
        </button>
        <button
          className={`status-filter-tab ${selectedStatus === 'ACTIVE' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('ACTIVE')}
        >
          <span>Published & Live</span>
          <span className="count-pill count-active">{activeCount}</span>
        </button>
        <button
          className={`status-filter-tab ${selectedStatus === 'PENDING' ? 'active' : ''}`}
          onClick={() => setSelectedStatus('PENDING')}
        >
          <span>Pending Moderation</span>
          <span className="count-pill count-pending">{pendingCount}</span>
        </button>
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
            placeholder="Search by garment title, SKU or fabric..."
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

      {/* Main Content Area */}
      {loading ? (
        <div className="loading-state-card">
          <div className="storefront-spinner" />
          <p>Syncing atelier inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-products-card">
          <Package size={48} color="#9CA3AF" />
          <h3>No garments found</h3>
          <p>Try refining your search terms or upload a new garment to your collection.</p>
          <button className="btn-action-primary" onClick={onAddNewProduct}>
            <Plus size={16} />
            <span>Upload New Garment</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="products-table-card">
          <table className="styled-inventory-table">
            <thead>
              <tr>
                <th>Garment</th>
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
                    : p.status === 'Pending Approval'
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
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-row-actions">
                        <button
                          className="btn-icon-action"
                          onClick={() => onEditProduct && onEditProduct(p)}
                          title="Edit Garment"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-icon-action danger"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete Garment"
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
                  {p.status}
                </span>
              </div>
              <div className="grid-card-content">
                <span className="grid-cat">{p.category}</span>
                <h4 className="grid-title">{p.name}</h4>
                <div className="grid-bottom-row">
                  <strong className="grid-price">₦ {p.price.toLocaleString()}</strong>
                  <div className="grid-actions">
                    <button
                      className="btn-icon-action"
                      onClick={() => onEditProduct && onEditProduct(p)}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="btn-icon-action danger"
                      onClick={() => handleDeleteProduct(p.id, p.name)}
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
