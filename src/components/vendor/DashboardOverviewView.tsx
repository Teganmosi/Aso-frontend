import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  Clock, 
  ArrowRight, 
  Landmark, 
  CheckCircle2, 
  AlertCircle,
  Loader,
  X,
  CreditCard,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { payoutApi, orderApi } from '../../api/client';
import type { VendorBalance, PayoutRequest, Order } from '../../types';

interface DashboardOverviewViewProps {
  onNavigateToProducts: () => void;
  onNavigateToOrders: () => void;
  onNavigateToAddProduct?: () => void;
  onNavigateToEarnings?: () => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  onNavigateToProducts,
  onNavigateToOrders,
  onNavigateToAddProduct,
  onNavigateToEarnings,
}) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<VendorBalance | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal Modal States
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmountNaira, setWithdrawAmountNaira] = useState<string>('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [balanceData, payoutsData, ordersData] = await Promise.allSettled([
        payoutApi.getBalance(),
        payoutApi.getPayoutRequests(),
        orderApi.vendorGetOrders(),
      ]);

      if (balanceData.status === 'fulfilled') setBalance(balanceData.value);
      if (payoutsData.status === 'fulfilled') setPayouts(payoutsData.value);
      if (ordersData.status === 'fulfilled') setRecentOrders(ordersData.value);
    } catch (err) {
      console.error('Failed to load dashboard live data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    setWithdrawSuccess(null);

    const amount = parseFloat(withdrawAmountNaira);
    if (isNaN(amount) || amount <= 0) {
      setWithdrawError('Please enter a valid withdrawal amount.');
      return;
    }

    const amountKobo = Math.round(amount * 100);
    const availableKobo = balance?.available_balance_kobo ?? 0;

    if (amountKobo > availableKobo) {
      setWithdrawError(`Amount exceeds your available balance of ₦${(availableKobo / 100).toLocaleString()}.`);
      return;
    }

    setWithdrawLoading(true);
    try {
      await payoutApi.requestWithdrawal(amountKobo);
      setWithdrawSuccess(`Payout request for ₦${amount.toLocaleString()} submitted successfully!`);
      setWithdrawAmountNaira('');
      await loadDashboardData();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawSuccess(null);
      }, 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.message || 'Failed to submit withdrawal request.';
      setWithdrawError(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Live real-time calculations directly from the DB models
  const availableNaira = balance?.available_balance_naira ?? 0;
  const pendingNaira = balance?.pending_balance_naira ?? 0;
  
  const activeOrdersCount = recentOrders.filter(
    (o) => !['COMPLETED', 'CANCELLED', 'REFUNDED', 'DELIVERED'].includes(o.order_status)
  ).length;

  const totalSalesNaira = recentOrders.reduce((acc, curr) => acc + (curr.total_amount_naira || 0), 0);
  const displayOrders = recentOrders.slice(0, 5);
  const displayPayouts = payouts.slice(0, 4);
  const designerName = user?.first_name || user?.vendor_profile?.store_name || 'Designer';

  return (
    <div className="heritage-vendor-dashboard-content">
      {/* Welcome Header */}
      <div className="heritage-welcome-section">
        <h1 className="heritage-headline-lg">Welcome back, {designerName}</h1>
        <p className="heritage-body-lg">Here is your live studio atelier performance and active customer pipeline.</p>
      </div>

      {/* 4 Top High-Level Metrics Cards */}
      <section className="heritage-metrics-grid">
        {/* Metric 1: Total Sales */}
        <div className="heritage-metric-card ambient-shadow" onClick={onNavigateToProducts}>
          <div className="metric-header-row">
            <h3 className="metric-label">TOTAL SALES (₦)</h3>
            <div className="metric-icon-box">
              <Wallet size={20} color="#00322d" />
            </div>
          </div>
          <p className="metric-amount-serif">₦ {totalSalesNaira.toLocaleString()}</p>
          <div className="metric-trend-positive">
            <TrendingUp size={16} />
            <span>Cumulative marketplace orders</span>
          </div>
        </div>

        {/* Metric 2: Active Orders */}
        <div className="heritage-metric-card ambient-shadow" onClick={onNavigateToOrders}>
          <div className="metric-header-row">
            <h3 className="metric-label">ACTIVE ORDERS</h3>
            <div className="metric-icon-box">
              <ShoppingBag size={20} color="#00322d" />
            </div>
          </div>
          <p className="metric-amount-serif">{activeOrdersCount}</p>
          <div className="metric-trend-subtext">
            <span>{activeOrdersCount === 1 ? '1 active garment order' : `${activeOrdersCount} active garment orders`}</span>
          </div>
        </div>

        {/* Metric 3: Available Balance */}
        <div className="heritage-metric-card ambient-shadow" onClick={() => setShowWithdrawModal(true)}>
          <div className="metric-header-row">
            <h3 className="metric-label">AVAILABLE BALANCE</h3>
            <div className="metric-icon-box">
              <CreditCard size={20} color="#00322d" />
            </div>
          </div>
          <p className="metric-amount-serif">₦ {availableNaira.toLocaleString()}</p>
          <div className="metric-trend-subtext">
            <span>{availableNaira > 0 ? 'Ready for bank settlement' : 'No cleared funds yet'}</span>
          </div>
        </div>

        {/* Metric 4: Pending Payouts */}
        <div className="heritage-metric-card ambient-shadow" onClick={onNavigateToEarnings}>
          <div className="metric-header-row">
            <h3 className="metric-label">PENDING PAYOUTS</h3>
            <div className="metric-icon-box">
              <Clock size={20} color="#00322d" />
            </div>
          </div>
          <p className="metric-amount-serif">₦ {pendingNaira.toLocaleString()}</p>
          <div className="metric-trend-subtext">
            <span>Customer escrow hold</span>
          </div>
        </div>
      </section>

      {/* Main Content Grid: 2:1 Split */}
      <div className="heritage-main-content-grid">
        {/* Left Column (2 Cols): Recent Orders Table */}
        <section className="heritage-orders-card ambient-shadow">
          <div className="heritage-orders-header">
            <h2 className="heritage-card-title">Recent Orders</h2>
            <button className="heritage-view-all-link" onClick={onNavigateToOrders}>
              <span>View All Orders</span>
              <ArrowRight size={15} />
            </button>
          </div>

          <div className="heritage-table-container">
            {loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
                <Loader size={24} className="cart-spinner" />
                <p style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>Syncing orders with database...</p>
              </div>
            ) : displayOrders.length === 0 ? (
              <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#6B7280' }}>
                <ShoppingBag size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.4, color: '#00322d' }} />
                <h3 style={{ fontSize: '1.1rem', color: '#111827', margin: '0 0 0.25rem', fontFamily: 'Cinzel, Georgia, serif' }}>
                  No orders received yet
                </h3>
                <p style={{ fontSize: '0.875rem', margin: '0 0 1rem', maxWidth: '380px', marginInline: 'auto' }}>
                  When customers purchase your garments, incoming orders and customer measurements will appear here live.
                </p>
                {onNavigateToAddProduct && (
                  <button
                    className="btn-action-primary"
                    onClick={onNavigateToAddProduct}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                  >
                    <Plus size={15} />
                    <span>Upload New Garment</span>
                  </button>
                )}
              </div>
            ) : (
              <table className="heritage-orders-table">
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>PRODUCT</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {displayOrders.map((order) => {
                    const orderNum = order.order_number || `#ASO-${order.id?.slice(0, 6)}`;
                    const orderAmt = order.total_amount_naira || 0;
                    const itemTitle = order.items?.[0]?.product_title_snapshot || 'Bespoke Garment';
                    const itemSize = order.items?.[0]?.variant_size_snapshot || 'Custom';
                    const custName = order.shipping_address_snapshot?.full_name || 'Customer';
                    const itemImg = '/traditional-men-1.png';
                    const status = order.order_status || 'PAID';

                    return (
                      <tr key={order.id} className="heritage-table-row">
                        <td className="cell-order-id">#{orderNum.replace('#', '')}</td>
                        <td className="cell-product-info">
                          <div className="product-media-group">
                            <img src={itemImg} alt={itemTitle} className="product-thumb-sq" />
                            <div>
                              <p className="product-title-text">{itemTitle}</p>
                              <p className="product-sub-meta">Size: {itemSize} • Customer: {custName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="cell-amount">₦ {orderAmt.toLocaleString()}</td>
                        <td className="cell-status">
                          {status === 'PAID' && (
                            <span className="pill-status-paid">
                              <span className="dot-paid" />
                              <span>Paid</span>
                            </span>
                          )}
                          {(status === 'PREPARING' || status === 'VENDOR_ACCEPTED') && (
                            <span className="pill-status-preparing">
                              <span className="dot-preparing" />
                              <span>Preparing</span>
                            </span>
                          )}
                          {(status === 'READY_FOR_PICKUP' || (status as string) === 'PICKED_UP' || (status as string) === 'OUT_FOR_DELIVERY') && (
                            <span className="pill-status-shipped">
                              <span className="dot-shipped" />
                              <span>Ready / Shipped</span>
                            </span>
                          )}
                          {(status === 'COMPLETED' || status === 'DELIVERED') && (
                            <span className="pill-status-completed">
                              <span className="dot-completed" />
                              <span>Delivered</span>
                            </span>
                          )}
                          {!['PAID', 'PREPARING', 'VENDOR_ACCEPTED', 'READY_FOR_PICKUP', 'COMPLETED', 'DELIVERED'].includes(status) && (
                            <span className="pill-status-preparing">
                              <span>{String(status).replace(/_/g, ' ')}</span>
                            </span>
                          )}
                        </td>
                        <td className="cell-action">
                          {status === 'PAID' ? (
                            <button
                              className="btn-heritage-accept"
                              onClick={onNavigateToOrders}
                            >
                              Accept
                            </button>
                          ) : (
                            <button
                              className="btn-heritage-outline"
                              onClick={onNavigateToOrders}
                            >
                              Inspect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Right Column (1 Col): Earnings & Payouts + Payout History */}
        <aside className="heritage-sidebar-column">
          {/* Earnings & Payouts Card */}
          <div className="heritage-withdraw-widget ambient-shadow">
            <div className="widget-radial-pattern" />
            <h2 className="heritage-card-title relative-z">Earnings & Payouts</h2>
            <p className="heritage-sub-label relative-z">Available for Withdrawal</p>
            
            <div className="heritage-payout-amount-row relative-z">
              <span className="naira-sign">₦</span>
              <span className="naira-val">{availableNaira.toLocaleString()}</span>
            </div>

            <button
              className="btn-heritage-payout relative-z"
              onClick={() => setShowWithdrawModal(true)}
              disabled={availableNaira <= 0}
              style={{ opacity: availableNaira <= 0 ? 0.75 : 1 }}
            >
              <Landmark size={18} />
              <span>Request Payout</span>
            </button>
          </div>

          {/* Payout History Card */}
          <div className="heritage-history-widget ambient-shadow">
            <div className="history-header-row">
              <h3 className="heritage-card-title text-18">Payout History</h3>
              {onNavigateToEarnings && (
                <button className="heritage-link-sm" onClick={onNavigateToEarnings}>
                  View All
                </button>
              )}
            </div>

            <div className="payout-items-stack">
              {loading ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: '#6B7280' }}>
                  <Loader size={18} className="cart-spinner" />
                </div>
              ) : displayPayouts.length === 0 ? (
                <div style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: '#6B7280' }}>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>
                    No payout settlements requested yet.
                  </p>
                </div>
              ) : (
                displayPayouts.map((pay) => (
                  <div key={pay.id} className="payout-history-row">
                    <div>
                      <p className="history-bank-name">
                        {pay.bank_name_snapshot ? `To ${pay.bank_name_snapshot}` : 'Bank Settlement'}
                      </p>
                      <p className="history-date-text">
                        {new Date(pay.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="history-right-col">
                      <p className="history-amount-text">₦ {(pay.amount_naira || 0).toLocaleString()}</p>
                      <p className="history-status-badge">
                        <CheckCircle2 size={13} color="#004b44" />
                        <span>{pay.status.replace(/_/g, ' ')}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title-row">
                <Landmark size={20} color="#00322d" />
                <h3>Request Bank Settlement</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowWithdrawModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="modal-form">
              <p className="modal-description">
                Withdraw your earned sales directly to your registered Nigerian bank account via automated NIP settlement.
              </p>

              <div className="available-balance-display">
                <span>Withdrawable Balance:</span>
                <strong>₦ {availableNaira.toLocaleString()}</strong>
              </div>

              {withdrawError && (
                <div className="form-alert error">
                  <AlertCircle size={16} />
                  <span>{withdrawError}</span>
                </div>
              )}

              {withdrawSuccess && (
                <div className="form-alert success">
                  <CheckCircle2 size={16} />
                  <span>{withdrawSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label>Withdrawal Amount (₦ Naira)</label>
                <div className="input-with-symbol">
                  <span className="input-symbol">₦</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 50000"
                    value={withdrawAmountNaira}
                    onChange={(e) => setWithdrawAmountNaira(e.target.value)}
                    required
                  />
                </div>
                <div className="quick-amount-pills">
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountNaira((availableNaira * 0.5).toFixed(0))}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmountNaira(availableNaira.toString())}
                  >
                    100% (Max)
                  </button>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowWithdrawModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-withdraw"
                  disabled={withdrawLoading || availableNaira <= 0}
                >
                  {withdrawLoading ? (
                    <>
                      <Loader size={16} className="spin-loader" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <span>Submit Payout</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardOverviewView;
