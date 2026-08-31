import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productApi, reviewApi } from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import type { Product, ProductVariant, Review } from '../types';
import {
  ArrowLeft, ShoppingBag, MapPin, Clock, CheckCircle2, Star,
  ChevronLeft, ChevronRight, AlertCircle, Loader, Package, MessageSquare, ShieldCheck
} from 'lucide-react';
import './ProductDetailPage.css';

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
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [quantity, setQuantity] = useState(1);

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
        const firstAvailable = data.variants.find(v => v.stock_quantity > 0 && v.is_active);
        setSelectedVariant(firstAvailable || data.variants[0]);
      }
      // Load reviews for this product
      loadReviews(data.id);
    } catch (err: any) {
      setError('Product not found or is no longer available.');
    } finally {
      setLoading(false);
    }
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
    setAddingToCart(true);
    setCartMessage(null);
    try {
      await addToCart(selectedVariant.id, quantity);
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
    if (variant.stock_quantity <= 5) return { label: `Low Stock (${variant.stock_quantity} left)`, color: '#D97706' };
    return { label: 'In Stock', color: '#10B981' };
  };

  const stockStatus = getStockStatus(selectedVariant);

  if (loading) {
    return (
      <div className="pdp-loading-state">
        <Loader size={32} className="pdp-spinner" />
        <p>Loading product...</p>
      </div>
    );
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
                  fill={s <= Math.round(avgRatingNum) ? '#F59E0B' : 'none'}
                  color={s <= Math.round(avgRatingNum) ? '#F59E0B' : '#D1D5DB'}
                />
              ))}
            </div>
            <span className="pdp-rating-text">
              {avgRatingNum > 0 ? avgRatingNum.toFixed(1) : 'New'} ({product.review_count} verified review{product.review_count !== 1 ? 's' : ''})
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

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="pdp-variants-section">
              <p className="pdp-variant-label">
                Size / Colour:
                {selectedVariant && (
                  <strong> {selectedVariant.size}{selectedVariant.color ? ` / ${selectedVariant.color}` : ''}</strong>
                )}
              </p>
              <div className="pdp-variant-chips">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    className={`pdp-variant-chip ${selectedVariant?.id === v.id ? 'active' : ''} ${v.stock_quantity === 0 ? 'out-of-stock' : ''}`}
                    onClick={() => { setSelectedVariant(v); setQuantity(1); }}
                    title={v.stock_quantity === 0 ? 'Out of stock' : `${v.stock_quantity} in stock`}
                    disabled={!v.is_active}
                  >
                    <span>{v.size}</span>
                    {v.color && <span className="variant-color-dot" style={{ backgroundColor: v.color.toLowerCase() }} />}
                    {v.stock_quantity === 0 && <span className="chip-oos-line" />}
                  </button>
                ))}
              </div>

              {stockStatus && (
                <div className="pdp-stock-status" style={{ color: stockStatus.color }}>
                  <Package size={14} />
                  <span>{stockStatus.label}</span>
                </div>
              )}
            </div>
          )}

          {/* Quantity Stepper */}
          <div className="pdp-quantity-row">
            <span className="pdp-qty-label">Quantity:</span>
            <div className="pdp-qty-stepper">
              <button
                className="pdp-qty-btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >−</button>
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
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#111827', fontFamily: 'Cinzel, Georgia, serif' }}>
              {avgRatingNum > 0 ? avgRatingNum.toFixed(1) : '5.0'}
            </div>
            <div>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    fill={s <= Math.round(avgRatingNum || 5) ? '#F59E0B' : 'none'}
                    color={s <= Math.round(avgRatingNum || 5) ? '#F59E0B' : '#D1D5DB'}
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: '0.2rem' }}>
                Based on {product.review_count} review{product.review_count !== 1 ? 's' : ''}
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
    </div>
  );
};
