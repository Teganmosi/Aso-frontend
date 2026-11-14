/**
 * Plain-language labels for the designer studio. One place, so the dashboard,
 * orders and earnings pages never show raw codes like "PAYOUT_RESERVED".
 */

/** What the designer should understand (and usually do) for each order status. */
export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Awaiting payment',
  PAID: 'New: accept it',
  VENDOR_ACCEPTED: 'Accepted',
  PREPARING: 'Being made',
  READY_FOR_PICKUP: 'Waiting for rider',
  PICKED_UP: 'With the rider',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  DISPUTED: 'Problem reported',
};

export const orderStatusLabel = (status?: string | null): string =>
  ORDER_STATUS_LABEL[String(status || '')] || String(status || '').replace(/_/g, ' ').toLowerCase();

export const PAYOUT_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: 'Available',
  PAYOUT_RESERVED: 'Waiting for approval',
  PROCESSING: 'Sending to your bank',
  SUCCESSFUL: 'Paid to your bank',
  FAILED: 'Failed: money returned',
};

export const payoutStatusLabel = (status?: string | null): string =>
  PAYOUT_STATUS_LABEL[String(status || '')] || String(status || '').replace(/_/g, ' ').toLowerCase();

/**
 * The ledger stores every amount as a positive number and the entry type says
 * which way it moved. Showing them all as "+₦" made a ₦100,000 withdrawal look
 * like ₦100,000 coming in.
 */
export const ledgerLine = (entryType: string): { label: string; sign: '+' | '−' | ''; tone: 'in' | 'out' | 'neutral' } => {
  switch (entryType) {
    case 'EARNING_PENDING':
      return { label: 'Order paid: on hold until delivery', sign: '+', tone: 'neutral' };
    case 'EARNING_RELEASE_TO_AVAILABLE':
      return { label: 'Released: ready to withdraw', sign: '+', tone: 'in' };
    case 'PAYOUT_RESERVE':
      return { label: 'Withdrawal requested', sign: '−', tone: 'out' };
    case 'PAYOUT_SUCCESS':
      return { label: 'Sent to your bank', sign: '', tone: 'neutral' };
    case 'PAYOUT_FAILED':
      return { label: 'Withdrawal failed: money returned', sign: '+', tone: 'in' };
    case 'REFUND':
      return { label: 'Order cancelled: earning removed', sign: '−', tone: 'out' };
    default:
      return { label: entryType.replace(/_/g, ' ').toLowerCase(), sign: '', tone: 'neutral' };
  }
};
