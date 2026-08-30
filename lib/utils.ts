import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number): string {
  return `Rs. ${amount.toLocaleString("en-LK")}`;
}

/**
 * What a shopper saves on one line against its compare-at price.
 *
 * `comparePrice` is the "was" figure, so it only counts when it is genuinely
 * higher than what they pay — a missing or lower one means no saving, never a
 * negative number that would quietly eat into the total.
 */
export function lineSavings(
  price: number,
  comparePrice: number | undefined | null,
  quantity = 1
): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return (comparePrice - price) * quantity;
}

/** Total saved across a set of lines, for the "you saved" figures. */
export function sumSavings(
  lines: Array<{ price: number; comparePrice?: number | null; quantity: number }>
): number {
  return lines.reduce((sum, l) => sum + lineSavings(l.price, l.comparePrice, l.quantity), 0);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const prefix = "SA";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function truncate(text: string, length: number): string {
  return text.length > length ? text.slice(0, length) + "…" : text;
}

export function starArray(rating: number): boolean[] {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
}

export function ratingDistribution(
  reviews: Array<{ rating: number }>
): Record<number, number> {
  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    const rating = Math.round(r.rating);
    if (rating >= 1 && rating <= 5) dist[rating]++;
  });
  return dist;
}

export function relativeDate(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
