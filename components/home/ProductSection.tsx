import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/types";

interface Props {
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  products: Product[];
  accent?: "rose" | "ink" | "gold";
}

export default function ProductSection({
  title,
  subtitle,
  viewAllHref,
  products,
  accent = "rose",
}: Props) {
  if (!products.length) return null;

  return (
    <section className="py-14 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8 lg:mb-12">
          <div>
            {subtitle && (
              <p
                className={`section-subtitle mb-2 ${
                  accent === "gold" ? "text-gold-600" : "text-rose-600"
                }`}
              >
                {subtitle}
              </p>
            )}
            <h2 className="section-title">{title}</h2>
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-rose-600 transition-colors group"
            >
              View All
              <ArrowRight
                size={14}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {products.slice(0, 5).map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {viewAllHref && (
          <div className="sm:hidden flex justify-center mt-8">
            <Link
              href={viewAllHref}
              className="inline-flex items-center gap-2 text-sm font-medium text-rose-600"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
