import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, Star } from 'lucide-react';
import type { Product } from '../../types';

interface CollectionProductCardProps {
  product: Product;
}

export const CollectionProductCard: React.FC<CollectionProductCardProps> = ({ product }) => {
  const imageUrl = product.primary_image_url || 
    (product.media && product.media.length > 0 ? product.media[0].url : null);
  
  const hasReviews = product.review_count > 0 && parseFloat(String(product.average_rating)) > 0;
  const isVerifiedVendor = Boolean(product.vendor?.is_verified);

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
          {product.preparation_time_days > 0 && (
            <div className="card-sla-badge">
              <Clock size={12} />
              <span>{product.preparation_time_days}d tailoring</span>
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

          {/* Strict verification badge: ONLY if vendor.is_verified === true */}
          {isVerifiedVendor && (
            <span className="card-verified-badge" title="Verified Designer Atelier">
              <ShieldCheck size={14} color="#D4AF37" />
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="card-title">
          <Link to={`/products/${product.slug || product.id}`}>
            {product.title}
          </Link>
        </h3>

        {/* Price & Rating Row */}
        <div className="card-bottom-row">
          <div className="card-price">
            ₦{product.base_price_naira.toLocaleString()}
          </div>

          {/* Genuine Reviews: ONLY displayed if review_count > 0 */}
          {hasReviews && (
            <div className="card-rating">
              <Star size={13} fill="#D4AF37" color="#D4AF37" />
              <span>{parseFloat(String(product.average_rating)).toFixed(1)}</span>
              <span className="card-review-count">({product.review_count})</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
