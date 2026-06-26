import { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem('agrimarket_cart');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const existing = state.find(item => item._id === action.payload._id);
      const addQty = action.payload.addQty || 1;
      if (existing) {
        return state.map(item =>
          item._id === action.payload._id
            ? { ...item, cartQty: Math.min(item.cartQty + addQty, item.availableStock) }
            : item
        );
      }
      return [...state, { ...action.payload, cartQty: addQty }];
    }
    case 'REMOVE_FROM_CART':
      return state.filter(item => item._id !== action.payload);
    case 'UPDATE_QUANTITY':
      return state.map(item =>
        item._id === action.payload.id
          ? { ...item, cartQty: action.payload.qty === '' ? '' : Math.min(Math.max(1, action.payload.qty), item.availableStock) }
          : item
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

export function CartProvider({ children }) {
  const [cartItems, dispatch] = useReducer(cartReducer, [], loadFromStorage);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('agrimarket_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (crop) => dispatch({ type: 'ADD_TO_CART', payload: crop });
  const removeFromCart = (id) => dispatch({ type: 'REMOVE_FROM_CART', payload: id });
  const updateQuantity = (id, qty) => dispatch({ type: 'UPDATE_QUANTITY', payload: { id, qty } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  const cartCount = cartItems.length; // Count unique products, not total quantities
  const cartTotal = cartItems.reduce((sum, item) => sum + item.pricePerUnit * (item.cartQty || 0), 0);

  return (
    <CartContext.Provider value={{
      cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
