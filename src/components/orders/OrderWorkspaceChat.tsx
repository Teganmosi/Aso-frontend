import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  ShieldCheck,
  AlertTriangle,
  Scissors,
  CheckCircle2,
  RefreshCw,
  X,
  Info
} from 'lucide-react';
import { orderChatApi } from '../../api/client';
import type { OrderMessage } from '../../types';
import './OrderWorkspaceChat.css';

interface OrderWorkspaceChatProps {
  orderId: string;
  orderNumber: string;
  userRole: 'CUSTOMER' | 'VENDOR';
  counterpartyName: string;
  garmentTitle?: string;
  customMeasurements?: Record<string, any> | null;
  onMeasurementsUpdated?: (updatedMeasurements: Record<string, any>) => void;
  onClose?: () => void;
}

export const OrderWorkspaceChat: React.FC<OrderWorkspaceChatProps> = ({
  orderId,
  orderNumber,
  userRole,
  counterpartyName,
  garmentTitle,
  customMeasurements: _initialMeasurements,
  onMeasurementsUpdated,
  onClose,
}) => {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // 1-Tap Action State
  const [recheckModal, setRecheckModal] = useState<{ key: string; label: string } | null>(null);
  const [recheckPrompt, setRecheckPrompt] = useState('');
  const [actionDispatching, setActionDispatching] = useState(false);

  // Resolving action state (Customer side)
  const [resolvingMsgId, setResolvingMsgId] = useState<string | null>(null);
  const [resolveValue, setResolveValue] = useState('');
  const [resolveLoading, setResolveLoading] = useState(false);

  const feedContainerRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const isNearBottomRef = useRef(true);

  // Internal container scroll only - NEVER scrolls parent page or window
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (feedContainerRef.current) {
      feedContainerRef.current.scrollTo({
        top: feedContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  // Track if user is currently scrolled near the bottom
  const handleFeedScroll = () => {
    if (!feedContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = feedContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
  };

  const loadMessages = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await orderChatApi.getMessages(orderId);
      setMessages((prev) => {
        // Deep compare to prevent unnecessary re-renders and auto-scroll jumps
        if (
          prev.length === data.length &&
          prev.length > 0 &&
          prev[prev.length - 1].id === data[data.length - 1]?.id
        ) {
          return prev; // Identical: keep same object reference
        }

        // If new message arrived and user is near bottom, smoothly scroll
        const hasNewMessages = data.length > prev.length;
        if (hasNewMessages && isNearBottomRef.current && !isInitialLoadRef.current) {
          setTimeout(() => scrollToBottom('smooth'), 50);
        }

        return data;
      });
    } catch (err) {
      console.error('Failed to load order messages', err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    isInitialLoadRef.current = true;
    loadMessages().then(() => {
      // Instant scroll on initial load without animation jerk
      setTimeout(() => {
        scrollToBottom('auto');
        isInitialLoadRef.current = false;
      }, 60);
    });

    const interval = setInterval(() => {
      loadMessages(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const newMsg = await orderChatApi.sendMessage(orderId, text);
      setMessages((prev) => [...prev, newMsg]);
      setInputText('');
      setTimeout(() => scrollToBottom('smooth'), 50);
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleDispatchActionRequest = async () => {
    if (!recheckModal || actionDispatching) return;
    setActionDispatching(true);
    try {
      const newMsg = await orderChatApi.requestMeasurementRecheck(orderId, {
        measurement_key: recheckModal.key,
        label: recheckModal.label,
        prompt: recheckPrompt.trim() || undefined,
      });
      setMessages((prev) => [...prev, newMsg]);
      setRecheckModal(null);
      setRecheckPrompt('');
    } catch (err) {
      console.error('Failed to dispatch action request', err);
    } finally {
      setActionDispatching(false);
    }
  };

  const handleResolveAction = async (msg: OrderMessage) => {
    if (!resolveValue.trim() || resolveLoading) return;
    setResolveLoading(true);
    try {
      const key = msg.action_payload?.measurement_key || 'measurement';
      const auditMsg = await orderChatApi.resolveMeasurement(orderId, {
        message_id: msg.id,
        measurement_key: key,
        new_value: resolveValue.trim(),
      });
      
      // Update local state
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === msg.id && m.action_payload) {
            return {
              ...m,
              action_payload: {
                ...m.action_payload,
                status: 'RESOLVED' as const,
                resolved_value: resolveValue.trim(),
              },
            };
          }
          return m;
        }).concat(auditMsg)
      );

      if (onMeasurementsUpdated) {
        onMeasurementsUpdated({ [key]: resolveValue.trim() });
      }

      setResolvingMsgId(null);
      setResolveValue('');
    } catch (err) {
      console.error('Failed to resolve measurement', err);
    } finally {
      setResolveLoading(false);
    }
  };

  return (
    <div className="order-workspace-container">
      {/* Workspace Header */}
      <div className="workspace-header">
        <div className="header-info">
          <div className="counterparty-badge">
            <span className="dot-live" />
            <strong>{counterpartyName}</strong>
            <span className="role-tag">{userRole === 'VENDOR' ? 'CLIENT' : 'ATELIER DESIGNER'}</span>
          </div>
          <p className="order-context-line">
            Order #{orderNumber} {garmentTitle ? `• ${garmentTitle}` : ''}
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn-refresh-chat"
            onClick={() => loadMessages()}
            title="Refresh conversation"
          >
            <RefreshCw size={15} />
          </button>
          {onClose && (
            <button
              type="button"
              className="btn-close-workspace"
              onClick={onClose}
              title="Close Workspace"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Escrow Guarantee Security Banner */}
      <div className="workspace-escrow-banner">
        <ShieldCheck size={18} className="shield-icon" />
        <div className="escrow-text">
          <strong>Aso Escrow Protected Workspace:</strong>
          <span> Funds and garments are insured until verified delivery. Off-platform contacts &amp; bank accounts are strictly masked.</span>
        </div>
      </div>

      {/* Quick Actions (Vendor / Designer Only) */}
      {userRole === 'VENDOR' && (
        <div className="designer-quick-actions-bar">
          <span className="qa-label"><Scissors size={12} /> Tailor Verification Tools:</span>
          <div className="qa-chips">
            <button
              type="button"
              className="qa-btn"
              onClick={() => {
                setRecheckModal({ key: 'waist', label: 'Waist Circumference' });
                setRecheckPrompt('Please double-check your waist measurement before we cut the lining.');
              }}
            >
              📏 Request Waist Check
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => {
                setRecheckModal({ key: 'chest_bust', label: 'Bust / Chest' });
                setRecheckPrompt('Please re-verify your bust/chest measurement for optimum silhouette drape.');
              }}
            >
              📏 Request Bust Check
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => {
                setRecheckModal({ key: 'hips', label: 'Hips' });
                setRecheckPrompt('Please confirm your hip measurement to ensure comfortable ease.');
              }}
            >
              📏 Request Hips Check
            </button>
            <button
              type="button"
              className="qa-btn"
              onClick={() => {
                setRecheckModal({ key: 'full_length', label: 'Garment Length' });
                setRecheckPrompt('Please confirm your desired finished length from shoulder to hem.');
              }}
            >
              📏 Request Length Check
            </button>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div 
        ref={feedContainerRef} 
        className="workspace-messages-feed"
        onScroll={handleFeedScroll}
      >
        {loading ? (
          <div className="chat-loading-state">
            <RefreshCw size={24} className="spin-icon" />
            <p>Loading Atelier Workspace...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty-state">
            <ShieldCheck size={36} color="#D4AF37" />
            <h4>Welcome to the Atelier Workspace</h4>
            <p>
              Clarify lining choices, drape preferences, or measurement specifications directly with{' '}
              {counterpartyName}.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn =
              (userRole === 'VENDOR' && msg.sender_role === 'VENDOR') ||
              (userRole === 'CUSTOMER' && msg.sender_role === 'CUSTOMER');

            if (msg.message_type === 'SYSTEM_AUDIT') {
              return (
                <div key={msg.id} className="chat-system-audit-pill">
                  <CheckCircle2 size={13} color="#059669" />
                  <span>{msg.content}</span>
                </div>
              );
            }

            if (msg.message_type === 'ACTION_REQUEST') {
              const payload = msg.action_payload || {};
              const isResolved = payload.status === 'RESOLVED';

              return (
                <div
                  key={msg.id}
                  className={`chat-action-card ${isResolved ? 'resolved' : 'pending'}`}
                >
                  <div className="action-card-header">
                    <div className="action-card-title">
                      <Scissors size={15} color="#D4AF37" />
                      <strong>Tailor Specification Verification: {payload.label || payload.measurement_key}</strong>
                    </div>
                    {isResolved ? (
                      <span className="action-status-badge resolved">
                        <CheckCircle2 size={12} /> Resolved
                      </span>
                    ) : (
                      <span className="action-status-badge pending">
                        <Info size={12} /> Action Required
                      </span>
                    )}
                  </div>
                  
                  <p className="action-card-prompt">"{msg.content}"</p>

                  <div className="action-card-meta">
                    <span>Cut sheet reference: <strong>{payload.current_value || 'Not set'} {payload.unit || 'IN'}</strong></span>
                  </div>

                  {/* Customer Resolution Form */}
                  {!isResolved && userRole === 'CUSTOMER' && (
                    <div className="action-card-resolve-box">
                      {resolvingMsgId === msg.id ? (
                        <div className="action-inline-form">
                          <input
                            type="text"
                            className="action-input-val"
                            placeholder={`Enter ${payload.label || 'measurement'} (${payload.unit || 'IN'})`}
                            value={resolveValue}
                            onChange={(e) => setResolveValue(e.target.value)}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-confirm-action"
                            disabled={resolveLoading || !resolveValue.trim()}
                            onClick={() => handleResolveAction(msg)}
                          >
                            {resolveLoading ? 'Updating...' : 'Confirm & Sync'}
                          </button>
                          <button
                            type="button"
                            className="btn-cancel-action"
                            onClick={() => setResolvingMsgId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn-trigger-resolve"
                          onClick={() => {
                            setResolvingMsgId(msg.id);
                            setResolveValue(payload.current_value || '');
                          }}
                        >
                          ✏️ Update &amp; Confirm Measurement
                        </button>
                      )}
                    </div>
                  )}

                  {isResolved && payload.resolved_value && (
                    <div className="action-resolved-summary">
                      ✓ Confirmed at <strong>{payload.resolved_value} {payload.unit || 'IN'}</strong>. Cut sheet updated in atelier records.
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`chat-bubble-row ${isOwn ? 'own' : 'peer'}`}
              >
                <div className={`chat-bubble ${isOwn ? 'own' : 'peer'} ${msg.is_masked ? 'masked' : ''}`}>
                  <div className="chat-bubble-author">
                    {msg.sender_name}
                    {msg.is_masked && (
                      <span className="security-shield-flag" title="Anti-Bypass Shield Intervened">
                        <AlertTriangle size={11} /> Escrow Guard
                      </span>
                    )}
                  </div>
                  <p className="chat-bubble-text">{msg.content}</p>
                  <span className="chat-bubble-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Recheck Modal for Designer */}
      {recheckModal && (
        <div className="action-modal-overlay">
          <div className="action-modal-card">
            <h4>Request Customer Measurement Check</h4>
            <p>Target Dimension: <strong>{recheckModal.label}</strong></p>
            <textarea
              className="action-modal-textarea"
              rows={3}
              placeholder="Explain why this check is needed (e.g. want to ensure relaxed drape in the armholes)..."
              value={recheckPrompt}
              onChange={(e) => setRecheckPrompt(e.target.value)}
            />
            <div className="action-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setRecheckModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-dispatch"
                disabled={actionDispatching}
                onClick={handleDispatchActionRequest}
              >
                {actionDispatching ? 'Dispatching...' : 'Send Verification Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Input Bar */}
      <form className="workspace-input-bar" onSubmit={handleSendMessage}>
        <div className="input-wrap">
          <input
            type="text"
            className="chat-text-input"
            placeholder="Type style notes, lining requests, or tailoring inquiries..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sending}
          />
          <button
            type="submit"
            className="btn-chat-send"
            disabled={sending || !inputText.trim()}
          >
            <Send size={16} />
          </button>
        </div>
        <p className="workspace-security-reminder">
          🔒 Off-platform contacts &amp; banking details are masked. All orders are insured under Aso Escrow.
        </p>
      </form>
    </div>
  );
};
