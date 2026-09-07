import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Cart } from '../types';
import { cartApi } from '../api/client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  cartLoading: boolean;
  cartCount: number;
  cartError: string | null;
  refreshCart: () => Promise<void>;
  addToCart: (variant_id: string, quantity?: number) => Promise<void>;
  updateItem: (item_id: string, quantity: number) => Promise<void>;
  removeItem: (item_id: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CART_CACHE_KEY = 'aso_marketplace_cart_cache';

const getCachedCart = (): Cart | null => {
  try {
    const raw = localStorage.getItem(CART_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const setCachedCart = (cart: Cart | null) => {
  try {
    if (cart && cart.items && cart.items.length > 0) {
      localStorage.setItem(CART_CACHE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_CACHE_KEY);
    }
  } catch (e) {
    console.warn('Failed to persist cart to localStorage', e);
  }
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(() => getCachedCart());
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const prevUserRef = useRef(user);

  const cartCount = cart?.item_count ?? 0;

  const refreshCart = useCallback(async () => {
    // If auth state is still resolving, do not wipe the cached cart
    if (authLoading) {
      return;
    }

    // If there is no authenticated user
    if (!user) {
      const cached = getCachedCart();
      if (cached) {
        setCart(cached);
      } else {
        setCart(null);
      }
      return;
    }

    setCartLoading(true);
    setCartError(null);
    try {
      const data = await cartApi.getCart();
      setCart(data);
      setCachedCart(data);
    } catch (err: any) {
      console.warn('Failed to fetch backend cart, keeping cached version:', err);
      const fallback = getCachedCart();
      if (fallback) {
        setCart(fallback);
      } else {
        setCartError('Failed to load cart.');
      }
    } finally {
      setCartLoading(false);
    }
  }, [user, authLoading]);

  // Sync cart whenever auth state finishes loading or changes
  useEffect(() => {
    if (!authLoading) {
      refreshCart();
    }
  }, [user, authLoading, refreshCart]);

  // If user explicitly logs out (transitions from logged in to null)
  useEffect(() => {
    if (prevUserRef.current && !user && !authLoading) {
      setCart(null);
      setCachedCart(null);
    }
    prevUserRef.current = user;
  }, [user, authLoading]);

  const addToCart = async (variant_id: string, quantity: number = 1) => {
    setCartError(null);
    const data = await cartApi.addItem(variant_id, quantity);
    setCart(data);
    setCachedCart(data);
  };

  const updateItem = async (item_id: string, quantity: number) => {
    setCartError(null);
    const data = await cartApi.updateItem(item_id, quantity);
    setCart(data);
    setCachedCart(data);
  };

  const removeItem = async (item_id: string) => {
    setCartError(null);
    const data = await cartApi.removeItem(item_id);
    setCart(data);
    setCachedCart(data);
  };

  const clearCart = async () => {
    setCartError(null);
    const data = await cartApi.clearCart();
    setCart(data);
    setCachedCart(null);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLoading,
        cartCount,
        cartError,
        refreshCart,
        addToCart,
        updateItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
