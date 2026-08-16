import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Edit3, 
  Trash2,
  Clock
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
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [_loading, setLoading] = useState(true);

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
            preparation_time: `${p.preparation_time_days} Days`,
            raw_product: p,
          };
        });
        setProducts(mapped);
      } else {
        // Fallback default sample data if vendor hasn't created any products yet
        setProducts([
          {
            id: 'p1',
            name: 'Indigo Adire Agbada',
            sku: 'ASO-0921-A',
            category: "Men's Traditional",
            price: 145000,
            stock_quantity: 15,
            status: 'Active',
            image_url: '/traditional-men-1.png',
            created_at: 'Oct 12, 2023',
          },
          {
            id: 'p2',
            name: 'Gold Aso-Oke Gele',
            sku: 'ASO-1044-G',
            category: "Women's Accessories",
            price: 32500,
            stock_quantity: 2,
            status: 'Active',
            image_url: '/adire-1.png',
            created_at: 'Nov 05, 2023',
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendorProducts();
  }, []);

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product listing?')) return;
    try {
      await productApi.deleteVendorProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product.');
    }
  };

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All Statuses' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalProducts = products.length;
  const activeListings = products.filter((p) => p.status === 'Active').length;
  const pendingApproval = products.filter((p) => p.status === 'Pending Approval').length;
  const outOfStock = products.filter((p) => p.stock_quantity === 0).length;

  return (
    <div className="designer-products-list-view">
      {/* Top Header */}
      <div className="products-list-header">
        <div>
          <h1 className="dashboard-serif-title">Vendor Dashboard</h1>
          <p className="dashboard-subtitle">Manage your inventory, track status, and update listings.</p>
        </div>
        <button className="btn-primary-emerald" onClick={onAddNewProduct}>
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">TOTAL PRODUCTS</span>
            <div className="stat-icon-wrapper">
              <Package size={18} />
            </div>
          </div>
          <div className="stat-value">{totalProducts}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">ACTIVE LISTINGS</span>
            <div className="stat-icon-wrapper icon-teal">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">{activeListings}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">PENDING APPROVAL</span>
            <div className="stat-icon-wrapper icon-warning">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value text-amber">{pendingApproval}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">OUT OF STOCK</span>
            <div className="stat-icon-wrapper icon-red">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="stat-value text-red">{outOfStock}</div>
        </div>
      </div>

      {/* Filter & Search Bar Row */}
      <div className="products-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="All Categories">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending Approval">Pending Approval</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Products Table Card */}
      <div className="dashboard-card table-card">
        <div className="table-responsive">
          <table className="designer-table">
            <thead>
              <tr>
                <th>PRODUCT</th>
                <th>CATEGORY</th>
                <th>PRICE (₦)</th>
                <th>PREPARATION</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th style={{ textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="table-product-cell">
                      <img 
                        src={product.image_url} 
                        alt={product.name} 
                        className="table-product-thumb" 
                      />
                      <div>
                        <div className="product-title-bold">{product.name}</div>
                        <div className="product-sku-sub">SKU: {product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-secondary">{product.category}</td>
                  <td className="font-mono font-bold">
                    ₦ {product.price.toLocaleString()}
                  </td>
                  <td className="text-secondary">
                    {product.preparation_time || '3 Days'}
                  </td>
                  <td>
                    <span className={`status-badge badge-${product.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="text-secondary">{product.created_at}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-group">
                      {onEditProduct && (
                        <button 
                          className="icon-action-btn" 
                          title="Edit product"
                          onClick={() => onEditProduct(product)}
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      <button 
                        className="icon-action-btn text-red" 
                        title="Delete product"
                        onClick={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="table-pagination-footer">
          <div className="pagination-info">
            Showing 1 to {filteredProducts.length} of 124 entries
          </div>
          <div className="pagination-buttons">
            <button className="page-btn">Previous</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <span className="page-ellipsis">...</span>
            <button className="page-btn">12</button>
            <button className="page-btn">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};
