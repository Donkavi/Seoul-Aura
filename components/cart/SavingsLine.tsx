import { Tag } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";

/**
 * The "you save" figure that sits with every set of totals.
 *
 * Rendered as a deduction (−Rs. …) directly under the original price, so the
 * three rows read as arithmetic the shopper can follow: original, less the
 * saving, equals what they pay. Gold rather than rose, matching the discount
 * badges on product cards, so it does not compete with the rose used for the
 * amount actually owed.
 *
 * Renders nothing when there is no saving, so callers can drop it in anywhere.
 */
export default function SavingsLine({
  amount,
  label = "You save",
  /** Pre-order prices are estimates until the quote lands, so they read "~". */
  approx = false,
  className,
}: {
  amount: number;
  label?: string;
  approx?: boolean;
  className?: string;
}) {
  if (!amount || amount <= 0) return null;

  return (
    <div className={cn("flex justify-between items-center text-sm", className)}>
      <span className="inline-flex items-center gap-1.5 text-gold-600 font-medium">
        <Tag size={13} strokeWidth={2} />
        {label}
      </span>
      <span className="font-semibold text-gold-600 whitespace-nowrap">
        −{approx ? "~" : ""}
        {formatPrice(amount)}
      </span>
    </div>
  );
}

/**
 * The strike-through "was" figure the saving is deducted from. Falls back to the
 * plain subtotal label when nothing is discounted, so an undiscounted bag still
 * reads normally instead of showing a redundant pair of identical rows.
 */
export function OriginalPriceLine({
  originalTotal,
  total,
  savings,
  label = "Original price",
  fallbackLabel = "Subtotal",
  approx = false,
  className,
}: {
  originalTotal: number;
  total: number;
  savings: number;
  label?: string;
  fallbackLabel?: string;
  approx?: boolean;
  className?: string;
}) {
  const discounted = savings > 0;
  const prefix = approx ? "~" : "";

  return (
    <div className={cn("flex justify-between items-center text-sm", className)}>
      <span className="text-ink-500">{discounted ? label : fallbackLabel}</span>
      <span
        className={cn(
          "whitespace-nowrap",
          discounted ? "text-ink-400 line-through" : "font-medium text-ink-900"
        )}
      >
        {prefix}
        {formatPrice(discounted ? originalTotal : total)}
      </span>
    </div>
  );
}
