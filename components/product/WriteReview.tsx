"use client";

import { useState } from "react";
import { Send, Check, AlertCircle, ImagePlus, X } from "lucide-react";
import StarRating from "./StarRating";

const MAX_IMAGES = 6;

export default function WriteReview({
  productId,
  onSubmitted,
}: {
  productId: string;
  onSubmitted?: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const addImageUrl = () => {
    const url = imageInput.trim();
    if (!url) return;
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    if (!/^https?:\/\//i.test(url)) {
      setError("Please paste a valid image URL (https://...)");
      return;
    }
    setImages([...images, url]);
    setImageInput("");
    setError("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const available = MAX_IMAGES - images.length;
    const toRead = files.slice(0, available);

    toRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (typeof ev.target?.result === "string") {
          setImages((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const removeImage = (i: number) => setImages(images.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (rating === 0) return setError("Please select a star rating");
    if (!name.trim() || !comment.trim()) return setError("Please fill in your name and review");

    setStatus("submitting");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          userName: name.trim(),
          userEmail: email.trim() || undefined,
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          images,
        }),
      });

      if (!res.ok) throw new Error("Submission failed");
      setStatus("success");
      setRating(0);
      setName("");
      setEmail("");
      setTitle("");
      setComment("");
      setImages([]);
      onSubmitted?.();
      setTimeout(() => setStatus("idle"), 4000);
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-sm p-8 text-center">
        <div className="w-14 h-14 mx-auto bg-rose-600 rounded-full flex items-center justify-center mb-4">
          <Check size={26} className="text-white" />
        </div>
        <h4 className="font-display text-2xl text-ink-900 mb-2">Thank you!</h4>
        <p className="text-sm text-ink-600">
          Your review has been submitted. It will appear once approved by our team.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8">
      <h3 className="font-display text-2xl text-ink-900 mb-2">Write a Review</h3>
      <p className="text-sm text-ink-500 mb-6">Share your experience with this product.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">
            Your Rating *
          </label>
          <StarRating value={rating} onChange={setRating} size={28} />
          {rating > 0 && (
            <p className="text-xs text-ink-500 mt-1.5 animate-fade-in">
              {["Poor", "Fair", "Good", "Very Good", "Excellent"][rating - 1]} ·{" "}
              <span className="text-rose-600">{rating}/5</span>
            </p>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              placeholder="Jane D."
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">
              Email (private)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">
            Review Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={80}
            placeholder="Sum up your experience in a few words"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            required
            rows={5}
            maxLength={1000}
            placeholder="Tell us about your skin/taste journey with this product…"
            className="input-field resize-none"
          />
          <p className="text-xs text-ink-400 mt-1.5 text-right">{comment.length}/1000</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">
            Add Photos (optional · up to {MAX_IMAGES})
          </label>

          {images.length > 0 && (
            <div className="flex gap-3 mb-3 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 flex-shrink-0 rounded-sm overflow-hidden border border-ink-200 group"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                    className="absolute top-1 right-1 w-5 h-5 bg-ink-900/80 hover:bg-rose-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addImageUrl();
                    }
                  }}
                  placeholder="Paste image URL..."
                  className="input-field flex-1 text-sm"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="px-4 border border-ink-200 hover:border-rose-400 hover:text-rose-600 text-sm font-medium transition-colors"
                >
                  Add
                </button>
              </div>

              <label className="cursor-pointer flex items-center justify-center gap-2 border border-dashed border-ink-200 hover:border-rose-400 hover:bg-rose-50/30 py-3 text-sm text-ink-600 transition-colors">
                <ImagePlus size={14} />
                <span>Or upload from device</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-3">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          {status === "submitting" ? (
            "Submitting…"
          ) : (
            <>
              <Send size={14} /> Submit Review
            </>
          )}
        </button>
      </form>
    </div>
  );
}
