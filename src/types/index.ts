export interface VendorProfileBrief {
  id: string;
  store_name: string;
  slug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_verified: boolean;
  city?: string;
  state?: string;
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
