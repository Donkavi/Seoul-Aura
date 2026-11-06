/**
 * Regular orders move through the same stages as pre-orders, so the admin
 * works one vocabulary across both queues.
 */
export type OrderStatus =
  | "pending"
  | "reviewing"
  | "availability"
  | "confirmed"
  | "rejected"
  | "fulfilled"
  | "done";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "reviewing",
  "availability",
  "confirmed",
  "rejected",
  "fulfilled",
  "done",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  availability: "Availability",
  confirmed: "Confirmed",
  rejected: "Rejected",
  fulfilled: "Fulfilled",
  done: "Done",
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as string[]).includes(value);
}

/** A rejected order gives its stock back; every other stage holds it. */
export function holdsStock(status: string): boolean {
  return status !== "rejected";
}

export type OrderPaymentMethod = "cod" | "bank";

export const ORDER_PAYMENT_METHODS: { id: OrderPaymentMethod; label: string; note: string }[] = [
  { id: "cod", label: "Cash on Delivery", note: "Pay for your items when your order arrives" },
  { id: "bank", label: "Bank Transfer", note: "Direct bank deposit" },
];

/**
 * What's been paid on an order and what's still owed. The delivery charge is
 * paid up front; the rest is collected by the buyer's chosen method. "done"
 * means everything is in.
 */
export function orderPayment(order: {
  status: string;
  total: number;
  shippingFee: number;
  deliveryFeePaid?: boolean;
}) {
  const complete = order.status === "done";
  const deliveryFeePaid = complete || !!order.deliveryFeePaid;
  const paid = complete ? order.total : deliveryFeePaid ? order.shippingFee : 0;
  return {
    complete,
    deliveryFeePaid,
    paid,
    balance: Math.max(0, order.total - paid),
  };
}

export function paymentMethodLabel(method?: string): string {
  return ORDER_PAYMENT_METHODS.find((m) => m.id === method)?.label ?? (method ? method.toUpperCase() : "—");
}
