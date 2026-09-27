import React, { useEffect, useState, useRef } from 'react';
import {
  X, 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Loader, 
  UploadCloud, 
  Check, 
  AlertCircle,
  Package,
  Image as ImageIcon,
  Shirt,
  Gem,
  Crown,
  Layers,
  Ruler,
  Palette,
  CheckCircle2,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';
import { categoryApi, productApi, mediaApi } from '../../api/client';
import type { Category, ProductItem, CreateProductPayload } from '../../types';
import './AddProductView.css';

interface AddProductViewProps {
  onBack: () => void;
  onSaveProduct?: (product: Partial<ProductItem>) => void;
  productToEdit?: ProductItem | null;
}

// Department / Target Audience Taxonomy
export type DepartmentType = 'Men' | 'Women' | 'Traditional & Bridal';

interface DepartmentOption {
  id: DepartmentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const DEPARTMENTS: DepartmentOption[] = [
  { id: 'Men', label: 'Men', icon: <Shirt size={18} />, description: 'Senators, Agbadas, Kaftans & Two-Piece Sets' },
  { id: 'Women', label: 'Women', icon: <Gem size={18} />, description: 'Aso Ebi, Boubous, Corset Gowns & Co-ords' },
  { id: 'Traditional & Bridal', label: 'Traditional', icon: <Crown size={18} />, description: 'Handwoven Aso Oke, Groom/Bride Regalia & Ceremonial Attire' }
];

// Universal Apparel Sizing Presets
export type SizingSystem = 'STANDARD' | 'CUSTOM';

const SIZING_PRESETS: Record<SizingSystem, { label: string; icon: React.ReactNode; sizes: string[]; hint: string }> = {
  STANDARD: {
    label: 'Standard Sizing (XS–4XL)',
    icon: <Layers size={15} />,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    hint: 'Best for ready-to-wear Senator suits, Kaftans, Agbadas, Gowns, and native sets'
  },
  CUSTOM: {
    label: 'Custom / Bespoke',
    icon: <Ruler size={15} />,
    sizes: ['Custom Measurements (Bespoke)'],
    hint: 'Customer provides exact body measurements (chest, waist, shoulder, sleeve length, etc.) at checkout'
  }
};

const PRESET_COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'Navy Blue', hex: '#1E3A8A' },
  { name: 'Emerald Green', hex: '#064E3B' },
  { name: 'Pure White', hex: '#F9FAFB' },
  { name: 'Royal Gold', hex: '#D97706' },
  { name: 'Burgundy / Wine', hex: '#831843' },
  { name: 'Charcoal Grey', hex: '#4B5563' },
  { name: 'Champagne / Cream', hex: '#FEF3C7' },
];

export const AddProductView: React.FC<AddProductViewProps> = ({
  onBack,
  onSaveProduct,
  productToEdit,
}) => {
  const isEditing = Boolean(productToEdit);

  // 1. Department & Category State
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType>('Men');
  const [categoryId, setCategoryId] = useState<string>(
    productToEdit?.raw_product?.category?.id || ''
  );
  const [categories, setCategories] = useState<Category[]>([]);

  // 2. Product Information
  const [productName, setProductName] = useState(productToEdit?.name || '');
  const [description, setDescription] = useState(
    productToEdit?.description || productToEdit?.raw_product?.description || ''
  );
  const [price, setPrice] = useState(
    productToEdit?.price ? productToEdit.price.toString() : ''
  );

  // 3. Fulfillment & Inventory Model
  const [fulfillmentMode, setFulfillmentMode] = useState<'MADE_TO_ORDER' | 'READY_TO_WEAR'>('MADE_TO_ORDER');
  const [prepDays, setPrepDays] = useState(
    productToEdit?.raw_product?.preparation_time_days
      ? productToEdit.raw_product.preparation_time_days.toString()
      : '3'
  );
  const [stockQuantity, setStockQuantity] = useState(
    productToEdit?.stock_quantity ? productToEdit.stock_quantity.toString() : '5'
  );

  // 4. Universal Sizing Engine State
  const [activeSizingSystem, setActiveSizingSystem] = useState<SizingSystem>('STANDARD');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
    if (productToEdit?.raw_product?.available_sizes?.length) {
      return productToEdit.raw_product.available_sizes;
    }
    if (productToEdit?.sizes?.length) {
      return productToEdit.sizes;
    }
    return ['S', 'M', 'L', 'XL'];
  });
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customSizes, setCustomSizes] = useState<string[]>([]);

  // 5. Fabric & Garment Cut Specs
  const [stretchLevel, setStretchLevel] = useState<'NON' | 'SLIGHT' | 'MEDIUM' | 'HIGH'>(
    (productToEdit?.raw_product?.size_chart?.stretch as any) || 'NON'
  );
  const [garmentCut, setGarmentCut] = useState<'SLIM' | 'REGULAR' | 'OVERSIZED' | 'TAILORED'>(
    (productToEdit?.raw_product?.size_chart?.garment_type as any) || 'TAILORED'
  );

  // 6. Color Selection & Custom Colorways
  const [availableColors, setAvailableColors] = useState<{ name: string; hex: string }[]>(() => {
    const list = [...PRESET_COLORS];
    if (productToEdit?.colors?.length) {
      productToEdit.colors.forEach((cName) => {
        if (!list.some((p) => p.name.toLowerCase() === cName.toLowerCase())) {
          list.push({ name: cName, hex: '#8B5CF6' });
        }
      });
    }
    return list;
  });

  const [colors, setColors] = useState<{ name: string; hex?: string }[]>(() => {
    if (productToEdit?.colors?.length) {
      return productToEdit.colors.map((c) => ({
        name: c,
        hex: PRESET_COLORS.find((p) => p.name.toLowerCase() === c.toLowerCase())?.hex || '#064E3B',
      }));
    }
    return [{ name: 'Emerald Green', hex: '#064E3B' }];
  });

  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#8B5CF6');

  // 7. Media Gallery & Uploads
  const [images, setImages] = useState<string[]>(() => {
    if (productToEdit?.raw_product?.media?.length) {
      return productToEdit.raw_product.media.map((m) => m.url);
    }
    if (productToEdit?.image_url) {
      return [productToEdit.image_url];
    }
    return [];
  });

  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form Submission States
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch Categories
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await categoryApi.getCategories();
        const catList = Array.isArray(res) ? res : ((res as any)?.results || []);
        setCategories(catList);
        if (catList.length > 0 && !categoryId) {
          setCategoryId(catList[0].id);
        }
      } catch (err) {
        console.warn('Could not load categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Department switch
  const handleDepartmentSelect = (dept: DepartmentType) => {
    setSelectedDepartment(dept);
    if (dept === 'Traditional & Bridal') {
      setActiveSizingSystem('STANDARD');
      setSelectedSizes(SIZING_PRESETS.STANDARD.sizes);
    } else {
      setActiveSizingSystem('STANDARD');
      setSelectedSizes(SIZING_PRESETS.STANDARD.sizes);
    }
  };

  // Toggle Sizing System Preset
  const handleSizingSystemSelect = (sys: SizingSystem) => {
    setActiveSizingSystem(sys);
    setSelectedSizes(SIZING_PRESETS[sys].sizes);
  };

  // Toggle Individual Size Chip
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length > 1) {
        setSelectedSizes(selectedSizes.filter((s) => s !== size));
      }
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Add Custom Size
  const handleAddCustomSize = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSizeInput.trim();
    if (trimmed) {
      if (!customSizes.includes(trimmed)) {
        setCustomSizes((prev) => [...prev, trimmed]);
      }
      if (!selectedSizes.includes(trimmed)) {
        setSelectedSizes((prev) => [...prev, trimmed]);
      }
      setCustomSizeInput('');
    }
  };

  const handleRemoveCustomSize = (sizeToRemove: string) => {
    setCustomSizes((prev) => prev.filter((s) => s !== sizeToRemove));
    setSelectedSizes((prev) => prev.filter((s) => s !== sizeToRemove));
  };

  // Toggle Color Swatch
  const toggleColor = (preset: { name: string; hex: string }) => {
    const exists = colors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
    if (exists) {
      if (colors.length > 1) {
        setColors(colors.filter((c) => c.name.toLowerCase() !== preset.name.toLowerCase()));
      }
    } else {
      setColors([...colors, preset]);
    }
  };

  const handleAddCustomColor = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customColorName.trim();
    if (!trimmed) return;

    const existing = availableColors.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    const newColor = existing || { name: trimmed, hex: customColorHex };

    if (!existing) {
      setAvailableColors((prev) => [...prev, newColor]);
    }

    if (!colors.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setColors((prev) => [...prev, newColor]);
    }

    setCustomColorName('');
  };

  const handleRemoveCustomColor = (colorName: string) => {
    setAvailableColors((prev) => prev.filter((c) => c.name.toLowerCase() !== colorName.toLowerCase()));
    setColors((prev) => prev.filter((c) => c.name.toLowerCase() !== colorName.toLowerCase()));
  };

  // Media Management
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingMedia(true);
    setErrorMessage('');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          setErrorMessage(`File "${file.name}" exceeds 10MB limit.`);
          continue;
        }

        try {
          const presigned = await mediaApi.getPresignedUrl({
            filename: file.name,
            file_type: file.type || 'image/jpeg',
          });
          if (presigned?.upload_url && presigned?.public_url) {
            await mediaApi.uploadToPresignedUrl(presigned.upload_url, file);
            setImages((prev) => [...prev, presigned.public_url]);
          } else {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string;
              if (dataUrl) setImages((prev) => [...prev, dataUrl]);
            };
            reader.readAsDataURL(file);
          }
        } catch {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            if (dataUrl) setImages((prev) => [...prev, dataUrl]);
          };
          reader.readAsDataURL(file);
        }
      }
    } catch (err: any) {
      setErrorMessage('Error uploading image: ' + (err.message || 'Network error'));
    } finally {
      setIsUploadingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const setPrimaryImage = (index: number) => {
    if (index === 0) return;
    const target = images[index];
    const rest = images.filter((_, i) => i !== index);
    setImages([target, ...rest]);
  };

  // Submit Handler
  const handleSave = async (targetStatus: 'Active' | 'Draft') => {
    setErrorMessage('');
    setSuccessMessage('');

    if (targetStatus === 'Active') {
      if (!productName.trim()) {
        setErrorMessage('Please enter a product name before publishing.');
        return;
      }
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        setErrorMessage('Please enter a valid price in Nigerian Naira.');
        return;
      }
      if (!categoryId) {
        setErrorMessage('Please select a product category.');
        return;
      }
      if (selectedSizes.length === 0) {
        setErrorMessage('Please select at least one available size.');
        return;
      }
      if (images.length === 0) {
        setErrorMessage('Please add at least one product image before publishing.');
        return;
      }
    } else {
      if (!productName.trim()) {
        setErrorMessage('Please enter at least a product title to save as draft.');
        return;
      }
    }

    setSaving(true);
    try {
      const numericPrice = parseFloat(price) || 0;
      const koboPrice = Math.round(numericPrice * 100);

      let targetCategoryId = categoryId;
      if (!targetCategoryId && categories.length > 0) {
        targetCategoryId = categories[0].id;
      }

      const compiledSizeChart = {
        stretch: stretchLevel,
        unit_default: 'IN' as const,
        garment_type: garmentCut,
        sizing_system: activeSizingSystem,
      };

      const finalStock = fulfillmentMode === 'MADE_TO_ORDER' ? 99 : (parseInt(stockQuantity) || 5);
      const finalPrepDays = fulfillmentMode === 'MADE_TO_ORDER' ? (parseInt(prepDays) || 3) : 1;
      const apiStatus: 'DRAFT' | 'PUBLISHED' = targetStatus === 'Active' ? 'PUBLISHED' : 'DRAFT';

      const payload: CreateProductPayload = {
        title: productName.trim(),
        category_id: targetCategoryId,
        description: description.trim() || `${productName.trim()} by Aso designer. Handcrafted premium fashion.`,
        base_price_kobo: koboPrice,
        preparation_time_days: finalPrepDays,
        status: apiStatus,
        sizes: selectedSizes,
        colors: colors.map((c) => c.name),
        stock_quantity: finalStock,
        size_chart: compiledSizeChart,
      };

      let savedProd: any;
      if (isEditing && productToEdit?.id) {
        savedProd = await productApi.updateVendorProduct(productToEdit.id, payload);
      } else {
        savedProd = await productApi.createVendorProduct(payload);
      }

      if (savedProd?.id && images.length > 0) {
        for (let idx = 0; idx < images.length; idx++) {
          const imgUrl = images[idx];
          try {
            await mediaApi.attachMedia(savedProd.id, {
              url: imgUrl,
              media_type: 'IMAGE',
              is_primary: idx === 0,
              display_order: idx,
            });
          } catch (mErr) {
            console.warn('Failed to attach media item:', imgUrl, mErr);
          }
        }
      }

      setSuccessMessage(
        isEditing
          ? 'Product changes saved successfully!'
          : 'Product published successfully to your storefront and catalog!'
      );

      if (onSaveProduct) {
        onSaveProduct({
          id: savedProd?.id,
          name: productName,
          price: numericPrice,
          image_url: images[0] || '',
          status: targetStatus,
          sizes: selectedSizes,
          stock_quantity: finalStock,
        });
      }

      setTimeout(() => {
        onBack();
      }, 1200);
    } catch (err: any) {
      console.error('Error saving product:', err);
      const detail = err.response?.data?.error?.message || err.response?.data?.detail || err.message;
      setErrorMessage(detail || 'Failed to save product. Please verify all required fields.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === categoryId);
  const formattedPriceDisplay = price && !isNaN(parseFloat(price)) 
    ? '₦' + parseFloat(price).toLocaleString() 
    : '₦0.00';

  return (
    <div className="add-piece-container">
      {/* ── Top Header Action Bar ── */}
      <div className="add-piece-header-bar">
        <div>
          <div className="add-piece-breadcrumb">
            <button type="button" onClick={onBack} className="btn-back-link">
              <ArrowLeft size={16} />
              <span>Studio Products</span>
            </button>
            <span>/</span>
            <span>{isEditing ? 'Edit Piece' : 'Create New Piece'}</span>
          </div>
          <div className="header-title-group">
            <h1 className="header-main-title">
              {isEditing ? 'Edit Fashion Piece' : 'Add New Fashion Piece'}
            </h1>
            <span className={`status-indicator-badge ${isEditing ? 'active' : 'draft'}`}>
              {isEditing ? 'Live in Catalog' : 'Draft Creation'}
            </span>
          </div>
        </div>

        <div className="header-actions-row">
          <button
            type="button"
            className="btn-save-draft"
            onClick={() => handleSave('Draft')}
            disabled={saving}
          >
            {saving ? <Loader size={15} className="spin-icon" /> : null}
            <span>Save Draft</span>
          </button>
          <button
            type="button"
            className="btn-publish-piece"
            onClick={() => handleSave('Active')}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin-icon" /> : <Sparkles size={16} />}
            <span>{isEditing ? 'Save & Update Piece' : 'Publish to Storefront'}</span>
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      {errorMessage && (
        <div className="form-feedback-alert error">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="form-feedback-alert success">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ── Main 2-Column Split ── */}
      <div className="add-piece-grid-split">
        {/* Left: Input Sections */}
        <div className="form-sections-stack">
          {/* Card 1: Basic Information */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <Shirt size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Basic Information &amp; Taxonomy</h3>
                <p>Categorize your piece so customers can find it across departments.</p>
              </div>
            </div>

            {/* Department Selection */}
            <div className="field-group">
              <label className="field-label">Target Department / Audience *</label>
              <div className="department-selection-grid">
                {DEPARTMENTS.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    className={`department-card-btn ${selectedDepartment === dept.id ? 'active' : ''}`}
                    onClick={() => handleDepartmentSelect(dept.id)}
                  >
                    <div className="dept-icon-wrapper">
                      {dept.icon}
                    </div>
                    <span className="dept-title">{dept.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label">Piece Title / Design Name *</label>
                <span className="char-counter">{productName.length}/120</span>
              </div>
              <input
                type="text"
                className="field-input"
                placeholder="e.g. Royal Emerald 3-Piece Agbada with Gold Threadwork"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                maxLength={120}
              />
            </div>

            {/* Category Dropdown */}
            <div className="field-group">
              <label className="field-label">Marketplace Category *</label>
              <select
                className="field-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.length === 0 && <option value="">Loading categories...</option>}
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} {cat.slug ? `(${cat.slug})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="field-group">
              <label className="field-label">Garment Story &amp; Craft Details</label>
              <textarea
                className="field-textarea"
                placeholder="Detail the fabric composition (e.g. 100% Swiss Damask, Aso Oke), embroidery motif, silhouette cut, and styling recommendations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <span className="field-hint-text">
                High-quality tailoring descriptions build immediate trust with bespoke buyers.
              </span>
            </div>
          </div>

          {/* Card 2: Media & Imagery */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <ImageIcon size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Product Imagery &amp; Photography</h3>
                <p>Upload clean, high-resolution shots showing front, back, and embroidery closeups.</p>
              </div>
            </div>

            <div
              className="media-uploader-dropzone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <div className="dropzone-inner">
                <div className="dropzone-icon-circle">
                  {isUploadingMedia ? <Loader size={24} className="spin-icon" /> : <UploadCloud size={24} />}
                </div>
                <p className="dropzone-title">
                  {isUploadingMedia ? 'Uploading high-res photos...' : 'Click or Drag images to upload'}
                </p>
                <p className="dropzone-sub">Supports JPG, PNG, WEBP up to 10MB each</p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="media-preview-grid">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="media-thumb-card">
                    <img src={imgUrl} alt={`Preview ${idx + 1}`} className="media-thumb-img" />
                    {idx === 0 && <span className="media-primary-badge">PRIMARY</span>}
                    <button
                      type="button"
                      className="btn-remove-thumb"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(idx);
                      }}
                      title="Remove image"
                    >
                      <Trash2 size={12} />
                    </button>
                    {idx !== 0 && (
                      <button
                        type="button"
                        className="btn-set-primary-thumb"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimaryImage(idx);
                        }}
                      >
                        Set as Main
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Pricing & Fulfillment */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <Package size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Pricing &amp; Fulfillment Model</h3>
                <p>Set your selling price and define whether this piece is tailored on-demand or ready to ship.</p>
              </div>
            </div>

            {/* Price */}
            <div className="field-group">
              <label className="field-label">Base Retail Price (NGN ₦) *</label>
              <div className="currency-input-wrap">
                <span className="currency-symbol-box">₦</span>
                <input
                  type="number"
                  className="field-input currency-input"
                  placeholder="e.g. 45000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="500"
                />
              </div>
            </div>

            {/* Fulfillment Mode Switch */}
            <div className="field-group">
              <label className="field-label">Production &amp; Inventory Model *</label>
              <div className="fulfillment-switch-row">
                <div
                  className={`fulfillment-card-option ${fulfillmentMode === 'MADE_TO_ORDER' ? 'active' : ''}`}
                  onClick={() => setFulfillmentMode('MADE_TO_ORDER')}
                >
                  <div className="fulfillment-header">
                    <span className="fulfillment-title">✨ Made to Order (Bespoke)</span>
                    {fulfillmentMode === 'MADE_TO_ORDER' && <Check size={16} color="#004B44" />}
                  </div>
                  <p>Tailored upon customer order. Dispatched within your custom tailoring lead time.</p>
                </div>

                <div
                  className={`fulfillment-card-option ${fulfillmentMode === 'READY_TO_WEAR' ? 'active' : ''}`}
                  onClick={() => setFulfillmentMode('READY_TO_WEAR')}
                >
                  <div className="fulfillment-header">
                    <span className="fulfillment-title">📦 Ready to Wear (In Stock)</span>
                    {fulfillmentMode === 'READY_TO_WEAR' && <Check size={16} color="#004B44" />}
                  </div>
                  <p>Finished garment already sewn in your studio. Dispatched immediately within 24 hours.</p>
                </div>
              </div>
            </div>

            {/* Conditional: Prep Days vs Stock Units */}
            {fulfillmentMode === 'MADE_TO_ORDER' ? (
              <div className="field-group">
                <label className="field-label">Tailoring Lead Time (SLA) *</label>
                <div className="lead-time-options-bar">
                  {['2', '3', '5', '7', '10', '14'].map((days) => (
                    <button
                      key={days}
                      type="button"
                      className={`lead-time-btn ${prepDays === days ? 'active' : ''}`}
                      onClick={() => setPrepDays(days)}
                    >
                      {days} {days === '1' ? 'Day' : 'Days'}
                    </button>
                  ))}
                </div>
                <span className="field-hint-text">
                  Time required from order confirmation to nationwide courier pickup.
                </span>
              </div>
            ) : (
              <div className="field-group">
                <label className="field-label">Available In-Stock Quantity *</label>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 5"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  min="1"
                />
              </div>
            )}
          </div>

          {/* Card 4: Sizing Engine */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <Ruler size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Sizing System &amp; Fit Specifications</h3>
                <p>Select the sizing framework that best fits this garment type.</p>
              </div>
            </div>

            {/* Presets Tabs */}
            <div className="sizing-presets-tabs">
              {(Object.keys(SIZING_PRESETS) as SizingSystem[]).map((key) => {
                const preset = SIZING_PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    className={`sizing-tab-btn ${activeSizingSystem === key ? 'active' : ''}`}
                    onClick={() => handleSizingSystemSelect(key)}
                  >
                    {preset.icon}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="field-hint-text" style={{ marginBottom: '0.75rem' }}>
              {SIZING_PRESETS[activeSizingSystem]?.hint}
            </p>

            {/* Size Chips Matrix */}
            <div className="size-chips-matrix">
              {[...new Set([...(SIZING_PRESETS[activeSizingSystem]?.sizes || []), ...customSizes])].map((sz) => {
                const isCustom = !(SIZING_PRESETS[activeSizingSystem]?.sizes || []).includes(sz);
                const isSelected = selectedSizes.includes(sz);
                return (
                  <div key={sz} className={`size-chip-badge ${isSelected ? 'active' : ''} ${isCustom ? 'is-custom' : ''}`}>
                    <button
                      type="button"
                      className="size-chip-toggle-btn"
                      onClick={() => toggleSize(sz)}
                    >
                      {sz}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        className="size-chip-delete-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCustomSize(sz);
                        }}
                        title="Remove custom size"
                        aria-label="Remove custom size"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom Bespoke Measurement Guidance Box */}
            {activeSizingSystem === 'CUSTOM' && (
              <div className="custom-bespoke-guide-box">
                <div className="bespoke-guide-header">
                  <Ruler size={16} color="#004B44" />
                  <h4>Client Custom Measurement Guide</h4>
                </div>
                <p className="bespoke-guide-desc">
                  When buyers order this bespoke piece, Aso will collect their tailored body measurements during checkout:
                </p>
                <div className="bespoke-tags-list">
                  <span className="bespoke-tag">Chest / Bust</span>
                  <span className="bespoke-tag">Waist &amp; Hips</span>
                  <span className="bespoke-tag">Shoulder Span</span>
                  <span className="bespoke-tag">Sleeve Length</span>
                  <span className="bespoke-tag">Garment Full Length</span>
                  <span className="bespoke-tag">Inseam / Agbada Flare</span>
                </div>
              </div>
            )}

            {/* Add Custom Size Form */}
            <form onSubmit={handleAddCustomSize} className="custom-size-adder-row">
              <input
                type="text"
                className="field-input"
                placeholder="+ Add custom size (e.g. 5XL)"
                value={customSizeInput}
                onChange={(e) => setCustomSizeInput(e.target.value)}
              />
              <button type="submit" className="btn-save-draft" style={{ whiteSpace: 'nowrap' }}>
                <Plus size={14} />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Card 5: Color Swatches & Stretch */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <Palette size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Color Palette &amp; Fabric Characteristics</h3>
                <p>Indicate available colorways and garment stretch level.</p>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Available Colorways &amp; Fabric Shades</label>
              <div className="color-swatches-row">
                {availableColors.map((preset) => {
                  const isSelected = colors.some((c) => c.name.toLowerCase() === preset.name.toLowerCase());
                  const isCustom = !PRESET_COLORS.some((p) => p.name.toLowerCase() === preset.name.toLowerCase());
                  return (
                    <div
                      key={preset.name}
                      className={`color-swatch-item ${isSelected ? 'active' : ''} ${isCustom ? 'is-custom-color' : ''}`}
                      onClick={() => toggleColor(preset)}
                    >
                      <span className="swatch-circle" style={{ backgroundColor: preset.hex }} />
                      <span>{preset.name}</span>
                      {isSelected && <Check size={12} color="#004B44" />}
                      {isCustom && (
                        <button
                          type="button"
                          className="color-swatch-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveCustomColor(preset.name);
                          }}
                          title="Remove custom shade"
                          aria-label="Remove custom shade"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Color Creator Form */}
              <form onSubmit={handleAddCustomColor} className="custom-color-adder-form">
                <div className="custom-color-input-wrap">
                  <input
                    type="color"
                    className="custom-color-picker"
                    value={customColorHex}
                    onChange={(e) => setCustomColorHex(e.target.value)}
                    title="Choose fabric color shade"
                  />
                  <input
                    type="text"
                    className="field-input custom-color-name-input"
                    placeholder="+ Add custom shade (e.g. Burnt Orange, Teal, Lilac, Indigo)"
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-save-draft" style={{ whiteSpace: 'nowrap' }}>
                  <Plus size={14} />
                  <span>Add Color</span>
                </button>
              </form>
            </div>

            {/* Garment Cut / Silhouette */}
            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label className="field-label">Garment Silhouette / Tailored Cut</label>
              <div className="lead-time-options-bar">
                {[
                  { id: 'TAILORED', label: 'Tailored Fit (Traditional)' },
                  { id: 'REGULAR', label: 'Regular Classic' },
                  { id: 'SLIM', label: 'Slim / Form-Fitting' },
                  { id: 'OVERSIZED', label: 'Oversized / Flowing' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`lead-time-btn ${garmentCut === c.id ? 'active' : ''}`}
                    onClick={() => setGarmentCut(c.id as any)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Stretch Level */}
            <div className="field-group" style={{ marginTop: '1rem' }}>
              <label className="field-label">Fabric Stretch Specification</label>
              <div className="lead-time-options-bar">
                {[
                  { id: 'NON', label: 'No Stretch (Structured)' },
                  { id: 'SLIGHT', label: 'Slight Stretch' },
                  { id: 'MEDIUM', label: 'Medium Stretch' },
                  { id: 'HIGH', label: 'High Stretch (Spandex)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`lead-time-btn ${stretchLevel === s.id ? 'active' : ''}`}
                    onClick={() => setStretchLevel(s.id as any)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Live Storefront Preview Card */}
        <div className="sidebar-preview-stack">
          {/* Live Preview Card */}
          <div className="live-preview-card">
            <div className="live-preview-header">
              <span className="preview-badge-live">
                <span className="preview-pulse-dot" />
                LIVE STOREFRONT PREVIEW
              </span>
              <Eye size={15} color="#64748B" />
            </div>

            <div className="preview-image-container">
              {images.length > 0 ? (
                <img src={images[0]} alt="Storefront Preview" className="preview-product-img" />
              ) : (
                <div className="preview-image-placeholder">
                  <ImageIcon size={32} />
                  <span>No primary image uploaded yet</span>
                </div>
              )}
            </div>

            <div className="preview-content-body">
              <div className="preview-dept-tag">
                {selectedDepartment} • {selectedCategoryObj?.name || 'African Fashion'}
              </div>
              <h4 className="preview-title">
                {productName.trim() || 'Untitled Fashion Piece'}
              </h4>
              <div className="preview-price">
                {formattedPriceDisplay}
              </div>
              <div className="preview-sla-pill">
                <Clock size={12} />
                <span>
                  {fulfillmentMode === 'MADE_TO_ORDER'
                    ? `Tailored & Dispatched in ${prepDays} Days`
                    : 'Ready to Ship (24h Dispatch)'}
                </span>
              </div>
            </div>
          </div>

          {/* Publishing Checklist Card */}
          <div className="checklist-card">
            <h4 className="checklist-title">Publishing Quality Checklist</h4>
            <div className={`checklist-item ${productName.trim() ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {productName.trim() ? <Check size={11} /> : null}
              </span>
              <span>Design title provided</span>
            </div>
            <div className={`checklist-item ${price && parseFloat(price) > 0 ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {price && parseFloat(price) > 0 ? <Check size={11} /> : null}
              </span>
              <span>Valid selling price configured</span>
            </div>
            <div className={`checklist-item ${images.length > 0 ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {images.length > 0 ? <Check size={11} /> : null}
              </span>
              <span>High-resolution image attached</span>
            </div>
            <div className={`checklist-item ${selectedSizes.length > 0 ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {selectedSizes.length > 0 ? <Check size={11} /> : null}
              </span>
              <span>Available sizes selected</span>
            </div>
          </div>

          {/* Direct Publish CTA */}
          <button
            type="button"
            className="btn-publish-piece"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem 1rem' }}
            onClick={() => handleSave('Active')}
            disabled={saving}
          >
            {saving ? <Loader size={16} className="spin-icon" /> : <Sparkles size={16} />}
            <span>{isEditing ? 'Save & Update Piece' : 'Publish to Storefront'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
