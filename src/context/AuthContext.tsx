import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Address } from '../types';
import { authApi, addressApi } from '../api/client';

export type UserTypeMode = 'customer' | 'designer';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  authModalUserType: UserTypeMode;
  openAuthModal: (tab?: 'login' | 'register', userType?: UserTypeMode) => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<User | null>;
  addresses: Address[];
  fetchAddresses: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authModalUserType, setAuthModalUserType] = useState<UserTypeMode>('customer');

  const refreshMe = async (): Promise<User | null> => {
    try {
      const u = await authApi.getMe();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const list = await addressApi.getAddresses();
      setAddresses(list);
    } catch (err) {
      console.error('Failed to fetch addresses', err);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchAddresses();
    } else {
      setAddresses([]);
    }
  }, [user]);

  const openAuthModal = (tab: 'login' | 'register' = 'login', userType: UserTypeMode = 'customer') => {
    setAuthModalTab(tab);
    setAuthModalUserType(userType);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    setUser(res.user);
    closeAuthModal();
  };

  const register = async (payload: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
  }): Promise<User> => {
    const res = await authApi.register(payload);
    setUser(res.user);
    closeAuthModal();
    return res.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      setUser(null);
      setAddresses([]);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthModalOpen,
        authModalTab,
        authModalUserType,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshMe,
        addresses,
        fetchAddresses,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
