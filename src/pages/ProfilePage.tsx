import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addressApi, orderApi, paymentApi, deliveryApi, reviewApi } from '../api/client';
import type { Address, Order, Delivery, OrderItem } from '../types';
import {
  User as UserIcon, MapPin, Plus, Trash2, CheckCircle, Star,
  Phone, Mail, AlertCircle, Loader, ShoppingBag, Calendar, ChevronRight, ArrowLeft, ShieldCheck, Truck, X
} from 'lucide-react';
import './ProfilePage.css';

const BLANK_ADDRESS: Omit<Address, 'id' | 'created_at'> = {
  full_name: '',
  phone_number: '',
  street_address: '',
  city: '',
  state: '',
  landmark: '',
  is_default: false,
};

export const ProfilePage: React.FC = () => {
  const { user, addresses, fetchAddresses, openAuthModal } = useAuth();
  const navigate = useNavigate();

  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<'addresses' | 'orders'>('addresses');

  // Address book States
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [formData, setFormData] = useState({ ...BLANK_ADDRESS });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Customer orders States
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [webhookSimLoading, setWebhookSimLoading] = useState(false);

  // Review Modal States (Sprint 10)
  const [reviewModalItem, setReviewModalItem] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(new Set());

  // Load orders when orders tab is active
  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const list = await orderApi.getOrders();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user && activeSubTab === 'orders') {
      loadOrders();
      setSelectedOrder(null);
    }
  }, [user, activeSubTab]);

  if (!user) {
    return (
      <div className="profile-gate">
        <UserIcon size={48} color="#D1D5DB" />
        <h2>Sign in to view your profile</h2>
        <button className="profile-signin-btn" onClick={() => openAuthModal('login')}>Sign In</button>
      </div>
    );
  }

  const handleFormChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.street_address.trim() || !formData.city.trim() || !formData.state.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      await addressApi.createAddress(formData);
      await fetchAddresses();
      setShowAddressForm(false);
      setFormData({ ...BLANK_ADDRESS });
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save address.';
      setFormError(String(msg));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    setDeletingId(id);
    try {
      await addressApi.deleteAddress(id);
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address', err);
    } finally {
      setDeletingId(null);
    }
  };

  // Select order and load its delivery tracking
  const handleSelectOrder = async (order: Order) => {
    setSelectedOrder(order);
    setDelivery(null);
    const trackingStatuses = ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
    if (trackingStatuses.includes(order.order_status)) {
      setDeliveryLoading(true);
      try {
        const d = await deliveryApi.getDeliveryDetail(order.id);
        setDelivery(d);
      } catch (err) {
        console.error('Failed to load delivery details', err);
      } finally {
        setDeliveryLoading(false);
      }
    }
  };

  // Helper for Web Crypto HMAC
  const signPayload = async (payloadStr: string, secret: string): Promise<string> => {
    const enc = new TextEncoder();
    const key = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: { name: "SHA-512" } },
      false,
      ["sign"]
    );
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      key,
      enc.encode(payloadStr)
    );
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  };

  // Simulate Payment Webhook Success In Profile
  const handleSimulatePaymentInProfile = async (order: Order) => {
    setWebhookSimLoading(true);
    try {
      const payReq = await paymentApi.initializePayment(order.id);
      
      const payload = {
        event: "charge.success",
        data: {
          id: Math.floor(Math.random() * 1000000),
          domain: "test",
          status: "success",
          reference: payReq.reference,
          amount: payReq.amount_kobo,
          message: "Approved",
          gateway_response: "Successful",
          currency: "NGN",
          channel: "card",
          ip_address: "127.0.0.1",
          customer: {
            id: Math.floor(Math.random() * 100000),
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email
          }
        }
      };

      const payloadStr = JSON.stringify(payload);
      const secret = "sk_test_mock_paystack_secret_key";
      const signature = await signPayload(payloadStr, secret);

      const res = await paymentApi.simulateWebhook(payload, signature);
      if (res.success) {
        alert('Webhook simulated successfully! Order marked as PAID.');
        // Reload order details
        const updated = await orderApi.getOrderDetail(order.id);
        setSelectedOrder(updated);
        // Reload orders list
        const list = await orderApi.getOrders();
        setOrders(list);
      } else {
        alert(res.detail || 'Webhook simulation returned failure.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to simulate payment webhook.');
    } finally {
      setWebhookSimLoading(false);
    }
  };

  // Submit Verified Buyer Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    setReviewError('');
    setReviewSuccess('');

    if (!reviewComment.trim()) {
      setReviewError('Please provide your review feedback.');
      return;
    }

    setReviewSubmitting(true);
    try {
      // product_id fallback: use item.product_id or empty/generic
      const productId = reviewModalItem.item.product_id || reviewModalItem.item.id;
      await reviewApi.submitReview(productId, {
        order_item_id: reviewModalItem.item.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewSuccess('Verified review submitted successfully! Thank you for supporting Nigerian artisans.');
      setReviewedItemIds(prev => new Set(prev).add(reviewModalItem.item.id));
      setTimeout(() => {
        setReviewModalItem(null);
        setReviewComment('');
        setReviewRating(5);
        setReviewSuccess('');
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.comment?.[0] || 'Failed to submit review. You may have already reviewed this item.';
      setReviewError(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h1 className="profile-page-title">My Profile</h1>
      </div>

      <div className="profile-layout">
        {/* Left: User Details Card */}
        <div className="profile-user-card">
          <div className="profile-avatar-ring">
            <div className="profile-avatar-circle">
              {user.first_name?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>

          <div className="profile-user-info">
            <h2 className="profile-user-name">{user.first_name} {user.last_name}</h2>
            {user.vendor_profile && (
              <span className="profile-vendor-badge">
                <Star size={13} /> Verified Designer
              </span>
            )}
          </div>

          <div className="profile-detail-list">
            <div className="profile-detail-row">
              <Mail size={16} />
              <div>
                <p className="profile-detail-label">Email Address</p>
                <p className="profile-detail-value">{user.email}</p>
              </div>
            </div>
            <div className="profile-detail-row">
              <Phone size={16} />
              <div>
                <p className="profile-detail-label">Phone Number</p>
                <p className="profile-detail-value">{user.phone_number || 'Not set'}</p>
              </div>
            </div>
          </div>

          {user.vendor_profile && (
            <button
              className="profile-dashboard-btn"
              onClick={() => navigate('/vendor/dashboard')}
            >
              Go to Vendor Dashboard
            </button>
          )}
        </div>

        {/* Right: Main Content Tabs */}
        <div className="profile-main-content">
          <div className="profile-tabs-header">
            <button
              className={`profile-tab-btn ${activeSubTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('addresses')}
            >
              <MapPin size={16} />
              <span>Saved Addresses</span>
            </button>
            <button
              className={`profile-tab-btn ${activeSubTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('orders')}
            >
              <ShoppingBag size={16} />
              <span>My Orders</span>
            </button>
          </div>

          {/* Sub-tab 1: Addresses */}
          {activeSubTab === 'addresses' && (
            <div className="profile-address-section">
              <div className="address-section-header">
                <div>
                  <h3 className="section-title">Delivery Addresses</h3>
                  <p className="section-subtitle">Manage where your bespoke orders are shipped.</p>
                </div>
                {!showAddressForm && (
                  <button className="add-address-btn" onClick={() => setShowAddressForm(true)}>
                    <Plus size={16} />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form Modal/Card */}
              {showAddressForm && (
                <div className="address-form-card">
                  <h4 className="form-title">New Delivery Address</h4>
                  {formError && (
                    <div className="auth-error-alert">
                      <AlertCircle size={16} />
                      <span>{formError}</span>
                    </div>
                  )}

                  <form onSubmit={handleAddressSubmit} className="address-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">FULL RECIPIENT NAME *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Babatunde Fashola"
                          value={formData.full_name}
                          onChange={(e) => handleFormChange('full_name', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">PHONE NUMBER *</label>
                        <input
                          type="tel"
                          className="input-field"
                          placeholder="e.g. 08012345678"
                          value={formData.phone_number}
                          onChange={(e) => handleFormChange('phone_number', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">STREET ADDRESS *</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. 15 Admiralty Way, Lekki Phase 1"
                        value={formData.street_address}
                        onChange={(e) => handleFormChange('street_address', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">CITY *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Lekki / Ikeja"
                          value={formData.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">STATE *</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Lagos State"
                          value={formData.state}
                          onChange={(e) => handleFormChange('state', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">LANDMARK / DELIVERY NOTE</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g. Near Filmhouse Cinema"
                        value={formData.landmark}
                        onChange={(e) => handleFormChange('landmark', e.target.value)}
                      />
                    </div>

                    <div className="form-group checkbox-group">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.is_default}
                          onChange={(e) => handleFormChange('is_default', e.target.checked)}
                        />
                        <span>Set as default shipping address</span>
                      </label>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => { setShowAddressForm(false); setFormError(''); }}
                        disabled={formLoading}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn-primary" disabled={formLoading}>
                        {formLoading ? 'Saving...' : 'Save Address'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Address List */}
              <div className="address-grid">
                {addresses.length === 0 ? (
                  <div className="profile-no-addresses">
                    <MapPin size={40} color="#D1D5DB" />
                    <p>No delivery addresses saved yet.</p>
                  </div>
                ) : (
                  addresses.map((addr) => (
                    <div key={addr.id} className={`address-card ${addr.is_default ? 'default-card' : ''}`}>
                      {addr.is_default && (
                        <span className="default-badge">
                          <CheckCircle size={12} /> Default
                        </span>
                      )}
                      <h4 className="addr-name">{addr.full_name}</h4>
                      <p className="addr-line">{addr.street_address}</p>
                      <p className="addr-line">{addr.city}, {addr.state}</p>
                      {addr.landmark && <p className="addr-landmark">Landmark: {addr.landmark}</p>}
                      <p className="addr-phone">Phone: {addr.phone_number}</p>

                      <button
                        className="addr-delete-btn"
                        onClick={() => handleDeleteAddress(addr.id)}
                        disabled={deletingId === addr.id}
                        title="Delete Address"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Orders */}
          {activeSubTab === 'orders' && (
            <div className="profile-orders-section">
              {selectedOrder ? (
                /* Single Order Details View */
                <div className="profile-order-detail-view">
                  <button className="back-to-orders-btn" onClick={() => setSelectedOrder(null)}>
                    <ArrowLeft size={16} />
                    <span>Back to all orders</span>
                  </button>

                  <div className="profile-order-header-card">
                    <div>
                      <span className="order-number-title font-mono">#{selectedOrder.order_number}</span>
                      <p className="order-date-sub">
                        Placed on {new Date(selectedOrder.created_at).toLocaleDateString()} • Boutique: <strong>{selectedOrder.vendor.store_name}</strong>
                      </p>
                    </div>
                    <span className={`status-pill status-${selectedOrder.order_status.toLowerCase()}`}>
                      {selectedOrder.order_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="profile-order-grid">
                    {/* Items Details */}
                    <div className="profile-order-section">
                      <h3>Ordered Items</h3>
                      <div className="profile-order-items">
                        {selectedOrder.items.map(item => {
                          const isReviewed = reviewedItemIds.has(item.id) || !!item.review;
                          const isCompleted = selectedOrder.order_status === 'COMPLETED' || selectedOrder.order_status === 'DELIVERED';

                          return (
                            <div key={item.id} className="order-item-row-detail" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                              <div>
                                <p className="item-title">{item.product_title_snapshot}</p>
                                <p className="item-meta">
                                  {item.variant_size_snapshot} {item.variant_color_snapshot ? `/ ${item.variant_color_snapshot}` : ''} • Qty: {item.quantity}
                                </p>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span className="item-price">₦{item.total_price_naira.toLocaleString()}</span>
                                {isCompleted && (
                                  isReviewed ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#059669', fontSize: '0.8rem', fontWeight: 600 }}>
                                      <CheckCircle size={14} /> Reviewed
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => setReviewModalItem({ item, order: selectedOrder })}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem',
                                        backgroundColor: '#FEF3C7',
                                        color: '#92400E',
                                        border: '1px solid #FDE68A',
                                        padding: '0.35rem 0.75rem',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <Star size={13} fill="#92400E" />
                                      <span>Write Review</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="profile-order-totals">
                        <div className="totals-line">
                          <span>Subtotal</span>
                          <span>₦{selectedOrder.subtotal_naira.toLocaleString()}</span>
                        </div>
                        <div className="totals-line">
                          <span>Delivery Fee</span>
                          <span>{selectedOrder.delivery_fee_naira === 0 ? 'Free' : `₦${selectedOrder.delivery_fee_naira.toLocaleString()}`}</span>
                        </div>
                        <div className="totals-line total-grand">
                          <span>Total Amount</span>
                          <span>₦{selectedOrder.total_amount_naira.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="profile-order-side-section">
                      <div className="side-card">
                        <h3>Delivery Address</h3>
                        <p><strong>{selectedOrder.shipping_address_snapshot.full_name}</strong></p>
                        <p>{selectedOrder.shipping_address_snapshot.street_address}</p>
                        <p>{selectedOrder.shipping_address_snapshot.city}, {selectedOrder.shipping_address_snapshot.state}</p>
                        {selectedOrder.shipping_address_snapshot.phone_number && (
                          <p className="phone">Phone: {selectedOrder.shipping_address_snapshot.phone_number}</p>
                        )}
                      </div>

                      {/* Delivery Tracking */}
                      {deliveryLoading ? (
                        <div className="side-card loading-card">
                          <Loader size={18} className="cart-spinner-sm" />
                          <span>Loading tracking information...</span>
                        </div>
                      ) : delivery ? (
                        <div className="side-card tracking-card">
                          <div className="tracking-title-row">
                            <Truck size={18} className="tracking-icon" />
                            <h3>Delivery Dispatch Status</h3>
                          </div>
                          
                          <div className="tracking-info">
                            <p><strong>Carrier:</strong> {delivery.carrier_name.replace(/_/g, ' ')}</p>
                            <p><strong>Tracking Number:</strong> <code className="font-mono">{delivery.tracking_number}</code></p>
                            <p><strong>Current Status:</strong> <span className={`status-pill status-${delivery.status.toLowerCase()}`}>{delivery.status_display}</span></p>
                            {delivery.dispatch_notes && (
                              <p className="notes"><strong>Notes:</strong> {delivery.dispatch_notes}</p>
                            )}
                          </div>
                          
                          {/* Timestamps status checklist */}
                          <div className="tracking-timeline">
                            <div className={`timeline-step ${delivery.picked_up_at ? 'completed' : ''}`}>
                              <div className="dot"></div>
                              <div className="timeline-info">
                                <p className="step-title">Picked Up</p>
                                {delivery.picked_up_at && <p className="step-time">{new Date(delivery.picked_up_at).toLocaleDateString()}</p>}
                              </div>
                            </div>
                            <div className={`timeline-step ${delivery.dispatched_at ? 'completed' : ''}`}>
                              <div className="dot"></div>
                              <div className="timeline-info">
                                <p className="step-title">In Transit</p>
                                {delivery.dispatched_at && <p className="step-time">{new Date(delivery.dispatched_at).toLocaleDateString()}</p>}
                              </div>
                            </div>
                            <div className={`timeline-step ${delivery.delivered_at ? 'completed' : ''}`}>
                              <div className="dot"></div>
                              <div className="timeline-info">
                                <p className="step-title">Delivered</p>
                                {delivery.delivered_at && <p className="step-time">{new Date(delivery.delivered_at).toLocaleDateString()}</p>}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {/* Developer Hook simulator block */}
                      {selectedOrder.order_status === 'PENDING_PAYMENT' && (
                        <div className="side-card sim-card">
                          <div className="sim-header">
                            <ShieldCheck size={18} className="sim-shield" />
                            <h4>Developer Payment Simulator</h4>
                          </div>
                          <p>Submit a mock payment webhook locally to instantly change order state to PAID.</p>
                          <button
                            className="btn-sim-pay"
                            onClick={() => handleSimulatePaymentInProfile(selectedOrder)}
                            disabled={webhookSimLoading}
                          >
                            {webhookSimLoading ? 'Simulating...' : 'Simulate Payment Success'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Orders List */
                <div className="profile-orders-list-view">
                  {ordersLoading ? (
                    <div className="orders-loading">
                      <Loader size={24} className="cart-spinner" />
                      <p>Fetching order history...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="profile-no-orders">
                      <ShoppingBag size={40} color="#D1D5DB" />
                      <p>You haven't placed any orders yet.</p>
                      <button className="profile-dashboard-btn" onClick={() => navigate('/')}>Explore Collections</button>
                    </div>
                  ) : (
                    <div className="orders-history-table">
                      {orders.map(order => (
                        <div key={order.id} className="order-history-card" onClick={() => handleSelectOrder(order)}>
                          <div className="order-history-info">
                            <div className="info-top">
                              <span className="order-num font-mono">#{order.order_number}</span>
                              <span className="order-date">
                                <Calendar size={13} /> {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="info-bottom">
                              <p className="order-vendor">Boutique: <strong>{order.vendor.store_name}</strong></p>
                              <p className="order-items-summary">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <div className="order-history-status-price">
                            <span className="order-price">₦{order.total_amount_naira.toLocaleString()}</span>
                            <div className="status-row-align">
                              <span className={`status-pill status-${order.order_status.toLowerCase()}`}>
                                {order.order_status.replace(/_/g, ' ')}
                              </span>
                              <ChevronRight size={16} className="chevron" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VERIFIED BUYER REVIEW MODAL (Sprint 10) */}
      {reviewModalItem && (
        <div className="designer-modal-overlay">
          <div className="designer-modal-box" style={{ maxWidth: '480px' }}>
            <div className="modal-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={20} color="#D4AF37" fill="#D4AF37" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Cinzel, Georgia, serif' }}>Leave Verified Review</h3>
              </div>
              <button 
                onClick={() => setReviewModalItem(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
                {reviewModalItem.item.product_title_snapshot}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.2rem' }}>
                Boutique: <strong>{reviewModalItem.order.vendor.store_name}</strong> • Order #{reviewModalItem.order.order_number}
              </div>
            </div>

            {reviewError && (
              <div className="auth-error-alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{reviewError}</span>
              </div>
            )}

            {reviewSuccess && (
              <div className="alert-success-msg" style={{ marginBottom: '1rem' }}>
                <CheckCircle size={16} />
                <span>{reviewSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReview}>
              {/* Star Rating Picker */}
              <div className="form-group" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  OVERALL CRAFTSMANSHIP & FIT RATING
                </label>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                    >
                      <Star
                        size={32}
                        fill={star <= reviewRating ? '#F59E0B' : 'none'}
                        color={star <= reviewRating ? '#F59E0B' : '#D1D5DB'}
                      />
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '0.25rem', display: 'block' }}>
                  {reviewRating === 5 ? 'Exceptional Masterpiece' : reviewRating === 4 ? 'Great Quality' : reviewRating === 3 ? 'Good Fit' : 'Fair'}
                </span>
              </div>

              {/* Review Text */}
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">YOUR REVIEW COMMENTS *</label>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="Share details about the tailoring, fabric texture, delivery packaging, and sizing accuracy..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setReviewModalItem(null)}
                  disabled={reviewSubmitting}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #D1D5DB', background: '#FFF' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={reviewSubmitting}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#064E3B', color: '#FFF', border: 'none' }}
                >
                  {reviewSubmitting ? 'Submitting...' : 'Post Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
