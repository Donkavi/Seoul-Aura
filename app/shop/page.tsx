"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  LayoutGrid,
  Grid3x3,
  List,
} from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

const KNOWN_BRANDS = [
  "COSRX",
  "ANUA",
  "Beauty of Joseon",
  "Medicube",
  "Innisfree",
  "Laneige",
  "Sulwhasoo",
  "Mielle",
  "Bateel",
  "Patchi",
  "Al Nassma",
  "Mirzam",
  "Shin Ramyun",
  "Pepero",
];

function extractBrand(name: string): string {
  const match = KNOWN_BRANDS.find((b) => name.toLowerCase().includes(b.toLowerCase()));
  return match ?? name.split(/[·\s]/)[0] ?? "Other";
}

type ViewMode = "grid-large" | "grid" | "list";

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [availability, setAvailability] = useState<Set<"in-stock" | "out-of-stock">>(
    new Set()
  );
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(50000);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);

  const filters = useMemo(
    () => ({
      type: searchParams.get("type") ?? undefined,
      subtype: searchParams.get("subtype") ?? undefined,
      origin: searchParams.get("origin") ?? undefined,
      brand: searchParams.get("brand") ?? undefined,
      tag: searchParams.get("tag") ?? undefined,
      filter: searchParams.get("filter") ?? undefined,
      concern: searchParams.get("concern") ?? undefined,
    }),
    [searchParams]
  );

  const pageTitle = useMemo(() => {
    if (filters.brand === "all") return "Shop by Brand";
    if (filters.brand) return filters.brand;
    if (filters.concern)
      return filters.concern.charAt(0).toUpperCase() + filters.concern.slice(1).replace("-", " ");
    if (filters.tag)
      return filters.tag.charAt(0).toUpperCase() + filters.tag.slice(1).replace("-", " ");
    if (filters.subtype) return filters.subtype;
    if (filters.type) return filters.type;
    if (filters.origin) return `${filters.origin} Edit`;
    if (filters.filter === "bestseller") return "Bestsellers";
    if (filters.filter === "new") return "New Arrivals";
    return "Shop All";
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.type) params.set("type", filters.type);
    if (filters.subtype) params.set("subtype", filters.subtype);
    if (filters.origin) params.set("origin", filters.origin);
    if (filters.tag) params.set("tag", filters.tag);
    if (filters.concern) params.set("concern", filters.concern);
    if (filters.filter === "bestseller") params.set("bestSeller", "true");
    if (filters.filter === "new") params.set("newArrival", "true");
    if (filters.brand) params.set("brand", filters.brand); // handled by API (all = no filter)
    if (search) params.set("search", search);
    params.set("limit", "100");

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list: Product[] = data.products ?? [];
        setProducts(list);
        const prices = list.map((p) => p.price);
        if (prices.length) {
          const min = Math.floor(Math.min(...prices));
          const max = Math.ceil(Math.max(...prices));
          setPriceMin(min);
          setPriceMax(max);
          setPriceRange([min, max]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [filters, search]);

  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const b = p.brand || extractBrand(p.name);
      counts[b] = (counts[b] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([brand, count]) => ({ brand, count }));
  }, [products]);

  const availabilityCounts = useMemo(() => {
    let inStock = 0;
    let outStock = 0;
    products.forEach((p) => (p.stock > 0 ? inStock++ : outStock++));
    return { inStock, outStock };
  }, [products]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (availability.size > 0) {
      result = result.filter((p) => {
        if (availability.has("in-stock") && p.stock > 0) return true;
        if (availability.has("out-of-stock") && p.stock === 0) return true;
        return false;
      });
    }

    if (selectedBrands.size > 0) {
      result = result.filter((p) => selectedBrands.has(extractBrand(p.name)));
    }

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    return result;
  }, [products, availability, selectedBrands, priceRange]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sort) {
      case "price-asc":
        return arr.sort((a, b) => a.price - b.price);
      case "price-desc":
        return arr.sort((a, b) => b.price - a.price);
      case "rating":
        return arr.sort((a, b) => b.averageRating - a.averageRating);
      case "newest":
        return arr.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "featured":
      default:
        return arr.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));
    }
  }, [filtered, sort]);

  const toggleSet = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const resetFilters = () => {
    setAvailability(new Set());
    setSelectedBrands(new Set());
    setPriceRange([priceMin, priceMax]);
  };

  const hasActiveFilters =
    availability.size > 0 ||
    selectedBrands.size > 0 ||
    priceRange[0] !== priceMin ||
    priceRange[1] !== priceMax;

  const gridClass = cn(
    "grid gap-4 lg:gap-6",
    viewMode === "grid-large" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    viewMode === "grid" && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    viewMode === "list" && "grid-cols-1"
  );

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-ink-100 py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <nav className="text-xs text-ink-500 flex items-center gap-2 mb-4">
            <a href="/" className="hover:text-rose-600">Home</a>
            <span>/</span>
            <a href="/shop" className="hover:text-rose-600">Shop</a>
            {pageTitle !== "Shop All" && (
              <>
                <span>/</span>
                <span className="text-ink-900">{pageTitle}</span>
              </>
            )}
          </nav>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900">{pageTitle}</h1>
          <p className="text-sm text-ink-500 mt-2">
            {loading ? "Loading…" : `${sorted.length} ${sorted.length === 1 ? "product" : "products"}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 lg:py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside
            className={cn(
              "lg:w-64 flex-shrink-0",
              filtersOpen
                ? "fixed inset-0 z-40 bg-black/40 lg:bg-transparent lg:relative lg:inset-auto"
                : "hidden lg:block"
            )}
            onClick={(e) => e.target === e.currentTarget && setFiltersOpen(false)}
          >
            <div
              className={cn(
                filtersOpen
                  ? "absolute right-0 top-0 bottom-0 w-80 bg-white p-5 overflow-y-auto"
                  : "lg:sticky lg:top-28"
              )}
            >
              {filtersOpen && (
                <button
                  className="lg:hidden mb-4 flex items-center gap-2 text-sm"
                  onClick={() => setFiltersOpen(false)}
                >
                  <X size={16} /> Close
                </button>
              )}

              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-xl text-ink-900">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-rose-600 underline hover:text-rose-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <FilterGroup title="Availability">
                <ul className="space-y-2.5">
                  <li>
                    <Checkbox
                      checked={availability.has("in-stock")}
                      onChange={() => setAvailability(toggleSet(availability, "in-stock"))}
                      label="In stock"
                      count={availabilityCounts.inStock}
                    />
                  </li>
                  <li>
                    <Checkbox
                      checked={availability.has("out-of-stock")}
                      onChange={() => setAvailability(toggleSet(availability, "out-of-stock"))}
                      label="Out of stock"
                      count={availabilityCounts.outStock}
                    />
                  </li>
                </ul>
              </FilterGroup>

              <FilterGroup title="Price">
                <div className="px-1">
                  <div className="flex items-center justify-between text-xs text-ink-600 mb-3">
                    <span>{formatPrice(priceRange[0])}</span>
                    <span>{formatPrice(priceRange[1])}</span>
                  </div>
                  <div className="relative h-1 bg-ink-100 rounded-full">
                    <div
                      className="absolute h-1 bg-rose-600 rounded-full"
                      style={{
                        left: `${((priceRange[0] - priceMin) / (priceMax - priceMin || 1)) * 100}%`,
                        right: `${
                          100 - ((priceRange[1] - priceMin) / (priceMax - priceMin || 1)) * 100
                        }%`,
                      }}
                    />
                    <input
                      type="range"
                      min={priceMin}
                      max={priceMax}
                      step={50}
                      value={priceRange[0]}
                      onChange={(e) =>
                        setPriceRange([
                          Math.min(Number(e.target.value), priceRange[1] - 50),
                          priceRange[1],
                        ])
                      }
                      className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none range-thumb"
                    />
                    <input
                      type="range"
                      min={priceMin}
                      max={priceMax}
                      step={50}
                      value={priceRange[1]}
                      onChange={(e) =>
                        setPriceRange([
                          priceRange[0],
                          Math.max(Number(e.target.value), priceRange[0] + 50),
                        ])
                      }
                      className="absolute inset-0 w-full appearance-none bg-transparent pointer-events-none range-thumb"
                    />
                  </div>
                </div>
              </FilterGroup>

              {brandCounts.length > 0 && (
                <FilterGroup title="By Brand">
                  <ul className="space-y-2.5 max-h-72 overflow-y-auto">
                    {brandCounts.map(({ brand, count }) => (
                      <li key={brand}>
                        <Checkbox
                          checked={selectedBrands.has(brand)}
                          onChange={() => setSelectedBrands(toggleSet(selectedBrands, brand))}
                          label={brand}
                          count={count}
                        />
                      </li>
                    ))}
                  </ul>
                </FilterGroup>
              )}
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-ink-100">
              <button
                onClick={() => setFiltersOpen(true)}
                className="lg:hidden flex items-center gap-2 border border-ink-200 px-4 py-2 text-sm"
              >
                <SlidersHorizontal size={14} /> Filters
              </button>

              <div className="flex-1 max-w-md hidden lg:block">
                <div className="relative">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400"
                  />
                  <input
                    type="text"
                    placeholder="Search this collection…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-ink-50 border-0 rounded-sm pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="appearance-none bg-white border border-ink-200 rounded-sm pl-3 pr-9 py-2 text-sm focus:outline-none focus:border-rose-400 cursor-pointer"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-500"
                  />
                </div>

                <div className="hidden lg:flex border border-ink-200 rounded-sm">
                  <button
                    onClick={() => setViewMode("grid-large")}
                    aria-label="Large grid"
                    className={cn(
                      "p-2 border-r border-ink-200",
                      viewMode === "grid-large" ? "bg-ink-900 text-white" : "hover:bg-ink-50"
                    )}
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    aria-label="Grid"
                    className={cn(
                      "p-2 border-r border-ink-200",
                      viewMode === "grid" ? "bg-ink-900 text-white" : "hover:bg-ink-50"
                    )}
                  >
                    <Grid3x3 size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    aria-label="List"
                    className={cn(
                      "p-2",
                      viewMode === "list" ? "bg-ink-900 text-white" : "hover:bg-ink-50"
                    )}
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={gridClass}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] bg-ink-100 rounded-sm" />
                    <div className="mt-3 h-3 bg-ink-100 w-1/3" />
                    <div className="mt-2 h-4 bg-ink-100 w-2/3" />
                  </div>
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <div className="text-center py-24 border border-ink-100 rounded-sm">
                <p className="font-display text-2xl text-ink-900 mb-2">No products found</p>
                <p className="text-sm text-ink-500 mb-6">Try adjusting your filters.</p>
                <button onClick={resetFilters} className="btn-outline">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className={gridClass}>
                {sorted.map((p) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-ink-100 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-3"
      >
        <span className="text-sm font-medium text-ink-900">{title}</span>
        <ChevronDown
          size={14}
          className={cn("text-ink-500 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <div className="animate-fade-in">{children}</div>}
    </div>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onChange}
      className="w-full flex items-center justify-between text-sm group hover:text-rose-600 transition-colors"
    >
      <span className="flex items-center gap-2.5">
        <span
          className={cn(
            "w-4 h-4 border rounded-sm flex items-center justify-center transition-colors flex-shrink-0",
            checked ? "bg-ink-900 border-ink-900" : "border-ink-300 group-hover:border-ink-500"
          )}
        >
          {checked && (
            <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="currentColor">
              <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 10-1.06 1.06l2.81 2.81a.75.75 0 001.06 0l6.81-6.81a.75.75 0 10-1.06-1.06z" />
            </svg>
          )}
        </span>
        <span className="text-ink-700 group-hover:text-rose-600">{label}</span>
      </span>
      {count !== undefined && <span className="text-xs text-ink-400">({count})</span>}
    </button>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ShopContent />
    </Suspense>
  );
}
