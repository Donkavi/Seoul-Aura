"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import type { Product } from "@/types";

interface WishlistState {
  items: Product[];
}

type WishlistAction =
  | { type: "ADD"; product: Product }
  | { type: "REMOVE"; productId: string }
  | { type: "TOGGLE"; product: Product }
  | { type: "HYDRATE"; items: Product[] }
  | { type: "CLEAR" };

function reducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case "ADD": {
      if (state.items.some((p) => p._id === action.product._id)) return state;
      return { items: [...state.items, action.product] };
    }
    case "REMOVE":
      return { items: state.items.filter((p) => p._id !== action.productId) };
    case "TOGGLE": {
      const exists = state.items.some((p) => p._id === action.product._id);
      return exists
        ? { items: state.items.filter((p) => p._id !== action.product._id) }
        : { items: [...state.items, action.product] };
    }
    case "HYDRATE":
      return { items: action.items };
    case "CLEAR":
      return { items: [] };
    default:
      return state;
  }
}

interface WishlistContextValue {
  items: Product[];
  count: number;
  has: (productId: string) => boolean;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  toggle: (product: Product) => void;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

const STORAGE_KEY = "sa-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const items: Product[] = JSON.parse(saved);
        if (Array.isArray(items)) dispatch({ type: "HYDRATE", items });
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        count: state.items.length,
        has: (id) => state.items.some((p) => p._id === id),
        add: (p) => dispatch({ type: "ADD", product: p }),
        remove: (id) => dispatch({ type: "REMOVE", productId: id }),
        toggle: (p) => dispatch({ type: "TOGGLE", product: p }),
        clear: () => dispatch({ type: "CLEAR" }),
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
