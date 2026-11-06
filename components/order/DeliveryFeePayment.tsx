"use client";

import { useRef, useState } from "react";
import { Check, Loader2, Upload, Landmark, ExternalLink } from "lucide-react";
import { BANK_DETAILS } from "@/lib/bankDetails";
import { uploadReceiptImage } from "@/lib/uploadImage";
import { formatPrice, cn } from "@/lib/utils";

/**
 * How to pay a regular order's delivery charge, plus the bank-slip upload.
 * Used at checkout (before the order exists) and from the account page.
 */
export default function DeliveryFeePayment({
  amount,
  receiptUrl,
  paid,
  onUploaded,
  className,
}: {
  amount: number;
  receiptUrl?: string;
  /** Admin has verified the payment — nothing left to do. */
  paid?: boolean;
  /** Called with the uploaded slip's URL; throw to show an error. */
  onUploaded: (url: string) => Promise<void> | void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const pick = async (file?: File) => {
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const url = await uploadReceiptImage(file);
      await onUploaded(url);
    } catch (err) {
      setError((err as Error).message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (paid) {
    return (
      <div className={cn("bg-green-50 border border-green-200 rounded-sm px-4 py-3 flex items-center gap-2.5", className)}>
        <Check size={16} className="text-green-700 flex-shrink-0" />
        <p className="text-sm text-green-800">
          Delivery charge of <strong>{formatPrice(amount)}</strong> received — your order is locked in.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("border border-ink-100 rounded-sm overflow-hidden", className)}>
      <div className="bg-ink-50/60 px-4 py-3 flex items-center gap-2 border-b border-ink-100">
        <Landmark size={14} className="text-rose-600" />
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-700">
          Pay delivery charge · {formatPrice(amount)}
        </p>
      </div>

      <dl className="px-4 py-3 text-sm space-y-1.5">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Account name</dt>
          <dd className="font-medium text-ink-900 text-right">{BANK_DETAILS.accountName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Bank</dt>
          <dd className="text-ink-900 text-right">{BANK_DETAILS.bank}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-500">Account number</dt>
          <dd className="font-mono font-semibold text-ink-900">{BANK_DETAILS.accountNumber}</dd>
        </div>
      </dl>

      <div className="px-4 py-3 border-t border-ink-100">
        {receiptUrl ? (
          <div className="flex items-center gap-3">
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
              <img src={receiptUrl} alt="Uploaded bank slip" className="w-14 h-14 object-cover rounded-sm border border-ink-100" />
            </a>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-700 flex items-center gap-1">
                <Check size={14} /> Slip uploaded
              </p>
              <p className="text-xs text-ink-500">We&apos;ll verify it and confirm your order.</p>
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1">
                View <ExternalLink size={10} />
              </a>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="text-xs text-ink-500 hover:text-rose-600 disabled:opacity-60 flex-shrink-0"
            >
              {uploading ? "Uploading…" : "Replace"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-rose-300 hover:bg-rose-25/60 text-rose-700 text-sm font-medium py-3 rounded-sm transition-colors disabled:opacity-60"
          >
            {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
            {uploading ? "Uploading slip…" : "Upload bank slip"}
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {error && <p className="text-xs text-rose-700 mt-2">{error}</p>}
        <p className="text-[11px] text-ink-400 mt-2">
          You can also send the slip via WhatsApp to{" "}
          <a href={BANK_DETAILS.whatsappLink} target="_blank" rel="noopener" className="text-rose-600 hover:underline">
            {BANK_DETAILS.whatsappDisplay}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
