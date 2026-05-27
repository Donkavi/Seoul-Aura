"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/types";

export default function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const soldOut = product.stock === 0;

  return (
    <Link href={`/shop/${product.slug ?? product._id}`} className="card-product block group">
      <div className="relative aspect-[3/4] bg-rose-25 overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 768px) 50vw, 20vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200" />
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {soldOut && (
            <span className="badge-origin bg-rose-600 text-white">Sold Out</span>
          )}
          {!soldOut && product.isBestSeller && (
            <span className="badge-origin bg-ink-900 text-white">Bestseller</span>
          )}
          {!soldOut && product.isNewArrival && !product.isBestSeller && (
            <span className="badge-origin bg-rose-600 text-white">New</span>
          )}
          {!soldOut && discount > 0 && (
            <span className="badge-origin bg-gold-500 text-white">-{discount}%</span>
          )}
        </div>

        {soldOut && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
            <span className="bg-ink-900 text-white text-[10px] uppercase tracking-[0.3em] font-semibold px-4 py-2 -rotate-6">
              Notify Me
            </span>
          </div>
        )}

        <button
          className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-rose-50"
          aria-label="Add to wishlist"
          onClick={(e) => e.preventDefault()}
        >
          <Heart size={15} className="text-ink-700" />
        </button>

        {!soldOut ? (
          <button
            onClick={handleAdd}
            className="absolute bottom-0 left-0 right-0 bg-ink-900 text-white py-3 text-xs font-semibold uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2 hover:bg-rose-600"
          >
            <ShoppingBag size={14} />
            Quick Add
          </button>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 bg-rose-600 text-white py-3 text-xs font-semibold uppercase tracking-widest translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2">
            Tap to Get Notified
          </div>
        )}
      </div>

      <div className="pt-4 pb-2 space-y-1.5">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-medium">
          <span
            className={cn(
              product.origin === "Korea" && "text-rose-600",
              product.origin === "Dubai" && "text-gold-600"
            )}
          >
            {product.origin}
          </span>
          {product.subtype && <span> · {product.subtype}</span>}
        </p>

        <h3 className="text-sm font-medium text-ink-900 line-clamp-2 leading-snug group-hover:text-rose-600 transition-colors">
          {product.name}
        </h3>

        {product.reviewCount > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={cn(
                    i < Math.round(product.averageRating)
                      ? "fill-gold-400 text-gold-400"
                      : "fill-ink-100 text-ink-100"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-ink-400">({product.reviewCount})</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 pt-0.5">
          <span className="text-sm font-semibold text-ink-900">
            {formatPrice(product.price)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-ink-400 line-through">
              {formatPrice(product.comparePrice)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
