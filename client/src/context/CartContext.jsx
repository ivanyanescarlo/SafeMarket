import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();
const CART_STORAGE_KEY = 'safemarket_cart';

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

  const addToCart = (product) => {
    if (!product || !product._id) return;
    if (cart.some((item) => item._id === product._id)) return;
    const updatedCart = [...cart, product];
    persistCart(updatedCart);
    setCart(updatedCart);
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item._id !== productId);
    persistCart(updatedCart);
    setCart(updatedCart);
  };

  const isInCart = (productId) => {
    return cart.some((item) => item._id === productId);
  };

  const clearCart = () => {
    persistCart([]);
    setCart([]);
  };

  const cartCount = cart.length;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        isInCart,
        clearCart,
        cartCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
