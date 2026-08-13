import axios from 'axios';
import type {
  User,
  Address,
  PublicVendorProfile,
  RegisterVendorPayload,
  BankAccountPayload,
  BankAccount,
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

export const addressApi = {
  getAddresses: async (): Promise<Address[]> => {
    const res = await apiClient.get('/auth/addresses/');
    return res.data.results || res.data;
  },

  createAddress: async (payload: Omit<Address, 'id' | 'created_at'>): Promise<Address> => {
    await fetchCsrfToken();
    const res = await apiClient.post('/auth/addresses/', payload);
    return res.data;
  },
};

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
