import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  Store, AlertCircle, Loader, Package
} from 'lucide-react';
import './CartPage.css';

export const CartPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const { cart, cartLoading, updateItem, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [clearingCart, setClearingCart] = useState(false);

  // Gate: must be logged in
  if (!user) {
    return (
      <div className="cart-page-gate">
        <ShoppingBag size={52} color="#D1D5DB" />
        <h2>Sign in to view your cart</h2>
        <p>Your cart is waiting — sign in to see your saved items.</p>
        <button className="cart-signin-btn" onClick={() => openAuthModal('login')}>
          Sign In
        </button>
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="cart-page-loading">
        <Loader size={32} className="cart-spinner" />
        <p>Loading your cart...</p>
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  const handleQuantityChange = async (item_id: string, newQty: number) => {
    if (newQty < 0) return;
    setUpdatingItems(prev => new Set(prev).add(item_id));
    try {
      if (newQty === 0) {
        await removeItem(item_id);
      } else {
        await updateItem(item_id, newQty);
      }
    } catch (err: any) {
      console.error('Failed to update item', err);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(item_id);
        return next;
      });
    }
  };

  const handleRemove = async (item_id: string) => {
    setUpdatingItems(prev => new Set(prev).add(item_id));
    try {
      await removeItem(item_id);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(item_id);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Clear your entire cart?')) return;
    setClearingCart(true);
    try {
      await clearCart();
    } finally {
      setClearingCart(false);
    }
  };

  if (isEmpty) {
    return (
      <div className="cart-page-empty">
        <div className="cart-empty-illustration">
          <ShoppingBag size={64} color="#D1D5DB" />
        </div>
        <h2>Your cart is empty</h2>
        <p>Discover authentic Nigerian fashion and add pieces you love.</p>
        <Link to="/" className="cart-explore-btn">
          <ArrowLeft size={16} /> Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page-header">
        <button className="cart-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Continue Shopping
        </button>
        <h1 className="cart-page-title">Shopping Cart</h1>
        <span className="cart-item-count">{cart!.item_count} item{cart!.item_count !== 1 ? 's' : ''}</span>
      </div>

      {/* Vendor notice banner */}
      {cart?.vendor && (
        <div className="cart-vendor-banner">
          <Store size={16} />
          <span>All items from <strong>{cart.vendor.store_name}</strong></span>
          <Link to={`/store/${cart.vendor.slug}`} className="cart-vendor-link">
            Visit Storefront <ArrowRight size={13} />
          </Link>
        </div>
      )}

      <div className="cart-layout">
        {/* Left: Cart Items */}
        <div className="cart-items-list">
          {cart!.items.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            return (
              <div key={item.id} className={`cart-item-row ${isUpdating ? 'cart-item-updating' : ''}`}>
                {/* Product Image */}
                <Link to={`/products/${item.product_slug}`} className="cart-item-image-link">
                  <div
                    className="cart-item-img"
                    style={{
                      backgroundImage: item.primary_image_url
                        ? `url(${item.primary_image_url})`
                        : `url(/traditional-men-1.png)`,
                    }}
                  />
                </Link>

                {/* Product Info */}
                <div className="cart-item-info">
                  <Link to={`/products/${item.product_slug}`} className="cart-item-title">
                    {item.product_title}
                  </Link>

                  <div className="cart-item-meta">
                    <span className="cart-item-variant-badge">
                      {item.size}{item.color ? ` / ${item.color}` : ''}
                    </span>
                    <span className="cart-item-sku">SKU: {item.sku}</span>
                  </div>

                  {item.stock_quantity <= 5 && item.stock_quantity > 0 && (
                    <div className="cart-item-low-stock">
                      <Package size={13} /> Only {item.stock_quantity} left
                    </div>
                  )}

                  <div className="cart-item-price-row">
                    <span className="cart-item-unit-price">
                      ₦{item.unit_price_naira.toLocaleString()} each
                    </span>
                  </div>
                </div>

                {/* Quantity + Total */}
                <div className="cart-item-controls">
                  <div className="cart-qty-stepper">
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      disabled={isUpdating || item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="cart-qty-value">
                      {isUpdating ? <Loader size={14} className="cart-spinner-sm" /> : item.quantity}
                    </span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      disabled={isUpdating || item.quantity >= item.stock_quantity}
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="cart-item-line-total">
                    ₦{item.total_price_naira.toLocaleString()}
                  </div>

                  <button
                    className="cart-remove-btn"
                    onClick={() => handleRemove(item.id)}
                    disabled={isUpdating}
                    aria-label={`Remove ${item.product_title}`}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Clear Cart */}
          <div className="cart-clear-row">
            <button
              className="cart-clear-btn"
              onClick={handleClearCart}
              disabled={clearingCart}
            >
              {clearingCart ? <Loader size={14} className="cart-spinner-sm" /> : <Trash2 size={14} />}
              Clear Cart
            </button>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="cart-summary-sidebar">
          <div className="cart-summary-card">
            <h2 className="cart-summary-title">Order Summary</h2>

            <div className="cart-summary-lines">
              <div className="cart-summary-line">
                <span>Subtotal ({cart!.item_count} item{cart!.item_count !== 1 ? 's' : ''})</span>
                <span>₦{cart!.subtotal_naira.toLocaleString()}</span>
              </div>
              <div className="cart-summary-line">
                <span>Delivery</span>
                <span className="cart-summary-delivery">Calculated at checkout</span>
              </div>
            </div>

            <div className="cart-summary-total-row">
              <span>Estimated Total</span>
              <span className="cart-summary-total-price">₦{cart!.subtotal_naira.toLocaleString()}</span>
            </div>

            {/* Single-vendor notice */}
            {cart?.vendor && (
              <div className="cart-summary-vendor-note">
                <AlertCircle size={14} />
                <span>
                  Cart is limited to one designer at a time. You have items from <strong>{cart.vendor.store_name}</strong>.
                </span>
              </div>
            )}

            {/* Checkout Button — disabled (Sprint 6) */}
            <button className="cart-checkout-btn" disabled title="Order placement coming in next sprint">
              Proceed to Checkout
              <span className="cart-checkout-coming-soon">Coming Soon</span>
            </button>

            <Link to="/" className="cart-continue-link">
              <ArrowLeft size={14} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
