import React, { createContext, useCallback, useContext, useState } from 'react';

const CartContext = createContext();
const CART_STORAGE_KEY = 'safemarket_cart';
const UNSEEN_CART_ITEMS_STORAGE_KEY = 'safemarket_unseen_cart_items';

const persistCart = (cart) => {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Failed to save cart:', error);
  }
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load cart:', error);
      return [];
    }
  });
  const [unseenCartItemIds, setUnseenCartItemIds] = useState(() => {
    try {
      const saved = localStorage.getItem(UNSEEN_CART_ITEMS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Failed to load unseen cart items:', error);
      return [];
    }
  });

  const persistUnseenCartItems = (itemIds) => {
    try {
      localStorage.setItem(UNSEEN_CART_ITEMS_STORAGE_KEY, JSON.stringify(itemIds));
    } catch (error) {
      console.error('Failed to save unseen cart items:', error);
    }
  };

  const addToCart = (product) => {
    if (!product || !product._id) return;
    if (cart.some((item) => item._id === product._id)) return;
    const updatedCart = [...cart, product];
    const updatedUnseenCartItemIds = [...new Set([...unseenCartItemIds, product._id])];
    persistCart(updatedCart);
    persistUnseenCartItems(updatedUnseenCartItemIds);
    setCart(updatedCart);
    setUnseenCartItemIds(updatedUnseenCartItemIds);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item._id !== productId);
    const updatedUnseenCartItemIds = unseenCartItemIds.filter((itemId) => itemId !== productId);
    persistCart(updatedCart);
    persistUnseenCartItems(updatedUnseenCartItemIds);
    setCart(updatedCart);
    setUnseenCartItemIds(updatedUnseenCartItemIds);
  };

  const isInCart = (productId) => {
    return cart.some((item) => item._id === productId);
  };

  const clearCart = () => {
    persistCart([]);
    persistUnseenCartItems([]);
    setCart([]);
    setUnseenCartItemIds([]);
  };

  const cartCount = cart.length;
  const unseenCartItemCount = unseenCartItemIds.length;

  const markCartAsSeen = useCallback(() => {
    if (unseenCartItemIds.length === 0) return;
    persistUnseenCartItems([]);
    setUnseenCartItemIds([]);
  }, [unseenCartItemIds.length]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        isInCart,
        clearCart,
        cartCount,
        unseenCartItemCount,
        markCartAsSeen
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
