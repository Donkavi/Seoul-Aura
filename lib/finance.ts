/**
 * Shared vocabulary for Admin › Finance — the ledger that replaced the
 * "Financial Monitoring Sheet" spreadsheet. Client-safe: no database code, so
 * the API routes and the admin screens validate and format money the same way.
 */

export const FINANCE_KINDS = [
  "sale",
  "purchase",
  "purchase_discount",
  "expense",
  "asset",
  "investment",
] as const;
export type FinanceKind = (typeof FINANCE_KINDS)[number];

export function isFinanceKind(v: unknown): v is FinanceKind {
  return typeof v === "string" && (FINANCE_KINDS as readonly string[]).includes(v);
}

/** For a sale: has the buyer paid. For a purchase: have we paid the supplier. */
export const PAYMENT_STATUSES = ["paid", "pending"] as const;
export type FinancePaymentStatus = (typeof PAYMENT_STATUSES)[number];

/**
 * "Who paid" when the money came out of the partners' pooled capital rather
 * than one partner's pocket — the sheet wrote this as "W,K,C". Spending from
 * the fund is nobody's personal contribution.
 */
export const BUSINESS_FUND = "Business Fund";

/** Pre-order statuses that mean the buyer has agreed to pay, i.e. a sale. */
export const PRE_ORDER_SALE_STATUSES = ["confirmed", "fulfilled", "done"];

export const KIND_LABELS: Record<FinanceKind, string> = {
  sale: "Sale",
  purchase: "Purchase",
  purchase_discount: "Purchase discount",
  expense: "Expense",
  asset: "Business asset",
  investment: "Investment",
};

/** Offered as suggestions only — any other category can be typed in. */
export const CATEGORY_SUGGESTIONS: Partial<Record<FinanceKind, string[]>> = {
  purchase: ["Product", "Ramen", "Korea Delivery", "Shipping", "Packaging", "Other"],
  expense: ["Packing", "Marketing", "SMS", "Delivery", "Website", "Other"],
  asset: ["Packing", "Marketing", "Website", "Equipment", "Other"],
};

/** Sales and purchases are priced per unit; every other kind is one amount. */
export function isPricedKind(kind: FinanceKind): boolean {
  return kind === "sale" || kind === "purchase";
}

/** A discount reduces purchases, so it counts against the running totals. */
export function signedAmount(entry: { kind: FinanceKind; amount: number }): number {
  return entry.kind === "purchase_discount" ? -entry.amount : entry.amount;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(n: number): string {
  return `Rs. ${n.toLocaleString("en-LK", { maximumFractionDigits: 2 })}`;
}

// ─── Dates ────────────────────────────────────────────────────────────────────
// A ledger date is a calendar day, stored as UTC midnight. Reading it back in
// UTC keeps "1 Aug" from drifting to 31 Jul or 2 Aug on any machine.

/** "2026-08-01" (or a full ISO string) → that day at UTC midnight; null if invalid. */
export function parseLedgerDate(v: unknown): Date | null {
  if (v instanceof Date) v = v.toISOString();
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}/.test(v)) return null;
  const d = new Date(`${v.slice(0, 10)}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatLedgerDate(d: string | Date): string {
  return new Date(d).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Value for an <input type="date">. */
export function toDateInput(d: string | Date): string {
  return new Date(d).toISOString().slice(0, 10);
}

export function todayInput(): string {
  // The admins work in Sri Lanka; en-CA formats as YYYY-MM-DD.
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" });
}

/** "2026-08" → "August 2026" */
export function formatMonth(key: string): string {
  return new Date(`${key}-01T00:00:00.000Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
}

/** Mongo filter for `from`–`to` inclusive (either end may be open). */
export function dateRangeFilter(from?: string | null, to?: string | null) {
  const range: { $gte?: Date; $lt?: Date } = {};
  const start = parseLedgerDate(from);
  const end = parseLedgerDate(to);
  if (start) range.$gte = start;
  if (end) range.$lt = new Date(end.getTime() + 86400000);
  return Object.keys(range).length ? { date: range } : {};
}

// ─── Validation ──────────────────────────────────────────────────────────────

/** An entry exactly as it is stored. Keys that don't apply to the kind are left undefined. */
export interface NormalizedEntry {
  kind: FinanceKind;
  date: Date;
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  unitPriceKRW?: number;
  brand?: string;
  category?: string;
  paidBy?: string;
  reference?: string;
  customer?: string;
  paymentStatus?: FinancePaymentStatus;
  paymentMethod?: string;
  source?: string;
  deliveryFeeCharged?: boolean;
  notes?: string;
}

const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

/** undefined when blank, NaN when present but not a number. */
const num = (v: unknown) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

/**
 * Checks an entry from the admin form (or the sheet import) and returns it in
 * stored form. For sales and purchases the total is always quantity × unit
 * price, so it can never disagree with the line.
 */
export function normalizeEntry(
  kind: FinanceKind,
  raw: Record<string, unknown>
): { entry: NormalizedEntry } | { error: string } {
  const date = parseLedgerDate(raw.date);
  if (!date) return { error: "A valid date is required" };

  const description = text(raw.description);
  if (!description) {
    return { error: kind === "purchase_discount" ? "Enter the reason for the discount" : "Enter a description" };
  }

  const paidBy = text(raw.paidBy);
  if (kind !== "sale" && !paidBy) {
    return { error: kind === "investment" ? "Choose the partner who invested" : "Choose who paid" };
  }
  if (kind === "investment" && paidBy === BUSINESS_FUND) {
    return { error: "An investment has to come from a partner, not the Business Fund" };
  }

  const priced = isPricedKind(kind);
  let quantity: number | undefined;
  let unitPrice: number | undefined;
  let amount: number;
  if (priced) {
    quantity = num(raw.quantity) ?? 1;
    unitPrice = num(raw.unitPrice);
    if (Number.isNaN(quantity) || quantity <= 0) return { error: "Quantity must be more than 0" };
    if (unitPrice === undefined || Number.isNaN(unitPrice) || unitPrice < 0) {
      return { error: kind === "sale" ? "Enter the selling price" : "Enter the cost price" };
    }
    unitPrice = roundMoney(unitPrice);
    amount = roundMoney(quantity * unitPrice);
  } else {
    const a = num(raw.amount);
    if (a === undefined || Number.isNaN(a) || a < 0) return { error: "Enter a valid amount" };
    amount = roundMoney(a);
  }

  const krw = kind === "purchase" ? num(raw.unitPriceKRW) : undefined;
  if (krw !== undefined && (Number.isNaN(krw) || krw < 0)) return { error: "Enter a valid KRW cost" };

  const status = PAYMENT_STATUSES.find((s) => s === raw.paymentStatus);

  return {
    entry: {
      kind,
      date,
      description,
      amount,
      quantity,
      unitPrice,
      unitPriceKRW: krw,
      brand: priced ? text(raw.brand) : undefined,
      category: kind === "sale" || kind === "purchase_discount" || kind === "investment" ? undefined : text(raw.category),
      paidBy: kind === "sale" ? undefined : paidBy,
      reference: priced ? text(raw.reference) : undefined,
      customer: kind === "sale" ? text(raw.customer) : undefined,
      paymentStatus: priced ? status ?? (kind === "sale" ? "pending" : "paid") : undefined,
      paymentMethod: priced ? text(raw.paymentMethod) : undefined,
      source: kind === "purchase" ? text(raw.source) : undefined,
      deliveryFeeCharged: kind === "sale" ? raw.deliveryFeeCharged === true : undefined,
      notes: text(raw.notes),
    },
  };
}
