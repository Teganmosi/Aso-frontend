import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminApi, productApi, orderApi } from '../api/client';
import type { 
  AdminVendorApplication, 
  Product, 
  Order, 
  PayoutRequest 
} from '../types';
import {
  ShieldCheck,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  MapPin,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Eye,
  Check,
  X,
  ArrowLeft,
  Camera,
  Loader2
} from 'lucide-react';
import './AdminPortalPage.css';

export const AdminPortalPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'applications' | 'products' | 'orders' | 'payouts'>('applications');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data States
  const [vendors, setVendors] = useState<AdminVendorApplication[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);

  // Search and Filter States
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorStatusFilter, setVendorStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedVendorForModal, setSelectedVendorForModal] = useState<AdminVendorApplication | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  // Action status message
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Fetch all admin data
  const fetchAllAdminData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [vendorsRes, productsRes, ordersRes, payoutsRes] = await Promise.all([
        adminApi.getVendors().catch(() => []),
        productApi.getPublicProducts().catch(() => []),
        orderApi.getOrders().catch(() => []),
        adminApi.getPayoutRequests().catch(() => []),
      ]);

      setVendors(vendorsRes || []);
      setProducts(productsRes || []);
      setOrders(ordersRes || []);
      setPayouts(payoutsRes || []);
    } catch (err) {
      console.error('Failed to load admin portal data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user && user.is_staff) {
      fetchAllAdminData();
    }
  }, [user]);

  // Handle Verification Badge Approval
  const handleVerifyVendor = async (vendor: AdminVendorApplication, isVerified = true) => {
    setActionLoadingId(vendor.id);
    setActionFeedback(null);
    try {
      await adminApi.updateVendorStatus(vendor.id, {
        status: 'APPROVED',
        is_verified: isVerified,
        kyc_tier: isVerified ? 'TIER_2_VERIFIED' : 'TIER_1_STARTER',
      });

      // Update local state immediately
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendor.id ? { ...v, status: 'APPROVED', is_verified: isVerified, kyc_tier: isVerified ? 'TIER_2_VERIFIED' : 'TIER_1_STARTER' } : v
        )
      );

      if (selectedVendorForModal?.id === vendor.id) {
        setSelectedVendorForModal((prev) =>
          prev ? { ...prev, status: 'APPROVED', is_verified: isVerified, kyc_tier: isVerified ? 'TIER_2_VERIFIED' : 'TIER_1_STARTER' } : null
        );
      }

      setActionFeedback({
        type: 'success',
        message: isVerified
          ? `Verified Atelier Badge GRANTED to ${vendor.store_name}! Verified checkmark is now active.`
          : `Verification badge revoked for ${vendor.store_name}.`,
      });
      setTimeout(() => setActionFeedback(null), 6000);
    } catch (err: any) {
      console.error('Failed to update vendor verification status', err);
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to update verification status on server.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // KPI Metrics Calculations
  const metrics = useMemo(() => {
    const totalVendors = vendors.length;
    const pendingVendors = vendors.filter((v) => v.status === 'PENDING').length;
    const approvedVendors = vendors.filter((v) => v.status === 'APPROVED').length;
    const totalProducts = products.length;
    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.order_status !== 'PENDING_PAYMENT' && o.order_status !== 'CANCELLED');
    const totalGmv = paidOrders.reduce((sum, o) => sum + (o.total_amount_naira || 0), 0);
    const pendingPayoutsCount = payouts.filter((p) => p.status === 'PENDING' || p.status === 'PAYOUT_RESERVED' || p.status === 'PROCESSING').length;

    return {
      totalVendors,
      pendingVendors,
      approvedVendors,
      totalProducts,
      totalOrders,
      totalGmv,
      pendingPayoutsCount,
    };
  }, [vendors, products, orders, payouts]);

  // Filtered Vendors List
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchSearch =
        v.store_name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        v.slug.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        v.city?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        v.instagram_handle?.toLowerCase().includes(vendorSearch.toLowerCase());

      const matchStatus =
        vendorStatusFilter === 'ALL' ? true : v.status === vendorStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [vendors, vendorSearch, vendorStatusFilter]);

  // Access Control Guard
  if (!user || !user.is_staff) {
    return (
      <div className="admin-unauthorized-view">
        <div className="unauthorized-card">
          <ShieldCheck size={56} className="unauthorized-shield-icon" />
          <h1>Staff Access Required</h1>
          <p>This administrative management portal is restricted to authorized Aso Marketplace staff and platform operators.</p>
          {!user ? (
            <button className="btn-admin-login" onClick={() => openAuthModal('login')}>
              Sign In to Staff Account
            </button>
          ) : (
            <Link to="/" className="btn-admin-login">
              Return to Marketplace
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-portal-page">
      {/* ─── Top Admin Bar ─── */}
      <header className="admin-portal-header">
        <div className="admin-header-container">
          <div className="admin-brand-left">
            <Link to="/" className="admin-home-link" title="Return to Marketplace">
              <ArrowLeft size={16} />
              <span>Aso Marketplace</span>
            </Link>
            <div className="admin-badge-pill">
              <ShieldCheck size={14} />
              <span>PLATFORM OPERATOR DESK</span>
            </div>
          </div>

          <div className="admin-header-actions">
            <button
              className="btn-refresh-admin"
              onClick={() => fetchAllAdminData(true)}
              disabled={refreshing}
              title="Refresh Data from Server"
            >
              <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh DB'}</span>
            </button>
            <div className="admin-user-pill">
              <span className="admin-dot" />
              <span>Staff: {user.first_name} {user.last_name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Main Admin Container ─── */}
      <main className="admin-main-container">
        
        {/* Feedback Alert */}
        {actionFeedback && (
          <div className={`admin-alert-banner alert-${actionFeedback.type}`}>
            {actionFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <span>{actionFeedback.message}</span>
            <button onClick={() => setActionFeedback(null)} className="alert-dismiss-btn">
              <X size={16} />
            </button>
          </div>
        )}

        {/* ─── KPI Metrics Overview ─── */}
        <section className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="kpi-icon-box icon-amber">
              <Clock size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Pending Review</span>
              <strong className="kpi-value text-amber">{metrics.pendingVendors}</strong>
              <span className="kpi-subtext">Designer applications</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="kpi-icon-box icon-emerald">
              <Store size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Active Designers</span>
              <strong className="kpi-value">{metrics.approvedVendors}</strong>
              <span className="kpi-subtext">{metrics.totalVendors} total registered</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="kpi-icon-box icon-blue">
              <Package size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Live Catalog</span>
              <strong className="kpi-value">{metrics.totalProducts}</strong>
              <span className="kpi-subtext">Published pieces</span>
            </div>
          </div>

          <div className="admin-kpi-card">
            <div className="kpi-icon-box icon-purple">
              <TrendingUp size={22} />
            </div>
            <div className="kpi-info">
              <span className="kpi-label">Marketplace GMV</span>
              <strong className="kpi-value">₦{metrics.totalGmv.toLocaleString()}</strong>
              <span className="kpi-subtext">{metrics.totalOrders} total orders</span>
            </div>
          </div>
        </section>
        {/* ─── Admin Tabs Navigation ─── */}
        <div className="admin-tabs-nav-deck">
          <button
            className={`admin-nav-tab ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            <ShieldCheck size={16} />
            <span>Designer Verification &amp; KYC</span>
            {vendors.filter((v) => !v.is_verified).length > 0 && (
              <span className="admin-tab-count-badge">{vendors.filter((v) => !v.is_verified).length}</span>
            )}
          </button>

          <button
            className={`admin-nav-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={16} />
            <span>Catalog Moderation ({products.length})</span>
          </button>

          <button
            className={`admin-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingBag size={16} />
            <span>Orders &amp; Escrow ({orders.length})</span>
          </button>

          <button
            className={`admin-nav-tab ${activeTab === 'payouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('payouts')}
          >
            <CreditCard size={16} />
            <span>Payout Requests ({payouts.length})</span>
          </button>
        </div>

        {/* ─── Loading Indicator ─── */}
        {loading && (
          <div className="admin-empty-state-card" style={{ padding: '3rem 2rem' }}>
            <Loader2 size={32} className="spin-anim" color="#D4AF37" />
            <h3 style={{ marginTop: '0.75rem' }}>Loading Admin Workspace...</h3>
            <p>Fetching authoritative records from the database.</p>
          </div>
        )}

        {/* ─── TAB 1: DESIGNER IDENTITY & VERIFICATION (KYC) ─── */}
        {!loading && activeTab === 'applications' && (
          <div className="admin-section-content">
            {/* Filter and Search Bar */}
            <div className="admin-table-filters-row">
              <div className="admin-search-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by designer name, slug, city, or Instagram..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>

              <div className="admin-status-filters-group">
                <button
                  className={`status-filter-btn ${vendorStatusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setVendorStatusFilter('ALL')}
                >
                  All Designers ({vendors.length})
                </button>
                <button
                  className={`status-filter-btn pending ${vendorStatusFilter === 'PENDING' ? 'active' : ''}`}
                  onClick={() => setVendorStatusFilter('PENDING')}
                >
                  Needs Verification ({vendors.filter((v) => !v.is_verified).length})
                </button>
                <button
                  className={`status-filter-btn approved ${vendorStatusFilter === 'APPROVED' ? 'active' : ''}`}
                  onClick={() => setVendorStatusFilter('APPROVED')}
                >
                  Verified Ateliers ({vendors.filter((v) => v.is_verified).length})
                </button>
              </div>
            </div>

            {/* Verification Notice Banner */}
            <div style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', padding: '0.9rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#166534' }}>
              <ShieldCheck size={20} color="#16A34A" />
              <div>
                <strong>Self-Service Selling &amp; Verification Protocol:</strong> Designers can list wares and manage their studios immediately upon registration. The <strong>Verified Atelier Badge</strong> is granted when the name on their bank account matches their NIN and registered account identity.
              </div>
            </div>

            {/* Applications List */}
            {filteredVendors.length === 0 ? (
              <div className="admin-empty-state-card">
                <Store size={44} color="#9CA3AF" />
                <h3>No Designers Found</h3>
                <p>No registered designers match your current search or status filter.</p>
              </div>
            ) : (
              <div className="admin-vendors-grid">
                {filteredVendors.map((vendor) => {
                  const isActioning = actionLoadingId === vendor.id;
                  const bankAcc = vendor.bank_account;
                  const hasNIN = Boolean(vendor.nin_number);
                  const hasBank = Boolean(bankAcc?.account_name);

                  return (
                    <article key={vendor.id} className={`admin-vendor-card ${vendor.is_verified ? 'status-approved' : 'status-pending'}`}>
                      <div className="card-header-row">
                        <div className="vendor-avatar-initials">
                          {vendor.store_name.charAt(0)}
                        </div>
                        <div className="vendor-title-block">
                          <div className="title-and-status">
                            <h3 className="vendor-store-title">{vendor.store_name}</h3>
                            <span className={`status-badge ${vendor.is_verified ? 'badge-approved' : 'badge-pending'}`}>
                              {vendor.is_verified ? 'VERIFIED ATELIER' : 'UNVERIFIED (TIER 1)'}
                            </span>
                          </div>
                          <span className="vendor-slug-pill">/store/{vendor.slug}</span>
                        </div>
                      </div>

                      <p className="vendor-card-desc">
                        {vendor.description || 'Nigerian fashion studio creating bespoke & ready-to-wear collections.'}
                      </p>

                      <div className="vendor-details-list">
                        <div className="detail-item">
                          <MapPin size={14} className="detail-icon" />
                          <span>{vendor.workshop_address || `${vendor.city || 'Lagos'}, ${vendor.state || 'Lagos State'}`}</span>
                        </div>

                        {vendor.instagram_handle && (
                          <div className="detail-item">
                            <Camera size={14} className="detail-icon" />
                            <a
                              href={`https://instagram.com/${vendor.instagram_handle.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="detail-link"
                            >
                              {vendor.instagram_handle}
                            </a>
                          </div>
                        )}

                        {/* 3-Way Match Verification Card */}
                        <div style={{ backgroundColor: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '6px', padding: '0.65rem 0.75rem', marginTop: '0.5rem' }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                            3-Way Identity Audit:
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#4B5563', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <div>👤 <strong>Owner:</strong> {vendor.user_name || vendor.store_name}</div>
                            <div>🆔 <strong>NIN:</strong> {hasNIN ? `${vendor.nin_number?.substring(0, 4)}••••••• (Valid Format)` : '⚠️ Not Provided Yet'}</div>
                            <div>🏦 <strong>Bank:</strong> {hasBank ? `${bankAcc?.account_name} (${bankAcc?.bank_name})` : '⚠️ Bank Not Linked'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="admin-card-actions-row">
                        {!vendor.is_verified ? (
                          <button
                            className="btn-admin-approve"
                            onClick={() => handleVerifyVendor(vendor, true)}
                            disabled={isActioning}
                            title="Verify identity & grant Verified Atelier badge"
                          >
                            <Check size={14} />
                            <span>{isActioning ? 'Verifying...' : 'Grant Verified Badge'}</span>
                          </button>
                        ) : (
                          <button
                            className="btn-admin-reject"
                            onClick={() => handleVerifyVendor(vendor, false)}
                            disabled={isActioning}
                            title="Revoke verified badge"
                          >
                            <X size={14} />
                            <span>Revoke Badge</span>
                          </button>
                        )}

                        <button
                          className="btn-view-dossier"
                          onClick={() => setSelectedVendorForModal(vendor)}
                        >
                          Full Dossier
                        </button>

                        <Link
                          to={`/store/${vendor.slug}`}
                          target="_blank"
                          className="btn-admin-preview"
                          title="Open live public storefront in new tab"
                        >
                          <ExternalLink size={13} />
                          <span>Storefront</span>
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: PRODUCT & CATALOG MODERATION ─── */}
        {!loading && activeTab === 'products' && (
          <div className="admin-section-content">
            <div className="admin-table-filters-row">
              <div className="admin-search-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search products by title, category, or designer..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>
              <div className="admin-count-indicator">
                Showing {products.length} catalog items
              </div>
            </div>

            <div className="admin-products-table-wrapper">
              <table className="admin-data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Designer</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Variants &amp; Stock</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
                    .map((prod) => (
                      <tr key={prod.id}>
                        <td className="product-title-cell">
                          <div className="prod-cell-flex">
                            <img
                              src={prod.primary_image_url || '/adire-1.png'}
                              alt={prod.title}
                              className="prod-thumb-mini"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/traditional-men-1.png';
                              }}
                            />
                            <div>
                              <strong>{prod.title}</strong>
                              <span className="prod-sub-slug">/products/{prod.slug || prod.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>{prod.vendor?.store_name || 'Independent Designer'}</td>
                        <td>{prod.category?.name || 'Two-Piece Sets'}</td>
                        <td className="font-mono font-bold">₦{(prod.base_price_naira || (prod.base_price_kobo ? prod.base_price_kobo / 100 : 0)).toLocaleString()}</td>
                        <td>{prod.variants?.length || 1} sizes / in stock</td>
                        <td>
                          <span className="status-pill status-approved">
                            {prod.approval_status || 'APPROVED'}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/products/${prod.slug || prod.id}`}
                            target="_blank"
                            className="btn-table-action"
                          >
                            <Eye size={13} />
                            <span>Preview</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 3: ORDERS & ESCROW OVERSIGHT ─── */}
        {!loading && activeTab === 'orders' && (
          <div className="admin-section-content">
            <div className="admin-table-filters-row">
              <div className="admin-search-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search orders by order number or customer..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="admin-search-input"
                />
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="admin-empty-state-card">
                <ShoppingBag size={44} color="#9CA3AF" />
                <h3>No Orders Placed Yet</h3>
                <p>New customer orders across all verified ateliers will appear here in real-time.</p>
              </div>
            ) : (
              <div className="admin-products-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Payment Status</th>
                      <th>Fulfillment</th>
                      <th>Escrow Protection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter((o) => o.order_number.toLowerCase().includes(orderSearch.toLowerCase()))
                      .map((ord) => {
                        const isPaid = ord.order_status !== 'PENDING_PAYMENT';
                        return (
                          <tr key={ord.id}>
                            <td className="font-mono font-bold">#{ord.order_number}</td>
                            <td>{new Date(ord.created_at).toLocaleDateString()}</td>
                            <td>{ord.shipping_address_snapshot?.full_name || 'Customer'}</td>
                            <td className="font-mono font-bold">₦{ord.total_amount_naira.toLocaleString()}</td>
                            <td>
                              <span className={`status-pill status-${ord.order_status.toLowerCase()}`}>
                                {ord.order_status.replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td>{ord.delivery?.status || 'Pending Dispatch'}</td>
                            <td>
                              {isPaid ? (
                                <span className="escrow-pill-active">
                                  <ShieldCheck size={12} />
                                  <span>72h Protected</span>
                                </span>
                              ) : (
                                <span className="escrow-pill-pending">Awaiting Payment</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 4: PAYOUTS & SETTLEMENT ─── */}
        {!loading && activeTab === 'payouts' && (
          <div className="admin-section-content">
            <div className="payouts-overview-box">
              <div className="payout-summary-card">
                <h4>Total Payouts Handled</h4>
                <strong className="font-mono">₦{(payouts.reduce((sum, p) => sum + (p.amount_naira || 0), 0)).toLocaleString()}</strong>
              </div>
              <div className="payout-summary-card">
                <h4>Pending Withdrawals</h4>
                <strong className="font-mono text-amber">{payouts.filter((p) => p.status === 'PENDING' || p.status === 'PAYOUT_RESERVED' || p.status === 'PROCESSING').length} requests</strong>
              </div>
            </div>

            {payouts.length === 0 ? (
              <div className="admin-empty-state-card">
                <CreditCard size={44} color="#9CA3AF" />
                <h3>No Payout Requests Pending</h3>
                <p>When verified designers request earnings withdrawals, their bank details and transfer approvals will appear here.</p>
              </div>
            ) : (
              <div className="admin-products-table-wrapper">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Bank Details</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payouts.map((p) => (
                      <tr key={p.id}>
                        <td className="font-mono">{p.reference}</td>
                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="font-mono font-bold">₦{p.amount_naira.toLocaleString()}</td>
                        <td>
                          <div>
                            <strong>{p.account_name_snapshot}</strong>
                            <div className="font-mono">{p.bank_name_snapshot} • {p.account_number_snapshot}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`status-pill status-${p.status.toLowerCase()}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          {(p.status === 'PENDING' || p.status === 'PAYOUT_RESERVED' || p.status === 'PROCESSING') && (
                            <button
                              className="btn-admin-approve"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                              onClick={() => adminApi.processPayout(p.id, 'APPROVE')}
                            >
                              Approve Transfer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* ─── Full Dossier Review Modal ─── */}
      {selectedVendorForModal && (
        <div className="admin-modal-overlay" onClick={() => setSelectedVendorForModal(null)}>
          <div className="admin-dossier-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-box">
                <h2>{selectedVendorForModal.store_name}</h2>
                <span className={`status-badge badge-${selectedVendorForModal.status.toLowerCase()}`}>
                  {selectedVendorForModal.status}
                </span>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedVendorForModal(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-scroll">
              <div className="dossier-section">
                <h4>Storefront Information</h4>
                <div className="dossier-grid">
                  <div>
                    <label>Store Name</label>
                    <p>{selectedVendorForModal.store_name}</p>
                  </div>
                  <div>
                    <label>Generated Slug</label>
                    <p className="font-mono">/store/{selectedVendorForModal.slug}</p>
                  </div>
                  <div className="col-span-2">
                    <label>Description</label>
                    <p>{selectedVendorForModal.description || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="dossier-section">
                <h4>Workshop &amp; Location Verification</h4>
                <div className="dossier-grid">
                  <div>
                    <label>State / Region</label>
                    <p>{selectedVendorForModal.state || 'Lagos State'}</p>
                  </div>
                  <div>
                    <label>City</label>
                    <p>{selectedVendorForModal.city || 'Lagos'}</p>
                  </div>
                  <div className="col-span-2">
                    <label>Physical Workshop Address</label>
                    <p>{selectedVendorForModal.workshop_address || 'Not provided yet'}</p>
                  </div>
                  <div className="col-span-2">
                    <label>Landmark</label>
                    <p>{selectedVendorForModal.landmark || 'Not provided yet'}</p>
                  </div>
                </div>
              </div>

              <div className="dossier-section">
                <h4>Identity, NIN &amp; NUBAN Bank Matching</h4>
                <div className="dossier-grid">
                  <div>
                    <label>Account Owner Name</label>
                    <p><strong>{selectedVendorForModal.user_name || selectedVendorForModal.store_name}</strong></p>
                  </div>
                  <div>
                    <label>National Identification Number (NIN)</label>
                    <p className="font-mono">{selectedVendorForModal.nin_number ? `${selectedVendorForModal.nin_number} (11 digits)` : '⚠️ Not Submitted Yet'}</p>
                  </div>
                  <div>
                    <label>Bank Account Name</label>
                    <p className="font-mono"><strong>{selectedVendorForModal.bank_account?.account_name || '⚠️ Not linked yet'}</strong></p>
                  </div>
                  <div>
                    <label>Bank &amp; Account Number</label>
                    <p className="font-mono">{selectedVendorForModal.bank_account ? `${selectedVendorForModal.bank_account.bank_name} • ${selectedVendorForModal.bank_account.account_number}` : 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <label>CAC Registration (Optional)</label>
                    <p>{selectedVendorForModal.cac_number || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="dossier-section">
                <h4>Social &amp; Digital Footprint</h4>
                <div className="dossier-grid">
                  <div>
                    <label>Instagram Handle</label>
                    <p>{selectedVendorForModal.instagram_handle || 'N/A'}</p>
                  </div>
                  <div>
                    <label>KYC Verification Tier</label>
                    <p>{selectedVendorForModal.is_verified ? 'TIER 2: VERIFIED ATELIER (GOLD BADGE)' : 'TIER 1: STARTER / UNVERIFIED'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-actions">
              {!selectedVendorForModal.is_verified ? (
                <button
                  className="btn-admin-approve"
                  onClick={() => handleVerifyVendor(selectedVendorForModal, true)}
                  disabled={actionLoadingId === selectedVendorForModal.id}
                >
                  <Check size={16} />
                  <span>Grant Verified Atelier Badge</span>
                </button>
              ) : (
                <button
                  className="btn-admin-reject"
                  onClick={() => handleVerifyVendor(selectedVendorForModal, false)}
                  disabled={actionLoadingId === selectedVendorForModal.id}
                >
                  <X size={16} />
                  <span>Revoke Verified Badge</span>
                </button>
              )}

              <Link
                to={`/store/${selectedVendorForModal.slug}`}
                target="_blank"
                className="btn-admin-preview"
              >
                <ExternalLink size={15} />
                <span>Open Public Storefront</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortalPage;
