export interface VendorProfileBrief {
  id: string;
  store_name: string;
  slug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_verified: boolean;
  city?: string;
  state?: string;
  description?: string;
  workshop_address?: string;
  landmark?: string;
  instagram_handle?: string;
  kyc_tier?: string;
}

export interface BankAccount {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
  created_at: string;
}

export interface PublicVendorProfile {
  id: string;
  store_name: string;
  slug: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  city: string;
  state: string;
  kyc_tier: string;
  is_verified: boolean;
  instagram_handle: string;
  workshop_address: string;
  landmark: string;
  average_rating: string;
  review_count: number;
  created_at: string;
}

export interface VendorProfileFull extends PublicVendorProfile {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  nin_number: string;
  cac_number: string;
  bank_account: BankAccount | null;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  is_staff: boolean;
  is_vendor: boolean;
  vendor_profile: VendorProfileBrief | null;
  created_at: string;
  date_joined: string;
}

export interface Address {
  id: string;
  full_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  state: string;
  landmark: string;
  is_default: boolean;
  created_at: string;
}

export interface RegisterVendorPayload {
  store_name: string;
  description?: string;
  city: string;
  state: string;
  instagram_handle?: string;
  workshop_address?: string;
  landmark?: string;
  nin_number?: string;
  cac_number?: string;
  account_name?: string;
  account_number?: string;
  bank_name?: string;
  bank_code?: string;
}

export interface BankAccountPayload {
  account_name: string;
  account_number: string;
  bank_name: string;
  bank_code: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent?: string | null;
  parent_name?: string | null;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  display_order?: number;
  children?: Category[];
}

export interface CategorySimple {
  id: string;
  name: string;
  slug: string;
  image_url?: string | null;
}

export interface ProductVariant {
  id: string;
  size: string;
  color?: string | null;
  sku: string;
  stock_quantity: number;
  price_override_kobo?: number | null;
  price_kobo: number;
  price_naira: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO';
  url: string;
  thumbnail_url?: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  base_price_kobo: number;
  base_price_naira: number;
  preparation_time_days: number;
  approval_status: 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  is_active: boolean;
  rejection_reason?: string | null;
  average_rating: number | string;
  review_count: number;
  primary_image_url?: string | null;
  available_sizes?: string[];
  vendor?: PublicVendorProfile;
  category?: CategorySimple;
  created_at: string;
  updated_at?: string;
  media?: ProductMedia[];
  variants?: ProductVariant[];
}

export interface CreateProductPayload {
  title: string;
  category_id: string;
  description: string;
  base_price_kobo: number;
  preparation_time_days?: number;
  status?: 'DRAFT' | 'PUBLISHED';
}

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock_quantity: number;
  status: 'Active' | 'Out of Stock' | 'Draft' | 'Pending Approval';
  image_url: string;
  created_at: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  preparation_time?: string;
  ships_from?: string;
  raw_product?: Product;
}

export interface DesignerOrder {
  id: string;
  order_number: string;
  product_name: string;
  product_image: string;
  customer_name: string;
  size_details: string;
  amount: number;
  status: 'Paid' | 'Preparing' | 'Shipped' | 'Delivered' | 'Cancelled';
  created_at: string;
}

// ─── Cart Types (Sprint 5) ───────────────────────────────────────────────────

export interface CartItem {
  id: string;
  variant_id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  size: string;
  color: string | null;
  sku: string;
  stock_quantity: number;
  unit_price_kobo: number;
  unit_price_naira: number;
  quantity: number;
  total_price_kobo: number;
  total_price_naira: number;
  primary_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Cart {
  id: string;
  vendor: PublicVendorProfile | null;
  items: CartItem[];
  subtotal_kobo: number;
  subtotal_naira: number;
  item_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Variant / Media Types (Sprint 4) ───────────────────────────────────────

export interface CreateVariantPayload {
  size: string;
  color?: string;
  stock_quantity: number;
  price_override_kobo?: number | null;
}

export interface PresignedUrlPayload {
  filename: string;
  file_type: string;
  product_id?: string;
}

export interface PresignedUrlResponse {
  upload_url: string;
  object_key: string;
  public_url: string;
}

export interface CreateMediaPayload {
  url: string;
  object_key?: string;
  media_type: 'IMAGE' | 'VIDEO';
  is_primary?: boolean;
  display_order?: number;
}

// ─── Order & Delivery Types (Sprint 6, 7 & 8) ───────────────────────────────

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'VENDOR_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'DISPUTED';

export type DeliveryStatus =
  | 'PENDING'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'FAILED_DELIVERY';

export interface OrderItem {
  id: string;
  product_id?: string;
  variant_id: string | null;
  product_title_snapshot: string;
  variant_size_snapshot: string;
  variant_color_snapshot: string | null;
  sku_snapshot: string;
  unit_price_kobo: number;
  unit_price_naira: number;
  quantity: number;
  total_price_kobo: number;
  total_price_naira: number;
  created_at: string;
  review?: Review | null;
}

export interface Delivery {
  id: string;
  tracking_number: string;
  carrier_name: string;
  status: DeliveryStatus;
  status_display: string;
  dispatch_notes: string | null;
  picked_up_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  vendor: PublicVendorProfile;
  order_status: OrderStatus;
  subtotal_kobo: number;
  subtotal_naira: number;
  delivery_fee_kobo: number;
  delivery_fee_naira: number;
  total_amount_kobo: number;
  total_amount_naira: number;
  payment_expires_at: string;
  is_expired: boolean;
  vendor_accept_due_by: string | null;
  vendor_accepted_at: string | null;
  prepared_at: string | null;
  ready_for_pickup_at: string | null;
  shipping_address_snapshot: any;
  cancellation_reason: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
  delivery?: Delivery | null;
}

export interface PaymentRequest {
  id: string;
  order: string;
  order_number: string;
  provider: string;
  reference: string;
  authorization_url: string;
  amount_kobo: number;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  created_at: string;
  updated_at: string;
}

// ─── Payout & Financial Ledger Types (Sprint 9) ─────────────────────────────

export type PayoutStatus =
  | 'PAYOUT_RESERVED'
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'REVERSED';

export interface VendorBalance {
  pending_balance_kobo: number;
  available_balance_kobo: number;
  reserved_balance_kobo: number;
  withdrawn_balance_kobo: number;
  pending_balance_naira: number;
  available_balance_naira: number;
  reserved_balance_naira: number;
  withdrawn_balance_naira: number;
}

export interface PayoutRequest {
  id: string;
  reference: string;
  amount_kobo: number;
  amount_naira: number;
  status: PayoutStatus;
  bank_name_snapshot?: string;
  account_number_snapshot?: string;
  account_name_snapshot?: string;
  failure_reason?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface LedgerEntry {
  id: string;
  entry_type: string;
  amount_kobo: number;
  amount_naira: number;
  description: string;
  created_at: string;
}

// ─── Review Types (Sprint 10) ───────────────────────────────────────────────

export interface Review {
  id: string;
  order_item: string;
  product: string;
  vendor: string;
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  } | string;
  customer_name?: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
}

export interface CreateReviewPayload {
  order_item_id: string;
  rating: number;
  comment: string;
}

// ─── Admin Types ─────────────────────────────────────────────────────────────

export interface AdminStats {
  total_vendors: number;
  pending_vendors: number;
  approved_vendors: number;
  total_products: number;
  total_orders: number;
  escrow_orders: number;
  total_gmv_naira: number;
  pending_payouts_count: number;
}

export interface AdminVendorApplication extends PublicVendorProfile {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  user_email?: string;
  user_name?: string;
  user_phone?: string;
  nin_number?: string;
  cac_number?: string;
  bank_account?: BankAccount | null;
}

