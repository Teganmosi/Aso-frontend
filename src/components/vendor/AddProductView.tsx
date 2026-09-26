import React, { useEffect, useState, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  X, 
  Clock, 
  Scissors, 
  ShieldCheck, 
  Loader, 
  UploadCloud, 
  Check, 
  AlertCircle,
  Package,
  Image as ImageIcon,
} from 'lucide-react';
import { categoryApi, productApi, mediaApi } from '../../api/client';
import type { Category, ProductItem, CreateProductPayload } from '../../types';

interface AddProductViewProps {
  onBack: () => void;
  onSaveProduct?: (product: Partial<ProductItem>) => void;
  productToEdit?: ProductItem | null;
}

// Department / Target Audience Taxonomy
export type DepartmentType = 'Men' | 'Women' | 'Traditional & Bridal' | 'Unisex & Contemporary' | 'Kids';

interface DepartmentOption {
  id: DepartmentType;
  label: string;
  icon: string;
  description: string;
}

const DEPARTMENTS: DepartmentOption[] = [
  { id: 'Men', label: 'Men', icon: '👔', description: 'Senators, Agbadas, Kaftans & Two-Piece Sets' },
  { id: 'Women', label: 'Women', icon: '👗', description: 'Aso Ebi, Boubous, Corset Gowns & Co-ords' },
  { id: 'Traditional & Bridal', label: 'Traditional & Bridal', icon: '👑', description: 'Handwoven Aso Oke, Groom/Bride Regalia & Beads' },
  { id: 'Unisex & Contemporary', label: 'Unisex & Contemporary', icon: '💫', description: 'Adire Lounge, Kimonos, Streetwear & Jackets' },
  { id: 'Kids', label: 'Kids', icon: '👶', description: 'Boys & Girls Traditional Celebratory Wear' }
];

// Universal Apparel Sizing Presets (No footwear)
export type SizingSystem = 'ALPHA' | 'UK_WOMEN' | 'MEN_WAIST' | 'FREE_SIZE' | 'BESPOKE';

const SIZING_PRESETS: Record<SizingSystem, { label: string; icon: string; sizes: string[]; hint: string }> = {
  ALPHA: {
    label: 'Standard Alpha (XS–4XL)',
    icon: '🏷️',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
    hint: 'Best for Senator suits, Kaftans, Agbadas, and casual native co-ords'
  },
  UK_WOMEN: {
    label: "Women's UK Dress (UK 6–22)",
    icon: '👗',
    sizes: ['UK 6', 'UK 8', 'UK 10', 'UK 12', 'UK 14', 'UK 16', 'UK 18', 'UK 20', 'UK 22'],
    hint: "Best for Corset gowns, Aso Ebi dresses, fitted skirts, and bespoke women's wear"
  },
  MEN_WAIST: {
    label: 'Men\'s Tailored Waist (30"-44")',
    icon: '👖',
    sizes: ['30"', '32"', '34"', '36"', '38"', '40"', '42"', '44"'],
    hint: 'Best for fitted native trousers, formal bottoms, and tailored waistbands'
  },
  FREE_SIZE: {
    label: 'Free Size / One Size',
    icon: '👘',
    sizes: ['Free Size (One Size Fits Most)'],
    hint: 'Best for flowing Boubous, wide Agbada robes, Kimonos, Geles, and Shawls'
  },
  BESPOKE: {
    label: 'Bespoke / Made-to-Measure',
    icon: '✂️',
    sizes: ['Bespoke Fit (Custom Measurements)'],
    hint: 'Customer provides exact body measurements (chest, waist, shoulder, length) at checkout'
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
  const [customCollectionTag, setCustomCollectionTag] = useState<string>('');

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
  const [activeSizingSystem, setActiveSizingSystem] = useState<SizingSystem>('ALPHA');
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

  // 5. Fabric & Garment Cut Specs
  const [stretchLevel, setStretchLevel] = useState<'NON' | 'SLIGHT' | 'MEDIUM' | 'HIGH'>(
    (productToEdit?.raw_product?.size_chart?.stretch as any) || 'NON'
  );
  const [garmentCut, setGarmentCut] = useState<'SENATOR' | 'AGBADA' | 'GOWN' | 'TROUSERS'>(
    (productToEdit?.raw_product?.size_chart?.garment_type as any) || 'SENATOR'
  );

  // 6. Colors State
  const [colorInput, setColorInput] = useState('');
  const [colors, setColors] = useState<{ name: string; hex: string }[]>([
    { name: 'Navy Blue', hex: '#1E3A8A' },
    { name: 'Emerald Green', hex: '#064E3B' },
  ]);

  // 7. Media Gallery State
  const [imageUrlInput, setImageUrlInput] = useState('');
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback & Saving States
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load Categories from Backend
  useEffect(() => {
    let isMounted = true;
    categoryApi.getCategories().then((data) => {
      if (isMounted && data && data.length > 0) {
        setCategories(data);
        if (!categoryId) {
          const initialMatch = data.find(c => c.parent_name === selectedDepartment) || data[0];
          setCategoryId(initialMatch.id);
        }
      }
    }).catch((err) => {
      console.error('Failed to load categories:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered categories for active Department
  const departmentCategories = useMemo(() => {
    const directMatches = categories.filter((c) => c.parent_name === selectedDepartment);
    if (directMatches.length > 0) return directMatches;

    const leaves = categories.filter((c) => c.parent_name || c.parent);
    return leaves.length > 0 ? leaves : categories;
  }, [categories, selectedDepartment]);

  // When Department changes, auto-select first category in that department
  const handleDepartmentChange = (dept: DepartmentType) => {
    setSelectedDepartment(dept);
    const matchingCat = categories.find((c) => c.parent_name === dept);
    if (matchingCat) {
      setCategoryId(matchingCat.id);
    }
    if (dept === 'Women' && activeSizingSystem === 'ALPHA') {
      setActiveSizingSystem('UK_WOMEN');
      setSelectedSizes(['UK 8', 'UK 10', 'UK 12', 'UK 14']);
      setGarmentCut('GOWN');
    } else if (dept === 'Men' && activeSizingSystem === 'UK_WOMEN') {
      setActiveSizingSystem('ALPHA');
      setSelectedSizes(['S', 'M', 'L', 'XL']);
      setGarmentCut('SENATOR');
    }
  };

  // Switch Sizing System Presets
  const handleSizingSystemSwitch = (sys: SizingSystem) => {
    setActiveSizingSystem(sys);
    setSelectedSizes(SIZING_PRESETS[sys].sizes);
  };

  // Toggle Individual Size Chip
  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length === 1) {
        setErrorMessage('At least one size must remain selected.');
        setTimeout(() => setErrorMessage(''), 3000);
        return;
      }
      setSelectedSizes(selectedSizes.filter((s) => s !== size));
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  // Select All / Deselect All for active preset
  const handleSelectAllSizes = () => {
    const preset = SIZING_PRESETS[activeSizingSystem].sizes;
    setSelectedSizes(Array.from(new Set([...selectedSizes, ...preset])));
  };

  const handleClearSizes = () => {
    setSelectedSizes([]);
  };

  // Add Custom Size Tag
  const handleAddCustomSize = () => {
    const trimmed = customSizeInput.trim();
    if (!trimmed) return;
    if (!selectedSizes.includes(trimmed)) {
      setSelectedSizes([...selectedSizes, trimmed]);
    }
    setCustomSizeInput('');
  };

  // Color Handlers
  const handleAddColor = (nameToAdd?: string, hexToAdd?: string) => {
    const name = (nameToAdd || colorInput).trim();
    if (name) {
      const exists = colors.some((c) => c.name.toLowerCase() === name.toLowerCase());
      if (!exists) {
        const hex = hexToAdd || '#111827';
        setColors([...colors, { name, hex }]);
      }
      setColorInput('');
    }
  };

  const handleRemoveColor = (index: number) => {
    setColors(colors.filter((_, idx) => idx !== index));
  };

  // Media Handlers
  const handleAddImageUrl = () => {
    const url = imageUrlInput.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'))) {
      if (!images.includes(url)) {
        setImages([...images, url]);
      }
      setImageUrlInput('');
    } else if (url) {
      setErrorMessage('Please enter a valid image URL (https://...)');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  const handleDeviceFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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
            reader.onload = (e) => {
              const dataUrl = e.target?.result as string;
              if (dataUrl) setImages((prev) => [...prev, dataUrl]);
            };
            reader.readAsDataURL(file);
          }
        } catch {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
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

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '1rem 0 3rem 0', color: '#1C1B1B' }}>
      {/* Top Sticky Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.75rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #E5E2E1',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'none',
            border: 'none',
            color: '#004B44',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: 0,
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Products</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => handleSave('Draft')}
            disabled={saving}
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#3F4947',
              backgroundColor: '#F0EDED',
              border: '1px solid #E5E2E1',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => handleSave('Active')}
            disabled={saving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 1.45rem',
              fontSize: '0.85rem',
              fontWeight: 600,
              color: '#FFFFFF',
              backgroundColor: saving ? '#535F5C' : '#004B44',
              border: 'none',
              borderRadius: '6px',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 4px rgba(0, 75, 68, 0.15)',
            }}
          >
            {saving ? (
              <>
                <Loader size={16} className="cart-spinner" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{isEditing ? 'Save Changes' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            padding: '0.85rem 1.15rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#DC2626',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            padding: '0.85rem 1.15rem',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#065F46',
            fontSize: '0.875rem',
            marginBottom: '1.5rem',
          }}
        >
          <Check size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: '2rem' }}>
        {/* LEFT COLUMN: Step-by-Step Upload Workflow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* STEP 1: Department & Style Taxonomy */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#004B44', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                1
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1B1B' }}>
                  Target Audience & Garment Style
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#707977', margin: '0.15rem 0 0 0' }}>
                  Select the audience department and authentic garment category for search & catalog discovery.
                </p>
              </div>
            </div>

            {/* Department Pills */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                Department / Audience *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem' }}>
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDepartment === dept.id;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => handleDepartmentChange(dept.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0.75rem 0.5rem',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #004B44' : '1px solid #E5E2E1',
                        backgroundColor: isSelected ? '#E6F4F1' : '#FCF9F8',
                        color: isSelected ? '#004B44' : '#3F4947',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>{dept.icon}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 600 }}>{dept.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Garment Style / Category Grid */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                Garment Category ({selectedDepartment}) *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem' }}>
                {departmentCategories.map((c) => {
                  const isSelected = categoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #004B44' : '1px solid #E5E2E1',
                        backgroundColor: isSelected ? '#004B44' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#1C1B1B',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span>{c.name}</span>
                      {isSelected && <Check size={14} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Title */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                Product Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Royal Emerald Senator Kaftan Set with Gold Embroidery"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  border: '1px solid #E5E2E1',
                  borderRadius: '4px',
                  backgroundColor: '#FCF9F8',
                  color: '#1C1B1B',
                }}
              />
            </div>

            {/* Storefront Custom Drop / Collection Tag */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947' }}>
                  Brand Collection / Drop (Optional)
                </label>
                <span style={{ fontSize: '0.7rem', color: '#707977' }}>Organizes items on your public store</span>
              </div>
              <input
                type="text"
                placeholder="e.g. Harmattan 2026 Collection, The Velvet Edit, Owambe Luxury"
                value={customCollectionTag}
                onChange={(e) => setCustomCollectionTag(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  fontSize: '0.85rem',
                  border: '1px solid #E5E2E1',
                  borderRadius: '4px',
                  backgroundColor: '#FCF9F8',
                  color: '#1C1B1B',
                }}
              />
            </div>

            {/* Product Description */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                Product Description *
              </label>
              <textarea
                rows={3}
                placeholder="Describe fabric grade (e.g. 100% Cashmere Wool, Swiss Cotton, Raw Silk), embroidery details, tailoring finish, and included garments..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.85rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.5',
                  border: '1px solid #E5E2E1',
                  borderRadius: '4px',
                  backgroundColor: '#FCF9F8',
                  color: '#1C1B1B',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* STEP 2: Pricing & Fulfillment Model */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#004B44', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                2
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1B1B' }}>
                  Pricing & Fulfillment Model
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#707977', margin: '0.15rem 0 0 0' }}>
                  Define retail pricing and specify if this piece is Made-to-Order or Ready-to-Wear.
                </p>
              </div>
            </div>

            {/* Price & Fulfillment Mode Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Price (₦ Naira) *
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: '#004B44' }}>
                    ₦
                  </span>
                  <input
                    type="number"
                    placeholder="85,000"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 0.85rem 0.75rem 2.2rem',
                      fontSize: '1rem',
                      fontWeight: 700,
                      border: '1px solid #E5E2E1',
                      borderRadius: '4px',
                      backgroundColor: '#FCF9F8',
                      color: '#1C1B1B',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Fulfillment Type *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setFulfillmentMode('MADE_TO_ORDER')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '4px',
                      border: fulfillmentMode === 'MADE_TO_ORDER' ? '2px solid #004B44' : '1px solid #E5E2E1',
                      backgroundColor: fulfillmentMode === 'MADE_TO_ORDER' ? '#E6F4F1' : '#FFFFFF',
                      color: fulfillmentMode === 'MADE_TO_ORDER' ? '#004B44' : '#3F4947',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    🧵 Made to Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentMode('READY_TO_WEAR')}
                    style={{
                      padding: '0.65rem 0.5rem',
                      borderRadius: '4px',
                      border: fulfillmentMode === 'READY_TO_WEAR' ? '2px solid #004B44' : '1px solid #E5E2E1',
                      backgroundColor: fulfillmentMode === 'READY_TO_WEAR' ? '#E6F4F1' : '#FFFFFF',
                      color: fulfillmentMode === 'READY_TO_WEAR' ? '#004B44' : '#3F4947',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    ⚡ Ready to Wear
                  </button>
                </div>
              </div>
            </div>

            {/* Conditional Fulfillment Settings */}
            {fulfillmentMode === 'MADE_TO_ORDER' ? (
              <div style={{ backgroundColor: '#F8FAF9', padding: '1rem', borderRadius: '6px', border: '1px solid #E2EAE8', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Clock size={16} color="#004B44" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#004B44' }}>Tailoring Turnaround Time</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
                  {[
                    { days: '1', label: '1 Day' },
                    { days: '2', label: '2 Days' },
                    { days: '3', label: '3 Days (Standard)' },
                    { days: '5', label: '5 Days' },
                    { days: '7', label: '7 Days (Elaborate)' },
                    { days: '10', label: '10 Days' },
                    { days: '14', label: '14 Days (Bespoke)' },
                  ].map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      onClick={() => setPrepDays(opt.days)}
                      style={{
                        padding: '0.5rem 0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        borderRadius: '4px',
                        border: prepDays === opt.days ? '2px solid #004B44' : '1px solid #E5E2E1',
                        backgroundColor: prepDays === opt.days ? '#004B44' : '#FFFFFF',
                        color: prepDays === opt.days ? '#FFFFFF' : '#3F4947',
                        cursor: 'pointer',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.7rem', color: '#707977', display: 'block', marginTop: '0.4rem' }}>
                  ✨ Made to Order items remain available continuously. Customers are informed of your tailoring timeframe.
                </span>
              </div>
            ) : (
              <div style={{ backgroundColor: '#F8FAF9', padding: '1rem', borderRadius: '6px', border: '1px solid #E2EAE8', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Package size={16} color="#004B44" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#004B44' }}>Physical Inventory Stock Count</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    style={{
                      width: '140px',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      border: '1px solid #E5E2E1',
                      borderRadius: '4px',
                      backgroundColor: '#FFFFFF',
                      color: '#1C1B1B',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#707977' }}>
                    Available pieces ready for immediate courier pickup. Atomically decremented on each customer order.
                  </span>
                </div>
              </div>
            )}

            {/* Payout Preview Banner */}
            {parseFloat(price) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#F3F4F6', borderRadius: '6px', fontSize: '0.8rem' }}>
                <span style={{ color: '#4B5563' }}>
                  Marketplace Fee (10%): <strong>₦ {(parseFloat(price) * 0.1).toLocaleString()}</strong>
                </span>
                <span style={{ color: '#004B44', fontWeight: 700 }}>
                  Estimated Payout: ₦ {(parseFloat(price) * 0.9).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {/* STEP 3: Universal Apparel Sizing Engine */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#004B44', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                3
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1B1B' }}>
                  Available Sizing & Measurements
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#707977', margin: '0.15rem 0 0 0' }}>
                  Select the sizing system matching your garment (Alpha, UK Dress sizes, Waist inches, Free Size, or Bespoke).
                </p>
              </div>
            </div>

            {/* Sizing Preset System Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
              {(Object.keys(SIZING_PRESETS) as SizingSystem[]).map((sysKey) => {
                const isSelected = activeSizingSystem === sysKey;
                const sys = SIZING_PRESETS[sysKey];
                return (
                  <button
                    key={sysKey}
                    type="button"
                    onClick={() => handleSizingSystemSwitch(sysKey)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected ? '1px solid #004B44' : '1px solid #E5E2E1',
                      backgroundColor: isSelected ? '#004B44' : '#F9FAFB',
                      color: isSelected ? '#FFFFFF' : '#3F4947',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{sys.icon}</span>
                    <span>{sys.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sizing Hint */}
            <p style={{ fontSize: '0.75rem', color: '#004B44', margin: '0 0 1rem 0', fontWeight: 500 }}>
              💡 {SIZING_PRESETS[activeSizingSystem].hint}
            </p>

            {/* Size Chips Selection Box */}
            <div style={{ backgroundColor: '#FCF9F8', padding: '1rem', borderRadius: '6px', border: '1px solid #E5E2E1', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#3F4947' }}>
                  Selected Sizes ({selectedSizes.length})
                </span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleSelectAllSizes}
                    style={{ background: 'none', border: 'none', color: '#004B44', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    + Select All
                  </button>
                  <span style={{ color: '#E5E2E1' }}>|</span>
                  <button
                    type="button"
                    onClick={handleClearSizes}
                    style={{ background: 'none', border: 'none', color: '#DC2626', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Chips Grid */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {SIZING_PRESETS[activeSizingSystem].sizes.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.5rem 0.85rem',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #004B44' : '1px solid #D1D5DB',
                        backgroundColor: isSelected ? '#004B44' : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#374151',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {sz.includes('Bespoke') && <Scissors size={13} />}
                      <span>{sz}</span>
                      {isSelected && <Check size={13} />}
                    </button>
                  );
                })}
              </div>

              {/* Custom Size Tag Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', maxWidth: '360px' }}>
                <input
                  type="text"
                  placeholder="Add custom size (e.g. Tall / L, Plus Fit)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSize(); } }}
                  style={{
                    flex: 1,
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.8rem',
                    border: '1px solid #D1D5DB',
                    borderRadius: '4px',
                    backgroundColor: '#FFFFFF',
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: '#004B44',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Colors Section */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.5rem' }}>
                Available Colors
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                {colors.map((c, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.35rem 0.75rem',
                      backgroundColor: '#F0EDED',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      color: '#1C1B1B',
                      border: '1px solid #E5E2E1',
                      fontWeight: 500,
                    }}
                  >
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(idx)}
                      style={{ border: 'none', background: 'none', color: '#707977', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>

              {/* Color Presets */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#707977', marginRight: '0.35rem' }}>Presets:</span>
                {PRESET_COLORS.map((pc) => (
                  <button
                    key={pc.name}
                    type="button"
                    onClick={() => handleAddColor(pc.name, pc.hex)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid #E5E2E1',
                      backgroundColor: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: pc.hex }} />
                    <span>+ {pc.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric Stretch & Size Guide Preset */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Fabric Stretch (For Size Guide)
                </label>
                <select
                  value={stretchLevel}
                  onChange={(e) => setStretchLevel(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8' }}
                >
                  <option value="NON">Non-Stretch (Rigid / Silk / Brocade)</option>
                  <option value="SLIGHT">Slight Stretch (Tailored Give)</option>
                  <option value="MEDIUM">Medium Stretch (Flexible Wool)</option>
                  <option value="HIGH">High Stretch (Figure-Hugging Knits)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3F4947', marginBottom: '0.35rem' }}>
                  Measurement Preset Guide
                </label>
                <select
                  value={garmentCut}
                  onChange={(e) => setGarmentCut(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.85rem', border: '1px solid #E5E2E1', borderRadius: '4px', backgroundColor: '#FCF9F8' }}
                >
                  <option value="SENATOR">Senator Two-Piece (Top + Trousers)</option>
                  <option value="AGBADA">Agbada 3-Piece Grand Set</option>
                  <option value="GOWN">Traditional Gown / Dress</option>
                  <option value="TROUSERS">Tailored Trousers Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 4: High-Res Photos & Media Gallery */}
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#004B44', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                4
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#1C1B1B' }}>
                  Product Photos & Media Gallery
                </h3>
                <p style={{ fontSize: '0.75rem', color: '#707977', margin: '0.15rem 0 0 0' }}>
                  Upload high-resolution photography from your device or paste image URLs.
                </p>
              </div>
            </div>

            {/* Device Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #004B44',
                borderRadius: '8px',
                padding: '1.5rem 1rem',
                textAlign: 'center',
                backgroundColor: '#F7FBF9',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handleDeviceFileUpload}
              />
              <UploadCloud size={32} color="#004B44" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#004B44', margin: 0 }}>
                {isUploadingMedia ? 'Uploading photos...' : 'Click to Upload Photos from Device'}
              </p>
              <span style={{ fontSize: '0.7rem', color: '#707977' }}>
                PNG, JPG, WEBP up to 10MB each
              </span>
            </div>

            {/* URL Input Fallback */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <input
                type="url"
                placeholder="Or paste image URL (https://...)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.75rem',
                  fontSize: '0.85rem',
                  border: '1px solid #E5E2E1',
                  borderRadius: '4px',
                  backgroundColor: '#FCF9F8',
                }}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                style={{
                  padding: '0.55rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor: '#F0EDED',
                  color: '#3F4947',
                  border: '1px solid #E5E2E1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Add URL
              </button>
            </div>

            {/* Gallery Thumbnail Strip */}
            {images.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    style={{
                      position: 'relative',
                      width: '80px',
                      height: '96px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: idx === 0 ? '2px solid #004B44' : '1px solid #E5E2E1',
                    }}
                  >
                    <img src={img} alt={`Uploaded ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {idx === 0 && (
                      <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,75,68,0.85)', color: '#FFF', fontSize: '0.6rem', textAlign: 'center', padding: '1px 0' }}>
                        Primary
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        position: 'absolute',
                        top: '3px',
                        right: '3px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        color: '#FFF',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Shopper PDP Preview */}
        <div style={{ position: 'sticky', top: '1.5rem', height: 'fit-content' }}>
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E2E1', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #E5E2E1' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#004B44' }}>
                SHOPPER PREVIEW
              </span>
              <span style={{ fontSize: '0.7rem', color: '#707977' }}>How customers see this piece</span>
            </div>

            {/* Preview Image Card */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '300px',
                backgroundColor: '#F7F6F5',
                borderRadius: '8px',
                overflow: 'hidden',
                marginBottom: '1rem',
                border: '1px solid #E5E2E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[0]}
                    alt={productName || 'Product preview'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: 'rgba(28,27,27,0.75)',
                        color: '#FFF',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {selectedDepartment} • {selectedCategoryObj?.name || 'Garment'}
                    </span>
                    {fulfillmentMode === 'MADE_TO_ORDER' ? (
                      <span
                        style={{
                          backgroundColor: '#004B44',
                          color: '#FFF',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        Tailored in {prepDays}d
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: '#D97706',
                          color: '#FFF',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      >
                        {stockQuantity} in stock
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#FAF9F8',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F0EDED')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#FAF9F8')}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      backgroundColor: '#E6F4F1',
                      color: '#004B44',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <ImageIcon size={24} />
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1C1B1B', marginBottom: '0.25rem' }}>
                    No image uploaded yet
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#707977', maxWidth: '220px', lineHeight: 1.4 }}>
                    Upload a primary photo or enter a URL on the left to preview your product
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    style={{
                      marginTop: '0.75rem',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#004B44',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #004B44',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    Upload Image
                  </button>
                </div>
              )}
            </div>

            {/* Title & Collection */}
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#1C1B1B' }}>
              {productName || 'Product Title Preview'}
            </h4>
            {customCollectionTag && (
              <span style={{ display: 'inline-block', fontSize: '0.75rem', color: '#004B44', fontWeight: 600, marginBottom: '0.75rem' }}>
                Collection: {customCollectionTag}
              </span>
            )}

            {/* Price Preview */}
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#004B44', margin: '0.5rem 0 1rem 0' }}>
              ₦ {price ? parseFloat(price).toLocaleString() : '85,000'}
            </div>

            {/* Size Chips Preview */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#707977', display: 'block', marginBottom: '0.35rem' }}>
                Available Sizes ({activeSizingSystem})
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                {selectedSizes.map((sz) => (
                  <span
                    key={sz}
                    style={{
                      padding: '0.25rem 0.55rem',
                      backgroundColor: '#F0EDED',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#1C1B1B',
                    }}
                  >
                    {sz}
                  </span>
                ))}
              </div>
            </div>

            {/* Colors Preview */}
            {colors.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: '#707977', display: 'block', marginBottom: '0.35rem' }}>
                  Available Colors
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {colors.map((c, i) => (
                    <span
                      key={i}
                      title={c.name}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        backgroundColor: c.hex,
                        border: '1px solid #D1D5DB',
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Buyer Trust Guarantee */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#E6F4F1', borderRadius: '6px', color: '#004B44', fontSize: '0.75rem', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Aso Buyer Protection & Escrow Payout Guaranteed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
