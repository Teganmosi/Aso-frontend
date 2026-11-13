import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  Plus,
  Scissors,
  ShieldCheck
} from 'lucide-react';
import { categoryApi, productApi, mediaApi, describeUploadError } from '../../api/client';
import type { Category, ProductItem, CreateProductPayload } from '../../types';
import './AddProductView.css';

interface AddProductViewProps {
  onBack: () => void;
  onSaveProduct?: (product: Partial<ProductItem>) => void;
  productToEdit?: ProductItem | null;
}

// Departments are the root categories in the database. A piece is filed under one of the
// root's subcategories, and the Men / Women / Traditional collection pages list exactly
// the pieces under their root, so what the designer picks here is where shoppers find it.
export type DepartmentType = 'Men' | 'Women' | 'Traditional' | 'Accessories';

interface DepartmentOption {
  id: DepartmentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const DEPARTMENT_ROOT_SLUG: Record<DepartmentType, string> = {
  Men: 'men',
  Women: 'women',
  Traditional: 'traditional-heritage',
  Accessories: 'accessories',
};

const rootOf = (cats: Category[], dept: DepartmentType) => cats.find((c) => c.slug === DEPARTMENT_ROOT_SLUG[dept]);

/** The subcategories a designer can choose for a department. */
export const filterCategoriesByDepartment = (cats: Category[], dept: DepartmentType): Category[] => {
  const root = rootOf(cats, dept);
  if (!root) return cats.filter((c) => c.parent);
  return cats.filter((c) => c.parent === root.id || (!!c.parent_name && c.parent_name === root.name));
};

/** Which department a saved category belongs to (for editing). */
export const departmentForCategory = (cats: Category[], categoryId: string): DepartmentType | null => {
  const cat = cats.find((c) => c.id === categoryId);
  if (!cat) return null;
  const rootId = cat.parent || cat.id;
  const match = (Object.keys(DEPARTMENT_ROOT_SLUG) as DepartmentType[]).find((d) => rootOf(cats, d)?.id === rootId);
  return match || null;
};

const DEPARTMENTS: DepartmentOption[] = [
  { id: 'Men', label: 'Men', icon: <Shirt size={18} />, description: 'Agbada, senator, kaftans, suits' },
  { id: 'Women', label: 'Women', icon: <Gem size={18} />, description: 'Aso ebi, boubous, gowns, co-ords' },
  { id: 'Traditional', label: 'Traditional', icon: <Crown size={18} />, description: 'Aso oke, bridal and groom regalia, adire' },
  { id: 'Accessories', label: 'Accessories', icon: <Sparkles size={18} />, description: 'Caps, geles, coral beads' },
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
  const [_activeSizingSystem, _setActiveSizingSystem] = useState<SizingSystem>('STANDARD');
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
  const [allowBespoke, setAllowBespoke] = useState<boolean>(() => {
    const sc = productToEdit?.raw_product?.size_chart as any;
    if (sc?.allows_custom_tailoring !== undefined) {
      return Boolean(sc.allows_custom_tailoring);
    }
    return true; // Default to true to encourage bespoke custom fit availability
  });

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

  // When editing, load the product's real photo list. The studio's product list
  // only carries a small card thumbnail, which must never be re-saved as a photo.
  useEffect(() => {
    const productId = productToEdit?.id;
    if (!productId) return;
    let cancelled = false;
    mediaApi
      .listMedia(productId)
      .then((media) => {
        if (cancelled || media.length === 0) return;
        const ordered = [...media].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || (a.display_order ?? 0) - (b.display_order ?? 0)
        );
        setImages(ordered.map((m) => m.url));
      })
      .catch(() => {
        /* keep whatever the form started with */
      });
    return () => {
      cancelled = true;
    };
  }, [productToEdit?.id]);

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
        if (catList.length > 0) {
          setCategories(catList);
          const initialFiltered = filterCategoriesByDepartment(catList, selectedDepartment);
          if (!categoryId && initialFiltered.length > 0) {
            setCategoryId(initialFiltered[0].id);
          } else if (!categoryId) {
            setCategoryId(catList[0].id);
          }
        } else {
          setErrorMessage('Categories haven’t been set up yet. Please contact Aso support.');
        }
      } catch (err) {
        console.warn('Could not load categories', err);
        setErrorMessage('We couldn’t load the categories. Check your connection and refresh the page.');
      }
    };
    fetchCats();
  }, []);

  // Filtered categories for active department
  // When editing, open on the department the piece is actually filed under.
  useEffect(() => {
    if (!categoryId || categories.length === 0) return;
    const dept = departmentForCategory(categories, categoryId);
    if (dept && dept !== selectedDepartment) setSelectedDepartment(dept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, categoryId]);

  const filteredCategories = useMemo(() => {
    return filterCategoriesByDepartment(categories, selectedDepartment);
  }, [categories, selectedDepartment]);

  // Department switch with smart category re-targeting
  const handleDepartmentSelect = (dept: DepartmentType) => {
    setSelectedDepartment(dept);
    const newFiltered = filterCategoriesByDepartment(categories, dept);
    if (newFiltered.length > 0 && !newFiltered.some(c => c.id === categoryId)) {
      setCategoryId(newFiltered[0].id);
    }
  };

  // Toggle Sizing System Preset (Kept for future sizing preset expansions)
  const _handleSizingSystemSelect = (sys: SizingSystem) => {
    _setActiveSizingSystem(sys);
    setSelectedSizes(SIZING_PRESETS[sys].sizes);
  };
  void _activeSizingSystem;
  void _handleSizingSystemSelect;

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

    // Upload one at a time so a slow connection doesn't time out on a batch,
    // and report every photo that failed instead of silently skipping it.
    const failures: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) {
          failures.push(`${file.name} is larger than 10 MB.`);
          continue;
        }
        try {
          const uploaded = await mediaApi.uploadImage(file, 'product');
          setImages((prev) => [...prev, uploaded.url]);
        } catch (err: any) {
          failures.push(describeUploadError(err, file.name));
        }
      }
      if (failures.length > 0) {
        setErrorMessage(failures.join(' '));
      }
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
        setErrorMessage('Please give your piece a name.');
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
        setErrorMessage('Please add at least one photo of the piece.');
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

      const finalSizes = [...selectedSizes];
      if (allowBespoke && !finalSizes.includes('Bespoke Fit')) {
        finalSizes.push('Bespoke Fit');
      }

      const compiledSizeChart = {
        stretch: stretchLevel,
        unit_default: 'IN' as const,
        garment_type: garmentCut,
        sizing_system: allowBespoke ? 'HYBRID' : 'STANDARD',
        allows_custom_tailoring: allowBespoke,
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
        sizes: finalSizes,
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

      // Sync photos with what's already saved: attach only new photos and remove
      // ones the designer deleted. (Re-attaching everything duplicated photos on every edit.)
      const photoErrors: string[] = [];
      if (savedProd?.id) {
        let existing: Awaited<ReturnType<typeof mediaApi.listMedia>> = [];
        if (isEditing) {
          try {
            existing = await mediaApi.listMedia(savedProd.id);
          } catch {
            existing = [];
          }
        }
        const keptUrls = new Set(images);
        const existingUrls = new Set(existing.flatMap((m) => [m.url, m.thumbnail_url].filter(Boolean) as string[]));

        for (const media of existing) {
          if (!keptUrls.has(media.url) && !(media.thumbnail_url && keptUrls.has(media.thumbnail_url))) {
            try {
              await mediaApi.deleteMedia(savedProd.id, media.id);
            } catch {
              photoErrors.push('A removed photo could not be deleted.');
            }
          }
        }

        for (let idx = 0; idx < images.length; idx++) {
          const imgUrl = images[idx];
          if (existingUrls.has(imgUrl)) continue;
          try {
            await mediaApi.attachMedia(savedProd.id, {
              url: imgUrl,
              media_type: 'IMAGE',
              is_primary: idx === 0,
              display_order: idx,
            });
          } catch {
            photoErrors.push(`Photo ${idx + 1} could not be saved. Please remove it and upload it again.`);
          }
        }
      }
      if (photoErrors.length > 0) {
        setErrorMessage(photoErrors.join(' '));
      }

      // Every new piece (and any change to title, description or price) is reviewed
      // by the Aso team before it appears publicly.
      setSuccessMessage(
        targetStatus === 'Draft'
          ? 'Saved as a draft. Only you can see it.'
          : isEditing
          ? 'Changes saved. If you changed the title, description or price, the piece goes back for a quick review before it’s live again.'
          : 'Submitted for review. Your piece will appear on your storefront as soon as the Aso team approves it.'
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
              {isEditing ? 'Edit Piece' : 'Add a New Piece'}
            </h1>
            <span className={`status-indicator-badge ${isEditing ? 'active' : 'draft'}`}>
              {isEditing ? 'Editing' : 'New piece'}
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
            <span>{isEditing ? 'Save & Update Piece' : 'Submit for Review'}</span>
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
                <h3>The basics</h3>
                <p>Who it’s for and what it is, so shoppers can find it.</p>
              </div>
            </div>

            {/* Department Selection */}
            <div className="field-group">
              <label className="field-label">Who is it for? *</label>
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
                <label className="field-label">Name of the piece *</label>
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
              <div className="field-label-row">
                <label className="field-label">Category *</label>
                <span className="char-counter">{categories.length === 0 ? 'Loading categories…' : `${filteredCategories.length} categories in ${selectedDepartment}`}</span>
              </div>
              <select
                className="field-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {filteredCategories.length === 0 && <option value="">Select Category...</option>}
                {filteredCategories.map((cat: Category) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="field-group">
              <label className="field-label">Description</label>
              <textarea
                className="field-textarea"
                placeholder="Detail the fabric composition (e.g. 100% Swiss Damask, Aso Oke), embroidery motif, silhouette cut, and styling recommendations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <span className="field-hint-text">
                Mention the fabric, the fit and what’s included. Good descriptions sell more.
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
                <h3>Photos</h3>
                <p>Clear, well-lit photos of the front, back and details. The first photo is the cover.</p>
              </div>
            </div>

            {/* Photo Guidelines Bar */}
            <div className="photo-guidance-bar">
              <span className="photo-guidance-title">💡 Photos that sell:</span>
              <div className="photo-guidance-chips">
                <span className="p-guidance-pill">1. Front (cover photo)</span>
                <span className="p-guidance-pill">2. Fabric and embroidery close-up</span>
                <span className="p-guidance-pill">3. Back</span>
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
                  {isUploadingMedia ? 'Uploading photos…' : 'Tap to add photos'}
                </p>
                <p className="dropzone-sub">JPG, PNG or WEBP, up to 10 MB each</p>
              </div>
            </div>

            {images.length > 0 && (
              <div className="media-preview-grid">
                {images.map((imgUrl, idx) => (
                  <div key={idx} className="media-thumb-card">
                    <img src={imgUrl} alt={`Preview ${idx + 1}`} className="media-thumb-img" />
                    {idx === 0 && <span className="media-primary-badge">★ MAIN PHOTO</span>}
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
                <h3>Price and timing</h3>
                <p>Your price, and whether you sew it after the order or already have it ready.</p>
              </div>
            </div>

            {/* Price */}
            <div className="field-group">
              <label className="field-label">Price (₦) *</label>
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

              {/* Designer Take-Home Payout Calculator */}
              {parseFloat(price) > 0 && (() => {
                const numericPrice = parseFloat(price);
                const fee = Math.round(numericPrice * 0.10);
                const netPayout = numericPrice - fee;
                return (
                  <div className="designer-payout-card">
                    <div className="payout-row">
                      <span className="payout-label">Retail Selling Price:</span>
                      <span className="payout-val">₦{numericPrice.toLocaleString()}</span>
                    </div>
                    <div className="payout-row">
                      <span className="payout-label">Aso Marketplace Fee (10%):</span>
                      <span className="payout-val fee-val">-₦{fee.toLocaleString()}</span>
                    </div>
                    <div className="payout-row total-row">
                      <span className="payout-label"><strong>Your Direct Escrow Payout:</strong></span>
                      <strong className="payout-val payout-highlight">₦{netPayout.toLocaleString()}</strong>
                    </div>
                    <div className="payout-note">
                      <ShieldCheck size={13} color="#059669" />
                      <span>Disbursed directly to your bank account upon order delivery confirmation.</span>
                    </div>
                  </div>
                );
              })()}
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
                    <span className="fulfillment-title">✨ Made to order</span>
                    {fulfillmentMode === 'MADE_TO_ORDER' && <Check size={16} color="#004B44" />}
                  </div>
                  <p>You sew it after the shopper pays, within the time you choose below.</p>
                </div>

                <div
                  className={`fulfillment-card-option ${fulfillmentMode === 'READY_TO_WEAR' ? 'active' : ''}`}
                  onClick={() => setFulfillmentMode('READY_TO_WEAR')}
                >
                  <div className="fulfillment-header">
                    <span className="fulfillment-title">📦 Ready to wear (in stock)</span>
                    {fulfillmentMode === 'READY_TO_WEAR' && <Check size={16} color="#004B44" />}
                  </div>
                  <p>Already sewn. You hand it to the rider within 24 hours of the order.</p>
                </div>
              </div>
            </div>

            {/* Conditional: Prep Days vs Stock Units */}
            {fulfillmentMode === 'MADE_TO_ORDER' ? (
              <div className="field-group">
                <label className="field-label">How many days do you need to sew it? *</label>
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
                <div className="made-to-order-capacity-badge">
                  <Sparkles size={14} color="#D4AF37" />
                  <span>Shoppers see this time before they pay. Choose a time you can always meet.</span>
                </div>
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
                <span className="field-hint-text">
                  Physical units sewn and ready in your studio for immediate 24h dispatch.
                </span>
              </div>
            )}
          </div>

          {/* Card 4: Hybrid Sizing Engine ("My Aso Fit") */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <Ruler size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Sizes and fit</h3>
                <p>The standard sizes you offer, and whether shoppers can order to their own measurements.</p>
              </div>
            </div>

            {/* Section A: Standard Ready-To-Wear Sizes */}
            <div className="field-group">
              <div className="field-label-row">
                <label className="field-label">Standard sizes</label>
                <span className="char-counter">{selectedSizes.length} sizes active</span>
              </div>
              <p className="field-hint-text" style={{ marginBottom: '0.65rem' }}>
                Tap every size you can make this piece in.
              </p>

              {/* Size Chips Matrix */}
              <div className="size-chips-matrix">
                {[...new Set([...['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'Free Size'], ...customSizes])].map((sz) => {
                  const isCustom = !['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', 'Free Size'].includes(sz);
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

              {/* Add Custom Size Form */}
              <form onSubmit={handleAddCustomSize} className="custom-size-adder-row" style={{ marginTop: '0.65rem' }}>
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

            {/* Section B: Hybrid Bespoke Tailoring Toggle Card */}
            <div className={`bespoke-enable-card ${allowBespoke ? 'active' : ''}`}>
              <div className="bespoke-enable-header">
                <div className="bespoke-enable-info">
                  <div className="bespoke-title-row">
                    <Scissors size={18} color="#D4AF37" />
                    <strong className="bespoke-enable-title">Allow custom fit</strong>
                    <span className="badge-recommended">Recommended</span>
                  </div>
                  <p className="bespoke-enable-desc">
                    Shoppers can pick a standard size or choose <strong>Custom fit</strong> and send their measurements (bust/chest, waist, hips, sleeve, length).
                  </p>
                </div>
                <label className="aso-switch">
                  <input
                    type="checkbox"
                    checked={allowBespoke}
                    onChange={(e) => setAllowBespoke(e.target.checked)}
                  />
                  <span className="aso-slider" />
                </label>
              </div>

              {allowBespoke && (
                <div className="bespoke-active-notice">
                  <Sparkles size={14} color="#065F46" />
                  <span>
                    Nothing else to set up. Aso asks the shopper for the right measurements at checkout and shows them on the order.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Card 5: Color Swatches & Stretch */}
          <div className="piece-form-card">
            <div className="card-section-header">
              <div className="section-icon-box">
                <Palette size={18} />
              </div>
              <div className="section-title-wrap">
                <h3>Colours and fabric</h3>
                <p>The colours you can make it in, and how the fabric fits.</p>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Colours available</label>
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
              <label className="field-label">Cut</label>
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
              <label className="field-label">Fabric stretch</label>
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
                PREVIEW
              </span>
              <Eye size={15} color="#64748B" />
            </div>

            <div className="preview-image-container">
              {images.length > 0 ? (
                <img src={images[0]} alt="Storefront Preview" className="preview-product-img" />
              ) : (
                <div className="preview-image-placeholder">
                  <ImageIcon size={32} />
                  <span>No photo yet</span>
                </div>
              )}
            </div>

            <div className="preview-content-body">
              <div className="preview-dept-tag">
                {selectedDepartment} • {selectedCategoryObj?.name || 'African Fashion'}
              </div>
              <h4 className="preview-title">
                {productName.trim() || 'Untitled piece'}
              </h4>
              <div className="preview-price">
                {formattedPriceDisplay}
              </div>
              <div className="preview-sla-pill">
                <Clock size={12} />
                <span>
                  {fulfillmentMode === 'MADE_TO_ORDER'
                    ? `Made and sent in ${prepDays} days`
                    : 'Ready to Ship (24h Dispatch)'}
                </span>
              </div>
            </div>
          </div>

          {/* Publishing Checklist Card */}
          <div className="checklist-card">
            <h4 className="checklist-title">Before you submit</h4>
            <div className={`checklist-item ${productName.trim() ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {productName.trim() ? <Check size={11} /> : null}
              </span>
              <span>Name added</span>
            </div>
            <div className={`checklist-item ${price && parseFloat(price) > 0 ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {price && parseFloat(price) > 0 ? <Check size={11} /> : null}
              </span>
              <span>Price added</span>
            </div>
            <div className={`checklist-item ${images.length > 0 ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {images.length > 0 ? <Check size={11} /> : null}
              </span>
              <span>At least one photo</span>
            </div>
            <div className={`checklist-item ${selectedSizes.length > 0 ? 'done' : ''}`}>
              <span className="check-box-indicator">
                {selectedSizes.length > 0 ? <Check size={11} /> : null}
              </span>
              <span>Sizes chosen</span>
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
            <span>{isEditing ? 'Save & Update Piece' : 'Submit for Review'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
