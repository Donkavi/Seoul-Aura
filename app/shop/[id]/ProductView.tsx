"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  Minus,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  Globe,
  Lock,
  Flame,
  Share2,
  Expand,
  X,
  ZoomIn,
  Star,
  Package,
  Clock,
  Phone,
  Mail,
  Check,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { formatPrice, cn } from "@/lib/utils";
import StarRating from "@/components/product/StarRating";
import ProductCard from "@/components/shop/ProductCard";
import NotifyMeForm from "@/components/product/NotifyMeForm";
import type { Product } from "@/types";


interface DescSection { title: string; content: string }

function parseDescriptionSections(desc: string): DescSection[] {
  if (!desc) return [];
  const lines = desc.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const sections: DescSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const line of lines) {
    // Header: short line ending with ":"
    if (/^[^a-z]{0,2}[A-Z].{0,50}:$/.test(line) || /^.{1,40}:$/.test(line)) {
      if (currentTitle && currentLines.length) {
        sections.push({ title: currentTitle.replace(/:$/, ""), content: currentLines.join(" ") });
      }
      currentTitle = line;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentTitle && currentLines.length) {
    sections.push({ title: currentTitle.replace(/:$/, ""), content: currentLines.join(" ") });
  }
  return sections.length >= 2 ? sections : [];
}

const ICON_MAP: Record<string, React.ElementType> = {
  truck: Truck,
  shield: ShieldCheck,
  globe: Globe,
  lock: Lock,
  star: Star,
  package: Package,
  heart: Heart,
  clock: Clock,
  phone: Phone,
  mail: Mail,
  check: Check,
};

export default function ProductView({
  product,
  related,
  showMintpay = true,
  showKoko = true,
  productBadges = [],
  productAccordions = [],
}: {
  product: Product;
  related: Product[];
  showMintpay?: boolean;
  showKoko?: boolean;
  productBadges?: { icon: string; text: string; enabled: boolean }[];
  productAccordions?: { label: string; content: string; enabled: boolean }[];
}) {
  const { addItem, openDrawer } = useCart();
  const { has: inWishlist, toggle: toggleWishlist } = useWishlist();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>("description");
  const [adding, setAdding] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [liveRating, setLiveRating] = useState({ avg: 0, count: 0, ready: false });
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product.name, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const images = product.images?.length ? product.images : [];
  const hasMultiple = images.length > 1;

  const variants = product.variants?.length ? product.variants : null;
  const activeVariant = variants ? variants[selectedVariantIdx] : null;
  // Use variant price if a variant is selected, otherwise base product price
  const activePrice = activeVariant ? activeVariant.price : product.price;

  const nextImage = () => setSelectedImage((selectedImage + 1) % images.length);
  const prevImage = () =>
    setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, selectedImage, images.length]);

  const descSections = parseDescriptionSections(product.description ?? "");
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - activePrice) / product.comparePrice) * 100)
    : 0;

  // Fetch real approved-review stats; don't trust the stored product fields
  useEffect(() => {
    fetch(`/api/reviews?productId=${product._id}&approved=true&limit=500`)
      .then((r) => r.json())
      .then((data: { rating?: number }[]) => {
        const list = Array.isArray(data) ? data : [];
        const avg = list.length
          ? list.reduce((s, r) => s + (r.rating ?? 0), 0) / list.length
          : 0;
        setLiveRating({ avg: Math.round(avg * 10) / 10, count: list.length, ready: true });
      })
      .catch(() => setLiveRating({ avg: 0, count: 0, ready: true }));
  }, [product._id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "sa-recently-viewed";
    const raw = localStorage.getItem(key);
    let list: string[] = raw ? JSON.parse(raw) : [];
    list = list.filter((id) => id !== product._id);
    list.unshift(product._id);
    list = list.slice(0, 8);
    localStorage.setItem(key, JSON.stringify(list));
  }, [product._id]);

  const handleAddToCart = () => {
    setAdding(true);
    const cartProduct = activeVariant
      ? { ...product, name: `${product.name} · ${activeVariant.name}`, price: activeVariant.price }
      : product;
    addItem(cartProduct, qty);
    setTimeout(() => setAdding(false), 1200);
  };

  const handleBuyNow = () => {
    const cartProduct = activeVariant
      ? { ...product, name: `${product.name} · ${activeVariant.name}`, price: activeVariant.price }
      : product;
    addItem(cartProduct, qty);
    setTimeout(() => (window.location.href = "/checkout"), 200);
  };

  const brandName = product.tags?.[0] ?? `${product.origin} Brand`;
  const installment = (activePrice / 3).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-12 lg:pb-16">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div
            className="relative aspect-square bg-ink-50 rounded-sm overflow-hidden group cursor-zoom-in"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
            onClick={() => setLightboxOpen(true)}
          >
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage]}
                alt={`${product.name} — view ${selectedImage + 1}`}
                fill
                className={cn(
                  "object-cover transition-transform duration-500",
                  zoom && "scale-110"
                )}
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-100 to-rose-200" />
            )}

            <div className="absolute top-5 left-5 flex flex-col gap-2">
              {product.isBestSeller && (
                <span className="badge-origin bg-ink-900 text-white">Bestseller</span>
              )}
              {discount > 0 && (
                <span className="badge-origin bg-rose-600 text-white">Save {discount}%</span>
              )}
            </div>

            <div className="absolute top-5 right-5 flex flex-col gap-2">
              <button
                aria-label="Expand image"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxOpen(true);
                }}
                className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-rose-50 transition-colors"
              >
                <Expand size={14} />
              </button>
              <div className="relative">
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-ink-900 text-white text-[10px] font-medium px-2.5 py-1 rounded whitespace-nowrap pointer-events-none">
                    Link copied!
                  </span>
                )}
                <button
                  aria-label="Share"
                  onClick={(e) => { e.stopPropagation(); handleShare(); }}
                  className={cn(
                    "w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center transition-colors",
                    copied ? "bg-green-50 text-green-600" : "hover:bg-rose-50"
                  )}
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                </button>
              </div>
            </div>

            {hasMultiple && (
              <>
                <button
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ChevronRight size={16} />
                </button>

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-semibold text-ink-700">
                  <ZoomIn size={11} />
                  {selectedImage + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {hasMultiple && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "relative w-20 h-20 lg:w-24 lg:h-24 bg-ink-50 rounded-sm overflow-hidden border-2 transition-all flex-shrink-0",
                    selectedImage === i
                      ? "border-rose-600 shadow-rose"
                      : "border-ink-100 hover:border-ink-400 opacity-70 hover:opacity-100"
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <Link
              href={`/shop?brand=${brandName}`}
              className="text-sm text-rose-600 underline-offset-4 hover:underline uppercase tracking-wider"
            >
              {brandName}
            </Link>
            <div className="flex items-start justify-between gap-3 mt-2">
              <h1 className="font-display text-3xl lg:text-4xl font-medium text-ink-900 leading-tight">
                {product.name}
              </h1>
              {product.isPreOrder ? (
                <span className="badge-origin bg-rose-600 text-white whitespace-nowrap mt-1">
                  Pre-Order
                </span>
              ) : product.stock === 0 ? (
                <span className="badge-origin bg-ink-900 text-white whitespace-nowrap mt-1">
                  Sold Out
                </span>
              ) : null}
            </div>

            <a href="#reviews" className="inline-flex items-center gap-2 mt-3 hover:text-rose-600">
              <StarRating value={Math.round(liveRating.avg)} readOnly size={14} />
              <span className="text-xs text-ink-500">
                {!liveRating.ready
                  ? "Loading…"
                  : liveRating.count > 0
                    ? `${liveRating.avg.toFixed(1)} (${liveRating.count} reviews)`
                    : "No reviews yet"}
              </span>
            </a>
          </div>

          {product.shortDescription && (
            <p className="text-sm text-ink-700 leading-relaxed">{product.shortDescription}</p>
          )}

          {descSections.length > 0 ? (
            <div className="border border-ink-100 rounded-sm divide-y divide-ink-100">
              {descSections.map((s) => (
                <div key={s.title} className="px-4 py-3">
                  <p className="text-xs font-semibold text-ink-900 uppercase tracking-wide mb-1">{s.title}</p>
                  <p className="text-sm text-ink-600 leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          ) : (
            !product.shortDescription && (
              <p className="text-sm text-ink-700 leading-relaxed">{product.description}</p>
            )
          )}

          {variants && variants.length > 1 && (
            <div>
              <p className="text-sm text-ink-900 font-medium mb-2">
                Size: <span className="text-ink-500 font-normal">{activeVariant?.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v, i) => (
                  <button
                    key={v.name}
                    onClick={() => setSelectedVariantIdx(i)}
                    className={cn(
                      "px-4 py-2 border text-sm font-medium transition-all",
                      i === selectedVariantIdx
                        ? "border-ink-900 text-ink-900 bg-white"
                        : "border-ink-200 text-ink-500 bg-ink-50 hover:border-ink-400"
                    )}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-ink-100 pt-5">
            <p className="text-xs text-ink-500 mb-1">Price</p>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="font-display text-3xl text-ink-900">{formatPrice(activePrice)}</span>
              {product.comparePrice && product.comparePrice > activePrice && (
                <span className="text-lg text-ink-400 line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
            </div>
            {(showMintpay || showKoko) && (
              <div className="text-xs text-ink-600 mt-2 space-y-1">
                {showMintpay && (
                  <p>
                    3 X Rs {installment} or 3.5% Cashback with{" "}
                    <span className="inline-block bg-ink-900 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold align-middle">
                      mintpay
                    </span>
                  </p>
                )}
                {showKoko && (
                  <p>
                    or pay in 3 × Rs {installment} with{" "}
                    <span className="inline-block bg-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold align-middle">
                      KOKO
                    </span>
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-ink-500 mt-2">
              Shipping calculated at checkout.
            </p>
          </div>

          {product.isPreOrder ? (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-ink-300 h-12">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 h-full hover:bg-ink-50"
                    aria-label="Decrease"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-3 h-full hover:bg-ink-50"
                    aria-label="Increase"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={cn(
                    "w-12 h-12 border flex items-center justify-center transition-colors",
                    inWishlist(product._id)
                      ? "border-rose-400 text-rose-600 bg-rose-50"
                      : "border-ink-300 hover:border-rose-400 hover:text-rose-600"
                  )}
                  aria-label={inWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={16} className={cn(inWishlist(product._id) && "fill-rose-600")} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-3.5 text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {adding ? "Added to Pre-Order Bag ✓" : "Pre-Order This Item"}
                </button>
                <p className="text-xs text-ink-500 text-center leading-relaxed">
                  Added to your <strong>Pre-Order</strong> bag. Our team confirms pricing &amp; availability within 48 hours — no payment until you approve.
                </p>
              </div>
            </>
          ) : product.stock > 0 ? (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center border border-ink-300 h-12">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="px-3 h-full hover:bg-ink-50"
                    aria-label="Decrease"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center font-medium">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="px-3 h-full hover:bg-ink-50"
                    aria-label="Increase"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => toggleWishlist(product)}
                  className={cn(
                    "w-12 h-12 border flex items-center justify-center transition-colors",
                    inWishlist(product._id)
                      ? "border-rose-400 text-rose-600 bg-rose-50"
                      : "border-ink-300 hover:border-rose-400 hover:text-rose-600"
                  )}
                  aria-label={inWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart size={16} className={cn(inWishlist(product._id) && "fill-rose-600")} />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="w-full border-2 border-ink-900 hover:bg-ink-900 hover:text-white text-ink-900 font-medium py-3.5 text-sm tracking-wide transition-all duration-300 disabled:opacity-50"
                >
                  {adding ? "Added to Cart ✓" : "Add to Cart"}
                </button>
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-rose-300 hover:bg-rose-400 text-ink-900 font-medium py-3.5 text-sm tracking-wide transition-all duration-300"
                >
                  Buy it now
                </button>
              </div>
            </>
          ) : (
            <NotifyMeForm productId={product._id} productName={product.name} />
          )}

          <ul className="space-y-2.5 pt-4 border-t border-ink-100 text-sm text-ink-700">
            {product.stock > 0 && product.stock <= 5 && (
              <li className="flex items-center gap-2">
                <Flame size={14} className="text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Hurry!</strong> Only {product.stock} left — get yours now!
                </span>
              </li>
            )}
            {productBadges.filter((b) => b.enabled).map((badge, i) => {
              const IconComp = ICON_MAP[badge.icon] ?? Truck;
              const text = badge.text.replace("{origin}", product.origin ?? "");
              return (
                <li key={i} className="flex items-center gap-2">
                  <IconComp size={14} className="text-ink-500 flex-shrink-0" />
                  {text}
                </li>
              );
            })}
          </ul>

          <div className="border-t border-ink-100 pt-2">
            {/* Description accordion — always first, always shown */}
            <div className="border-b border-ink-100">
              <button
                onClick={() =>
                  setOpenSection(openSection === "description" ? null : "description")
                }
                className="w-full flex items-center justify-between py-4 text-sm font-medium text-ink-900 hover:text-rose-600 transition-colors"
              >
                Description
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform duration-300",
                    openSection === "description" && "rotate-180"
                  )}
                />
              </button>
              {openSection === "description" && (
                <div className="pb-5 text-sm text-ink-600 leading-relaxed animate-fade-in">
                  <div className="space-y-3">
                    <p>{product.description}</p>
                    {product.tags.length > 0 && (
                      <p>
                        <strong className="text-ink-900">Tags:</strong>{" "}
                        {product.tags.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dynamic accordions from settings */}
            {productAccordions.filter((a) => a.enabled).map((accordion, i) => {
              const sectionId = `accordion-${i}`;
              return (
                <div key={i} className="border-b border-ink-100">
                  <button
                    onClick={() =>
                      setOpenSection(openSection === sectionId ? null : sectionId)
                    }
                    className="w-full flex items-center justify-between py-4 text-sm font-medium text-ink-900 hover:text-rose-600 transition-colors"
                  >
                    {accordion.label}
                    <ChevronDown
                      size={16}
                      className={cn(
                        "transition-transform duration-300",
                        openSection === sectionId && "rotate-180"
                      )}
                    />
                  </button>
                  {openSection === sectionId && (
                    <div className="pb-5 text-sm text-ink-600 leading-relaxed animate-fade-in">
                      <p style={{ whiteSpace: "pre-line" }}>{accordion.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 lg:mt-28">
          <h2 className="font-display text-2xl lg:text-3xl text-ink-900 mb-8">You may also like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-ink-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="absolute top-6 left-6 text-white text-sm font-medium">
            {selectedImage + 1} / {images.length}
          </div>

          <div className="relative w-full max-w-5xl aspect-square">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {hasMultiple && (
            <>
              <button
                onClick={prevImage}
                aria-label="Previous"
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={nextImage}
                aria-label="Next"
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={22} />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Go to image ${i + 1}`}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      i === selectedImage ? "w-10 bg-white" : "w-5 bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
