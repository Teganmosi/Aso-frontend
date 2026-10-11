import { BrandLoader } from '../components/common/BrandLoader';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi, reviewApi } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import type { Product, ProductVariant, Review } from '../types';

import {
  ArrowLeft, ShoppingBag, MapPin, Clock, CheckCircle2, Star,
  ChevronLeft, ChevronRight, AlertCircle, Loader, Package, MessageSquare, ShieldCheck,
  Ruler, Scissors, Check
} from 'lucide-react';
import { SizeGuideModal } from '../components/common/SizeGuideModal';
import { BespokeFitModal } from '../components/common/BespokeFitModal';
import type { BespokeMeasurements } from '../types';
import './ProductDetailPage.css';


const COLOR_HEX_MAP: Record<string, string> = {
  'black': '#111827',
  'midnight black': '#0F172A',
  'white': '#FFFFFF',
  'off-white': '#FAF9F6',
  'cream': '#FDFBF7',
  'gold': '#D4AF37',
  'champagne': '#F7E7CE',
  'champagne gold': '#F7E7CE',
  'emerald': '#064E3B',
  'emerald green': '#064E3B',
  'green': '#15803D',
  'forest green': '#0C3B2E',
  'olive': '#3F6212',
  'olive green': '#3F6212',
  'burgundy': '#7F1D1D',
  'wine': '#831843',
  'wine red': '#780016',
  'navy': '#1E3A8A',
  'navy blue': '#1E3A8A',
  'royal blue': '#1D4ED8',
  'blue': '#2563EB',
  'sky blue': '#38BDF8',
  'purple': '#6B21A8',
  'royal purple': '#581C87',
  'lilac': '#C084FC',
  'orange': '#EA580C',
  'burnt orange': '#C2410C',
  'terracotta': '#C86D51',
  'peach': '#FDBA74',
  'coral': '#F43F5E',
  'yellow': '#EAB308',
  'mustard': '#CA8A04',
  'mustard yellow': '#CA8A04',
  'brown': '#78350F',
  'chocolate': '#451A03',
  'bronze': '#A16207',
  'silver': '#94A3B8',
  'grey': '#64748B',
  'gray': '#64748B',
  'charcoal': '#334155',
  'teal': '#0F766E',
  'turquoise': '#0D9488',
  'red': '#DC2626',
  'pink': '#DB2777',
  'dusty pink': '#BE185D',
  'rose gold': '#B76E79',
  'beige': '#E5D3B3',
};

const getSwatchHex = (colorName?: string | null): string => {
  if (!colorName) return '#0C3B2E';
  const clean = colorName.trim().toLowerCase();
  if (clean.startsWith('#') || clean.startsWith('rgb')) return clean;
  if (COLOR_HEX_MAP[clean]) return COLOR_HEX_MAP[clean];
  for (const [key, hex] of Object.entries(COLOR_HEX_MAP)) {
    if (clean.includes(key)) return hex;
  }
  return '#0C3B2E';
};

export const ProductDetailPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showBespokeModal, setShowBespokeModal] = useState(false);
  const [bespokeMeasurements, setBespokeMeasurements] = useState<BespokeMeasurements | null>(null);
  const [isBespokeMode, setIsBespokeMode] = useState(false);

  useEffect(() => {
    if (identifier) {
      loadProduct(identifier);
    }
  }, [identifier]);

  const loadProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productApi.getPublicProductDetail(id);
      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        const firstAvailable = data.variants.find(v => v.stock_quantity > 0 && v.is_active) || data.variants[0];
        setSelectedVariant(firstAvailable);
        if (firstAvailable.color && firstAvailable.color !== 'Standard' && firstAvailable.color.toLowerCase() !== 'default') {
          setSelectedColor(firstAvailable.color);
        }
        setSelectedSize(firstAvailable.size);
      }
      // Load reviews for this product
      loadReviews(data.id);
    } catch {
      setError('Product not found or is no longer available.');
    } finally {
      setLoading(false);
    }
  };


  const handleSelectColor = (colorName: string) => {
    setSelectedColor(colorName);
    if (!product?.variants) return;

    // Try finding variant with current size in the newly selected color
    const exact = product.variants.find(
      v => v.color?.toLowerCase() === colorName.toLowerCase() && v.size === selectedSize && v.is_active
    );
    if (exact) {
      setSelectedVariant(exact);
    } else {
      // Fallback: pick first in-stock variant of that color, or any active variant of that color
      const fallback = product.variants.find(
        v => v.color?.toLowerCase() === colorName.toLowerCase() && v.stock_quantity > 0 && v.is_active
      ) || product.variants.find(
        v => v.color?.toLowerCase() === colorName.toLowerCase() && v.is_active
      );
      if (fallback) {
        setSelectedSize(fallback.size);
        setSelectedVariant(fallback);
      }
    }
  };

  const handleSelectSize = (sz: string) => {
    setIsBespokeMode(false);
    setSelectedSize(sz);
    if (!product?.variants) return;

    const exact = product.variants.find(
      v => v.size === sz && (!selectedColor || v.color?.toLowerCase() === selectedColor.toLowerCase()) && v.is_active
    ) || product.variants.find(
      v => v.size === sz && v.is_active
    );
    if (exact) {
      setSelectedVariant(exact);
      if (exact.color && exact.color !== 'Standard' && exact.color.toLowerCase() !== 'default') {
        setSelectedColor(exact.color);
      }
    }
    setQuantity(1);
  };

  const loadReviews = async (productId: string) => {
    setReviewsLoading(true);
    try {
      const revs = await reviewApi.getProductReviews(productId);
      setReviews(revs);
    } catch (err) {
      console.error('Failed to load reviews', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    if (!selectedVariant) {
      setCartMessage({ type: 'error', text: 'Please select a size/variant before adding to cart.' });
      return;
    }

    const hasBespokeMeasurements = Boolean(bespokeMeasurements && Object.keys(bespokeMeasurements).length > 0);
    const isBespoke = isBespokeMode || hasBespokeMeasurements || selectedVariant.size.toLowerCase().includes('bespoke') || selectedVariant.size.toLowerCase().includes('custom');
    if (isBespoke && !hasBespokeMeasurements) {
      setShowBespokeModal(true);
      setCartMessage({ type: 'error', text: 'Please enter your custom body measurements for this bespoke piece.' });
      return;
    }

    setAddingToCart(true);
    setCartMessage(null);
    try {
      await addToCart(selectedVariant.id, quantity, (isBespoke && hasBespokeMeasurements) ? bespokeMeasurements : undefined);
      setCartMessage({ type: 'success', text: 'Added to cart successfully!' });
      setTimeout(() => setCartMessage(null), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to add item to cart.';
      setCartMessage({ type: 'error', text: msg });
    } finally {
      setAddingToCart(false);
    }
  };

  const mediaItems = product?.media && product.media.length > 0
    ? product.media
    : product?.primary_image_url
      ? [{ id: 'primary', url: product.primary_image_url, media_type: 'IMAGE' as const, is_primary: true, display_order: 0, created_at: '' }]
      : [];

  const activeImage = mediaItems[activeMediaIndex]?.url || '/traditional-men-1.png';

  const getStockStatus = (variant: ProductVariant | null) => {
    if (!variant) return null;
    if (variant.stock_quantity === 0) return { label: 'Out of Stock', color: '#DC2626' };
    
    // Made-to-Order fulfillment (high stock flag or preparation time >= 2 days)
    if (variant.stock_quantity >= 50 || (product?.preparation_time_days && product.preparation_time_days >= 2)) {
      const days = product?.preparation_time_days || 3;
      return { 
        label: `✨ Made to Order · Tailored & Dispatched in ${days} ${days === 1 ? 'day' : 'days'}`, 
        color: '#004B44' 
      };
    }
    
    if (variant.stock_quantity <= 5) {
      return { label: `⚡ Ready to Ship · Low Stock (${variant.stock_quantity} left)`, color: '#D97706' };
    }
    return { label: `⚡ Ready to Ship (${variant.stock_quantity} available)`, color: '#10B981' };
  };

  const stockStatus = getStockStatus(selectedVariant);

  if (loading) {
    return <BrandLoader message="Loading luxury piece details..." theme="light" />;
  }

  if (error || !product) {
    return (
      <div className="pdp-error-state">
        <AlertCircle size={40} color="#DC2626" />
        <h2>Product Not Found</h2>
        <p>{error || 'This product could not be found.'}</p>
        <button className="pdp-back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Home
        </button>
      </div>
    );
  }

  const avgRatingNum = Number(product.average_rating) || 0;

  return (
    <div className="pdp-page">
      {/* Breadcrumb */}
      <div className="pdp-breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        {product.category && <><Link to={`/?category=${product.category.slug}`}>{product.category.name}</Link><span>/</span></>}
        <span className="pdp-breadcrumb-current">{product.title}</span>
      </div>

      <div className="pdp-container">
        {/* LEFT: Media Gallery */}
        <div className="pdp-gallery">
          <div className="pdp-main-image-wrapper">
            <img
              src={activeImage}
              alt={product.title}
              className="pdp-main-image"
              onError={(e) => { (e.target as HTMLImageElement).src = '/traditional-men-1.png'; }}
            />
            {mediaItems.length > 1 && (
              <>
                <button
                  className="pdp-gallery-nav pdp-gallery-prev"
                  onClick={() => setActiveMediaIndex(i => (i - 1 + mediaItems.length) % mediaItems.length)}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="pdp-gallery-nav pdp-gallery-next"
                  onClick={() => setActiveMediaIndex(i => (i + 1) % mediaItems.length)}
                  aria-label="Next image"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>

          {mediaItems.length > 1 && (
            <div className="pdp-thumbnail-strip">
              {mediaItems.map((m, i) => (
                <button
                  key={m.id}
                  className={`pdp-thumb ${i === activeMediaIndex ? 'active' : ''}`}
                  onClick={() => setActiveMediaIndex(i)}
                >
                  <img src={m.url} alt={`View ${i + 1}`} onError={(e) => { (e.target as HTMLImageElement).src = '/traditional-men-1.png'; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Info Panel */}
        <div className="pdp-info-panel">
          {/* Vendor badge */}
          {product.vendor && (
            <Link to={`/store/${product.vendor.slug}`} className="pdp-vendor-badge">
              {product.vendor.is_verified && <CheckCircle2 size={14} />}
              <span>{product.vendor.store_name}</span>
              <span className="pdp-vendor-location">
                <MapPin size={12} />{product.vendor.city}, {product.vendor.state}
              </span>
            </Link>
          )}

          {/* Category chip */}
          {product.category && (
            <span className="pdp-category-chip">{product.category.name}</span>
          )}

          <h1 className="pdp-title">{product.title}</h1>

          {/* Rating */}
          <div className="pdp-rating-row">
            <div className="pdp-stars">
              {[1, 2, 3, 4, 5].map(s => (
                <Star
                  key={s}
                  size={15}
                  fill={avgRatingNum > 0 && s <= Math.round(avgRatingNum) ? '#F59E0B' : 'none'}
                  color={avgRatingNum > 0 && s <= Math.round(avgRatingNum) ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </div>
            <span className="pdp-rating-text">
              {product.review_count > 0 ? `${avgRatingNum.toFixed(1)} (${product.review_count} verified review${product.review_count !== 1 ? 's' : ''})` : 'Newly Listed • No reviews yet'}
            </span>
          </div>

          {/* Price */}
          <div className="pdp-price-block">
            <span className="pdp-price">
              ₦{(selectedVariant?.price_naira ?? product.base_price_naira).toLocaleString()}
            </span>
            {product.preparation_time_days > 0 && (
              <div className="pdp-prep-badge">
                <Clock size={13} />
                <span>{product.preparation_time_days} day{product.preparation_time_days !== 1 ? 's' : ''} bespoke tailoring</span>
              </div>
            )}
          </div>

          {/* Decoupled Color & Size Sizing Engine */}
          {(() => {
            const variants = product.variants || [];
            if (variants.length === 0) return null;

            // 1. Extract Unique Colorways (excluding empty or 'Standard')
            const rawColors = variants
              .map(v => v.color?.trim())
              .filter((c): c is string => Boolean(c && c !== 'Standard' && c.toLowerCase() !== 'default'));
            const uniqueColors = Array.from(new Set(rawColors));

            // 2. Extract Unique Sizes (ordered naturally)
            const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', '4XL', 'Free Size'];
            const rawSizes = variants
              .map(v => v.size?.trim())
              .filter((sz): sz is string => Boolean(sz && !sz.toLowerCase().includes('bespoke')));
            const uniqueSizes = Array.from(new Set(rawSizes)).sort((a, b) => {
              const indexA = sizeOrder.indexOf(a);
              const indexB = sizeOrder.indexOf(b);
              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              return a.localeCompare(b);
            });

            // Active display values
            const currentColor = selectedColor || (selectedVariant?.color && selectedVariant.color !== 'Standard' ? selectedVariant.color : '');
            const currentSize = selectedSize || selectedVariant?.size || '';

            return (
              <div className="pdp-variants-section">
                {/* Sizing Track Mode Selector Tabs */}
                <div className="pdp-track-mode-tabs">
                  <button
                    type="button"
                    className={`pdp-track-tab ${!isBespokeMode ? 'active' : ''}`}
                    onClick={() => setIsBespokeMode(false)}
                  >
                    Standard Ready-To-Wear
                  </button>
                  <button
                    type="button"
                    className={`pdp-track-tab pdp-track-tab--bespoke ${isBespokeMode ? 'active' : ''}`}
                    onClick={() => {
                      setIsBespokeMode(true);
                      if (!bespokeMeasurements) setShowBespokeModal(true);
                    }}
                  >
                    <Scissors size={13} />
                    <span>Custom Made-to-Measure</span>
                  </button>
                </div>

                {/* TIER 1: Color Palette Selector (Only shown if vendor offered multiple colors) */}
                {uniqueColors.length > 1 && !isBespokeMode && (
                  <div className="pdp-color-tier">
                    <div className="pdp-tier-header">
                      <span className="pdp-tier-label">Color:</span>
                      <strong className="pdp-tier-value">{currentColor || 'Select Color'}</strong>
                    </div>
                    <div className="pdp-color-swatches-row">
                      {uniqueColors.map((colorName) => {
                        const isColorActive = currentColor.toLowerCase() === colorName.toLowerCase();
                        const hex = getSwatchHex(colorName);
                        const isLight = ['#ffffff', '#faf9f6', '#fdfbf7', '#f7e7ce', '#e5d3b3'].includes(hex.toLowerCase());

                        // Check if ANY size in this color has available stock
                        const hasStock = variants.some(
                          v => v.color?.toLowerCase() === colorName.toLowerCase() && v.stock_quantity > 0 && v.is_active
                        );

                        return (
                          <button
                            key={colorName}
                            type="button"
                            className={`pdp-color-pill ${isColorActive ? 'active' : ''} ${!hasStock ? 'out-of-stock' : ''}`}
                            onClick={() => handleSelectColor(colorName)}
                            title={hasStock ? colorName : `${colorName} (Sold Out)`}
                          >
                            <span
                              className="pdp-color-dot"
                              style={{
                                backgroundColor: hex,
                                border: isLight ? '1px solid #D1D5DB' : 'none'
                              }}
                            />
                            <span className="pdp-color-pill-label">{colorName}</span>
                            {isColorActive && <Check size={12} className="pdp-color-check-icon" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TIER 2: Sizing & Fit Selector */}
                <div className="pdp-size-tier">
                  <div className="pdp-size-header-row">
                    <p className="pdp-variant-label" style={{ margin: 0 }}>
                      {isBespokeMode ? (
                        <span style={{ color: '#0C3B2E', fontWeight: 700 }}>
                          <Scissors size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                          Bespoke Custom Fit
                        </span>
                      ) : (
                        <>
                          <span className="pdp-tier-label">Size:</span>
                          <strong className="pdp-tier-value"> {currentSize || 'Select Size'}</strong>
                        </>
                      )}
                    </p>
                    {!isBespokeMode && (
                      <button
                        className="pdp-size-guide-btn"
                        onClick={() => setShowSizeGuide(true)}
                        type="button"
                      >
                        <Ruler size={13} color="#0C3B2E" />
                        <span>Size Guide</span>
                      </button>
                    )}
                  </div>

                  {/* Size Chips */}
                  <div className="pdp-variant-chips">
                    {uniqueSizes.map((sz) => {
                      const matching = variants.find(
                        v => v.size === sz && (!currentColor || v.color?.toLowerCase() === currentColor.toLowerCase())
                      ) || variants.find(v => v.size === sz);

                      const isSelected = !isBespokeMode && currentSize === sz;
                      const isOos = !matching || matching.stock_quantity === 0 || !matching.is_active;

                      return (
                        <button
                          key={sz}
                          type="button"
                          className={`pdp-variant-chip ${isSelected ? 'active' : ''} ${isOos ? 'out-of-stock' : ''}`}
                          onClick={() => handleSelectSize(sz)}
                          title={isOos ? `${sz} is Out of stock` : `${sz} in stock`}
                          disabled={!matching?.is_active}
                        >
                          <span>{sz}</span>
                          {isOos && <span className="chip-oos-line" />}
                        </button>
                      );
                    })}

                    {/* Dedicated Bespoke Chip */}
                    <button
                      type="button"
                      className={`pdp-variant-chip pdp-bespoke-chip ${isBespokeMode ? 'active' : ''}`}
                      onClick={() => {
                        setIsBespokeMode(true);
                        if (!bespokeMeasurements) setShowBespokeModal(true);
                      }}
                    >
                      <Scissors size={12} className="chip-scissors-icon" />
                      <span>Bespoke Fit</span>
                    </button>
                  </div>
                </div>

                {stockStatus && (
                  <div className="pdp-stock-status" style={{ color: stockStatus.color }}>
                    <Package size={14} />
                    <span>{stockStatus.label}</span>
                  </div>
                )}

                {/* Bespoke Fit Configuration Card */}
                {(isBespokeMode || (selectedVariant && (selectedVariant.size.toLowerCase().includes('bespoke') || selectedVariant.size.toLowerCase().includes('custom')))) && (
                  <div className="pdp-bespoke-spec-card">
                    <div className="bespoke-card-header">
                      <div className="bespoke-card-icon">
                        <Scissors size={16} color="#D4AF37" />
                      </div>
                      <div className="bespoke-card-text">
                        <strong>Bespoke Made-to-Measure</strong>
                        <span>Tailored specifically to your unique silhouette</span>
                      </div>
                    </div>

                    {bespokeMeasurements && Object.keys(bespokeMeasurements).length > 0 ? (() => {
                      const isSmartEstimated = bespokeMeasurements.fit_source === 'smart_estimator_v1.2';
                      const sizeSnap = bespokeMeasurements.size_snapshot;
                      const heightSnap = bespokeMeasurements.height_snapshot;
                      const unit = bespokeMeasurements.unit || 'IN';

                      // Filter out internal metadata keys & non-scalar object maps
                      const metaKeys = ['unit', 'category_type', 'notes', 'estimated_ranges', 'fit_source', 'height_snapshot', 'size_snapshot'];
                      const keyMeasurements = Object.entries(bespokeMeasurements)
                        .filter(([k, v]) => !metaKeys.includes(k) && typeof v !== 'object' && v !== undefined && v !== '' && !isNaN(Number(v)))
                        .map(([k, v]) => ({
                          label: k.replace(/_/g, ' '),
                          value: `${v} ${unit.toLowerCase()}`
                        }));

                      const primaryPills = keyMeasurements.slice(0, 3);

                      return (
                        <div className="bespoke-spec-active-box">
                          <div className="bespoke-spec-summary">
                            <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                            <div>
                              <div style={{ fontWeight: 700, color: '#0C3B2E', fontSize: '0.85rem' }}>
                                {isSmartEstimated ? (
                                  <>✨ Smart Fit Calibrated {sizeSnap ? `(Size ${sizeSnap}` : ''}{heightSnap ? ` • ${heightSnap})` : ')'}</>
                                ) : (
                                  <>Atelier Fit Configured ({unit})</>
                                )}
                              </div>
                              {primaryPills.length > 0 && (
                                <div style={{ fontSize: '0.78rem', color: '#4B5563', marginTop: '0.15rem' }}>
                                  {primaryPills.map(p => `${p.label}: ${p.value}`).join(' · ')}
                                  {keyMeasurements.length > 3 && ` · +${keyMeasurements.length - 3} more`}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-edit-bespoke-spec"
                            onClick={() => setShowBespokeModal(true)}
                          >
                            Edit Spec
                          </button>
                        </div>
                      );
                    })() : (
                      <button
                        type="button"
                        className="btn-launch-bespoke-spec"
                        onClick={() => setShowBespokeModal(true)}
                      >
                        <Scissors size={14} /> Set Custom Measurements (Required)
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Quantity Stepper */}
          <div className="pdp-quantity-row">
            <span className="pdp-qty-label">Quantity:</span>
            <div className="pdp-qty-stepper">
              <button
                className="pdp-qty-btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >-</button>
              <span className="pdp-qty-value">{quantity}</span>
              <button
                className="pdp-qty-btn"
                onClick={() => setQuantity(q => Math.min(selectedVariant?.stock_quantity ?? 99, q + 1))}
                disabled={quantity >= (selectedVariant?.stock_quantity ?? 99)}
              >+</button>
            </div>
          </div>

          {/* Cart Feedback Message */}
          {cartMessage && (
            <div className={`pdp-cart-message pdp-cart-message--${cartMessage.type}`}>
              {cartMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{cartMessage.text}</span>
            </div>
          )}

          {/* Add to Cart + View Cart */}
          <div className="pdp-cta-row">
            <button
              id="add-to-cart-btn"
              className="pdp-add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={addingToCart || (selectedVariant?.stock_quantity === 0)}
            >
              {addingToCart ? (
                <><Loader size={16} className="pdp-spinner-sm" /> Adding...</>
              ) : selectedVariant?.stock_quantity === 0 ? (
                'Out of Stock'
              ) : (
                <><ShoppingBag size={18} /> Add to Cart</>
              )}
            </button>
            <Link to="/cart" className="pdp-view-cart-link">View Cart</Link>
          </div>

          {/* Description */}
          <div className="pdp-description">
            <h3 className="pdp-desc-title">About this piece</h3>
            <p>{product.description}</p>
          </div>
        </div>
      </div>

      {/* VERIFIED BUYER REVIEWS SECTION (Sprint 10) */}
      <div className="pdp-reviews-section" style={{ marginTop: '4rem', borderTop: '1px solid #E5E7EB', paddingTop: '3rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontFamily: 'Cinzel, Georgia, serif', color: '#111827', margin: 0 }}>
              Verified Buyer Reviews
            </h2>
            <p style={{ color: '#6B7280', fontSize: '0.9rem', marginTop: '0.3rem' }}>
              Authentic feedback from customers who purchased and received this bespoke creation.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#F9FAFB', padding: '0.75rem 1.25rem', borderRadius: '8px' }}>
            <div style={{ fontSize: product.review_count > 0 ? '2rem' : '1.25rem', fontWeight: 700, color: '#111827', fontFamily: 'Cinzel, Georgia, serif' }}>
              {product.review_count > 0 ? avgRatingNum.toFixed(1) : 'No reviews yet'}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={product.review_count > 0 && s <= Math.round(avgRatingNum) ? '#F59E0B' : 'none'}
                    color={product.review_count > 0 && s <= Math.round(avgRatingNum) ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.2rem' }}>
                {product.review_count > 0 ? `Based on ${product.review_count} verified customer review${product.review_count !== 1 ? 's' : ''}` : 'Be the first client to review this bespoke piece'}
              </div>
            </div>
          </div>
        </div>

        {reviewsLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B7280' }}>
            <Loader size={24} className="cart-spinner" />
            <p style={{ marginTop: '0.5rem' }}>Loading verified reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: '#F9FAFB', borderRadius: '12px', color: '#6B7280' }}>
            <MessageSquare size={36} style={{ color: '#9CA3AF', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', color: '#374151', margin: 0 }}>No Customer Reviews Yet</h3>
            <p style={{ fontSize: '0.875rem', maxWidth: '400px', margin: '0.5rem auto 0' }}>
              Be the first to purchase and review this bespoke piece once your order is fulfilled and delivered!
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {reviews.map((rev) => {
              const reviewerName = typeof rev.customer === 'object' && rev.customer?.first_name 
                ? `${rev.customer.first_name} ${rev.customer.last_name?.[0] || ''}.`
                : rev.customer_name || 'Verified Customer';

              return (
                <div 
                  key={rev.id} 
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
                        {reviewerName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.2rem' }}>
                        <ShieldCheck size={13} />
                        <span>Verified Buyer</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '1px' }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={14}
                            fill={s <= rev.rating ? '#F59E0B' : 'none'}
                            color={s <= rev.rating ? '#F59E0B' : '#D1D5DB'}
                          />
                        ))}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.2rem', display: 'block' }}>
                        {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: '#4B5563', lineHeight: 1.6, margin: 0 }}>
                    "{rev.comment}"
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bespoke Fit Modal */}
      {product && (
        <BespokeFitModal
          isOpen={showBespokeModal}
          onClose={() => setShowBespokeModal(false)}
          productTitle={product.title}
          categoryName={product.category?.name}
          categorySlug={product.category?.slug}
          garmentTypeHint={product.size_chart?.garment_type}
          currentMeasurements={bespokeMeasurements}
          onApplyMeasurements={(m) => { setBespokeMeasurements(m); setIsBespokeMode(true); }}
        />
      )}

      {/* Temu-Style Interactive Size Guide Modal */}
      {product && (
        <SizeGuideModal
          isOpen={showSizeGuide}
          onClose={() => setShowSizeGuide(false)}
          productTitle={product.title}
          productImage={activeImage}
          sizeChart={product.size_chart}
          selectedSize={selectedVariant?.size}
          onSelectSize={(sz) => {
            const found = product.variants?.find((v) => v.size.toUpperCase() === sz.toUpperCase());
            if (found) {
              setSelectedVariant(found);
              setQuantity(1);
            }
          }}
          variants={product.variants}
        />
      )}
    </div>
  );
};

