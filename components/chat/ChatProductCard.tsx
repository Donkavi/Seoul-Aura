"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Check, Plus, Star } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, cn } from "@/lib/utils";
import type { Product } from "@/types";

export default function ChatProductCard({ product }: { product: Product }) {
  // Adding from chat uses the silent variant so the cart drawer never slides
  // over the conversation the shopper is still reading.
  const { addItemSilent } = useCart();
  const [added, setAdded] = useState(false);

  const soldOut = !product.isPreOrder && product.stock === 0;
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAdd = () => {
    if (soldOut) return;
    addItemSilent(product, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="group flex gap-3 bg-white border border-ink-100 rounded-sm p-2.5 transition-shadow duration-300 hover:shadow-card">
      <Link
        href={`/shop/${product.slug ?? product._id}`}
        className="relative w-[68px] h-[86px] flex-shrink-0 bg-ink-50 overflow-hidden rounded-sm"
      >
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="68px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200" />
        )}
        {discount > 0 && !soldOut && (
          <span className="absolute top-1 left-1 bg-gold-500 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col">
        {product.brand && (
          <p className="text-[9px] uppercase tracking-[0.18em] text-ink-400 font-medium truncate">
            {product.brand}
          </p>
        )}

        <Link
          href={`/shop/${product.slug ?? product._id}`}
          className="text-[13px] leading-snug font-medium text-ink-900 line-clamp-2 hover:text-rose-600 transition-colors"
        >
          {product.name}
        </Link>

        {product.reviewCount > 0 && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-ink-400">
            <Star size={9} className="fill-gold-400 text-gold-400" />
            {product.averageRating.toFixed(1)}
            <span className="text-ink-300">({product.reviewCount})</span>
          </span>
        )}

        <div className="mt-auto pt-1.5 flex items-end justify-between gap-2">
          <div className="leading-none">
            <span className="text-[13px] font-semibold text-ink-900">
              {formatPrice(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="ml-1.5 text-[10px] text-ink-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>

          {soldOut ? (
            <span className="text-[9px] uppercase tracking-[0.15em] text-ink-400 font-semibold px-2 py-1.5">
              Sold out
            </span>
          ) : (
            <button
              onClick={handleAdd}
              aria-label={`Add ${product.name} to cart`}
              className={cn(
                "flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold px-2.5 py-1.5 rounded-sm transition-all duration-300",
                added
                  ? "bg-green-600 text-white"
                  : "bg-ink-900 text-white hover:bg-rose-600"
              )}
            >
              {added ? (
                <>
                  <Check size={11} strokeWidth={3} /> Added
                </>
              ) : (
                <>
                  <Plus size={11} strokeWidth={3} /> {product.isPreOrder ? "Bag" : "Cart"}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
