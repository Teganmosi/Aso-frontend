import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderApi, paymentApi, addressApi } from '../api/client';
import type { Order, PaymentRequest, Address } from '../types';
import {
  ShoppingBag, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  Store, AlertCircle, Loader, Package, Check, MapPin, CreditCard, ShieldCheck, CheckCircle
} from 'lucide-react';
import './CartPage.css';

const BLANK_ADDRESS: Omit<Address, 'id' | 'created_at'> = {
  full_name: '',
  phone_number: '',
  street_address: '',
  city: '',
  state: '',
  landmark: '',
  is_default: false,
};

export const CartPage: React.FC = () => {
  const { user, openAuthModal, addresses, fetchAddresses } = useAuth();
  const { cart, cartLoading, updateItem, removeItem, clearCart, refreshCart } = useCart();
  const navigate = useNavigate();

  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());
  const [clearingCart, setClearingCart] = useState(false);

  // Checkout-specific States
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  // Inline address form States
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormData, setAddressFormData] = useState({ ...BLANK_ADDRESS });
  const [addressFormLoading, setAddressFormLoading] = useState(false);
  const [addressFormError, setAddressFormError] = useState('');

  // Webhook simulation States
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationMessage, setSimulationMessage] = useState('');
  const [simulationSuccess, setSimulationSuccess] = useState<boolean | null>(null);

  // Set default selected address when addresses change
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find(a => a.is_default);
      setSelectedAddressId(def ? def.id : addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

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

  // Add address inline
  const handleAddressFormChange = (field: keyof typeof addressFormData, value: string | boolean) => {
    setAddressFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressFormData.full_name.trim() || !addressFormData.street_address.trim() || !addressFormData.city.trim() || !addressFormData.state.trim()) {
      setAddressFormError('Please fill in all required fields.');
      return;
    }
    setAddressFormLoading(true);
    setAddressFormError('');
    try {
      const newAddr = await addressApi.createAddress(addressFormData);
      await fetchAddresses();
      setSelectedAddressId(newAddr.id);
      setShowAddressForm(false);
      setAddressFormData({ ...BLANK_ADDRESS });
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save address.';
      setAddressFormError(String(msg));
    } finally {
      setAddressFormLoading(false);
    }
  };

  // Checkout order placement & payment initialization
  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select or add a shipping address.');
      return;
    }
    setCheckoutLoading(true);
    try {
      // 1. Create order on backend
      const order = await orderApi.createOrder(selectedAddressId);
      
      // 2. Initialize Paystack payment request
      const payReq = await paymentApi.initializePayment(order.id);
      
      setCreatedOrder(order);
      setPaymentRequest(payReq);
      
      // 3. Clear/Refresh local cart context
      await refreshCart();
    } catch (err: any) {
      console.error('Failed to checkout', err);
      const detail = err.response?.data?.detail || 'An error occurred during checkout. Please try again.';
      alert(detail);
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Real Backend Payment Status Check
  const handleRefreshOrderStatus = async () => {
    if (!paymentRequest) return;
    setSimulationLoading(true);
    setSimulationMessage('');
    try {
      const updatedOrder = await orderApi.getOrderDetail(paymentRequest.order);
      setCreatedOrder(updatedOrder);
      if (updatedOrder.order_status === 'PAID' || updatedOrder.order_status !== 'PENDING_PAYMENT') {
        setSimulationSuccess(true);
        setSimulationMessage('Payment confirmed by server! Order is being processed.');
      } else {
        setSimulationSuccess(false);
        setSimulationMessage('Payment is still pending backend webhook confirmation.');
      }
    } catch (err: any) {
      console.error(err);
      setSimulationSuccess(false);
      setSimulationMessage('Unable to refresh order status from server.');
    } finally {
      setSimulationLoading(false);
    }
  };

  // RENDER 1: Order Confirmation Screen
  if (createdOrder && paymentRequest) {
    const isPaid = createdOrder.order_status !== 'PENDING_PAYMENT';
    return (
      <div className="order-confirmation-container page-padded">
        <div className="confirmation-card">
          <div className="conf-icon-badge">
            {isPaid ? (
              <CheckCircle size={48} className="conf-icon-success" />
            ) : (
              <CreditCard size={48} className="conf-icon-pending" />
            )}
          </div>
          
          <h1 className="conf-serif-title">
            {isPaid ? 'Payment Confirmed!' : 'Order Placed & Pending Payment'}
          </h1>
          <p className="conf-subtitle">
            Order Reference: <strong className="font-mono">{createdOrder.order_number}</strong>
          </p>

          <div className="conf-layout">
            {/* Left: Summary and details */}
            <div className="conf-details-card">
              <div className="conf-section">
                <h3>Order Status</h3>
                <span className={`status-pill status-${createdOrder.order_status.toLowerCase()}`}>
                  {createdOrder.order_status.replace(/_/g, ' ')}
                </span>
                {!isPaid && (
                  <p className="conf-timer-warning">
                    * Inventory stock is reserved for 30 minutes. Please complete payment before it expires.
                  </p>
                )}
              </div>

              <div className="conf-section">
                <h3>Delivery Address Snapshot</h3>
                <div className="conf-address-block">
                  <p><strong>{createdOrder.shipping_address_snapshot.full_name}</strong></p>
                  <p>{createdOrder.shipping_address_snapshot.street_address}</p>
                  <p>{createdOrder.shipping_address_snapshot.city}, {createdOrder.shipping_address_snapshot.state}</p>
                  {createdOrder.shipping_address_snapshot.phone_number && (
                    <p className="conf-phone">Phone: {createdOrder.shipping_address_snapshot.phone_number}</p>
                  )}
                </div>
              </div>

              <div className="conf-section">
                <h3>Items Details</h3>
                <div className="conf-items-list">
                  {createdOrder.items.map(item => (
                    <div key={item.id} className="conf-item-row">
                      <div>
                        <p className="conf-item-name">{item.product_title_snapshot}</p>
                        <p className="conf-item-spec">{item.variant_size_snapshot} {item.variant_color_snapshot ? `/ ${item.variant_color_snapshot}` : ''} • Qty: {item.quantity}</p>
                      </div>
                      <span className="conf-item-price">₦{item.total_price_naira.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="conf-totals-block">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span>₦{createdOrder.subtotal_naira.toLocaleString()}</span>
                </div>
                <div className="totals-row">
                  <span>Delivery Fee</span>
                  <span>{createdOrder.delivery_fee_naira === 0 ? 'Free' : `₦${createdOrder.delivery_fee_naira.toLocaleString()}`}</span>
                </div>
                <div className="totals-row total-grand">
                  <span>Grand Total</span>
                  <span>₦{createdOrder.total_amount_naira.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Right: Actions and developer simulator */}
            <div className="conf-actions-sidebar">
              {!isPaid && (
                <div className="conf-card-action">
                  <h3>Complete Your Order</h3>
                  <p>Use Paystack gateway to make a test payment.</p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const payReq = await paymentApi.initializePayment(createdOrder.id);
                        setPaymentRequest(payReq);
                        if (payReq.authorization_url) {
                          window.open(payReq.authorization_url, '_blank');
                        }
                      } catch {
                        if (paymentRequest.authorization_url) {
                          window.open(paymentRequest.authorization_url, '_blank');
                        }
                      }
                    }}
                    className="paystack-redirect-btn"
                  >
                    <CreditCard size={18} />
                    <span>Pay with Paystack</span>
                  </button>
                </div>
              )}

              {/* Real Server Payment Verification */}
              {!isPaid && (
                <div className="conf-card-action simulation-panel">
                  <div className="simulation-header">
                    <ShieldCheck size={18} className="sim-shield-icon" />
                    <h4>Payment Verification</h4>
                  </div>
                  <p>Once you complete payment in the Paystack checkout window, click below to verify your confirmed order status directly with the server.</p>
                  
                  {simulationMessage && (
                    <div className={`sim-alert-message ${simulationSuccess ? 'sim-success' : 'sim-fail'}`}>
                      {simulationMessage}
                    </div>
                  )}

                  <button
                    className="btn-simulate-webhook"
                    onClick={handleRefreshOrderStatus}
                    disabled={simulationLoading}
                  >
                    {simulationLoading ? (
                      <>
                        <Loader size={15} className="cart-spinner-sm" />
                        <span>Checking server status...</span>
                      </>
                    ) : (
                      <span>I Have Completed Payment</span>
                    )}
                  </button>
                </div>
              )}

              <div className="conf-navigation-block">
                <button className="btn-go-profile" onClick={() => navigate('/profile')}>
                  View Order History
                </button>
                <Link to="/" className="conf-continue-shopping">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER 2: Empty Cart Screen
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

  // RENDER 3: Checkout Selection Mode
  if (isCheckoutMode) {
    return (
      <div className="cart-page checkout-mode-active">
        <div className="cart-page-header">
          <button className="cart-back-link" onClick={() => setIsCheckoutMode(false)}>
            <ArrowLeft size={16} /> Back to Cart
          </button>
          <h1 className="cart-page-title">Checkout</h1>
        </div>

        <div className="cart-layout">
          {/* Left Column: Shipping Address Selector */}
          <div className="checkout-address-selection">
            <h2 className="checkout-section-title">
              <MapPin size={18} /> Shipping Address
            </h2>

            {!showAddressForm && (
              <div className="address-options-list">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      className={`address-option-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div className="address-option-indicator">
                        {isSelected ? <Check size={14} color="#FFF" /> : null}
                      </div>
                      <div className="address-option-info">
                        <p className="addr-name">
                          {addr.full_name}
                          {addr.is_default && <span className="addr-default-tag">Default</span>}
                        </p>
                        <p className="addr-detail">{addr.street_address}</p>
                        <p className="addr-city">{addr.city}, {addr.state}</p>
                        {addr.phone_number && <p className="addr-phone">Phone: {addr.phone_number}</p>}
                      </div>
                    </div>
                  );
                })}

                <button className="checkout-add-address-btn" onClick={() => setShowAddressForm(true)}>
                  <Plus size={16} /> Add New Address
                </button>
              </div>
            )}

            {/* Inline add address form */}
            {showAddressForm && (
              <div className="checkout-address-form-box">
                <h3>Add a Delivery Address</h3>
                {addressFormError && <div className="checkout-form-error">{addressFormError}</div>}
                
                <form onSubmit={handleAddressSubmit}>
                  <div className="checkout-form-grid">
                    <div className="form-group">
                      <label>Recipient Name *</label>
                      <input
                        className="input-field"
                        value={addressFormData.full_name}
                        onChange={e => handleAddressFormChange('full_name', e.target.value)}
                        placeholder="Recipient full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        className="input-field"
                        value={addressFormData.phone_number}
                        onChange={e => handleAddressFormChange('phone_number', e.target.value)}
                        placeholder="e.g. 08012345678"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      className="input-field"
                      value={addressFormData.street_address}
                      onChange={e => handleAddressFormChange('street_address', e.target.value)}
                      placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                      required
                    />
                  </div>

                  <div className="checkout-form-grid">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        className="input-field"
                        value={addressFormData.city}
                        onChange={e => handleAddressFormChange('city', e.target.value)}
                        placeholder="e.g. Lagos"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State *</label>
                      <input
                        className="input-field"
                        value={addressFormData.state}
                        onChange={e => handleAddressFormChange('state', e.target.value)}
                        placeholder="e.g. Lagos State"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Landmark (Optional)</label>
                    <input
                      className="input-field"
                      value={addressFormData.landmark}
                      onChange={e => handleAddressFormChange('landmark', e.target.value)}
                      placeholder="e.g. Near Shoprite"
                    />
                  </div>

                  <div className="checkout-form-actions">
                    <button
                      type="button"
                      className="btn-cancel"
                      onClick={() => { setShowAddressForm(false); setAddressFormError(''); setAddressFormData({ ...BLANK_ADDRESS }); }}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-save" disabled={addressFormLoading}>
                      {addressFormLoading ? 'Saving...' : 'Save & Select'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Checkout Summary and Actions */}
          <div className="cart-summary-sidebar">
            <div className="cart-summary-card">
              <h2 className="cart-summary-title">Checkout Summary</h2>

              <div className="checkout-sidebar-items">
                {cart.items.map(item => (
                  <div key={item.id} className="checkout-item-preview">
                    <div className="preview-info">
                      <p className="preview-title">{item.product_title}</p>
                      <p className="preview-meta">{item.size} • Qty: {item.quantity}</p>
                    </div>
                    <span className="preview-price">₦{item.total_price_naira.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div className="cart-summary-lines">
                <div className="cart-summary-line">
                  <span>Subtotal</span>
                  <span>₦{cart.subtotal_naira.toLocaleString()}</span>
                </div>
                <div className="cart-summary-line">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="cart-summary-total-row">
                <span>Grand Total</span>
                <span className="cart-summary-total-price">₦{cart.subtotal_naira.toLocaleString()}</span>
              </div>

              <button
                className="checkout-place-order-btn"
                onClick={handlePlaceOrder}
                disabled={checkoutLoading || addresses.length === 0}
              >
                {checkoutLoading ? (
                  <>
                    <Loader size={18} className="cart-spinner-sm" />
                    <span>Placing Order...</span>
                  </>
                ) : (
                  <span>Place Order & Pay</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER 4: Normal Shopping Cart View
  return (
    <div className="cart-page">
      <div className="cart-page-header">
        <button className="cart-back-link" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Continue Shopping
        </button>
        <h1 className="cart-page-title">Shopping Cart</h1>
        <span className="cart-item-count">{cart!.item_count} item{cart!.item_count !== 1 ? 's' : ''}</span>
      </div>

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
        {/* Left: Cart Items List */}
        <div className="cart-items-list">
          {cart!.items.map((item) => {
            const isUpdating = updatingItems.has(item.id);
            return (
              <div key={item.id} className={`cart-item-row ${isUpdating ? 'cart-item-updating' : ''}`}>
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

            {cart?.vendor && (
              <div className="cart-summary-vendor-note">
                <AlertCircle size={14} />
                <span>
                  Cart is limited to one designer at a time. You have items from <strong>{cart.vendor.store_name}</strong>.
                </span>
              </div>
            )}

            <button className="cart-checkout-btn" onClick={() => setIsCheckoutMode(true)}>
              Proceed to Checkout
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
