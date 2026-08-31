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
  X
} from 'lucide-react';
import { payoutApi, orderApi } from '../../api/client';
import type { VendorBalance, PayoutRequest, Order } from '../../types';

interface DashboardOverviewViewProps {
  onNavigateToProducts: () => void;
  onNavigateToOrders: () => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  onNavigateToProducts,
  onNavigateToOrders,
}) => {
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
      // Reload balance and payouts
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

  // Calculations
  const availableNaira = balance?.available_balance_naira ?? 0;
  const pendingNaira = balance?.pending_balance_naira ?? 0;
  const activeOrdersCount = recentOrders.filter(
    (o) => !['COMPLETED', 'CANCELLED', 'REFUNDED'].includes(o.order_status)
  ).length;

  const totalSalesNaira = recentOrders
    .filter((o) => ['PAID', 'VENDOR_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(o.order_status))
    .reduce((acc, curr) => acc + (curr.total_amount_naira || 0), 0);

  return (
    <div className="designer-dashboard-overview">
      {/* Welcome Headline */}
      <div className="dashboard-welcome-header">
        <h1 className="dashboard-serif-title">Welcome back, Designer</h1>
        <p className="dashboard-subtitle">Here is what's happening with your boutique today.</p>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="dashboard-stats-grid">
        {/* Card 1: Total Sales */}
        <div className="stat-card" onClick={onNavigateToProducts} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span className="stat-label">TOTAL SALES (₦)</span>
            <div className="stat-icon-wrapper">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value">
            ₦ {totalSalesNaira > 0 ? totalSalesNaira.toLocaleString() : '0.00'}
          </div>
          <div className="stat-meta text-emerald">
            <span>Live Marketplace Volume</span>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="stat-card" onClick={onNavigateToOrders} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span className="stat-label">ACTIVE ORDERS</span>
            <div className="stat-icon-wrapper">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="stat-value">{activeOrdersCount}</div>
          <div className="stat-meta text-muted">
            <span>Orders awaiting processing/delivery</span>
          </div>
        </div>

        {/* Card 3: Available Balance */}
        <div className="stat-card" onClick={() => setShowWithdrawModal(true)} style={{ cursor: 'pointer' }}>
          <div className="stat-card-header">
            <span className="stat-label">AVAILABLE BALANCE</span>
            <div className="stat-icon-wrapper">
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-value">₦ {availableNaira.toLocaleString()}</div>
          <div className="stat-meta text-emerald">
            <span>Ready for instant withdrawal</span>
          </div>
        </div>

        {/* Card 4: Pending Payouts / Balance */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">PENDING BALANCE</span>
            <div className="stat-icon-wrapper">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">₦ {pendingNaira.toLocaleString()}</div>
          <div className="stat-meta text-muted">
            <span>72h Buyer Protection Hold</span>
          </div>
        </div>
      </div>

      {/* Main Section: 2 Columns */}
      <div className="dashboard-two-column-layout">
        {/* Left Column: Recent Orders Table */}
        <div className="dashboard-card recent-orders-card">
          <div className="card-header-flex">
            <h3 className="card-heading">Recent Orders</h3>
            <button className="btn-link-action" onClick={onNavigateToOrders}>
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                <Loader size={24} className="cart-spinner" />
                <p style={{ marginTop: '0.5rem' }}>Loading recent orders...</p>
              </div>
            ) : recentOrders.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: '#6B7280' }}>
                <ShoppingBag size={36} style={{ color: '#D1D5DB', marginBottom: '0.5rem' }} />
                <p>No customer orders placed yet.</p>
              </div>
            ) : (
              <table className="designer-table">
                <thead>
                  <tr>
                    <th>ORDER</th>
                    <th>CUSTOMER</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="font-mono font-medium">#{order.order_number}</td>
                      <td>
                        <div className="product-cell-title">
                          {order.shipping_address_snapshot?.full_name || 'Customer'}
                        </div>
                        <div className="product-cell-sub">
                          {order.items?.length || 1} item(s) • {order.shipping_address_snapshot?.city || 'Nigeria'}
                        </div>
                      </td>
                      <td className="font-mono font-bold">
                        ₦ {order.total_amount_naira.toLocaleString()}
                      </td>
                      <td>
                        <span className={`status-pill status-${order.order_status.toLowerCase()}`}>
                          {order.order_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-table-action secondary-action"
                          onClick={onNavigateToOrders}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Earnings & Payout History */}
        <div className="dashboard-right-sidebar">
          {/* Earnings Withdrawal Card */}
          <div className="dashboard-card earnings-card">
            <div className="earnings-card-content">
              <span className="earnings-sub-title">Available for Withdrawal</span>
              <div className="earnings-serif-amount">₦ {availableNaira.toLocaleString()}</div>
              <button 
                className="btn-primary-dark btn-payout" 
                onClick={() => setShowWithdrawModal(true)}
                disabled={availableNaira <= 0}
              >
                <Landmark size={18} />
                <span>Request Payout</span>
              </button>
            </div>
          </div>

          {/* Payout History Card */}
          <div className="dashboard-card payout-history-card">
            <div className="card-header-flex">
              <h3 className="card-heading">Payout History</h3>
            </div>

            <div className="payout-history-list">
              {payouts.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '1rem 0' }}>
                  No payout withdrawals requested yet.
                </p>
              ) : (
                payouts.slice(0, 4).map((p) => (
                  <div key={p.id} className="payout-history-item">
                    <div>
                      <div className="payout-bank-title">
                        {p.bank_name_snapshot || 'Registered Bank'} {p.account_number_snapshot ? `(••••${p.account_number_snapshot.slice(-4)})` : ''}
                      </div>
                      <div className="payout-date">
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="payout-amount-col">
                      <div className="font-mono font-bold">₦ {p.amount_naira.toLocaleString()}</div>
                      <div className={`payout-status-${p.status === 'COMPLETED' ? 'success' : 'pending'}`}>
                        {p.status === 'COMPLETED' && <CheckCircle2 size={12} />}
                        <span>{p.status.replace(/_/g, ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WITHDRAWAL MODAL */}
      {showWithdrawModal && (
        <div className="designer-modal-overlay">
          <div className="designer-modal-box" style={{ maxWidth: '440px' }}>
            <div className="modal-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Landmark size={20} color="#D4AF37" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'Cinzel, Georgia, serif' }}>Request Payout</h3>
              </div>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Balance</span>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#064E3B', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                ₦ {availableNaira.toLocaleString()}
              </div>
            </div>

            {withdrawError && (
              <div className="auth-error-alert" style={{ marginBottom: '1rem' }}>
                <AlertCircle size={16} />
                <span>{withdrawError}</span>
              </div>
            )}

            {withdrawSuccess && (
              <div className="alert-success-msg" style={{ marginBottom: '1rem' }}>
                <CheckCircle2 size={16} />
                <span>{withdrawSuccess}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">WITHDRAWAL AMOUNT (₦)</label>
                <input
                  type="number"
                  step="0.01"
                  min="100"
                  max={availableNaira}
                  className="input-field"
                  placeholder="e.g. 50000"
                  value={withdrawAmountNaira}
                  onChange={(e) => setWithdrawAmountNaira(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setWithdrawAmountNaira(availableNaira.toString())}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#065F46',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginTop: '0.4rem',
                    padding: 0
                  }}
                >
                  Withdraw Full Available Balance (₦{availableNaira.toLocaleString()})
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowWithdrawModal(false)}
                  disabled={withdrawLoading}
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #D1D5DB', background: '#FFF' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={withdrawLoading || availableNaira <= 0}
                  style={{ padding: '0.6rem 1.4rem', borderRadius: '6px', cursor: 'pointer', backgroundColor: '#064E3B', color: '#FFF', border: 'none' }}
                >
                  {withdrawLoading ? 'Submitting...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
