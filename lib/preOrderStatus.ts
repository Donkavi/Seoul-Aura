/**
 * How much payment information a pre-order reveals to the buyer at each stage.
 * Shared by the account page and the buyer emails so both stay in step.
 *
 *   none    — nothing about money yet (we're still looking into the request)
 *   pricing — item prices, delivery and total, but no deposit is due yet
 *   full    — the above plus the 25% deposit / balance split
 */
export type PaymentVisibility = "none" | "pricing" | "full";

const VISIBILITY: Record<string, PaymentVisibility> = {
  pending: "none",
  reviewing: "none",
  availability: "pricing",
  confirmed: "full",
  fulfilled: "full",
  done: "full",
  // Nothing is owed on a rejected request, so never show a deposit due.
  rejected: "pricing",
};

export function paymentVisibility(status: string): PaymentVisibility {
  return VISIBILITY[status] ?? "full";
}

/** `done` means the order is complete and fully paid — never chase payment. */
export function isPaymentComplete(status: string): boolean {
  return status === "done";
}
