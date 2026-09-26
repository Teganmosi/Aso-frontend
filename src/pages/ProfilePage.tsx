import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addressApi, orderApi, paymentApi, deliveryApi, reviewApi } from '../api/client';
import type { Address, Order, Delivery, OrderItem } from '../types';
import {
  User as UserIcon, MapPin, Plus, Trash2, CheckCircle, Star,
  AlertCircle, Loader, ShoppingBag, ChevronRight,
  ArrowLeft, Truck, X, CreditCard, ShieldCheck, Copy,
  ExternalLink, Sparkles, Clock, Check, RefreshCw, Edit3, ArrowUpRight
} from 'lucide-react';
import './ProfilePage.css';

const NIGERIAN_STATES = [
  'Abia', 'Abuja FCT', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

const BLANK_ADDRESS: Omit<Address, 'id' | 'created_at'> = {
  full_name: '',
  phone_number: '',
  street_address: '',
  city: '',
  state: 'Lagos',
  landmark: '',
  is_default: false,
};

type OrderFilterType = 'ALL' | 'PENDING_PAYMENT' | 'PROCESSING' | 'READY_FOR_PICKUP' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

export const ProfilePage: React.FC = () => {
  const { user, addresses, fetchAddresses, updateProfile, openAuthModal, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial tab from URL search param
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') as any;
  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'details'>(
    ['orders', 'addresses', 'details'].includes(initialTab) ? initialTab : 'orders'
  );

  // Status Filter for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderFilterType>('ALL');

  // Customer orders states
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [paymentActionLoading, setPaymentActionLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Address book states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ ...BLANK_ADDRESS });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  // Profile Edit states
  const [profileFirstName, setProfileFirstName] = useState(user?.first_name || '');
  const [profileLastName, setProfileLastName] = useState(user?.last_name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone_number || '');
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Review Modal States
  const [reviewModalItem, setReviewModalItem] = useState<{ item: OrderItem; order: Order } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [reviewedItemIds, setReviewedItemIds] = useState<Set<string>>(new Set());

  // Application Status Modal for pending vendor applicants
  const [showApplicationStatusModal, setShowApplicationStatusModal] = useState(false);

  // Keep profile form in sync when user object updates
  useEffect(() => {
    if (user) {
      setProfileFirstName(user.first_name || '');
      setProfileLastName(user.last_name || '');
      setProfilePhone(user.phone_number || '');
    }
  }, [user]);

  // Load orders
  const loadOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const list = await orderApi.getOrders();
      setOrders(list);
    } catch (err: any) {
      console.error('Failed to load orders', err);
      setOrdersError('Something went wrong while loading your account information.');
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();

      // Check if redirected back from Paystack checkout callback
      const trxref = searchParams.get('trxref') || searchParams.get('reference');
      if (trxref) {
        paymentApi.verifyPayment(trxref)
          .then((res) => {
            if (res.success) {
              setProfileSuccessMsg('Payment successfully verified! Your order is now confirmed.');
              setTimeout(() => setProfileSuccessMsg(''), 4000);
              loadOrders();
            }
          })
          .catch((err) => console.log('Payment verification attempt:', err));
      }
    }
  }, [user]);

  // Copy helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
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

  // Pay for Pending Order via Paystack
  const handlePayPendingOrder = async (order: Order) => {
    setPaymentActionLoading(true);
    try {
      const payReq = await paymentApi.initializePayment(order.id);
      if (payReq.authorization_url) {
        window.location.href = payReq.authorization_url;
      } else {
        alert('Payment initialization did not return an authorization URL.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to initialize payment.');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  // Refresh Order Details
  const handleRefreshOrderDetails = async (orderId: string) => {
    setPaymentActionLoading(true);
    try {
      if (selectedOrder && selectedOrder.order_status === 'PENDING_PAYMENT') {
        try {
          await paymentApi.verifyByOrderId(orderId);
        } catch {
          // continue
        }
      }
      const updated = await orderApi.getOrderDetail(orderId);
      setSelectedOrder(updated);
      const list = await orderApi.getOrders();
      setOrders(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setPaymentActionLoading(false);
    }
  };

  const handleVerifyOrderPayment = async (orderId: string) => {
    setPaymentActionLoading(true);
    try {
      const res = await paymentApi.verifyByOrderId(orderId);
      if (res.success) {
        alert('Payment verified successfully! Your order is now marked as Confirmed.');
        await loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          const updated = await orderApi.getOrderDetail(orderId);
          setSelectedOrder(updated);
        }
      } else {
        alert(res.message || 'Payment not yet confirmed by Paystack.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payment verification failed or transaction not completed on Paystack.');
    } finally {
      setPaymentActionLoading(false);
    }
  };

  // Save Personal Details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');
    setProfileUpdating(true);

    try {
      await updateProfile({
        first_name: profileFirstName.trim(),
        last_name: profileLastName.trim(),
        phone_number: profilePhone.trim(),
      });
      setProfileSuccessMsg('Profile information updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to update profile. Please try again.';
      setProfileErrorMsg(detail);
    } finally {
      setProfileUpdating(false);
    }
  };

  // Address Handlers
  const handleOpenNewAddressForm = () => {
    setEditingAddressId(null);
    setFormData({ ...BLANK_ADDRESS });
    setFormError('');
    setShowAddressForm(true);
  };

  const handleEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setFormData({
      full_name: addr.full_name,
      phone_number: addr.phone_number,
      street_address: addr.street_address,
      city: addr.city,
      state: addr.state,
      landmark: addr.landmark || '',
      is_default: addr.is_default,
    });
    setFormError('');
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.street_address.trim() || !formData.city.trim() || !formData.state.trim() || !formData.phone_number.trim()) {
      setFormError('Please fill in all required address fields.');
      return;
    }
    setFormLoading(true);
    setFormError('');
    try {
      if (editingAddressId) {
        await addressApi.updateAddress(editingAddressId, formData);
      } else {
        await addressApi.createAddress(formData);
      }
      await fetchAddresses();
      setShowAddressForm(false);
      setEditingAddressId(null);
      setFormData({ ...BLANK_ADDRESS });
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save address.';
      setFormError(String(msg));
    } finally {
      setFormLoading(false);
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    setSettingDefaultId(id);
    try {
      await addressApi.setDefaultAddress(id);
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address', err);
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this delivery address?')) return;
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

  // Submit Verified Review
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
      const productId = reviewModalItem.item.product_id || reviewModalItem.item.id;
      await reviewApi.submitReview(productId, {
        order_item_id: reviewModalItem.item.id,
        rating: reviewRating,
        comment: reviewComment.trim(),
      });

      setReviewSuccess('Verified review submitted! Thank you for supporting Nigerian fashion.');
      setReviewedItemIds(prev => new Set(prev).add(reviewModalItem.item.id));
      setTimeout(() => {
        setReviewModalItem(null);
        setReviewComment('');
        setReviewRating(5);
        setReviewSuccess('');
      }, 1800);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.comment?.[0] || 'Failed to submit review.';
      setReviewError(msg);
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Auth gate
  if (!user) {
    return (
      <div className="profile-gate-container">
        <div className="profile-gate-card">
          <div className="profile-gate-icon-ring">
            <UserIcon size={36} className="text-emerald" />
          </div>
          <h2>Customer Account Portal</h2>
          <p>Sign in to view your marketplace orders, track dispatches, and manage delivery addresses.</p>
          <button className="aso-btn-primary" onClick={() => openAuthModal('login')}>
            Sign In to Account
          </button>
        </div>
      </div>
    );
  }

  // Active orders calculation: orders not completed or cancelled
  const activeOrdersCount = orders.filter(o =>
    ['PENDING_PAYMENT', 'PAID', 'VENDOR_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.order_status)
  ).length;

  // Filtered orders
  const filteredOrders = orders.filter(order => {
    if (orderStatusFilter === 'ALL') return true;
    if (orderStatusFilter === 'PENDING_PAYMENT') return order.order_status === 'PENDING_PAYMENT';
    if (orderStatusFilter === 'PROCESSING') return ['PAID', 'VENDOR_ACCEPTED', 'PREPARING'].includes(order.order_status);
    if (orderStatusFilter === 'READY_FOR_PICKUP') return order.order_status === 'READY_FOR_PICKUP';
    if (orderStatusFilter === 'IN_TRANSIT') return ['PICKED_UP', 'OUT_FOR_DELIVERY'].includes(order.order_status);
    if (orderStatusFilter === 'COMPLETED') return ['DELIVERED', 'COMPLETED'].includes(order.order_status);
    if (orderStatusFilter === 'CANCELLED') return ['CANCELLED', 'REFUNDED', 'DISPUTED'].includes(order.order_status);
    return true;
  });

  // Customer-facing status label mapping
  const getCustomerStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT':
        return { label: 'Pending Payment', className: 'status-pending' };
      case 'PAID':
        return { label: 'Order Confirmed', className: 'status-confirmed' };
      case 'VENDOR_ACCEPTED':
        return { label: 'Confirmed by Designer', className: 'status-accepted' };
      case 'PREPARING':
        return { label: 'Preparing', className: 'status-preparing' };
      case 'READY_FOR_PICKUP':
        return { label: 'Ready for Pickup', className: 'status-ready' };
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return { label: 'In Transit', className: 'status-transit' };
      case 'DELIVERED':
        return { label: 'Delivered', className: 'status-delivered' };
      case 'COMPLETED':
        return { label: 'Completed', className: 'status-completed' };
      case 'CANCELLED':
        return { label: 'Cancelled', className: 'status-cancelled' };
      case 'REFUNDED':
        return { label: 'Refunded', className: 'status-refunded' };
      default:
        return { label: status.replace(/_/g, ' '), className: 'status-default' };
    }
  };

  // Vendor account status derivation
  const isApprovedVendor = user.is_vendor || user.vendor_profile?.status === 'APPROVED';
  const isPendingVendor = user.vendor_profile?.status === 'PENDING';

  return (
    <div className="profile-page-wrapper">
      {/* Profile Header */}
      <section className="profile-hero-banner">
        <div className="profile-hero-content">
          <div className="profile-hero-identity">
            <div className="profile-hero-avatar">
              <span>{user.first_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</span>
              <span className="profile-avatar-accent-dot" />
            </div>

            <div className="profile-hero-text">
              <div className="profile-hero-title-row">
                <h1>{user.first_name} {user.last_name}</h1>
                {isApprovedVendor ? (
                  <span className="aso-badge-designer">
                    <Sparkles size={12} /> {user.vendor_profile?.is_verified ? 'Verified Designer' : 'Registered Designer'}
                  </span>
                ) : isPendingVendor ? (
                  <span className="aso-badge-pending">
                    <Clock size={12} /> Application Pending
                  </span>
                ) : (
                  <span className="aso-badge-customer">
                    Aso Marketplace Customer
                  </span>
                )}
              </div>
              <p className="profile-hero-sub">
                <span className="text-muted">{user.email}</span>
                {user.phone_number && <span className="text-divider">• {user.phone_number}</span>}
              </p>
            </div>
          </div>

          <div className="profile-hero-actions">
            {isApprovedVendor ? (
              <button
                className="aso-btn-gold"
                onClick={() => navigate('/vendor/dashboard')}
                title="Go to Seller Dashboard"
              >
                <span>Seller Dashboard</span>
                <ChevronRight size={15} />
              </button>
            ) : isPendingVendor ? (
              <button
                className="aso-btn-outline-light"
                onClick={() => setShowApplicationStatusModal(true)}
                title="Check Designer Application Status"
              >
                <Clock size={14} />
                <span>Application Status</span>
              </button>
            ) : (
              <button
                className="aso-btn-outline-light"
                onClick={() => openAuthModal('register', 'designer')}
                title="Register your fashion house on Aso"
              >
                <span>Become a Designer</span>
                <ArrowUpRight size={15} />
              </button>
            )}
            <button className="aso-btn-ghost-danger" onClick={logout} title="Sign Out">
              Log Out
            </button>
          </div>
        </div>

        {/* Account Summary Metrics */}
        <div className="profile-stats-strip">
          <div
            className={`stat-card ${activeTab === 'orders' && orderStatusFilter === 'ALL' ? 'active-stat' : ''}`}
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); setOrderStatusFilter('ALL'); }}
          >
            <span className="stat-label">Total Orders</span>
            <span className="stat-val">{ordersLoading ? '—' : orders.length}</span>
          </div>

          <div
            className={`stat-card ${activeTab === 'orders' && orderStatusFilter === 'PROCESSING' ? 'active-stat' : ''}`}
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); setOrderStatusFilter('PROCESSING'); }}
          >
            <span className="stat-label">Active Orders</span>
            <span className="stat-val text-emerald">{ordersLoading ? '—' : activeOrdersCount}</span>
          </div>

          <div
            className={`stat-card ${activeTab === 'addresses' ? 'active-stat' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <span className="stat-label">Delivery Addresses</span>
            <span className="stat-val">{addresses.length}</span>
          </div>
        </div>
      </section>

      {/* Main Account Navigation & Hub */}
      <div className="profile-hub-layout">
        {/* Account Navigation Tabs */}
        <nav className="profile-nav-pills" aria-label="Profile navigation">
          <button
            className={`nav-pill ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
          >
            <ShoppingBag size={17} />
            <span>My Orders</span>
            {orders.length > 0 && <span className="pill-badge">{orders.length}</span>}
          </button>

          <button
            className={`nav-pill ${activeTab === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            <MapPin size={17} />
            <span>Delivery Addresses</span>
            <span className="pill-badge">{addresses.length}</span>
          </button>

          <button
            className={`nav-pill ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <ShieldCheck size={17} />
            <span>Account & Security</span>
          </button>
        </nav>

        {/* Tab 1: My Orders */}
        {activeTab === 'orders' && (
          <div className="profile-tab-pane">
            {selectedOrder ? (
              /* Order Detail & Tracking View */
              <div className="order-detail-canvas">
                <div className="order-detail-top-nav">
                  <button className="aso-btn-back" onClick={() => setSelectedOrder(null)}>
                    <ArrowLeft size={16} />
                    <span>Back to My Orders</span>
                  </button>

                  <div className="order-detail-header-actions">
                    <button
                      className="aso-btn-refresh"
                      onClick={() => handleRefreshOrderDetails(selectedOrder.id)}
                      disabled={paymentActionLoading}
                      title="Sync status with server"
                    >
                      <RefreshCw size={14} className={paymentActionLoading ? 'spin' : ''} />
                      <span>Sync Status</span>
                    </button>
                    {(() => {
                      const statusInfo = getCustomerStatusInfo(selectedOrder.order_status);
                      return (
                        <span className={`aso-order-pill ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* Order Summary Card */}
                <div className="order-detail-summary-card">
                  <div className="order-summary-meta">
                    <div className="order-meta-col">
                      <span className="meta-label">Order Number</span>
                      <div className="meta-value-copy">
                        <span className="font-mono">#{selectedOrder.order_number}</span>
                        <button
                          className="btn-icon-sm"
                          onClick={() => handleCopy(selectedOrder.order_number, selectedOrder.id)}
                          title="Copy order number"
                        >
                          {copiedText === selectedOrder.id ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="order-meta-col">
                      <span className="meta-label">Designer</span>
                      <span className="meta-value font-serif">
                        <button
                          className="store-link-btn"
                          onClick={() => navigate(`/store/${selectedOrder.vendor.slug}`)}
                        >
                          {selectedOrder.vendor.store_name} <ExternalLink size={12} />
                        </button>
                      </span>
                    </div>

                    <div className="order-meta-col">
                      <span className="meta-label">Order Date</span>
                      <span className="meta-value">
                        {new Date(selectedOrder.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="order-meta-col">
                      <span className="meta-label">Order Total</span>
                      <span className="meta-value text-gold font-bold">
                        ₦{selectedOrder.total_amount_naira.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Pending payment banner */}
                  {selectedOrder.order_status === 'PENDING_PAYMENT' && (
                    <div className="order-pending-payment-box">
                      <div>
                        <h4>Payment Pending Verification</h4>
                        <p>Complete your Paystack checkout to confirm this order and dispatch it to the designer.</p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="aso-btn-secondary"
                          onClick={() => handleVerifyOrderPayment(selectedOrder.id)}
                          disabled={paymentActionLoading}
                          title="Verify if you already completed Paystack transaction"
                        >
                          <CheckCircle size={15} className="text-emerald" />
                          <span>{paymentActionLoading ? 'Verifying...' : 'Verify Paid Status'}</span>
                        </button>
                        <button
                          className="aso-btn-pay"
                          onClick={() => handlePayPendingOrder(selectedOrder)}
                          disabled={paymentActionLoading}
                        >
                          <CreditCard size={16} />
                          <span>{paymentActionLoading ? 'Connecting Paystack...' : 'Pay via Paystack'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="order-content-grid">
                  {/* Left: Products List */}
                  <div className="order-items-pane">
                    <h3 className="section-title-sm">Ordered Products</h3>
                    <div className="order-items-list">
                      {selectedOrder.items.map(item => {
                        const isReviewed = reviewedItemIds.has(item.id) || !!item.review;
                        const canReview = selectedOrder.order_status === 'COMPLETED' || selectedOrder.order_status === 'DELIVERED';

                        return (
                          <div key={item.id} className="order-item-card">
                            {item.product_image && (
                              <div className="order-item-thumb">
                                <img src={item.product_image} alt={item.product_title_snapshot} />
                              </div>
                            )}
                            <div className="item-main-details">
                              <h4 className="item-title">{item.product_title_snapshot}</h4>
                              <div className="item-badges">
                                {item.variant_size_snapshot && (
                                  <span className="item-pill">Size: {item.variant_size_snapshot}</span>
                                )}
                                {item.variant_color_snapshot && (
                                  <span className="item-pill">Color: {item.variant_color_snapshot}</span>
                                )}
                                <span className="item-pill">Qty: {item.quantity}</span>
                              </div>
                              <div className="item-pricing">
                                <span>Unit: ₦{item.unit_price_naira.toLocaleString()}</span>
                                <span className="text-muted">•</span>
                                <span className="text-gold font-bold">Total: ₦{item.total_price_naira.toLocaleString()}</span>
                              </div>
                            </div>

                            {canReview && (
                              <div className="item-review-action">
                                {isReviewed ? (
                                  <span className="badge-reviewed">
                                    <CheckCircle size={13} /> Reviewed
                                  </span>
                                ) : (
                                  <button
                                    className="aso-btn-sm-review"
                                    onClick={() => {
                                      setReviewModalItem({ item, order: selectedOrder });
                                      setReviewRating(5);
                                      setReviewComment('');
                                      setReviewError('');
                                    }}
                                  >
                                    <Star size={13} /> Leave Review
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Server-Authoritative Financial Breakdown */}
                    <div className="order-financial-breakdown">
                      <div className="finance-row">
                        <span>Items Subtotal</span>
                        <span>₦{selectedOrder.subtotal_naira.toLocaleString()}</span>
                      </div>
                      <div className="finance-row">
                        <span>Delivery Fee</span>
                        <span>₦{selectedOrder.delivery_fee_naira.toLocaleString()}</span>
                      </div>
                      <div className="finance-row total-row">
                        <span>Order Total</span>
                        <span className="text-gold">₦{selectedOrder.total_amount_naira.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Shipping Address & Order Tracking */}
                  <div className="order-sidebar-pane">
                    {/* Snapshotted Shipping Address */}
                    <div className="order-address-box">
                      <div className="box-header">
                        <MapPin size={16} className="text-gold" />
                        <h4>Shipping Address</h4>
                      </div>
                      {selectedOrder.shipping_address_snapshot ? (
                        <div className="address-snapshot-details">
                          <p className="addr-name font-bold">{selectedOrder.shipping_address_snapshot.full_name}</p>
                          <p className="addr-phone">{selectedOrder.shipping_address_snapshot.phone_number}</p>
                          <p className="addr-street">{selectedOrder.shipping_address_snapshot.street_address}</p>
                          <p className="addr-city">{selectedOrder.shipping_address_snapshot.city}, {selectedOrder.shipping_address_snapshot.state}</p>
                          {selectedOrder.shipping_address_snapshot.landmark && (
                            <p className="addr-landmark text-muted">Landmark: {selectedOrder.shipping_address_snapshot.landmark}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-muted">Standard courier delivery address</p>
                      )}
                    </div>

                    {/* Order Timeline Progress */}
                    <div className="order-timeline-box">
                      <div className="box-header">
                        <Clock size={16} className="text-emerald" />
                        <h4>Order Status Timeline</h4>
                      </div>

                      <div className="order-stepper">
                        <div className={`step-node ${['PAID', 'VENDOR_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) ? 'completed' : ''}`}>
                          <div className="node-marker" />
                          <div className="node-info">
                            <span className="node-title">Order Confirmed</span>
                            <span className="node-desc">Payment verified and locked in escrow</span>
                          </div>
                        </div>

                        <div className={`step-node ${['VENDOR_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) ? 'completed' : ''}`}>
                          <div className="node-marker" />
                          <div className="node-info">
                            <span className="node-title">Confirmed by Designer</span>
                            <span className="node-desc">Designer accepted and reserved fabric</span>
                          </div>
                        </div>

                        <div className={`step-node ${['PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) ? 'completed' : ''}`}>
                          <div className="node-marker" />
                          <div className="node-info">
                            <span className="node-title">Preparing Piece</span>
                            <span className="node-desc">Finishing and quality assurance</span>
                          </div>
                        </div>

                        <div className={`step-node ${['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) ? 'completed' : ''}`}>
                          <div className="node-marker" />
                          <div className="node-info">
                            <span className="node-title">Ready for Pickup</span>
                            <span className="node-desc">Packaged for logistics courier</span>
                          </div>
                        </div>

                        <div className={`step-node ${['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) ? 'completed' : ''}`}>
                          <div className="node-marker" />
                          <div className="node-info">
                            <span className="node-title">In Transit</span>
                            <span className="node-desc">Out for delivery with dispatch rider</span>
                          </div>
                        </div>

                        <div className={`step-node ${['DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) ? 'completed' : ''}`}>
                          <div className="node-marker" />
                          <div className="node-info">
                            <span className="node-title">Delivered</span>
                            <span className="node-desc">Received and completed</span>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Logistics Details if available */}
                      {deliveryLoading ? (
                        <div className="delivery-loading-box">
                          <Loader size={16} className="spin" /> Checking logistics status...
                        </div>
                      ) : delivery ? (
                        <div className="delivery-info-card">
                          <div className="delivery-header">
                            <Truck size={16} className="text-emerald" />
                            <span className="delivery-title">{delivery.carrier_name || 'Marketplace Courier'}</span>
                          </div>
                          <p className="delivery-code">Tracking: <strong>{delivery.tracking_number}</strong></p>
                          {delivery.dispatch_notes && (
                            <p className="delivery-notes text-muted">{delivery.dispatch_notes}</p>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Buyer Protection Card */}
                    <div className="buyer-protection-card">
                      <ShieldCheck size={18} className="text-gold" />
                      <div>
                        <h5>Aso Buyer Protection</h5>
                        <p>Your payment is safely held in escrow until your garment is verified and delivered.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Orders List Canvas */
              <div className="orders-list-canvas">
                <div className="orders-header-row">
                  <div>
                    <h2>My Orders</h2>
                    <p className="subtext">Browse and track your marketplace orders.</p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="order-filters-bar" role="tablist">
                  <button
                    className={`filter-btn ${orderStatusFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('ALL')}
                  >
                    All Orders ({orders.length})
                  </button>
                  <button
                    className={`filter-btn ${orderStatusFilter === 'PENDING_PAYMENT' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('PENDING_PAYMENT')}
                  >
                    Pending Payment
                  </button>
                  <button
                    className={`filter-btn ${orderStatusFilter === 'PROCESSING' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('PROCESSING')}
                  >
                    Processing
                  </button>
                  <button
                    className={`filter-btn ${orderStatusFilter === 'READY_FOR_PICKUP' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('READY_FOR_PICKUP')}
                  >
                    Ready for Pickup
                  </button>
                  <button
                    className={`filter-btn ${orderStatusFilter === 'IN_TRANSIT' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('IN_TRANSIT')}
                  >
                    In Transit
                  </button>
                  <button
                    className={`filter-btn ${orderStatusFilter === 'COMPLETED' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('COMPLETED')}
                  >
                    Completed
                  </button>
                  <button
                    className={`filter-btn ${orderStatusFilter === 'CANCELLED' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('CANCELLED')}
                  >
                    Cancelled
                  </button>
                </div>

                {/* Error State */}
                {ordersError ? (
                  <div className="order-error-card">
                    <AlertCircle size={36} className="text-danger" />
                    <h3>We couldn't load your orders.</h3>
                    <p>{ordersError}</p>
                    <button className="aso-btn-primary" onClick={loadOrders}>
                      <RefreshCw size={15} /> Try Again
                    </button>
                  </div>
                ) : ordersLoading ? (
                  /* Skeleton Loading State */
                  <div className="orders-skeleton-grid">
                    {[1, 2].map(n => (
                      <div key={n} className="order-skeleton-card">
                        <div className="skeleton-line shimmer title" />
                        <div className="skeleton-line shimmer subtitle" />
                        <div className="skeleton-line shimmer text" />
                        <div className="skeleton-line shimmer action" />
                      </div>
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  /* Empty State: Zero orders total */
                  <div className="order-empty-card">
                    <div className="empty-icon-ring">
                      <ShoppingBag size={40} className="text-muted" />
                    </div>
                    <h3>No orders yet</h3>
                    <p>You haven't placed an order on Aso Marketplace yet.</p>
                    <button className="aso-btn-primary" onClick={() => navigate('/')}>
                      Explore Nigerian Fashion
                    </button>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  /* Filtered Empty State */
                  <div className="order-empty-card">
                    <ShoppingBag size={32} className="text-muted" />
                    <h3>No orders matching this filter</h3>
                    <p>You have no orders currently in this category.</p>
                    <button className="aso-btn-outline" onClick={() => setOrderStatusFilter('ALL')}>
                      View All Orders
                    </button>
                  </div>
                ) : (
                  /* Orders Grid */
                  <div className="orders-cards-list">
                    {filteredOrders.map(order => {
                      const statusInfo = getCustomerStatusInfo(order.order_status);
                      const placedDate = new Date(order.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });

                      return (
                        <div key={order.id} className="customer-order-card">
                          <div className="order-card-header">
                            <div className="order-card-meta">
                              <span className="order-number font-mono">#{order.order_number}</span>
                              <span className="meta-separator">•</span>
                              <span className="order-date">Placed on {placedDate}</span>
                            </div>
                            <span className={`aso-order-pill ${statusInfo.className}`}>
                              {statusInfo.label}
                            </span>
                          </div>

                          <div className="order-card-body">
                            <div className="order-designer-row">
                              <span className="designer-label">Designer:</span>
                              <button
                                className="designer-name-link font-serif"
                                onClick={() => navigate(`/store/${order.vendor.slug}`)}
                              >
                                {order.vendor.store_name}
                              </button>
                            </div>

                            {/* Products inside order */}
                            <div className="order-products-summary">
                              {order.items.map(item => (
                                <div key={item.id} className="product-summary-row">
                                  {item.product_image && (
                                    <img src={item.product_image} alt={item.product_title_snapshot} className="product-thumb-mini" />
                                  )}
                                  <div className="product-info-compact">
                                    <p className="product-title font-medium">{item.product_title_snapshot}</p>
                                    <div className="product-variants-tags">
                                      {item.variant_size_snapshot && (
                                        <span className="variant-tag">Size: {item.variant_size_snapshot}</span>
                                      )}
                                      {item.variant_color_snapshot && (
                                        <span className="variant-tag">Color: {item.variant_color_snapshot}</span>
                                      )}
                                      <span className="variant-tag">Qty: {item.quantity}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="order-card-footer">
                            <div className="order-total-block">
                              <span className="total-label">Order Total</span>
                              <span className="total-value text-gold font-bold">
                                ₦{order.total_amount_naira.toLocaleString()}
                              </span>
                            </div>

                            <button
                              className="aso-btn-view-order"
                              onClick={() => handleSelectOrder(order)}
                            >
                              <span>View Order & Tracking</span>
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Delivery Addresses */}
        {activeTab === 'addresses' && (
          <div className="profile-tab-pane">
            <div className="addresses-canvas">
              <div className="addresses-header-row">
                <div>
                  <h2>Delivery Addresses</h2>
                  <p className="subtext">Manage and select your saved shipping addresses for checkout.</p>
                </div>
                <button className="aso-btn-primary" onClick={handleOpenNewAddressForm}>
                  <Plus size={16} /> Add Address
                </button>
              </div>

              {/* Address Form Modal */}
              {showAddressForm && (
                <div className="aso-modal-overlay" onClick={() => setShowAddressForm(false)}>
                  <div className="aso-modal-card address-modal" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                      <h3>{editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}</h3>
                      <button className="btn-close" onClick={() => setShowAddressForm(false)}>
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleAddressSubmit} className="address-form">
                      {formError && <div className="form-error-banner">{formError}</div>}

                      <div className="form-group">
                        <label>Recipient Full Name *</label>
                        <input
                          type="text"
                          required
                          value={formData.full_name}
                          onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                          placeholder="e.g. Adeola Adeleke"
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone_number}
                          onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                          placeholder="e.g. 08012345678"
                        />
                      </div>

                      <div className="form-group">
                        <label>Street Address *</label>
                        <textarea
                          required
                          rows={2}
                          value={formData.street_address}
                          onChange={e => setFormData({ ...formData, street_address: e.target.value })}
                          placeholder="House / Flat number, street name"
                        />
                      </div>

                      <div className="form-row-2">
                        <div className="form-group">
                          <label>City / Town *</label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                            placeholder="e.g. Lekki Phase 1"
                          />
                        </div>

                        <div className="form-group">
                          <label>State *</label>
                          <select
                            value={formData.state}
                            onChange={e => setFormData({ ...formData, state: e.target.value })}
                          >
                            {NIGERIAN_STATES.map(st => (
                              <option key={st} value={st}>{st}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Landmark / Delivery Instructions (Optional)</label>
                        <input
                          type="text"
                          value={formData.landmark}
                          onChange={e => setFormData({ ...formData, landmark: e.target.value })}
                          placeholder="e.g. Opposite Palms Mall, grey gate"
                        />
                      </div>

                      <div className="form-checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={formData.is_default}
                            onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                          />
                          <span>Set as my default shipping address</span>
                        </label>
                      </div>

                      <div className="modal-actions">
                        <button type="button" className="aso-btn-outline" onClick={() => setShowAddressForm(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="aso-btn-primary" disabled={formLoading}>
                          {formLoading ? 'Saving...' : editingAddressId ? 'Save Changes' : 'Save Address'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Addresses List */}
              {addresses.length === 0 ? (
                <div className="address-empty-card">
                  <MapPin size={36} className="text-muted" />
                  <h3>No saved addresses</h3>
                  <p>Add your delivery address for faster checkout on all designer garments.</p>
                  <button className="aso-btn-primary" onClick={handleOpenNewAddressForm}>
                    <Plus size={16} /> Add Address
                  </button>
                </div>
              ) : (
                <div className="addresses-grid">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`address-card ${addr.is_default ? 'default-card' : ''}`}>
                      <div className="address-card-top">
                        <div className="addr-recipient">
                          <h4>{addr.full_name}</h4>
                          <span className="addr-phone">{addr.phone_number}</span>
                        </div>
                        {addr.is_default && (
                          <span className="badge-default-addr">
                            <CheckCircle size={12} /> Default
                          </span>
                        )}
                      </div>

                      <div className="address-card-body">
                        <p className="street-line">{addr.street_address}</p>
                        <p className="city-line">{addr.city}, {addr.state}</p>
                        {addr.landmark && <p className="landmark-line text-muted">Landmark: {addr.landmark}</p>}
                      </div>

                      <div className="address-card-actions">
                        {!addr.is_default && (
                          <button
                            className="btn-text-action"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            disabled={settingDefaultId === addr.id}
                          >
                            {settingDefaultId === addr.id ? 'Setting...' : 'Set as Default'}
                          </button>
                        )}
                        <button
                          className="btn-icon-action"
                          onClick={() => handleEditAddress(addr)}
                          title="Edit address"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          className="btn-icon-action text-danger"
                          onClick={() => handleDeleteAddress(addr.id)}
                          disabled={deletingId === addr.id}
                          title="Delete address"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Account & Security */}
        {activeTab === 'details' && (
          <div className="profile-tab-pane">
            <div className="account-details-canvas">
              <div className="details-header-row">
                <div>
                  <h2>Account & Security</h2>
                  <p className="subtext">Manage your personal details and account preferences.</p>
                </div>
              </div>

              <div className="details-form-card">
                <form onSubmit={handleSaveProfile} className="personal-details-form">
                  <h3>Personal Information</h3>

                  {profileSuccessMsg && <div className="form-success-banner">{profileSuccessMsg}</div>}
                  {profileErrorMsg && <div className="form-error-banner">{profileErrorMsg}</div>}

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        required
                        value={profileFirstName}
                        onChange={e => setProfileFirstName(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        required
                        value={profileLastName}
                        onChange={e => setProfileLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        value={profilePhone}
                        onChange={e => setProfilePhone(e.target.value)}
                        placeholder="e.g. 08123456789"
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={user.email}
                        className="input-disabled"
                      />
                      <small className="field-hint">Registered account email cannot be edited directly.</small>
                    </div>
                  </div>

                  <button type="submit" className="aso-btn-primary" disabled={profileUpdating}>
                    {profileUpdating ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>

              {/* Security & Password Card */}
              <div className="security-settings-card">
                <h3>Account Security</h3>
                <p className="subtext">Your account is secured with HttpOnly session cookies and encrypted password storage.</p>
                <div className="security-action-row">
                  <div>
                    <h4>Password Management</h4>
                    <p className="text-muted">Need to update your password? You can log out and use the password reset link.</p>
                  </div>
                  <button className="aso-btn-outline" onClick={logout}>
                    Log Out to Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verified Review Modal */}
      {reviewModalItem && (
        <div className="aso-modal-overlay" onClick={() => setReviewModalItem(null)}>
          <div className="aso-modal-card review-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Leave a Verified Review</h3>
              <button className="btn-close" onClick={() => setReviewModalItem(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="review-form">
              {reviewSuccess && <div className="form-success-banner">{reviewSuccess}</div>}
              {reviewError && <div className="form-error-banner">{reviewError}</div>}

              <div className="review-product-preview">
                <h4>{reviewModalItem.item.product_title_snapshot}</h4>
                <p className="designer-sub">by {reviewModalItem.order.vendor.store_name}</p>
              </div>

              <div className="rating-select-group">
                <label>Overall Rating</label>
                <div className="star-rating-row">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                      onClick={() => setReviewRating(star)}
                    >
                      <Star size={24} fill={star <= reviewRating ? '#d4af37' : 'none'} />
                    </button>
                  ))}
                  <span className="rating-text font-bold">{reviewRating} of 5 Stars</span>
                </div>
              </div>

              <div className="form-group">
                <label>Your Feedback & Experience *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Share details about the fit, fabric quality, and designer craftsmanship..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="aso-btn-outline" onClick={() => setReviewModalItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="aso-btn-primary" disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Status Modal for pending vendor applicants */}
      {showApplicationStatusModal && (
        <div className="aso-modal-overlay" onClick={() => setShowApplicationStatusModal(false)}>
          <div className="aso-modal-card status-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Designer Application Status</h3>
              <button className="btn-close" onClick={() => setShowApplicationStatusModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="status-modal-content">
              <div className="status-badge-ring">
                <Clock size={32} className="text-gold" />
              </div>
              <h4>Application Under Review</h4>
              <p>Your designer storefront application for <strong>{user.vendor_profile?.store_name}</strong> has been received and is currently under verification by our marketplace onboarding team.</p>

              <div className="status-steps">
                <div className="status-step-item done">
                  <CheckCircle size={16} className="text-emerald" />
                  <span>Profile and contact verification</span>
                </div>
                <div className="status-step-item in-progress">
                  <Clock size={16} className="text-gold" />
                  <span>Studio & tailoring standards review</span>
                </div>
                <div className="status-step-item pending">
                  <div className="step-circle-pending" />
                  <span>Storefront activation & listing permissions</span>
                </div>
              </div>

              <button className="aso-btn-primary full-width" onClick={() => setShowApplicationStatusModal(false)}>
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
