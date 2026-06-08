"use client";

import Link from "next/link";
import { Heart, ArrowRight, Trash2 } from "lucide-react";
import { useWishlist } from "@/context/WishlistContext";
import ProductCard from "@/components/shop/ProductCard";

export default function WishlistPage() {
  const { items, count, clear } = useWishlist();

  if (count === 0) {
    return (
      <div className="bg-rose-25/30 min-h-[70vh] flex items-center">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-6">
            <Heart size={28} className="text-rose-400" strokeWidth={1.5} />
          </div>
          <p className="section-subtitle text-rose-600 mb-3">Your Wishlist</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
            Save the things you <span className="italic">love</span>
          </h1>
          <p className="text-sm text-ink-500 mb-8 max-w-md mx-auto leading-relaxed">
            Tap the heart icon on any product to add it here. We'll let you know when wishlist items
            go on sale.
          </p>
          <Link href="/shop" className="btn-primary inline-flex items-center gap-2 group">
            Discover Products
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="section-subtitle text-rose-600 mb-2">Your Wishlist</p>
            <h1 className="font-display text-3xl lg:text-4xl text-ink-900">
              {count} {count === 1 ? "item" : "items"} saved
            </h1>
          </div>
          <button
            onClick={clear}
            className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-rose-600 transition-colors"
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
