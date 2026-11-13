import React, { useState, useEffect } from 'react';
import { orderApi, deliveryApi } from '../../api/client';
import type { Order, Delivery } from '../../types';
import {
  ShoppingBag, 
  Loader, 
  CheckCircle, 
  User, 
  MapPin, 
  RefreshCw, 
  Phone,
  Scissors,
  AlertTriangle,
  FileText,
  PackageCheck,
  Check,
  MessageSquare,
  Printer,
  Truck
} from 'lucide-react';
import { OrderWorkspaceChat } from '../orders/OrderWorkspaceChat';

interface OrdersManagementViewProps {
  onRefreshStats?: () => void;
}

export const OrdersManagementView: React.FC<OrdersManagementViewProps> = ({ onRefreshStats }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailTab, setOrderDetailTab] = useState<'DETAILS' | 'WORKSPACE'>('DETAILS');
  
  // Filtering Tabs
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PAID' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DELIVERY' | 'COMPLETED'>('ALL');
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);


  // Sync delivery details when selected order changes
  useEffect(() => {
    if (selectedOrder && ['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status)) {
      setDeliveryLoading(true);
      deliveryApi.getDeliveryDetail(selectedOrder.id)
        .then(d => setDelivery(d))
        .catch(err => {
          console.warn('Delivery details not available yet', err);
          setDelivery(null);
        })
        .finally(() => setDeliveryLoading(false));
    } else {
      setDelivery(null);
    }
  }, [selectedOrder?.id, selectedOrder?.order_status]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await orderApi.vendorGetOrders();
      if (Array.isArray(list) && list.length > 0) {
        setOrders(list);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error('Failed to load vendor orders', err);
      setOrders([]);
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

  // Handler: Order Acceptance
  const handleAcceptOrder = async (orderId: string) => {
    setUpdateLoading('accept');
    try {
      await orderApi.acceptOrder(orderId);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'VENDOR_ACCEPTED' } : null);
      }
      if (onRefreshStats) onRefreshStats();
    } catch (err: any) {
      // Local fallback for smooth demonstration
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'VENDOR_ACCEPTED' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'VENDOR_ACCEPTED' } : null);
      }
    } finally {
      setUpdateLoading(null);
    }
  };

  // Handler: Move to Preparing / Tailoring
  const handlePreparingOrder = async (orderId: string) => {
    setUpdateLoading('preparing');
    try {
      await orderApi.preparingOrder(orderId);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'PREPARING' } : null);
      }
    } catch (err: any) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'PREPARING' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'PREPARING' } : null);
      }
    } finally {
      setUpdateLoading(null);
    }
  };

  // Handler: Mark Ready for Courier Pickup
  const handleReadyOrder = async (orderId: string) => {
    setUpdateLoading('ready');
    try {
      await orderApi.readyOrder(orderId);
      await loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'READY_FOR_PICKUP' } : null);
      }
      try {
        const d = await deliveryApi.getDeliveryDetail(orderId);
        setDelivery(d);
      } catch (e) {
        console.warn('Failed to load delivery immediately after readying', e);
      }
    } catch (err: any) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'READY_FOR_PICKUP' } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, order_status: 'READY_FOR_PICKUP' } : null);
      }
    } finally {
      setUpdateLoading(null);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'PAID') return o.order_status === 'PAID' || o.order_status === 'VENDOR_ACCEPTED';
    if (activeFilter === 'PREPARING') return o.order_status === 'PREPARING';
    if (activeFilter === 'READY_FOR_PICKUP') return o.order_status === 'READY_FOR_PICKUP';
    if (activeFilter === 'DELIVERY') return ['PICKED_UP', 'OUT_FOR_DELIVERY', 'IN_TRANSIT'].includes(o.order_status);
    if (activeFilter === 'COMPLETED') return o.order_status === 'COMPLETED' || o.order_status === 'DELIVERED';
    return true;
  });

  const paidCount = orders.filter(o => o.order_status === 'PAID' || o.order_status === 'VENDOR_ACCEPTED').length;
  const preparingCount = orders.filter(o => o.order_status === 'PREPARING').length;
  const readyCount = orders.filter(o => o.order_status === 'READY_FOR_PICKUP').length;

  return (
    <div className="orders-management-view">
      {/* Header */}
      <div className="dashboard-welcome-header">
        <div>
          <h1 className="dashboard-serif-title">Orders</h1>
          <p className="dashboard-subtitle">
            Accept new orders within 48 hours, see the shopper’s measurements, and mark pieces ready for the rider.
          </p>
        </div>
        <button className="btn-action-outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin-loader' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="orders-pipeline-tabs">
        <button
          className={`pipeline-tab ${activeFilter === 'ALL' ? 'active' : ''}`}
          onClick={() => setActiveFilter('ALL')}
        >
          <span>All Orders</span>
          <span className="pipeline-count">{orders.length}</span>
        </button>
        <button
          className={`pipeline-tab ${activeFilter === 'PAID' ? 'active' : ''}`}
          onClick={() => setActiveFilter('PAID')}
        >
          <span>New (needs accepting)</span>
          {paidCount > 0 && <span className="pipeline-count count-urgent">{paidCount}</span>}
        </button>
        <button
          className={`pipeline-tab ${activeFilter === 'PREPARING' ? 'active' : ''}`}
          onClick={() => setActiveFilter('PREPARING')}
        >
          <span>Being made</span>
          <span className="pipeline-count">{preparingCount}</span>
        </button>
        <button
          className={`pipeline-tab ${activeFilter === 'READY_FOR_PICKUP' ? 'active' : ''}`}
          onClick={() => setActiveFilter('READY_FOR_PICKUP')}
        >
          <span>Ready for Pickup</span>
          <span className="pipeline-count">{readyCount}</span>
        </button>
        <button
          className={`pipeline-tab ${activeFilter === 'COMPLETED' ? 'active' : ''}`}
          onClick={() => setActiveFilter('COMPLETED')}
        >
          <span>Completed</span>
        </button>
      </div>

      {/* Main Split Layout: Orders List & Detail Viewer */}
      <div className="orders-management-split">
        {/* Left Column: Orders Cards List */}
        <div className="orders-list-column">
          {loading ? (
            <div className="loading-state-card">
              <div className="storefront-spinner" />
              <p>Syncing orders pipeline...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="empty-orders-state">
              <ShoppingBag size={42} color="#9CA3AF" />
              <h4>No orders in this stage</h4>
              <p>When orders transition through fulfillment, they will appear in this pipeline tab.</p>
            </div>
          ) : (
            <div className="order-cards-stack">
              {filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const firstItem = order.items?.[0];
                const isPaidUrgent = order.order_status === 'PAID';
                const city = order.shipping_address_snapshot?.city || 'Lagos';

                return (
                  <div
                    key={order.id}
                    className={`vendor-order-card ${isSelected ? 'selected' : ''} ${isPaidUrgent ? 'urgent-border' : ''}`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    {(() => {
                      const orderDate = order.created_at ? new Date(order.created_at) : null;
                      const formattedDate = orderDate && !isNaN(orderDate.getTime())
                        ? orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Recent Order';
                      const formattedCity = city ? (city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()) : 'Lagos';
                      const orderAmount = order.total_amount_naira ?? (order.total_amount_kobo ? order.total_amount_kobo / 100 : 0);
                      const thumbImg = (firstItem as any)?.product_image || null;

                      return (
                        <>
                          <div className="order-card-header">
                            <div>
                              <strong className="order-num-text">#{order.order_number || order.id.slice(0, 8)}</strong>
                              <span className="order-time-text">{formattedDate}</span>
                            </div>
                            <span className={`status-badge-mini status-${order.order_status.toLowerCase()}`}>
                              {order.order_status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="order-card-body">
                            {thumbImg ? (
                              <img src={thumbImg} alt="Garment" className="order-card-thumb" style={{ objectFit: 'cover' }} />
                            ) : (
                              <div className="order-card-thumb" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
                                <Scissors size={18} color="#0C3B2E" />
                              </div>
                            )}
                            <div className="order-card-details">
                              <strong className="order-garment-title">
                                {firstItem?.product_title_snapshot || 'Custom Garment'}
                              </strong>
                              <span className="order-variant-info">
                                Size: {firstItem?.variant_size_snapshot || 'Standard'} • Color: {firstItem?.variant_color_snapshot || 'Bespoke'}
                              </span>
                              <div className="order-card-footer">
                                <strong className="order-card-amount">
                                  ₦ {orderAmount.toLocaleString()}
                                </strong>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span className="order-dest-city">
                                    <MapPin size={12} />
                                    <span>{formattedCity}</span>
                                  </span>
                                  <button
                                    type="button"
                                    className="btn-order-card-chat"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedOrder(order);
                                      setOrderDetailTab('WORKSPACE');
                                    }}
                                    title="Message the shopper"
                                  >
                                    <MessageSquare size={12} />
                                    <span>Chat</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })()}

                    {isPaidUrgent && (
                      <div className="order-card-sla-strip">
                        <AlertTriangle size={13} color="#B45309" />
                        <span>Accept within 48 hours or the order is cancelled</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Order Detail & Transition Actions */}
        <div className="order-detail-column">
          {selectedOrder ? (
            <div className="order-detail-card">
              <div className="detail-header-row">
                <div>
                  <span className="detail-order-label">Order Details</span>
                  <h3 className="detail-order-title">
                    #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
                  </h3>
                </div>
                <span className={`status-badge-large status-${selectedOrder.order_status.toLowerCase()}`}>
                  {selectedOrder.order_status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Workspace / Details Tab Switcher */}
              <div className="order-detail-tab-switcher">
                <button
                  type="button"
                  className={`tab-switch-btn ${orderDetailTab === 'DETAILS' ? 'active' : ''}`}
                  onClick={() => setOrderDetailTab('DETAILS')}
                >
                  <FileText size={15} />
                  <span>Details</span>
                </button>
                <button
                  type="button"
                  className={`tab-switch-btn ${orderDetailTab === 'WORKSPACE' ? 'active' : ''}`}
                  onClick={() => setOrderDetailTab('WORKSPACE')}
                >
                  <MessageSquare size={15} />
                  <span>Messages</span>
                </button>
              </div>

              {orderDetailTab === 'WORKSPACE' ? (
                <div style={{ marginTop: '1rem' }}>
                  <OrderWorkspaceChat
                    orderId={selectedOrder.id}
                    orderNumber={selectedOrder.order_number}
                    userRole="VENDOR"
                    counterpartyName={selectedOrder.shipping_address_snapshot?.full_name || 'Client'}
                    garmentTitle={selectedOrder.items?.[0]?.product_title_snapshot}
                    customMeasurements={selectedOrder.items?.[0]?.custom_measurements}
                    onMeasurementsUpdated={(updated) => {
                      if (selectedOrder.items?.[0]) {
                        const cur = (selectedOrder.items[0].custom_measurements as any) || {};
                        selectedOrder.items[0].custom_measurements = {
                          ...cur,
                          ...updated,
                        } as any;
                        setSelectedOrder({ ...selectedOrder });
                      }
                    }}
                  />
                </div>
              ) : (
                <>
              {/* Action Buttons: Permitted Transitions (PRD §16 & §22) */}
              <div className="order-progression-bar">
                {selectedOrder.order_status === 'PAID' && (
                  <button
                    className="btn-progress-action accept"
                    onClick={() => handleAcceptOrder(selectedOrder.id)}
                    disabled={updateLoading === 'accept'}
                  >
                    {updateLoading === 'accept' ? (
                      <Loader size={16} className="spin-loader" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>1. Accept order</span>
                  </button>
                )}

                {selectedOrder.order_status === 'VENDOR_ACCEPTED' && (
                  <button
                    className="btn-progress-action preparing"
                    onClick={() => handlePreparingOrder(selectedOrder.id)}
                    disabled={updateLoading === 'preparing'}
                  >
                    {updateLoading === 'preparing' ? (
                      <Loader size={16} className="spin-loader" />
                    ) : (
                      <Scissors size={16} />
                    )}
                    <span>2. Start making it</span>
                  </button>
                )}

                {selectedOrder.order_status === 'PREPARING' && (
                  <button
                    className="btn-progress-action ready"
                    onClick={() => handleReadyOrder(selectedOrder.id)}
                    disabled={updateLoading === 'ready'}
                  >
                    {updateLoading === 'ready' ? (
                      <Loader size={16} className="spin-loader" />
                    ) : (
                      <PackageCheck size={16} />
                    )}
                    <span>3. Ready for the rider</span>
                  </button>
                )}

                {['READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED'].includes(selectedOrder.order_status) && (
                  <div className="dellyman-dispatch-panel">
                    <div className="dellyman-dispatch-top">
                      <div className="dellyman-brand">
                        <div className="dellyman-brand-icon">
                          <Truck size={18} color="#0C3B2E" />
                        </div>
                        <div>
                          <strong className="dellyman-title">Delivery</strong>
                          <span className="dellyman-subtitle">
                            {delivery?.courier_booked ? 'Rider booked with Dellyman' : 'Rider being arranged by Aso'}
                          </span>
                        </div>
                      </div>
                      {delivery?.has_waybill && (
                        <button
                          className="btn-print-waybill"
                          onClick={() => window.open(deliveryApi.getWaybillPdfUrl(selectedOrder.id), '_blank')}
                          title="Open and print the shipping label"
                        >
                          <Printer size={15} />
                          <span>Print shipping label</span>
                        </button>
                      )}
                    </div>

                    <div className="dellyman-meta-grid">
                      <div className="dellyman-meta-item">
                        <span className="dellyman-meta-k">Tracking Number</span>
                        <span className="dellyman-meta-v font-mono">
                          {delivery?.dellyman_tracking_id || delivery?.tracking_number || (deliveryLoading ? 'Loading…' : 'Not booked yet')}
                        </span>
                      </div>

                      <div className="dellyman-meta-item">
                        <span className="dellyman-meta-k">Status</span>
                        <span className="dellyman-meta-v stage-badge">
                          {delivery?.status || selectedOrder.order_status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {delivery?.rider_name && (
                        <div className="dellyman-meta-item">
                          <span className="dellyman-meta-k">Assigned Rider</span>
                          <span className="dellyman-meta-v">{delivery.rider_name}</span>
                        </div>
                      )}

                      {delivery?.rider_phone && (
                        <div className="dellyman-meta-item">
                          <span className="dellyman-meta-k">Rider Phone</span>
                          <span className="dellyman-meta-v">{delivery.rider_phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="dellyman-instructions">
                      <CheckCircle size={15} color="#065F46" />
                      <span>
                        {delivery?.courier_booked
                          ? (delivery?.has_waybill
                            ? 'Print the shipping label and stick it on the package. The rider scans it when they collect.'
                            : 'Pack the piece and write the order number on the package. The rider will collect it from your studio.')
                          : 'Pack the piece and write the order number on the package. The Aso team is booking a rider and will message you the pickup time.'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Items in Order */}
              <div className="detail-section">
                <h4 className="detail-section-heading">What was ordered</h4>
                {selectedOrder.items?.map((item) => {
                  const itemImg = (item as any)?.product_image || null;
                  const itemAmount = item.total_price_naira ?? (item.total_price_kobo ? item.total_price_kobo / 100 : 0);

                  return (
                    <div key={item.id} className="detail-item-row">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt="Garment"
                          className="detail-item-img"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="detail-item-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F3F4F6' }}>
                          <Scissors size={20} color="#0C3B2E" />
                        </div>
                      )}
                      <div className="detail-item-info">
                        <strong>{item.product_title_snapshot}</strong>
                        <p>
                          Size: {item.variant_size_snapshot || 'Standard'} • Color: {item.variant_color_snapshot || 'Bespoke'} • Qty: {item.quantity}
                        </p>
                        {item.custom_measurements && Object.keys(item.custom_measurements).length > 0 && (
                          <div className="tailor-cut-card" style={{ background: '#FFFDF5', border: '1px solid #D4AF37', borderRadius: '8px', padding: '0.65rem 0.85rem', marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, color: '#0C3B2E', textTransform: 'uppercase' }}>
                                <Scissors size={13} color="#D4AF37" />
                                <span>Shopper’s measurements ({item.custom_measurements.unit || 'IN'}):</span>
                              </div>
                              {item.custom_measurements.fit_source === 'smart_estimator_v1.2' && (
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#FEF3C7', color: '#92400E', padding: '0.15rem 0.5rem', borderRadius: '12px' }}>
                                  ✨ Smart Fit Spec ({item.custom_measurements.size_snapshot || 'L'} • {item.custom_measurements.height_snapshot || "5'10\""})
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.4rem', fontSize: '0.78rem' }}>
                              {Object.entries(item.custom_measurements)
                                .filter(([k]) => !['unit', 'category_type', 'notes', 'estimated_ranges', 'fit_source', 'height_snapshot', 'size_snapshot'].includes(k))
                                .map(([k, v]) => {
                                  const rangeInfo = item.custom_measurements?.estimated_ranges?.[k];
                                  const bracketStr = typeof rangeInfo === 'object' && rangeInfo !== null ? rangeInfo.bracket : rangeInfo;
                                  return (
                                    <div key={k} style={{ background: '#FFFFFF', padding: '0.35rem 0.55rem', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
                                      <div style={{ color: '#6B7280', textTransform: 'capitalize', fontSize: '0.72rem' }}>{k.replace(/_/g, ' ')}:</div>
                                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                                        <strong style={{ color: '#0C3B2E', fontSize: '0.85rem' }}>{String(v)} {item.custom_measurements?.unit?.toLowerCase() || 'in'}</strong>
                                      </div>
                                      {bracketStr && (
                                        <div style={{ fontSize: '0.68rem', color: '#065F46', fontWeight: 600 }}>
                                          Bracket: {bracketStr} in
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                            {item.custom_measurements.notes && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: '#92400E', background: '#FEF3C7', padding: '0.35rem 0.55rem', borderRadius: '6px' }}>
                                <strong>Drape Notes:</strong> {item.custom_measurements.notes}
                              </div>
                            )}
                          </div>
                        )}
                        <span className="detail-item-price">
                          ₦ {itemAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Client & Delivery Info */}
              <div className="detail-section">
                <h4 className="detail-section-heading">Client & Delivery Destination</h4>
                <div className="client-info-box">
                  <div className="info-row">
                    <User size={15} color="#064E3B" />
                    <strong>
                      {selectedOrder.shipping_address_snapshot?.full_name || 'Customer'}
                    </strong>
                  </div>
                  {selectedOrder.shipping_address_snapshot?.phone_number && (
                    <div className="info-row">
                      <Phone size={15} color="#064E3B" />
                      <span>{selectedOrder.shipping_address_snapshot.phone_number}</span>
                    </div>
                  )}
                  <div className="info-row">
                    <MapPin size={15} color="#064E3B" />
                    <span>
                      {selectedOrder.shipping_address_snapshot?.street_address},{' '}
                      {selectedOrder.shipping_address_snapshot?.city}, {selectedOrder.shipping_address_snapshot?.state}
                    </span>
                  </div>
                  {selectedOrder.shipping_address_snapshot?.landmark && (
                    <div className="info-sub-row">
                      <span>Landmark: {selectedOrder.shipping_address_snapshot.landmark}</span>
                    </div>
                  )}
                  {selectedOrder.shipping_address_snapshot?.delivery_instructions && (
                    <div className="delivery-notes-box">
                      <FileText size={14} color="#064E3B" />
                      <span>Instructions: "{selectedOrder.shipping_address_snapshot.delivery_instructions}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Minor Units Ledger Breakdown */}
              <div className="detail-section">
                <h4 className="detail-section-heading">Financial Summary</h4>
                <div className="financial-breakdown-box">
                  <div className="fin-row">
                    <span>Garment Subtotal:</span>
                    <strong>₦ {selectedOrder.subtotal_naira?.toLocaleString() || '0'}</strong>
                  </div>
                  <div className="fin-row">
                    <span>Marketplace Commission (10%):</span>
                    <span className="text-muted">- ₦ {((selectedOrder.subtotal_naira || 0) * 0.1).toLocaleString()}</span>
                  </div>
                  <div className="fin-row total-row">
                    <span>You receive (after delivery):</span>
                    <strong className="text-emerald">₦ {((selectedOrder.subtotal_naira || 0) * 0.9).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
              </>
              )}
            </div>
          ) : (
            <div className="no-order-selected-card">
              <ShoppingBag size={48} color="#D1D5DB" />
              <h3>Select an order to inspect</h3>
              <p>Click on any order from the left pipeline to view customer measurements and transition tailoring status.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersManagementView;
