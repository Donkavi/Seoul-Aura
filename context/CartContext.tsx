"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { CartItem, Product } from "@/types";

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product; quantity?: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QTY"; productId: string; quantity: number }
  | { type: "CLEAR" }
  | { type: "TOGGLE_DRAWER" }
  | { type: "OPEN_DRAWER" }
  | { type: "CLOSE_DRAWER" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.product._id === action.product._id);
      if (existing) {
        return {
          ...state,
          isOpen: true,
          items: state.items.map((i) =>
            i.product._id === action.product._id
              ? { ...i, quantity: i.quantity + (action.quantity ?? 1) }
              : i
          ),
        };
      }
      return {
        ...state,
        isOpen: true,
        items: [...state.items, { product: action.product, quantity: action.quantity ?? 1 }],
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.product._id !== action.productId) };
    case "UPDATE_QTY":
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter((i) => i.product._id !== action.productId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.product._id === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case "CLEAR":
      // Clearing the cart (e.g. after a regular order) keeps pre-order items intact
      return { ...state, items: state.items.filter((i) => i.product.isPreOrder) };
    case "TOGGLE_DRAWER":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN_DRAWER":
      return { ...state, isOpen: true };
    case "CLOSE_DRAWER":
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

interface CartContextValue extends CartState {
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  clearPreOrders: () => void;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  // Regular (in-stock) items
  cartItems: CartItem[];
  total: number;
  itemCount: number;
  // Pre-order items
  preOrderItems: CartItem[];
  preOrderCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });

  useEffect(() => {
    const saved = localStorage.getItem("sa-cart");
    if (saved) {
      const items: CartItem[] = JSON.parse(saved);
      items.forEach((i) => dispatch({ type: "ADD_ITEM", product: i.product, quantity: i.quantity }));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sa-cart", JSON.stringify(state.items));
  }, [state.items]);

  const cartItems = state.items.filter((i) => !i.product.isPreOrder);
  const preOrderItems = state.items.filter((i) => i.product.isPreOrder);

  // Regular cart totals only — pre-orders are quoted separately, never in the checkout total
  const total = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const itemCount = cartItems.reduce((s, i) => s + i.quantity, 0);
  const preOrderCount = preOrderItems.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        ...state,
        cartItems,
        preOrderItems,
        total,
        itemCount,
        preOrderCount,
        addItem: (p, q) => dispatch({ type: "ADD_ITEM", product: p, quantity: q }),
        removeItem: (id) => dispatch({ type: "REMOVE_ITEM", productId: id }),
        updateQty: (id, q) => dispatch({ type: "UPDATE_QTY", productId: id, quantity: q }),
        clearCart: () => dispatch({ type: "CLEAR" }),
        clearPreOrders: () =>
          preOrderItems.forEach((i) => dispatch({ type: "REMOVE_ITEM", productId: i.product._id })),
        toggleDrawer: () => dispatch({ type: "TOGGLE_DRAWER" }),
        openDrawer: () => dispatch({ type: "OPEN_DRAWER" }),
        closeDrawer: () => dispatch({ type: "CLOSE_DRAWER" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
