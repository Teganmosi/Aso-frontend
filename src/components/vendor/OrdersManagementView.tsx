import React, { useState, useEffect } from 'react';
import { orderApi, deliveryApi } from '../../api/client';
import type { Order, DeliveryStatus } from '../../types';
import {
  ShoppingBag, Clock, Loader, CheckCircle, User, MapPin, Truck, ChevronRight, ArrowLeft, RefreshCw, Phone
} from 'lucide-react';

interface OrdersManagementViewProps {
  onRefreshStats?: () => void;
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({ onRefreshStats }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Filtering
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PAID' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DELIVERY' | 'CANCELLED'>('ALL');
  
  // Delivery Update form states
  const [nextDeliveryStatus, setNextDeliveryStatus] = useState<string>('');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState<string | null>(null); // holds action name e.g. 'accept', 'delivery'

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await orderApi.vendorGetOrders();
      setOrders(list);
      
      // If we have a selected order, refresh its detail snapshot as well
      if (selectedOrder) {
        const updated = list.find(o => o.id === selectedOrder.id);
        if (updated) {
          setSelectedOrder(updated);
          // Set default next status based on current delivery status if available
          if (updated.delivery) {
            setNextDeliveryStatus(getDefaultNextDeliveryStatus(updated.delivery.status));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load vendor orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    loadOrders();
    if (onRefreshStats) onRefreshStats();
  };

  // Helper: check SLA countdown for PAID orders
  const getSLARemainingTime = (dueDateStr: string | null) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr).getTime();
    const now = Date.now();
    const diffMs = due - now;
    if (diffMs <= 0) return 'Expired (SLA Timeout)';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m remaining`;
  };

  // Helper: determine allowed delivery status transitions
  const getAllowedNextStatuses = (currentStatus: DeliveryStatus) => {
    const transitions: Record<DeliveryStatus, { value: DeliveryStatus; label: string }[]> = {
      PENDING: [
        { value: 'PICKED_UP', label: 'Mark Picked Up' },
        { value: 'FAILED_DELIVERY', label: 'Mark Failed Delivery' }
      ],
      PICKED_UP: [
        { value: 'IN_TRANSIT', label: 'Mark In Transit' },
        { value: 'FAILED_DELIVERY', label: 'Mark Failed Delivery' }
      ],
      IN_TRANSIT: [
        { value: 'DELIVERED', label: 'Mark Delivered' },
        { value: 'FAILED_DELIVERY', label: 'Mark Failed Delivery' }
      ],
      FAILED_DELIVERY: [
        { value: 'PICKED_UP', label: 'Mark Picked Up' },
        { value: 'IN_TRANSIT', label: 'Mark In Transit' },
        { value: 'DELIVERED', label: 'Mark Delivered' }
      ],
      DELIVERED: [] // Terminal state
    };
    return transitions[currentStatus] || [];
  };

  const getDefaultNextDeliveryStatus = (currentStatus: DeliveryStatus): string => {
    const allowed = getAllowedNextStatuses(currentStatus);
    return allowed.length > 0 ? allowed[0].value : '';
  };

  // Handler: Order Acceptance
  const handleAcceptOrder = async (orderId: string) => {
    setUpdateLoading('accept');
    try {
      await orderApi.acceptOrder(orderId);
      await loadOrders();
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to accept order.');
    } finally {
      setUpdateLoading(null);
    }
  };

  // Handler: Move to Preparing
  const handlePreparingOrder = async (orderId: string) => {
    setUpdateLoading('preparing');
    try {
      await orderApi.preparingOrder(orderId);
      await loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update order state to preparing.');
    } finally {
      setUpdateLoading(null);
    }
  };

  // Handler: Mark Ready for Pickup
  const handleReadyOrder = async (orderId: string) => {
    setUpdateLoading('ready');
    try {
      await orderApi.readyOrder(orderId);
      await loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to mark order as ready for pickup.');
    } finally {
      setUpdateLoading(null);
    }
  };

  // Handler: Update Delivery Status
  const handleUpdateDeliveryStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder?.delivery || !nextDeliveryStatus) return;
    setUpdateLoading('delivery');
    try {
      await deliveryApi.updateDeliveryStatus(
        selectedOrder.delivery.id,
        nextDeliveryStatus,
        deliveryNotes
      );
      setDeliveryNotes('');
      await loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update delivery status.');
    } finally {
      setUpdateLoading(null);
    }
  };

  // Filter Orders
  const filteredOrders = orders.filter(order => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PAID') return order.order_status === 'PAID';
    if (activeFilter === 'PREPARING') return order.order_status === 'PREPARING' || order.order_status === 'VENDOR_ACCEPTED';
    if (activeFilter === 'READY_FOR_PICKUP') return order.order_status === 'READY_FOR_PICKUP';
    if (activeFilter === 'DELIVERY') {
      const deliveryStatuses = ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'];
      return deliveryStatuses.includes(order.order_status);
    }
    if (activeFilter === 'CANCELLED') return order.order_status === 'CANCELLED' || order.order_status === 'REFUNDED';
    return true;
  });

  return (
    <div className="orders-management-view">
      <div className="dashboard-welcome-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="dashboard-serif-title">Boutique Orders</h1>
          <p className="dashboard-subtitle">Fulfill tailor-made customer requests, track manual delivery dispatches, and manage acceptance SLAs.</p>
        </div>
        <button className="btn-filter-more" onClick={handleRefresh} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <RefreshCw size={15} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Tabs Row */}
      <div className="products-filter-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
        <button className={`page-btn ${activeFilter === 'ALL' ? 'active' : ''}`} onClick={() => { setActiveFilter('ALL'); setSelectedOrder(null); }}>All Orders</button>
        <button className={`page-btn ${activeFilter === 'PAID' ? 'active' : ''}`} onClick={() => { setActiveFilter('PAID'); setSelectedOrder(null); }}>Pending Acceptance (SLA)</button>
        <button className={`page-btn ${activeFilter === 'PREPARING' ? 'active' : ''}`} onClick={() => { setActiveFilter('PREPARING'); setSelectedOrder(null); }}>In Preparation</button>
        <button className={`page-btn ${activeFilter === 'READY_FOR_PICKUP' ? 'active' : ''}`} onClick={() => { setActiveFilter('READY_FOR_PICKUP'); setSelectedOrder(null); }}>Ready for Pickup</button>
        <button className={`page-btn ${activeFilter === 'DELIVERY' ? 'active' : ''}`} onClick={() => { setActiveFilter('DELIVERY'); setSelectedOrder(null); }}>In Delivery / Completed</button>
        <button className={`page-btn ${activeFilter === 'CANCELLED' ? 'active' : ''}`} onClick={() => { setActiveFilter('CANCELLED'); setSelectedOrder(null); }}>Cancelled</button>
      </div>

      <div className="dashboard-two-column-layout" style={{ display: 'grid', gridTemplateColumns: selectedOrder ? '1.2fr 1fr' : '1fr', gap: '1.75rem', transition: 'all 0.3s ease' }}>
        {/* Left Column: Orders list table/grid */}
        <div className="dashboard-card" style={{ margin: 0 }}>
          {loading && orders.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6B7280' }}>
              <Loader size={30} className="cart-spinner" style={{ margin: '0 auto 1rem' }} />
              <p>Fetching boutique orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#6B7280' }}>
              <ShoppingBag size={40} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No orders found matching this filter.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="designer-table">
                <thead>
                  <tr>
                    <th>ORDER REFERENCE</th>
                    <th>ITEMS SUMMARY</th>
                    <th>GRAND TOTAL</th>
                    <th>STATUS / SLA</th>
                    <th style={{ textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => {
                    const slaTime = order.order_status === 'PAID' ? getSLARemainingTime(order.vendor_accept_due_by) : null;
                    const isSelected = selectedOrder?.id === order.id;
                    return (
                      <tr 
                        key={order.id} 
                        className={`clickable-row ${isSelected ? 'active-row' : ''}`}
                        onClick={() => {
                          setSelectedOrder(order);
                          if (order.delivery) {
                            setNextDeliveryStatus(getDefaultNextDeliveryStatus(order.delivery.status));
                          } else {
                            setNextDeliveryStatus('');
                          }
                          setDeliveryNotes('');
                        }}
                        style={{ cursor: 'pointer', background: isSelected ? '#F0FDF4' : '' }}
                      >
                        <td className="font-mono font-bold" style={{ fontSize: '0.85rem' }}>#{order.order_number}</td>
                        <td>
                          <div>
                            <span className="product-title-bold" style={{ fontSize: '0.85rem' }}>
                              {order.items[0]?.product_title_snapshot || 'Custom Order'}
                            </span>
                            {order.items.length > 1 && (
                              <span className="product-cell-sub" style={{ marginLeft: '4px', color: '#4B5563', fontSize: '0.75rem' }}>
                                (+{order.items.length - 1} more items)
                              </span>
                            )}
                            <div className="product-cell-sub">
                              {order.items[0]?.variant_size_snapshot} {order.items[0]?.variant_color_snapshot ? `/ ${order.items[0]?.variant_color_snapshot}` : ''}
                            </div>
                          </div>
                        </td>
                        <td className="font-mono font-bold">
                          ₦{order.total_amount_naira ? order.total_amount_naira.toLocaleString() : (order.total_amount_kobo / 100).toLocaleString()}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span className={`status-pill status-${order.order_status.toLowerCase()}`}>
                              {order.order_status.replace(/_/g, ' ')}
                            </span>
                            {slaTime && (
                              <span className="sla-time-indicator" style={{ fontSize: '0.725rem', color: slaTime.includes('Expired') ? '#DC2626' : '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Clock size={12} /> {slaTime}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                          <button className="icon-action-btn" title="View details">
                            <ChevronRight size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Active Order Details panel */}
        {selectedOrder && (
          <div className="dashboard-card" style={{ margin: 0, padding: '1.75rem', position: 'sticky', top: '150px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <h3 className="card-heading" style={{ margin: 0 }}>Order Reference</h3>
              <button 
                className="btn-back-to-orders" 
                onClick={() => setSelectedOrder(null)} 
                style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem' }}
              >
                <ArrowLeft size={14} /> Close details
              </button>
            </div>

            <div className="order-details-scrollable-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.25rem' }}>
              <div>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>ORDER REFERENCE</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="font-mono font-bold" style={{ fontSize: '1.1rem' }}>#{selectedOrder.order_number}</span>
                  <span className={`status-pill status-${selectedOrder.order_status.toLowerCase()}`}>
                    {selectedOrder.order_status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              {/* Fulfill action controls based on order state */}
              <div style={{ padding: '1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#475569', fontWeight: 700 }}>FULFILLMENT WORKFLOW ACTIONS</p>
                
                {selectedOrder.order_status === 'PAID' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.775rem', color: '#64748B' }}>
                      Accept this order to confirm you can prepare it within your specified deadline.
                    </p>
                    <button
                      className="btn-primary-dark"
                      onClick={() => handleAcceptOrder(selectedOrder.id)}
                      disabled={updateLoading === 'accept'}
                    >
                      {updateLoading === 'accept' ? 'Accepting...' : 'Accept Order'}
                    </button>
                  </div>
                )}

                {selectedOrder.order_status === 'VENDOR_ACCEPTED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.775rem', color: '#64748B' }}>
                      Advance order to "Preparing" state once your tailoring workshop has started production.
                    </p>
                    <button
                      className="btn-primary-dark"
                      onClick={() => handlePreparingOrder(selectedOrder.id)}
                      disabled={updateLoading === 'preparing'}
                    >
                      {updateLoading === 'preparing' ? 'Updating...' : 'Start Tailoring (Preparing)'}
                    </button>
                  </div>
                )}

                {selectedOrder.order_status === 'PREPARING' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.775rem', color: '#64748B' }}>
                      Mark order as ready once tailoring is complete and the package is ready for courier pickup.
                    </p>
                    <button
                      className="btn-primary-emerald"
                      onClick={() => handleReadyOrder(selectedOrder.id)}
                      disabled={updateLoading === 'ready'}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {updateLoading === 'ready' ? 'Updating...' : 'Mark Ready for Pickup'}
                    </button>
                  </div>
                )}

                {/* Delivery dispatcher controls */}
                {selectedOrder.delivery ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderBottom: '1px solid #CBD5E1', paddingBottom: '0.4rem' }}>
                      <Truck size={16} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#334155' }}>Delivery Tracker (Manual Dispatch)</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <p><strong>Tracking Number:</strong> <code className="font-mono">{selectedOrder.delivery.tracking_number}</code></p>
                      <p><strong>Current Status:</strong> <span className={`status-pill status-${selectedOrder.delivery.status.toLowerCase()}`}>{selectedOrder.delivery.status_display}</span></p>
                      {selectedOrder.delivery.dispatch_notes && (
                        <p><strong>Notes:</strong> {selectedOrder.delivery.dispatch_notes}</p>
                      )}
                    </div>

                    {selectedOrder.delivery.status !== 'DELIVERED' ? (
                      <form onSubmit={handleUpdateDeliveryStatus} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.725rem' }}>TRANSITION STATUS</label>
                          <select
                            className="input-field"
                            style={{ padding: '0.45rem', fontSize: '0.8rem' }}
                            value={nextDeliveryStatus}
                            onChange={e => setNextDeliveryStatus(e.target.value)}
                            required
                          >
                            {getAllowedNextStatuses(selectedOrder.delivery.status).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.725rem' }}>TRANSITION NOTES (OPTIONAL)</label>
                          <input
                            className="input-field"
                            style={{ padding: '0.45rem', fontSize: '0.8rem' }}
                            value={deliveryNotes}
                            onChange={e => setDeliveryNotes(e.target.value)}
                            placeholder="e.g. Courier picked up package"
                          />
                        </div>
                        <button
                          type="submit"
                          className="btn-primary-dark"
                          style={{ padding: '0.5rem', fontSize: '0.8rem' }}
                          disabled={updateLoading === 'delivery' || !nextDeliveryStatus}
                        >
                          {updateLoading === 'delivery' ? 'Updating Status...' : 'Apply Status Update'}
                        </button>
                      </form>
                    ) : (
                      <div style={{ backgroundColor: '#D1FAE5', border: '1px solid #10B981', padding: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#065F46', fontSize: '0.775rem' }}>
                        <CheckCircle size={15} />
                        <span>Delivery finalized. Terminal state reached.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  selectedOrder.order_status === 'READY_FOR_PICKUP' && (
                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#FEF3C7', padding: '0.5rem', borderRadius: '4px' }}>
                      <Clock size={15} style={{ color: '#D97706', flexShrink: 0 }} />
                      <span>Fulfillment is pending courier assignment. Manual dispatch tracking record is created. Please refresh if needed.</span>
                    </div>
                  )
                )}

                {/* Unpaid warning */}
                {selectedOrder.order_status === 'PENDING_PAYMENT' && (
                  <p style={{ margin: 0, fontSize: '0.775rem', color: '#D97706', fontWeight: 600 }}>
                    ⚠️ This order is awaiting payment confirmation. You cannot perform actions until it is PAID.
                  </p>
                )}
              </div>

              {/* Items details summary */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>ORDER ITEMS</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedOrder.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.85rem' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.product_title_snapshot}</p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#6B7280' }}>
                          Size: {item.variant_size_snapshot} {item.variant_color_snapshot ? ` / Color: ${item.variant_color_snapshot}` : ''} • Qty: {item.quantity}
                        </p>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#9CA3AF' }}>SKU: {item.sku_snapshot}</p>
                      </div>
                      <span className="font-mono font-bold" style={{ flexShrink: 0 }}>₦{(item.total_price_naira || item.total_price_kobo / 100).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer and shipping snapshots */}
              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: '#6B7280', fontWeight: 700, letterSpacing: '0.04em' }}>DELIVERY CUSTOMER DETAILS</p>
                <div style={{ background: '#FAFAFA', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '1rem', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563' }}>
                    <User size={14} />
                    <strong>{selectedOrder.shipping_address_snapshot.full_name}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563' }}>
                    <MapPin size={14} />
                    <span>{selectedOrder.shipping_address_snapshot.street_address}, {selectedOrder.shipping_address_snapshot.city}, {selectedOrder.shipping_address_snapshot.state}</span>
                  </div>
                  {selectedOrder.shipping_address_snapshot.phone_number && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#4B5563' }}>
                      <Phone size={14} />
                      <span>{selectedOrder.shipping_address_snapshot.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
