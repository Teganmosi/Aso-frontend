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

export interface ProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock_quantity: number;
  status: 'Active' | 'Out of Stock' | 'Draft';
  image_url: string;
  created_at: string;
  description?: string;
  sizes?: string[];
  colors?: string[];
  preparation_time?: string;
  ships_from?: string;
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
