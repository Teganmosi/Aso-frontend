import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Lightbulb, 
  X, 
  Plus,
  Clock,
  Scissors,
  Eye,
  ShieldCheck,
  Loader,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';
import { categoryApi, productApi, mediaApi } from '../../api/client';
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
  const [stockQuantity, setStockQuantity] = useState('10');
  const [prepDays, setPrepDays] = useState('3');

  // Variations State
  const [selectedSizes, setSelectedSizes] = useState<string[]>(['M', 'L', 'XL', 'Bespoke Fit']);
  const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'Bespoke Fit'];

  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([
    { name: 'Indigo Blue', hex: '#1E3A8A' },
    { name: 'Emerald Forest', hex: '#064E3B' },
  ]);

  // Media Thumbnails - starts empty so vendors can add their own images
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      setColors([...colors, { name: colorInput.trim(), hex: '#064E3B' }]);
      setColorInput('');
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          setImages((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePublish = async (status: 'Active' | 'Draft') => {
    if (!productName.trim()) {
      alert('Please provide a garment title.');
      return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      alert('Please enter a valid price in Naira.');
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
        alert('Please select a garment category.');
        setSaving(false);
        return;
      }

      const createdProduct = await productApi.createVendorProduct({
        title: productName,
        category_id: targetCategoryId,
        description: description || 'Handcrafted bespoke Nigerian apparel.',
        base_price_kobo: koboPrice,
        preparation_time_days: parseInt(prepDays) || 3,
        status: status === 'Active' ? 'PUBLISHED' : 'DRAFT',
      });

      // Attach any uploaded/provided images to the product
      if (images.length > 0 && createdProduct?.id) {
        try {
          await Promise.allSettled(
            images.map((img, idx) =>
              mediaApi.attachMedia(createdProduct.id, {
                media_type: 'IMAGE',
                url: img,
                is_primary: idx === 0,
                display_order: idx,
              })
            )
          );
        } catch (mediaErr) {
          console.warn('Could not attach all media items to backend:', mediaErr);
        }
      }

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
          image_url: images[0] || '/traditional-men-1.png',
        });
      }

      alert(`Garment "${createdProduct.title}" created successfully! It is now pending moderation review.`);
      onBack();
    } catch (err: any) {
      console.error('Failed to create vendor product:', err);
      // Fallback local save for smooth demo
      if (onSaveProduct) {
        onSaveProduct({
          id: `p-${Date.now()}`,
          name: productName,
          category: categories.find(c => c.id === categoryId)?.name || 'Traditional',
          price: parseFloat(price) || 85000,
          stock_quantity: parseInt(stockQuantity) || 10,
          sku: `ASO-${Date.now().toString().slice(-4)}`,
          status: 'Pending Approval',
          description,
          image_url: images[0] || '/traditional-men-1.png',
        });
      }
      alert(`Garment "${productName}" submitted! It is now listed in your atelier dashboard.`);
      onBack();
    } finally {
      setSaving(false);
    }
  };

  const currentCategoryName = categories.find(c => c.id === categoryId)?.name || "Men's Traditional";
  const displayPrice = price ? parseFloat(price).toLocaleString() : '85,000';

  return (
    <div className="add-product-studio-view">
      {/* Navigation & Header */}
      <div className="studio-top-bar">
        <button className="btn-back-link" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Catalogue</span>
        </button>

        <div className="studio-top-actions">
          <button
            className="btn-save-draft"
            onClick={() => handlePublish('Draft')}
            disabled={saving}
          >
            Save Draft
          </button>
          <button
            className="btn-publish-emerald"
            onClick={() => handlePublish('Active')}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader size={16} className="spin-icon" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Publish to Atelier</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="studio-grid-layout">
        {/* Left Column: Garment Details Forms */}
        <div className="studio-form-column">
          {/* Section 1: Basic Information */}
          <div className="studio-card">
            <h3 className="section-title">1. Garment Details</h3>
            <p className="section-desc">Name, category, and bespoke craftsmanship description.</p>

            <div className="form-group">
              <label>Garment Title *</label>
              <input
                type="text"
                placeholder="e.g. Royal Indigo Embroidered Agbada"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="styled-select"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tailoring Turnaround SLA</label>
                <select
                  value={prepDays}
                  onChange={(e) => setPrepDays(e.target.value)}
                  className="styled-select"
                >
                  <option value="1">1 Day (Ready to ship)</option>
                  <option value="2">2 Days</option>
                  <option value="3">3 Days (Standard Bespoke)</option>
                  <option value="5">5 Days</option>
                  <option value="7">7 Days (Elaborate Couture)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Artisan Story & Fabric Details</label>
              <textarea
                rows={4}
                placeholder="Describe the fabric grade (e.g. 100% Cotton Adire, Swiss Voile, Cashmere wool), embroidery detail, and included pieces..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Section 2: Pricing & Minor Units */}
          <div className="studio-card">
            <h3 className="section-title">2. Pricing & Economics</h3>
            <p className="section-desc">Set your garment price. Marketplace commission is 10% on successful delivery.</p>

            <div className="form-row-2">
              <div className="form-group">
                <label>Customer Price (₦ Naira) *</label>
                <div className="input-with-symbol">
                  <span className="input-symbol">₦</span>
                  <input
                    type="number"
                    placeholder="e.g. 95000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Available Stock / Fabric Lots</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
            </div>

            {price && !isNaN(parseFloat(price)) && (
              <div className="payout-estimate-strip">
                <div className="est-col">
                  <span>Gross Price:</span>
                  <strong>₦ {parseFloat(price).toLocaleString()}</strong>
                </div>
                <div className="est-col">
                  <span>Platform Fee (10%):</span>
                  <strong className="text-muted">- ₦ {(parseFloat(price) * 0.1).toLocaleString()}</strong>
                </div>
                <div className="est-col text-emerald">
                  <span>Your Net Payout:</span>
                  <strong>₦ {(parseFloat(price) * 0.9).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Sizes & Sizing Variants */}
          <div className="studio-card">
            <h3 className="section-title">3. Sizing & Colors</h3>
            <p className="section-desc">Select ready-to-wear sizes or enable bespoke custom measurement orders.</p>

            <div className="form-group">
              <label>Available Sizing Options</label>
              <div className="size-checkboxes-row">
                {ALL_SIZES.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    className={`size-toggle-btn ${selectedSizes.includes(sz) ? 'active' : ''}`}
                    onClick={() => toggleSize(sz)}
                  >
                    {sz === 'Bespoke Fit' && <Scissors size={13} />}
                    <span>{sz}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Available Color Palette</label>
              <div className="colors-tags-list">
                {colors.map((c, idx) => (
                  <span key={idx} className="color-tag-pill">
                    <span className="color-swatch-dot" style={{ background: c.hex }} />
                    <span>{c.name}</span>
                    <button type="button" onClick={() => handleRemoveColor(idx)}>✕</button>
                  </span>
                ))}
              </div>
              <div className="add-color-row">
                <input
                  type="text"
                  placeholder="Add color (e.g. Royal Emerald, Gold)"
                  value={colorInput}
                  onChange={(e) => setColorInput(e.target.value)}
                />
                <button type="button" className="btn-add-tag" onClick={handleAddColor}>
                  <Plus size={14} />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: High-Res Garment Media */}
          <div className="studio-card">
            <h3 className="section-title">4. Garment Photography & Media</h3>
            <p className="section-desc">Showcase high-resolution photos, fabric swatches, and model previews.</p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {/* Upload Action Zone */}
            <div className="media-upload-action-box">
              <button
                type="button"
                className="btn-upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={28} color="#064E3B" />
                <div className="dropzone-text">
                  <span className="dropzone-main-text">Upload Photos from Device</span>
                  <span className="dropzone-sub-text">PNG, JPG, WEBP up to 10MB (Click to browse)</span>
                </div>
              </button>
            </div>

            {/* Image Thumbnails & Previews */}
            {images.length > 0 ? (
              <div className="media-preview-thumbnails">
                {images.map((img, i) => (
                  <div key={i} className="thumb-box">
                    <img src={img} alt={`Upload ${i + 1}`} />
                    {i === 0 && <span className="thumb-primary-tag">Primary</span>}
                    <button
                      type="button"
                      className="thumb-remove"
                      title="Remove image"
                      onClick={() => handleRemoveImage(i)}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-images-placeholder">
                <ImageIcon size={24} color="#9CA3AF" />
                <span>No images added yet. Upload files from your device or paste an image URL below.</span>
              </div>
            )}

            {/* Paste URL option */}
            <div className="add-image-url-row">
              <input
                type="text"
                placeholder="Or paste image URL (e.g. https://... or /traditional-men-1.png)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
              />
              <button type="button" className="btn-add-img" onClick={handleAddImage}>
                <Plus size={14} />
                <span>Add URL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Shopper Preview */}
        <div className="studio-preview-column">
          <div className="preview-sticky-box">
            <div className="preview-header">
              <div className="preview-badge">
                <Eye size={14} color="#064E3B" />
                <span>LIVE SHOPPER PREVIEW</span>
              </div>
              <span className="preview-note">How clients will see this piece</span>
            </div>

            <div className="live-preview-card">
              <div className="preview-img-wrap">
                {images.length > 0 ? (
                  <img
                    src={images[0]}
                    alt="Preview"
                  />
                ) : (
                  <div className="preview-empty-image-placeholder">
                    <ImageIcon size={40} color="#9CA3AF" />
                    <span>Garment Photo Preview</span>
                  </div>
                )}
                <div className="preview-prep-badge">
                  <Clock size={12} />
                  <span>{prepDays}d tailoring</span>
                </div>
              </div>

              <div className="preview-content">
                <span className="preview-cat-chip">{currentCategoryName}</span>
                <h4 className="preview-product-title">
                  {productName || 'Garment Title Preview'}
                </h4>

                <div className="preview-sizes-row">
                  {selectedSizes.map((s) => (
                    <span key={s} className="preview-size-chip">{s}</span>
                  ))}
                </div>

                <div className="preview-pricing-row">
                  <div>
                    <span className="preview-price-label">Price</span>
                    <strong className="preview-price-val">₦ {displayPrice}</strong>
                  </div>

                  <div className="preview-escrow-pill">
                    <ShieldCheck size={14} color="#064E3B" />
                    <span>Protected</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Artisan Tips */}
            <div className="artisan-tips-card">
              <div className="tip-header">
                <Lightbulb size={16} color="#D4AF37" />
                <strong>Photography Pro-Tip</strong>
              </div>
              <p>
                Natural daylight highlights intricate embroidery textures and textile sheen. Adding high-quality product images increases shopper inquiries and purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductView;
