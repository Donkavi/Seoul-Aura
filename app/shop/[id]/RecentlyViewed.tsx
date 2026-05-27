"use client";

import { useEffect, useState } from "react";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/types";

export default function RecentlyViewed({ currentProductId }: { currentProductId: string }) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("sa-recently-viewed");
    if (!raw) return;

    const ids: string[] = JSON.parse(raw);
    const otherIds = ids.filter((id) => id !== currentProductId).slice(0, 4);
    if (otherIds.length === 0) return;

    Promise.all(
      otherIds.map((id) =>
        fetch(`/api/products/${id}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setProducts(results.filter(Boolean) as Product[]);
    });
  }, [currentProductId]);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-12 lg:py-16 border-t border-ink-100">
      <h2 className="font-display text-2xl lg:text-3xl text-ink-900 mb-8">Recently viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
        {products.map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
}
