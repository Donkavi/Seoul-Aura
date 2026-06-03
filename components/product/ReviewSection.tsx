"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ThumbsUp,
  MessageSquarePlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Image as ImageIcon,
} from "lucide-react";
import StarRating from "./StarRating";
import WriteReview from "./WriteReview";
import { cn, relativeDate, ratingDistribution } from "@/lib/utils";
import type { Review } from "@/types";

export default function ReviewSection({
  productId,
  initialAverage,
  initialCount,
}: {
  productId: string;
  initialAverage: number;
  initialCount: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [filter, setFilter] = useState<number | null>(null);
  const [withPhotos, setWithPhotos] = useState(false);
  const [sort, setSort] = useState<"recent" | "helpful" | "high" | "low">("recent");
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  const loadReviews = () => {
    setLoading(true);
    fetch(`/api/reviews?productId=${productId}&approved=true&limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

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

  const distribution = ratingDistribution(reviews);
  // Use live fetched data once loaded; only use initialCount/Average before first load completes
  const total = loading ? initialCount : reviews.length;
  const average = loading
    ? initialAverage
    : reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  let filtered = filter !== null ? reviews.filter((r) => Math.round(r.rating) === filter) : reviews;
  if (withPhotos) filtered = filtered.filter((r) => (r.images?.length ?? 0) > 0);
  const photoCount = reviews.filter((r) => (r.images?.length ?? 0) > 0).length;

  const sorted = [...filtered].sort((a, b) => {
    switch (sort) {
      case "high":
        return b.rating - a.rating;
      case "low":
        return a.rating - b.rating;
      case "recent":
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const visible = sorted.slice(0, visibleCount);

  return (
    <section id="reviews" className="bg-rose-25/30 py-16 lg:py-20 border-t border-ink-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="mb-12">
          <p className="section-subtitle text-rose-600 mb-2">Customer Stories</p>
          <h2 className="section-title">Reviews & Ratings</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 mb-10">
          <div className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8 text-center lg:col-span-1">
            <div className="text-6xl font-display text-ink-900 mb-2 leading-none">
              {average.toFixed(1)}
              <span className="text-3xl text-ink-400 font-light">/5</span>
            </div>
            <StarRating value={Math.round(average)} readOnly className="justify-center mb-3" size={20} />
            <p className="text-sm text-ink-500 mb-6">Based on {total} reviews</p>

            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <MessageSquarePlus size={16} />
              Write a Review
            </button>
          </div>

          <div className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8 lg:col-span-2">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-5">
              Rating Breakdown
            </h4>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] ?? 0;
                const percent = total > 0 ? (count / total) * 100 : 0;
                return (
                  <button
                    key={star}
                    onClick={() => setFilter(filter === star ? null : star)}
                    className={cn(
                      "w-full flex items-center gap-4 group hover:bg-rose-50/50 -mx-2 px-2 py-1.5 rounded transition-colors",
                      filter === star && "bg-rose-50"
                    )}
                  >
                    <span className="text-sm font-medium text-ink-700 w-8 flex items-center gap-1">
                      {star}
                      <span className="text-gold-400">★</span>
                    </span>
                    <div className="flex-1 h-2 bg-ink-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-400 to-rose-600 transition-all duration-700"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-500 w-12 text-right">{count}</span>
                  </button>
                );
              })}
            </div>
            {filter !== null && (
              <button
                onClick={() => setFilter(null)}
                className="text-xs text-rose-600 mt-4 hover:underline"
              >
                Clear filter ({filter}★ only)
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div className="mb-10 animate-fade-up">
            <WriteReview
              productId={productId}
              onSubmitted={() => {
                setShowForm(false);
                loadReviews();
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-display text-2xl text-ink-900">
              {filter !== null ? `${filter}-Star Reviews` : "All Reviews"}
              <span className="text-ink-400 text-base font-body ml-2">({sorted.length})</span>
            </h3>
            {photoCount > 0 && (
              <button
                onClick={() => setWithPhotos(!withPhotos)}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors",
                  withPhotos
                    ? "bg-rose-600 border-rose-600 text-white"
                    : "border-ink-200 text-ink-700 hover:border-rose-400 hover:text-rose-600"
                )}
              >
                <ImageIcon size={12} /> With Photos ({photoCount})
              </button>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="bg-white border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
          >
            <option value="recent">Most Recent</option>
            <option value="high">Highest Rating</option>
            <option value="low">Lowest Rating</option>
          </select>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-100 p-6 rounded-sm animate-pulse">
                <div className="h-4 bg-ink-100 w-1/3 mb-3" />
                <div className="h-4 bg-ink-100 w-full mb-2" />
                <div className="h-4 bg-ink-100 w-2/3" />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-sm p-12 text-center">
            <p className="font-display text-2xl text-ink-900 mb-2">No reviews yet</p>
            <p className="text-sm text-ink-500 mb-6">Be the first to share your experience!</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Write the First Review
            </button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2">
            {visible.map((r, idx) => (
              <article
                key={r._id}
                className="bg-white border border-ink-100 rounded-sm p-6 hover:shadow-card transition-shadow animate-fade-up"
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <div className="flex items-start justify-between mb-3 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {r.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-ink-900 text-sm flex items-center gap-1.5">
                        {r.userName}
                        {r.isVerifiedBuyer && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-medium uppercase tracking-wider">
                            <BadgeCheck size={10} /> Verified Buyer
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-ink-400 mt-0.5">{relativeDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <StarRating value={r.rating} readOnly size={14} />
                </div>

                {r.title && (
                  <h4 className="font-display text-lg text-ink-900 mb-2">{r.title}</h4>
                )}

                <p className="text-sm text-ink-700 leading-relaxed">{r.comment}</p>

                {r.images && r.images.length > 0 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
                    {r.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setLightbox({ images: r.images!, index: i })}
                        className="relative w-20 h-20 lg:w-24 lg:h-24 rounded-sm overflow-hidden border border-ink-100 hover:border-rose-400 transition-colors flex-shrink-0 group"
                      >
                        <img
                          src={img}
                          alt={`Review photo ${i + 1} by ${r.userName}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink-50">
                  <button className="text-xs text-ink-500 hover:text-rose-600 flex items-center gap-1.5">
                    <ThumbsUp size={12} /> Helpful
                  </button>
                  {r.images && r.images.length > 0 && (
                    <span className="text-xs text-ink-400 flex items-center gap-1.5">
                      <ImageIcon size={11} /> {r.images.length} photo{r.images.length > 1 && "s"}
                    </span>
                  )}
                </div>
              </article>
            ))}

            {sorted.length > visibleCount && (
              <button
                onClick={() => setVisibleCount(visibleCount + 5)}
                className="btn-outline w-full inline-flex items-center justify-center gap-2"
              >
                Show More Reviews <ChevronDown size={14} />
              </button>
            )}
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

          <div className="absolute top-6 left-6 text-white text-sm font-medium">
            {lightbox.index + 1} / {lightbox.images.length}
          </div>

          <div className="relative w-full max-w-4xl aspect-square">
            <img
              src={lightbox.images[lightbox.index]}
              alt="Customer review photo"
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
            </>
          )}
        </div>
      )}
    </section>
  );
}
