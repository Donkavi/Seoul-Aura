"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { PackagePlus, Check, Loader2, X, ImagePlus } from "lucide-react";
import { uploadReviewImage, commaFreeImageUrl } from "@/lib/uploadImage";
import type { ChatRequestBlock } from "@/types";

const MAX_PHOTOS = 3;

/**
 * Shown when the assistant searched and genuinely found nothing suitable.
 * Collapsed to a single button until the shopper opts in — the conversation
 * should not turn into a form unless they actually want the product sourced.
 */
export default function ProductRequestCard({
  block,
  lastUserMessage,
}: {
  block: ChatRequestBlock;
  lastUserMessage?: string;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(session?.user?.name ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - images.length;
    if (room <= 0) return;

    setUploading(true);
    setError("");
    try {
      const uploaded = await Promise.all(
        Array.from(files)
          .slice(0, room)
          // Comma-free so the URL survives the admin form's comma-separated images field.
          .map((file) => uploadReviewImage(file).then(commaFreeImageUrl))
      );
      setImages((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That photo would not upload.");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("We need an email so we can tell you when it arrives.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: block.productName,
          brand: block.brand,
          category: block.category,
          concern: block.concern,
          reason: block.reason,
          customerMessage: lastUserMessage,
          customerName: name.trim(),
          customerEmail: email.trim(),
          phoneNumber: phone.trim(),
          images,
          source: "chat",
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
    } catch {
      setError("That did not go through. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-sm p-3">
        <Check size={15} className="text-green-700 mt-0.5 flex-shrink-0" strokeWidth={2.5} />
        <div className="text-[12px] leading-relaxed text-green-900">
          <p className="font-semibold">Request sent</p>
          <p className="text-green-800/80 mt-0.5">
            Our team will look into sourcing{" "}
            <span className="font-medium">{block.productName}</span> and email you if we bring it in.
          </p>
          {images.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {images.map((url) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={url}
                  src={url}
                  alt="Photo you sent with the request"
                  className="w-10 h-10 object-cover rounded-sm border border-green-200"
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-25 border border-rose-100 rounded-sm overflow-hidden">
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
            <PackagePlus size={14} className="text-rose-600" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[9px] uppercase tracking-[0.18em] text-rose-600 font-semibold">
              Not in store yet
            </p>
            <p className="text-[13px] font-medium text-ink-900 leading-snug mt-0.5">
              {block.brand ? `${block.brand} — ` : ""}
              {block.productName}
            </p>
            {block.reason && (
              <p className="text-[11px] text-ink-500 leading-relaxed mt-1">{block.reason}</p>
            )}
          </div>
        </div>

        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] uppercase tracking-[0.15em] font-semibold py-2.5 rounded-sm transition-colors duration-300"
          >
            Request we stock this
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="border-t border-rose-100 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink-500 font-semibold">
              Where should we reach you?
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cancel request"
              className="text-ink-400 hover:text-ink-700 transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full border border-ink-200 rounded-sm px-3 py-2 text-[12px] focus:outline-none focus:border-rose-400 transition-colors"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            className="w-full border border-ink-200 rounded-sm px-3 py-2 text-[12px] focus:outline-none focus:border-rose-400 transition-colors"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full border border-ink-200 rounded-sm px-3 py-2 text-[12px] focus:outline-none focus:border-rose-400 transition-colors"
          />

          {/* A photo of the exact bottle removes the guesswork when sourcing it. */}
          <div className="pt-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              {images.map((url) => (
                <span key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt="Product you are requesting"
                    className="w-12 h-12 object-cover rounded-sm border border-ink-200"
                  />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((u) => u !== url))}
                    aria-label="Remove photo"
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink-900 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                  >
                    <X size={9} strokeWidth={3} />
                  </button>
                </span>
              ))}

              {images.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 border border-dashed border-ink-300 rounded-sm text-ink-400 hover:border-rose-400 hover:text-rose-600 disabled:opacity-60 transition-colors"
                >
                  {uploading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <ImagePlus size={14} strokeWidth={1.75} />
                  )}
                </button>
              )}
            </div>
            <p className="text-[10px] text-ink-400 mt-1.5 leading-relaxed">
              Add a photo of the product if you have one — it helps us source the exact item.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {error && <p className="text-[11px] text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-ink-900 hover:bg-rose-600 disabled:opacity-60 text-white text-[10px] uppercase tracking-[0.15em] font-semibold py-2.5 rounded-sm transition-colors duration-300 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Sending
              </>
            ) : (
              "Send request"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
