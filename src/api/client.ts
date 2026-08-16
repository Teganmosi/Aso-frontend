import axios from 'axios';
import type {
  User,
  Address,
  PublicVendorProfile,
  RegisterVendorPayload,
  BankAccountPayload,
  BankAccount,
  Category,
  Product,
  CreateProductPayload,
  ProductVariant,
  CreateVariantPayload,
  ProductMedia,
  PresignedUrlPayload,
  PresignedUrlResponse,
  CreateMediaPayload,
  Cart,
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

apiClient.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken && config.headers) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
});

export const fetchCsrfToken = async () => {
  try {
    const res = await apiClient.get('/auth/csrf/');
    return res.data?.csrfToken;
  } catch (err) {
    console.error('Failed to fetch CSRF token', err);
    return null;
  }
};

// ─── Auth API ────────────────────────────────────────────────────────────────

export const authApi = {
  getCsrf: fetchCsrfToken,

  register: async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  }) => {
    await fetchCsrfToken();
    const res = await apiClient.post('/auth/register/', payload);
    return res.data;
  },

  login: async (payload: { email: string; password: string }): Promise<{ detail: string; user: User }> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/auth/login/', payload);
    return res.data;
  },

  logout: async () => {
    await fetchCsrfToken();
    const res = await apiClient.post('/auth/logout/');
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await apiClient.get('/me/');
    return res.data;
  },
};

// ─── Address API ─────────────────────────────────────────────────────────────

export const addressApi = {
  getAddresses: async (): Promise<Address[]> => {
    const res = await apiClient.get('/auth/addresses/');
    return res.data.results || res.data;
  },

  createAddress: async (payload: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/auth/addresses/', payload);
    return res.data.address || res.data;
  },

  updateAddress: async (id: string, payload: Partial<Omit<Address, 'id' | 'created_at'>>): Promise<Address> => {
    await fetchCsrfToken();
    const res = await apiClient.put(`/auth/addresses/${id}/`, payload);
    return res.data.address || res.data;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await fetchCsrfToken();
    await apiClient.delete(`/auth/addresses/${id}/`);
  },
};

// ─── Vendor API ──────────────────────────────────────────────────────────────

export const vendorApi = {
  registerVendor: async (payload: RegisterVendorPayload) => {
    await fetchCsrfToken();
    const res = await apiClient.post('/vendors/register/', payload);
    return res.data;
  },

  getPublicProfile: async (slug: string): Promise<PublicVendorProfile> => {
    const res = await apiClient.get(`/vendors/${slug}/`);
    return res.data;
  },

  getBankAccount: async (): Promise<BankAccount> => {
    const res = await apiClient.get('/vendors/bank-account/');
    return res.data;
  },

  saveBankAccount: async (payload: BankAccountPayload): Promise<BankAccount> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/vendors/bank-account/', payload);
    return res.data;
  },
};

// ─── Category API ─────────────────────────────────────────────────────────────

export const categoryApi = {
  getCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get('/categories/');
    return res.data.results || res.data;
  },

  getCategoryBySlug: async (slug: string): Promise<Category> => {
    const res = await apiClient.get(`/categories/${slug}/`);
    return res.data;
  },
};

// ─── Product API ─────────────────────────────────────────────────────────────

export const productApi = {
  getPublicProducts: async (params?: {
    search?: string;
    category?: string;
    vendor?: string;
    ordering?: string;
  }): Promise<Product[]> => {
    const res = await apiClient.get('/products/', { params });
    return res.data.results || res.data;
  },

  getPublicProductDetail: async (identifier: string): Promise<Product> => {
    const res = await apiClient.get(`/products/${identifier}/`);
    return res.data;
  },

  getVendorProducts: async (): Promise<Product[]> => {
    const res = await apiClient.get('/vendor/products/');
    return res.data.results || res.data;
  },

  createVendorProduct: async (payload: CreateProductPayload): Promise<Product> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/vendor/products/', payload);
    return res.data;
  },

  updateVendorProduct: async (id: string, payload: Partial<CreateProductPayload>): Promise<Product> => {
    await fetchCsrfToken();
    const res = await apiClient.put(`/vendor/products/${id}/`, payload);
    return res.data;
  },

  deleteVendorProduct: async (id: string): Promise<void> => {
    await fetchCsrfToken();
    await apiClient.delete(`/vendor/products/${id}/`);
  },
};

// ─── Cart API (Sprint 5) ─────────────────────────────────────────────────────

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res = await apiClient.get('/cart/');
    return res.data.data;
  },

  addItem: async (variant_id: string, quantity: number = 1): Promise<Cart> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/cart/items/', { variant_id, quantity });
    return res.data.data;
  },

  updateItem: async (item_id: string, quantity: number): Promise<Cart> => {
    await fetchCsrfToken();
    const res = await apiClient.patch(`/cart/items/${item_id}/`, { quantity });
    return res.data.data;
  },

  removeItem: async (item_id: string): Promise<Cart> => {
    await fetchCsrfToken();
    const res = await apiClient.delete(`/cart/items/${item_id}/`);
    return res.data.data;
  },

  clearCart: async (): Promise<Cart> => {
    await fetchCsrfToken();
    const res = await apiClient.delete('/cart/');
    return res.data.data;
  },
};

// ─── Variant API (Sprint 4) ──────────────────────────────────────────────────

export const variantApi = {
  listVariants: async (product_id: string): Promise<ProductVariant[]> => {
    const res = await apiClient.get(`/products/${product_id}/variants/`);
    return res.data.results || res.data;
  },

  createVariant: async (product_id: string, payload: CreateVariantPayload): Promise<ProductVariant> => {
    await fetchCsrfToken();
    const res = await apiClient.post(`/products/${product_id}/variants/`, payload);
    return res.data;
  },

  updateVariant: async (product_id: string, variant_id: string, payload: Partial<CreateVariantPayload>): Promise<ProductVariant> => {
    await fetchCsrfToken();
    const res = await apiClient.put(`/products/${product_id}/variants/${variant_id}/`, payload);
    return res.data;
  },

  deleteVariant: async (product_id: string, variant_id: string): Promise<void> => {
    await fetchCsrfToken();
    await apiClient.delete(`/products/${product_id}/variants/${variant_id}/`);
  },
};

// ─── Media API (Sprint 4) ────────────────────────────────────────────────────

export const mediaApi = {
  getPresignedUrl: async (payload: PresignedUrlPayload): Promise<PresignedUrlResponse> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/products/upload-url/', payload);
    return res.data;
  },

  uploadToPresignedUrl: async (uploadUrl: string, file: File): Promise<void> => {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
  },

  listMedia: async (product_id: string): Promise<ProductMedia[]> => {
    const res = await apiClient.get(`/products/${product_id}/media/`);
    return res.data.results || res.data;
  },

  attachMedia: async (product_id: string, payload: CreateMediaPayload): Promise<ProductMedia> => {
    await fetchCsrfToken();
    const res = await apiClient.post(`/products/${product_id}/media/`, payload);
    return res.data;
  },

  deleteMedia: async (product_id: string, media_id: string): Promise<void> => {
    await fetchCsrfToken();
    await apiClient.delete(`/products/${product_id}/media/${media_id}/`);
  },
};
