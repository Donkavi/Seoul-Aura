"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import {
  Star,
  Quote,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  Image as ImageIcon,
} from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";

interface PopulatedReview {
  _id: string;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedBuyer?: boolean;
  createdAt: string;
  productId?:
    | string
    | {
        _id: string;
        name: string;
        slug: string;
        images: string[];
      };
}

const fallbackReviews: PopulatedReview[] = [
  {
    _id: "f1",
    userName: "Sanduni P.",
    rating: 5,
    title: "Skin transformation",
    comment:
      "I've been using this product for a month and I'm amazed at how much it brightened up dark spots on my face. Helped maintain moisture and overall brightened my complexion!",
    images: ["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop"],
    isVerifiedBuyer: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    productId: { _id: "d1", name: "COSRX Snail Mucin Essence", slug: "demo", images: [] },
  },
  {
    _id: "f2",
    userName: "Krishani R.",
    rating: 5,
    title: "Fast delivery, authentic",
    comment:
      "A 'go-to' place for genuine products at reasonable prices. Very much satisfied with their super fast delivery service. Highly recommended!",
    isVerifiedBuyer: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    productId: { _id: "d2", name: "Monthly K-Beauty Box", slug: "demo", images: [] },
  },
  {
    _id: "f3",
    userName: "Tharushi M.",
    rating: 5,
    title: "Worth repurchasing",
    comment:
      "Look, love, look! I have repurchased twice already. The Dubai snack box was such a delightful surprise too — Bateel dates are insanely good.",
    images: ["https://images.unsplash.com/photo-1601493700518-4f9f5a8fcb3a?w=400&h=400&fit=crop"],
    isVerifiedBuyer: true,
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    productId: { _id: "d3", name: "Dubai Snack Box", slug: "demo", images: [] },
  },
];

export default function ReviewCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const [reviews, setReviews] = useState<PopulatedReview[]>(fallbackReviews);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    fetch("/api/reviews?top=true&limit=10")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setReviews(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    const id = setInterval(() => emblaApi.scrollNext(), 6500);
    return () => clearInterval(id);
  }, [emblaApi]);

  const getProduct = (r: PopulatedReview) =>
    typeof r.productId === "object" ? r.productId : null;

  return (
    <section className="py-16 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-50/40 to-white" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-rose-100 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-gold-50 rounded-full blur-3xl opacity-60" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-12">
          <p className="section-subtitle text-rose-600 mb-3">★ Verified Voices ★</p>
          <h2 className="font-display text-3xl lg:text-5xl font-medium text-ink-900 italic">
            Whispers from the Aura family
          </h2>
          <p className="text-sm text-ink-500 mt-3 max-w-md mx-auto">
            Honest reflections from skincare devotees and curious foodies who let us into their daily ritual.
          </p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {reviews.map((r) => {
                const product = getProduct(r);
                const productImage = product?.images?.[0];
                const reviewImage = r.images?.[0];
                const heroImage = reviewImage ?? productImage;

                return (
                  <div
                    key={r._id}
                    className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 first:pl-0"
                  >
                    <article className="bg-white border border-ink-100 rounded-sm overflow-hidden h-full shadow-card hover:shadow-card-hover transition-all duration-300 group flex flex-col">
                      {heroImage && (
                        <div className="relative aspect-[4/3] overflow-hidden bg-ink-50">
                          <img
                            src={heroImage}
                            alt={r.title ?? "Customer review"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          {r.images && r.images.length > 1 && (
                            <span className="absolute bottom-3 right-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-[10px] font-semibold text-ink-700 flex items-center gap-1">
                              <ImageIcon size={10} /> +{r.images.length - 1}
                            </span>
                          )}
                          {reviewImage && (
                            <span className="absolute top-3 left-3 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider">
                              Customer Photo
                            </span>
                          )}
                        </div>
                      )}

                      <div className="p-6 lg:p-7 flex-1 flex flex-col relative">
                        <Quote
                          size={32}
                          className="absolute top-5 right-5 text-rose-100 fill-rose-100"
                        />
                        <div className="flex gap-0.5 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={13}
                              className={cn(
                                i < r.rating
                                  ? "fill-gold-400 text-gold-400"
                                  : "fill-ink-100 text-ink-100"
                              )}
                            />
                          ))}
                        </div>

                        {r.title && (
                          <h3 className="font-display text-lg text-ink-900 mb-2 leading-snug">
                            {r.title}
                          </h3>
                        )}

                        <p className="text-sm text-ink-700 leading-relaxed mb-5 line-clamp-4 flex-1">
                          {r.comment}
                        </p>

                        <div className="border-t border-ink-100 pt-4 flex items-center justify-between mt-auto">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-ink-900 flex items-center gap-1.5 truncate">
                              {r.userName}
                              {r.isVerifiedBuyer && (
                                <BadgeCheck
                                  size={14}
                                  className="text-rose-600 flex-shrink-0"
                                />
                              )}
                            </p>
                            {product && (
                              <Link
                                href={`/shop/${product.slug ?? product._id}`}
                                className="text-xs text-ink-400 italic hover:text-rose-600 transition-colors truncate block"
                              >
                                on {product.name}
                              </Link>
                            )}
                          </div>
                          <span className="text-[10px] text-ink-400 uppercase tracking-wider flex-shrink-0 ml-2">
                            {relativeDate(r.createdAt)}
                          </span>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-0 top-1/3 -translate-y-1/2 -translate-x-4 hidden md:flex w-11 h-11 bg-white shadow-card rounded-full items-center justify-center hover:bg-rose-600 hover:text-white transition-colors z-10"
            aria-label="Previous"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-0 top-1/3 -translate-y-1/2 translate-x-4 hidden md:flex w-11 h-11 bg-white shadow-card rounded-full items-center justify-center hover:bg-rose-600 hover:text-white transition-colors z-10"
            aria-label="Next"
          >
            <ChevronRight size={18} />
          </button>

          <div className="flex justify-center gap-1.5 mt-8">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === selected ? "w-8 bg-rose-600" : "w-1.5 bg-ink-200"
                )}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
