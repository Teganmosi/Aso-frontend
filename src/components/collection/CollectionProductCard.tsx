import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Star, Truck } from 'lucide-react';
import type { Product } from '../../types';

interface CollectionProductCardProps {
  product: Product;
}

export const CollectionProductCard: React.FC<CollectionProductCardProps> = ({ product }) => {
  const imageUrl = product.primary_image_url || 
    (product.media && product.media.length > 0 ? product.media[0].url : null);
  
  const hasReviews = product.review_count > 0 && parseFloat(String(product.average_rating)) > 0;
  const isVerifiedVendor = Boolean(product.vendor?.is_verified);

  // Concrete Delivery Date Math: (Tailor prep days + 2 days Dellyman dispatch)
  const estDeliveryText = React.useMemo(() => {
    const prepDays = product.preparation_time_days > 0 ? product.preparation_time_days : 3;
    const totalDays = prepDays + 2;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + totalDays);
    return targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }, [product.preparation_time_days]);

  return (
    <article className="collection-product-card">
      <Link to={`/products/${product.slug || product.id}`} className="card-media-link">
        <div className="card-media-wrapper">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.title}
              className="card-media-img"
              loading="lazy"
            />
          ) : (
            <div className="card-media-placeholder">
              <span>{product.title.slice(0, 2).toUpperCase()}</span>
            </div>
          )}

          {/* Real Preparation SLA Badge */}
          {product.preparation_time_days > 0 ? (
            <div className="card-sla-badge">
              <Clock size={11} />
              <span>{product.preparation_time_days}d tailoring</span>
            </div>
          ) : (
            <div className="card-sla-badge ready-badge">
              <span>Ready to Ship</span>
            </div>
          )}

          {/* Bespoke Pill if custom tailoring permitted */}
          {product.allow_custom_measurements && (
            <div className="card-bespoke-badge">
              <span>✂️ Bespoke</span>
            </div>
          )}
        </div>
      </Link>

      <div className="card-details">
        {/* Designer Row */}
        <div className="card-designer-row">
          {product.vendor ? (
            <Link to={`/store/${product.vendor.slug}`} className="card-designer-name">
              {product.vendor.store_name}
            </Link>
          ) : (
            <span className="card-designer-name">Independent Designer</span>
          )}

          {/* Verification badge */}
          {isVerifiedVendor && (
            <span className="card-verified-badge" title="Verified Designer Atelier">
              <ShieldCheck size={13} color="#D4AF37" />
            </span>
          )}
        </div>

        {/* Title (Line clamped to 2 lines for uniform grid alignment) */}
        <h3 className="card-title">
          <Link to={`/products/${product.slug || product.id}`}>
            {product.title}
          </Link>
        </h3>

        {/* Concrete Delivery Date Promise */}
        <div className="card-delivery-row">
          <Truck size={11} className="delivery-icon" />
          <span>Arrives by <strong>{estDeliveryText}</strong></span>
        </div>

        {/* Price & Rating Row */}
        <div className="card-bottom-row">
          <div className="card-price">
            ₦{product.base_price_naira.toLocaleString()}
          </div>

          {hasReviews && (
            <div className="card-rating">
              <Star size={11} fill="#D4AF37" color="#D4AF37" />
              <span>{parseFloat(String(product.average_rating)).toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
