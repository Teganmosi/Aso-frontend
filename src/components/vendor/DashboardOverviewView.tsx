import React, { useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  Clock, 
  ArrowRight, 
  Landmark, 
  CheckCircle2 
} from 'lucide-react';
import type { DesignerOrder } from '../../types';

interface DashboardOverviewViewProps {
  onNavigateToProducts: () => void;
  onNavigateToOrders: () => void;
}

export const DashboardOverviewView: React.FC<DashboardOverviewViewProps> = ({
  onNavigateToProducts,
  onNavigateToOrders,
}) => {
  const [payoutRequested, setPayoutRequested] = useState(false);

  const sampleOrders: DesignerOrder[] = [
    {
      id: '1',
      order_number: '#VDO-10023',
      product_name: 'Indigo Adire Kaftan',
      product_image: '/adire-1.png',
      customer_name: 'Adebayo O.',
      size_details: 'Size: L',
      amount: 85000,
      status: 'Paid',
      created_at: '2024-10-14',
    },
    {
      id: '2',
      order_number: '#VDO-10022',
      product_name: 'Maroon Aso-Oke Set',
      product_image: '/traditional-men-1.png',
      customer_name: 'Chioma N.',
      size_details: 'Size: Custom',
      amount: 120000,
      status: 'Preparing',
      created_at: '2024-10-13',
    },
    {
      id: '3',
      order_number: '#VDO-10021',
      product_name: 'Embroidered Urban Kaftan',
      product_image: '/traditional-men-2.png',
      customer_name: 'Ibrahim S.',
      size_details: 'Size: M',
      amount: 45000,
      status: 'Shipped',
      created_at: '2024-10-11',
    },
  ];

  const handleRequestPayout = () => {
    setPayoutRequested(true);
    setTimeout(() => {
      alert('Payout request of ₦ 1,150,000 submitted to Zenith Bank ****4567. Processing in 24-48 hours.');
    }, 200);
  };

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
          <div className="stat-value">₦ 4,250,000</div>
          <div className="stat-meta text-emerald">
            <span>↗ +15% from last month</span>
          </div>
        </div>

        {/* Card 2: Active Orders */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">ACTIVE ORDERS</span>
            <div className="stat-icon-wrapper">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="stat-value">24</div>
          <div className="stat-meta text-muted">
            <span>5 require immediate action</span>
          </div>
        </div>

        {/* Card 3: Available Balance */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">AVAILABLE BALANCE</span>
            <div className="stat-icon-wrapper">
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-value">₦ 1,150,000</div>
          <div className="stat-meta text-emerald">
            <span>Ready for withdrawal</span>
          </div>
        </div>

        {/* Card 4: Pending Payouts */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-label">PENDING PAYOUTS</span>
            <div className="stat-icon-wrapper">
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">₦ 450,000</div>
          <div className="stat-meta text-muted">
            <span>Processing in 2-3 business days</span>
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
            <table className="designer-table">
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
                {sampleOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-mono font-medium">{order.order_number}</td>
                    <td>
                      <div className="table-product-cell">
                        <img 
                          src={order.product_image} 
                          alt={order.product_name} 
                          className="table-thumbnail-img" 
                        />
                        <div>
                          <div className="product-cell-title">{order.product_name}</div>
                          <div className="product-cell-sub">
                            {order.size_details} • Customer: {order.customer_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono font-bold">
                      ₦ {order.amount.toLocaleString()}
                    </td>
                    <td>
                      <span className={`status-pill pill-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {order.status === 'Paid' ? (
                        <button className="btn-table-action primary-action">Accept</button>
                      ) : order.status === 'Preparing' ? (
                        <button className="btn-table-action secondary-action">Update</button>
                      ) : (
                        <button className="btn-table-action secondary-action">View</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Earnings & Payout History */}
        <div className="dashboard-right-sidebar">
          {/* Earnings Withdrawal Card */}
          <div className="dashboard-card earnings-card">
            <div className="earnings-card-content">
              <span className="earnings-sub-title">Available for Withdrawal</span>
              <div className="earnings-serif-amount">₦ 1,150,000</div>
              <button 
                className="btn-primary-dark btn-payout" 
                onClick={handleRequestPayout}
                disabled={payoutRequested}
              >
                <Landmark size={18} />
                <span>{payoutRequested ? 'Payout Requested' : 'Request Payout'}</span>
              </button>
            </div>
          </div>

          {/* Payout History Card */}
          <div className="dashboard-card payout-history-card">
            <div className="card-header-flex">
              <h3 className="card-heading">Payout History</h3>
              <button className="btn-link-action" onClick={() => alert('Viewing full payout logs')}>
                View All
              </button>
            </div>

            <div className="payout-history-list">
              <div className="payout-history-item">
                <div>
                  <div className="payout-bank-title">To Zenith Bank ****4567</div>
                  <div className="payout-date">Oct 12, 2024</div>
                </div>
                <div className="payout-amount-col">
                  <div className="font-mono font-bold">₦ 850,000</div>
                  <div className="payout-status-success">
                    <CheckCircle2 size={12} />
                    <span>Completed</span>
                  </div>
                </div>
              </div>

              <div className="payout-history-item">
                <div>
                  <div className="payout-bank-title">To Zenith Bank ****4567</div>
                  <div className="payout-date">Sep 28, 2024</div>
                </div>
                <div className="payout-amount-col">
                  <div className="font-mono font-bold">₦ 1,200,000</div>
                  <div className="payout-status-success">
                    <CheckCircle2 size={12} />
                    <span>Completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
