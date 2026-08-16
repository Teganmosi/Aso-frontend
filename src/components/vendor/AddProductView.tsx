import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  UploadCloud, 
  Bold, 
  Italic, 
  List, 
  Link2, 
  Sparkles, 
  Lightbulb, 
  Check, 
  X, 
  Plus 
} from 'lucide-react';
import { categoryApi, productApi } from '../../api/client';
import type { Category, ProductItem } from '../../types';

interface AddProductViewProps {
  onBack: () => void;
  onSaveProduct?: (product: Partial<ProductItem>) => void;
}

export const AddProductView: React.FC<AddProductViewProps> = ({
  onBack,
  onSaveProduct,
}) => {
  // Form State
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [sku, setSku] = useState('');

  // Variations State
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L']);
  const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Custom Fit'];

  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([
    { name: 'Indigo Blue', hex: '#1E3A8A' },
    { name: 'Terracotta Red', hex: '#991B1B' },
  ]);

  // Shipping & Logistics State
  const [prepTime, setPrepTime] = useState('3-5 Business Days');
  const [shipsFrom, setShipsFrom] = useState('Lagos, LA');

  // Media Thumbnails
  const [images] = useState<string[]>([
    '/traditional-men-1.png',
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    categoryApi.getCategories().then((data) => {
      if (isMounted && data && data.length > 0) {
        setCategories(data);
        setCategoryId(data[0].id);
      }
    }).catch((err) => {
      console.error('Failed to load categories:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const handleAddColor = () => {
    if (colorInput.trim()) {
      setColors([...colors, { name: colorInput.trim(), hex: '#0E4A38' }]);
      setColorInput('');
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handlePublish = async (status: 'Active' | 'Draft') => {
    if (!productName.trim()) {
      alert('Please provide a product title.');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      const numericPrice = parseFloat(price);
      const koboPrice = Math.round(numericPrice * 100);
      let targetCategoryId = categoryId;

      if (!targetCategoryId && categories.length > 0) {
        targetCategoryId = categories[0].id;
      }

      if (!targetCategoryId) {
        alert('Please select a category.');
        setSaving(false);
        return;
      }

      const createdProduct = await productApi.createVendorProduct({
        title: productName,
        category_id: targetCategoryId,
        description: description || 'No description provided.',
        base_price_kobo: koboPrice,
        preparation_time_days: 3,
        status: status === 'Active' ? 'PUBLISHED' : 'DRAFT',
      });

      if (onSaveProduct) {
        onSaveProduct({
          id: createdProduct.id,
          name: createdProduct.title,
          category: createdProduct.category?.name || 'Traditional',
          price: createdProduct.base_price_naira,
          stock_quantity: parseInt(stockQuantity) || 10,
          sku: createdProduct.slug,
          status: createdProduct.approval_status === 'PENDING' ? 'Pending Approval' : (status === 'Active' ? 'Active' : 'Draft'),
          description: createdProduct.description,
          image_url: createdProduct.primary_image_url || '/traditional-men-1.png',
        });
      }

      alert(`Product "${createdProduct.title}" submitted successfully! It is now pending approval by admin moderation.`);
      onBack();
    } catch (err: any) {
      console.error('Failed to create vendor product:', err);
      const errMsg = err?.response?.data ? JSON.stringify(err.response.data) : 'Failed to publish product. Please check your backend connection.';
      alert(`Error creating product: ${errMsg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="designer-add-product-container">
      {/* Top Navigation Back Button */}
      <div className="add-product-top-bar">
        <button className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={18} />
          <span className="font-serif font-bold text-lg">Add New Product</span>
        </button>
      </div>

      <div className="add-product-layout">
        {/* Left Column - Main Form Cards */}
        <div className="add-product-main-col">
          {/* Card 1: Basic Information */}
          <div className="dashboard-card form-card">
            <h3 className="card-section-title">Basic Information</h3>
            <p className="card-section-desc">Provide the primary details that describe your product.</p>

            <div className="form-group">
              <label className="form-label">
                Product Name <span className="text-red">*</span>
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., Handwoven Aso-Oke Agbada Set"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Category <span className="text-red">*</span>
              </label>
              <select
                className="input-field"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories.length === 0 && <option value="">Loading categories...</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <div className="rich-editor-toolbar">
                <button type="button" className="toolbar-btn" title="Bold"><Bold size={14} /></button>
                <button type="button" className="toolbar-btn" title="Italic"><Italic size={14} /></button>
                <button type="button" className="toolbar-btn" title="Bullet list"><List size={14} /></button>
                <button type="button" className="toolbar-btn" title="Insert link"><Link2 size={14} /></button>
              </div>
              <textarea
                className="input-field editor-textarea"
                rows={5}
                placeholder="Detail the craftsmanship, fabric origins, and styling suggestions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: Media */}
          <div className="dashboard-card form-card">
            <div className="card-header-flex">
              <div>
                <h3 className="card-section-title">Media</h3>
                <p className="card-section-desc">Upload high-resolution images (3:4 ratio recommended) and a short video.</p>
              </div>
              <span className="media-count-badge">{images.length} / 5 Max</span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              className="dropzone-box"
              onClick={() => alert('Simulating file selector dialog...')}
            >
              <div className="dropzone-icon-circle">
                <UploadCloud size={24} className="text-emerald" />
              </div>
              <p className="dropzone-prompt">
                <strong>Click to upload</strong> or drag and drop
              </p>
              <span className="dropzone-sub">SVG, PNG, JPG or MP4 (max. 10MB)</span>
            </div>

            {/* Thumbnail Slots Row */}
            <div className="thumbnails-grid">
              {images.map((img, idx) => (
                <div className="thumbnail-slot filled" key={idx}>
                  <img src={img} alt="Product thumbnail" />
                  {idx === 0 && <span className="cover-badge">Cover</span>}
                </div>
              ))}
              {Array.from({ length: 5 - images.length }).map((_, idx) => (
                <div className="thumbnail-slot empty" key={idx}>
                  <UploadCloud size={16} className="text-muted" />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Pricing & Inventory */}
          <div className="dashboard-card form-card">
            <h3 className="card-section-title">Pricing & Inventory</h3>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">
                  Price (Naira) <span className="text-red">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="₦ 0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Stock Quantity <span className="text-red">*</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="e.g., 50"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">SKU (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g., ASO-AGB-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />
            </div>
          </div>

          {/* Card 4: Variations */}
          <div className="dashboard-card form-card">
            <h3 className="card-section-title">Variations</h3>
            <p className="card-section-desc">Select available sizes and add colors.</p>

            {/* Available Sizes Chips */}
            <div className="form-group">
              <label className="form-label">Available Sizes</label>
              <div className="sizes-chips-row">
                {ALL_SIZES.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      type="button"
                      key={size}
                      className={`size-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleSize(size)}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colors Input & Chips */}
            <div className="form-group">
              <label className="form-label">Colors</label>
              <div className="color-add-row">
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Indigo Blue"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                />
                <button type="button" className="btn-add-color" onClick={handleAddColor}>
                  <Plus size={14} /> Add
                </button>
              </div>

              <div className="color-tags-row">
                {colors.map((color, idx) => (
                  <span className="color-tag" key={idx}>
                    <span 
                      className="color-swatch-dot" 
                      style={{ backgroundColor: color.hex }}
                    ></span>
                    <span>{color.name}</span>
                    <button 
                      type="button" 
                      className="remove-color-btn" 
                      onClick={() => handleRemoveColor(idx)}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 5: Shipping & Logistics */}
          <div className="dashboard-card form-card">
            <h3 className="card-section-title">Shipping & Logistics</h3>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Estimated Preparation Time</label>
                <select
                  className="input-field"
                  value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                >
                  <option value="3-5 Business Days">3-5 Business Days</option>
                  <option value="1-2 Weeks (Bespoke)">1-2 Weeks (Bespoke)</option>
                  <option value="Ready to Ship (24 hrs)">Ready to Ship (24 hrs)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Ships From (City, State)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Lagos, LA"
                  value={shipsFrom}
                  onChange={(e) => setShipsFrom(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Status & Quality Standards */}
        <div className="add-product-sidebar">
          {/* Card: Publishing Status */}
          <div className="dashboard-card sidebar-card">
            <h4 className="sidebar-card-title">Publishing Status</h4>
            <div className="status-indicator-row">
              <span className="status-dot-gray"></span>
              <span className="text-secondary font-medium">Draft</span>
            </div>

            <div className="publishing-actions">
              <button 
                type="button"
                className="btn-primary-emerald w-full"
                onClick={() => handlePublish('Active')}
                disabled={saving}
              >
                <Sparkles size={16} />
                <span>{saving ? 'Publishing...' : 'Publish Product'}</span>
              </button>

              <button 
                type="button"
                className="btn-secondary-outline w-full"
                onClick={() => handlePublish('Draft')}
                disabled={saving}
              >
                Save as Draft
              </button>
            </div>
          </div>

          {/* Card: Quality Standards Checklist */}
          <div className="dashboard-card sidebar-card quality-card">
            <div className="quality-header-row">
              <Lightbulb size={18} className="text-emerald" />
              <h4 className="sidebar-card-title">Quality Standards</h4>
            </div>

            <ul className="quality-checklist">
              <li>
                <Check size={14} className="text-emerald" />
                <span>Ensure images clearly show fabric texture.</span>
              </li>
              <li>
                <Check size={14} className="text-emerald" />
                <span>Descriptions should highlight cultural origin.</span>
              </li>
              <li>
                <Check size={14} className="text-emerald" />
                <span>Custom fit requires a minimum 2-week prep time.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
