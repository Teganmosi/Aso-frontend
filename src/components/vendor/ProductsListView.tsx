import React, { useState } from 'react';
import { 
  Plus, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  MoreVertical 
} from 'lucide-react';
import type { ProductItem } from '../../types';

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

  const [products] = useState<ProductItem[]>([
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
    {
      id: 'p3',
      name: 'Embroidered Urban Hoodie',
      sku: 'ASO-0812-S',
      category: 'Streetwear',
      price: 58000,
      stock_quantity: 0,
      status: 'Out of Stock',
      image_url: '/streetwear-4.png',
      created_at: 'Sep 28, 2023',
    },
    {
      id: 'p4',
      name: 'Silk Batik Kaftan',
      sku: 'ASO-1105-K',
      category: "Women's Wear",
      price: 85000,
      stock_quantity: 42,
      status: 'Draft',
      image_url: '/adire-2.png',
      created_at: 'Dec 01, 2023',
    },
  ]);

  const filteredProducts = products.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Categories' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All Statuses' || item.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
          <div className="stat-value">124</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">ACTIVE LISTINGS</span>
            <div className="stat-icon-wrapper icon-teal">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value">112</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">OUT OF STOCK</span>
            <div className="stat-icon-wrapper icon-red">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="stat-value text-red">3</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">LOW INVENTORY</span>
            <div className="stat-icon-wrapper icon-warning">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="stat-value text-amber">9</div>
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
          <option value="Men's Traditional">Men's Traditional</option>
          <option value="Women's Accessories">Women's Accessories</option>
          <option value="Women's Wear">Women's Wear</option>
          <option value="Streetwear">Streetwear</option>
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="All Statuses">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Out of Stock">Out of Stock</option>
          <option value="Draft">Draft</option>
        </select>

        <button className="btn-filter-more" onClick={() => alert('Advanced filters dialog')}>
          <Filter size={16} />
          <span>More Filters</span>
        </button>
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
                <th>INVENTORY</th>
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
                  <td>
                    <span className={
                      product.stock_quantity === 0
                        ? 'text-red font-medium'
                        : product.stock_quantity <= 5
                        ? 'text-amber font-medium'
                        : 'text-dark font-medium'
                    }>
                      {product.stock_quantity} in stock
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge badge-${product.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="text-secondary">{product.created_at}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-actions-group">
                      <button 
                        className="icon-action-btn" 
                        title="Edit product"
                        onClick={() => onEditProduct && onEditProduct(product)}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button className="icon-action-btn" title="Preview storefront view">
                        <Eye size={16} />
                      </button>
                      <button className="icon-action-btn" title="More options">
                        <MoreVertical size={16} />
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
