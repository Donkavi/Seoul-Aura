"use client";

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Flag,
  Star,
  MessageSquare,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";
import type { Review } from "@/types";

type FilterTab = "pending" | "approved" | "flagged" | "all";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; reviewer: string } | null>(
    null
  );

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

  const load = async () => {
    setLoading(true);
    let url = "/api/reviews?limit=100";
    if (tab === "pending") url += "&approved=false";
    if (tab === "approved") url += "&approved=true";

    const data = await fetch(url).then((r) => r.json());
    let filtered = Array.isArray(data) ? data : [];
    if (tab === "flagged") filtered = filtered.filter((r: Review) => r.flagged);

    setReviews(filtered);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleApprove = async (id: string) => {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true, flagged: false }),
    });
    await load();
  };

  const handleFlag = async (id: string) => {
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged: true, isApproved: false }),
    });
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review permanently?")) return;
    await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    await load();
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "flagged", label: "Flagged" },
    { key: "all", label: "All Reviews" },
  ];

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
          Community Moderation
        </p>
        <h1 className="font-display text-4xl text-ink-900">Review Moderation</h1>
        <p className="text-sm text-ink-500 mt-1">
          Approve, flag, or remove customer reviews
        </p>
      </header>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 flex items-center gap-1 p-2 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-sm transition-colors whitespace-nowrap",
                tab === t.key
                  ? "bg-rose-600 text-white"
                  : "text-ink-700 hover:bg-ink-50"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading reviews…</div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900 mb-1">No reviews in this category</p>
            <p className="text-sm text-ink-500">
              {tab === "pending"
                ? "All caught up! No reviews waiting for moderation."
                : "Try a different filter."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Reviewer</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Rating</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Review</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Date</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Status</th>
                <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id} className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white text-xs font-semibold">
                        {r.userName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900">{r.userName}</p>
                        <p className="text-[10px] text-ink-400">Product #{r.productId.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={11}
                          className={
                            i < r.rating
                              ? "fill-gold-400 text-gold-400"
                              : "fill-ink-100 text-ink-200"
                          }
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-4 max-w-md">
                    {r.title && (
                      <p className="text-sm font-medium text-ink-900 mb-1">{r.title}</p>
                    )}
                    <p className="text-xs text-ink-600 line-clamp-2">{r.comment}</p>
                    {r.images && r.images.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {r.images.slice(0, 4).map((img, i) => (
                          <button
                            key={i}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLightbox({
                                images: r.images,
                                index: i,
                                reviewer: r.userName,
                              });
                            }}
                            className="relative w-12 h-12 rounded-sm overflow-hidden border border-ink-200 hover:border-rose-400 hover:scale-105 transition-all flex-shrink-0 group"
                            aria-label={`View photo ${i + 1}`}
                          >
                            <img
                              src={img}
                              alt={`Photo ${i + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {i === 3 && r.images.length > 4 && (
                              <span className="absolute inset-0 bg-ink-900/70 text-white text-[10px] font-semibold flex items-center justify-center">
                                +{r.images.length - 3}
                              </span>
                            )}
                          </button>
                        ))}
                        <span className="text-[10px] text-ink-400 self-center flex items-center gap-0.5 ml-1">
                          <ImageIcon size={10} />
                          {r.images.length}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs text-ink-500">{relativeDate(r.createdAt)}</td>
                  <td className="p-4">
                    {r.flagged ? (
                      <span className="badge-origin bg-rose-50 text-rose-700">Flagged</span>
                    ) : r.isApproved ? (
                      <span className="badge-origin bg-green-50 text-green-700">Approved</span>
                    ) : (
                      <span className="badge-origin bg-gold-50 text-gold-700">Pending</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {!r.isApproved && (
                        <button
                          onClick={() => handleApprove(r._id)}
                          className="p-2 hover:bg-green-50 rounded text-ink-600 hover:text-green-600 transition-colors"
                          title="Approve"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      {!r.flagged && (
                        <button
                          onClick={() => handleFlag(r._id)}
                          className="p-2 hover:bg-gold-50 rounded text-ink-600 hover:text-gold-600 transition-colors"
                          title="Flag"
                        >
                          <Flag size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="p-2 hover:bg-rose-50 rounded text-ink-600 hover:text-rose-600 transition-colors"
                        title="Delete"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                    index:
                      lightbox.index === 0 ? lightbox.images.length - 1 : lightbox.index - 1,
                  })
                }
                aria-label="Previous"
                className="absolute left-4 lg:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <ChevronLeft size={22} />
              </button>
              <button
                onClick={() =>
                  setLightbox({
                    ...lightbox,
                    index: (lightbox.index + 1) % lightbox.images.length,
                  })
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
    </div>
  );
}
