import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  const cartCount = cart?.item_count ?? 0;

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCart(null);
      return;
    }
    setCartLoading(true);
    setCartError(null);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart', err);
      setCartError('Failed to load cart.');
    } finally {
      setCartLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (variant_id: string, quantity: number = 1) => {
    setCartError(null);
    const data = await cartApi.addItem(variant_id, quantity);
    setCart(data);
  };

  const updateItem = async (item_id: string, quantity: number) => {
    setCartError(null);
    const data = await cartApi.updateItem(item_id, quantity);
    setCart(data);
  };

  const removeItem = async (item_id: string) => {
    setCartError(null);
    const data = await cartApi.removeItem(item_id);
    setCart(data);
  };

  const clearCart = async () => {
    setCartError(null);
    const data = await cartApi.clearCart();
    setCart(data);
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
