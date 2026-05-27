"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeDrawer, updateQty, removeItem, total, itemCount } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm animate-fade-in"
        onClick={closeDrawer}
      />
      <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <header className="flex items-center justify-between p-6 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <ShoppingBag size={20} className="text-rose-600" />
            <h2 className="font-display text-2xl text-ink-900">
              Your Bag
              <span className="text-sm text-ink-400 ml-2 font-body">({itemCount})</span>
            </h2>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 hover:bg-ink-50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <ShoppingBag size={32} className="text-rose-400" />
            </div>
            <p className="font-display text-2xl text-ink-900 mb-2">Your bag is empty</p>
            <p className="text-sm text-ink-500 mb-6">Discover our curated Korean & Dubai imports.</p>
            <Link href="/shop" onClick={closeDrawer} className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product._id}
                  className="flex gap-4 pb-4 border-b border-ink-50"
                >
                  <div className="w-20 h-24 bg-ink-50 rounded-sm overflow-hidden flex-shrink-0 relative">
                    {item.product.images[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
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
                        <button
                          onClick={() => updateQty(item.product._id, item.quantity - 1)}
                          className="p-1.5 hover:bg-ink-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product._id, item.quantity + 1)}
                          className="p-1.5 hover:bg-ink-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-ink-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.product._id)}
                          className="text-ink-400 hover:text-rose-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="btn-primary w-full block text-center"
              >
                Checkout · {formatPrice(total)}
              </Link>
              <button onClick={closeDrawer} className="btn-ghost w-full text-center text-xs">
                Continue Shopping
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
