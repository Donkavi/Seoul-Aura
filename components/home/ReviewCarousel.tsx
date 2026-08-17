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
  MessageSquarePlus,
  X,
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

export default function ReviewCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start", slidesToScroll: 1 });
  const [reviews, setReviews] = useState<PopulatedReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(0);
  const [activeImage, setActiveImage] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; reviewer: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/reviews?top=true&limit=10")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReviews(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    const id = setInterval(() => emblaApi.scrollNext(), 6500);
    return () => clearInterval(id);
  }, [emblaApi]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight")
        setLightbox((lb) => (lb ? { ...lb, index: (lb.index + 1) % lb.images.length } : null));
      if (e.key === "ArrowLeft")
        setLightbox((lb) =>
          lb ? { ...lb, index: lb.index === 0 ? lb.images.length - 1 : lb.index - 1 } : null
        );
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightbox]);

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
          <Link
            href="/reviews/new"
            className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-rose-600 border border-rose-200 hover:border-rose-400 hover:bg-rose-50 rounded-full px-5 py-2.5 transition-colors"
          >
            <MessageSquarePlus size={15} />
            Share Your Experience
          </Link>
        </div>

        {loading ? null : reviews.length === 0 ? (
          <div className="max-w-md mx-auto text-center bg-white border border-ink-100 rounded-sm p-10 shadow-card">
            <Quote size={28} className="mx-auto mb-3 text-rose-200 fill-rose-100" />
            <p className="font-display text-xl text-ink-900 mb-2">No reviews yet</p>
            <p className="text-sm text-ink-500">
              Be the first to share your experience with the Aura family.
            </p>
          </div>
        ) : (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {reviews.map((r) => {
                const product = getProduct(r);
                const productImage = product?.images?.[0];
                const reviewImages = r.images ?? [];
                const activeIdx = Math.min(activeImage[r._id] ?? 0, Math.max(reviewImages.length - 1, 0));
                const heroImage = reviewImages[activeIdx] ?? productImage;

                return (
                  <div
                    key={r._id}
                    className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] pl-4 first:pl-0"
                  >
                    <article className="bg-white border border-ink-100 rounded-sm overflow-hidden h-full shadow-card hover:shadow-card-hover transition-all duration-300 group flex flex-col">
                      {heroImage && (
                        <div className="relative aspect-[4/3] overflow-hidden bg-ink-50">
                          <button
                            type="button"
                            onClick={() =>
                              reviewImages.length > 0 &&
                              setLightbox({ images: reviewImages, index: activeIdx, reviewer: r.userName })
                            }
                            className={cn("block w-full h-full", reviewImages.length > 0 && "cursor-zoom-in")}
                            aria-label={reviewImages.length > 0 ? "View full-size photo" : undefined}
                          >
                            <img
                              src={heroImage}
                              alt={r.title ?? "Customer review"}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          </button>
                          {reviewImages.length > 0 && (
                            <span className="absolute top-3 left-3 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider pointer-events-none">
                              Customer Photo
                            </span>
                          )}

                          {reviewImages.length > 1 && (
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-ink-900/70 to-transparent pt-6 pb-2.5 px-2.5 flex items-center gap-1.5">
                              {reviewImages.map((img, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveImage((prev) => ({ ...prev, [r._id]: i }));
                                  }}
                                  aria-label={`View photo ${i + 1} of ${reviewImages.length}`}
                                  className={cn(
                                    "relative w-8 h-8 rounded-sm overflow-hidden border-2 flex-shrink-0 transition-all",
                                    i === activeIdx
                                      ? "border-white scale-105"
                                      : "border-white/40 opacity-70 hover:opacity-100"
                                  )}
                                >
                                  <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                              <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-white/90">
                                <ImageIcon size={10} /> {reviewImages.length}
                              </span>
                            </div>
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
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[100] bg-ink-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <X size={20} />
          </button>

          <div className="absolute top-6 left-6 text-white">
            <p className="text-xs uppercase tracking-widest text-rose-300 font-semibold">
              Customer Photo by
            </p>
            <p className="text-sm font-medium">{lightbox.reviewer}</p>
            <p className="text-xs text-white/60 mt-1">
              {lightbox.index + 1} of {lightbox.images.length}
            </p>
          </div>

          <div className="relative w-full max-w-4xl aspect-square">
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Review photo by ${lightbox.reviewer}`}
              className="w-full h-full object-contain"
            />
          </div>

          {lightbox.images.length > 1 && (
            <>
              <button
                onClick={() =>
                  setLightbox({
                    ...lightbox,
                    index: lightbox.index === 0 ? lightbox.images.length - 1 : lightbox.index - 1,
                  })
                }
                aria-label="Previous"
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() =>
                  setLightbox({ ...lightbox, index: (lightbox.index + 1) % lightbox.images.length })
                }
                aria-label="Next"
                className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronRight size={22} />
              </button>

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                {lightbox.images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setLightbox({ ...lightbox, index: i })}
                    aria-label={`Image ${i + 1}`}
                    className={cn(
                      "h-1 rounded-full transition-all",
                      i === lightbox.index ? "w-8 bg-white" : "w-4 bg-white/40 hover:bg-white/60"
                    )}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
