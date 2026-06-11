"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag, Trash2, Plane } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, cn } from "@/lib/utils";
import type { CartItem } from "@/types";

type Tab = "bag" | "preorder";

export default function CartDrawer() {
  const {
    isOpen, closeDrawer, updateQty, removeItem,
    cartItems, total, itemCount,
    preOrderItems, preOrderCount, preOrderTotal,
  } = useCart();
  const [tab, setTab] = useState<Tab>("bag");

  // If the bag is empty but there are pre-orders, default to the pre-order tab
  useEffect(() => {
    if (isOpen && cartItems.length === 0 && preOrderItems.length > 0) setTab("preorder");
  }, [isOpen, cartItems.length, preOrderItems.length]);

  if (!isOpen) return null;

  const activeItems = tab === "bag" ? cartItems : preOrderItems;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={closeDrawer}
      />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <header className="flex items-center justify-between p-6 pb-4 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-rose-600" />
            <h2 className="font-display text-2xl text-ink-900">Your Bag</h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-ink-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-ink-100 px-6">
          <button
            onClick={() => setTab("bag")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === "bag" ? "border-rose-600 text-rose-600" : "border-transparent text-ink-500 hover:text-ink-800"
            )}
          >
            <ShoppingBag size={15} /> Bag
            <span className={cn("text-xs rounded-full px-1.5 py-0.5", tab === "bag" ? "bg-rose-100 text-rose-700" : "bg-ink-100 text-ink-500")}>
              {itemCount}
            </span>
          </button>
          <button
            onClick={() => setTab("preorder")}
            className={cn(
              "flex items-center gap-2 py-3 px-4 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === "preorder" ? "border-rose-600 text-rose-600" : "border-transparent text-ink-500 hover:text-ink-800"
            )}
          >
            <Plane size={15} /> Pre-Order
            <span className={cn("text-xs rounded-full px-1.5 py-0.5", tab === "preorder" ? "bg-rose-100 text-rose-700" : "bg-ink-100 text-ink-500")}>
              {preOrderCount}
            </span>
          </button>
        </div>

        {activeItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              {tab === "bag"
                ? <ShoppingBag size={32} className="text-rose-400" />
                : <Plane size={32} className="text-rose-400" />}
            </div>
            <p className="font-display text-2xl text-ink-900 mb-2">
              {tab === "bag" ? "Your bag is empty" : "No pre-orders yet"}
            </p>
            <p className="text-sm text-ink-500 mb-6">
              {tab === "bag"
                ? "Discover our curated Korean imports."
                : "Add a pre-order item and we'll source it for you."}
            </p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary">
              {tab === "bag" ? "Start Shopping" : "Browse Products"}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {activeItems.map((item) => (
                <CartLine
                  key={item.product._id}
                  item={item}
                  isPreOrder={tab === "preorder"}
                  onUpdateQty={updateQty}
                  onRemove={removeItem}
                />
              ))}
            </div>

            {tab === "bag" ? (
              <footer className="border-t border-ink-100 p-6 space-y-4 bg-ink-50/50">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Subtotal</span>
                  <span className="font-medium text-ink-900">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-500">Shipping</span>
                  <span className="text-ink-700">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-base pt-3 border-t border-ink-200">
                  <span className="font-semibold text-ink-900">Total</span>
                  <span className="font-display text-xl text-rose-600">{formatPrice(total)}</span>
                </div>
                <Link href="/checkout" onClick={closeDrawer} className="btn-primary w-full block text-center">
                  Checkout · {formatPrice(total)}
                </Link>
                <button onClick={closeDrawer} className="btn-ghost w-full text-center text-xs">
                  Continue Shopping
                </button>
              </footer>
            ) : (
              <footer className="border-t border-ink-100 p-6 space-y-3 bg-rose-25/40">
                {/* Estimated price breakdown */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-500">Est. Subtotal</span>
                    <span className="font-medium text-ink-900">~{formatPrice(preOrderTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-500">Delivery</span>
                    <span className="text-ink-500 text-xs">Added at confirmation</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-rose-100">
                    <span className="font-semibold text-ink-900">Est. Total</span>
                    <span className="font-display text-xl text-rose-600">~{formatPrice(preOrderTotal)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-[11px] text-ink-500 leading-relaxed">
                  <Plane size={12} className="text-rose-400 shrink-0 mt-0.5" />
                  <p>Prices are estimates — final quote confirmed within 48 hrs. No payment until you approve.</p>
                </div>
                <Link href="/pre-order" onClick={closeDrawer} className="btn-primary w-full block text-center">
                  Request Pre-Order · {preOrderCount} item{preOrderCount !== 1 ? "s" : ""}
                </Link>
                <button onClick={closeDrawer} className="btn-ghost w-full text-center text-xs">
                  Continue Shopping
                </button>
              </footer>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function CartLine({
  item, isPreOrder, onUpdateQty, onRemove,
}: {
  item: CartItem;
  isPreOrder: boolean;
  onUpdateQty: (id: string, q: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="flex gap-4 pb-4 border-b border-ink-50">
      <div className="w-20 h-24 bg-ink-50 rounded-sm overflow-hidden flex-shrink-0 relative">
        {item.product.images[0] && (
          <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="80px" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-ink-400 uppercase tracking-wider">
          {item.product.origin} · {item.product.subtype}
        </p>
        <h3 className="text-sm font-medium text-ink-900 line-clamp-2 leading-snug mt-0.5">
          {item.product.name}
        </h3>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center border border-ink-200 rounded-sm">
            <button onClick={() => onUpdateQty(item.product._id, item.quantity - 1)} className="p-1.5 hover:bg-ink-50">
              <Minus size={12} />
            </button>
            <span className="px-3 text-sm font-medium">{item.quantity}</span>
            <button onClick={() => onUpdateQty(item.product._id, item.quantity + 1)} className="p-1.5 hover:bg-ink-50">
              <Plus size={12} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-ink-900">
              {isPreOrder ? `~${formatPrice(item.product.price * item.quantity)}` : formatPrice(item.product.price * item.quantity)}
            </span>
            <button onClick={() => onRemove(item.product._id)} className="text-ink-400 hover:text-rose-600">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
        {isPreOrder && (
          <p className="text-[10px] text-ink-400 mt-1.5 italic">Estimated price — final quote sent after review</p>
        )}
      </div>
    </div>
  );
}
