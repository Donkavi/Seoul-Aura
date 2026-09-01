/**
 * The delivery journey a confirmed pre-order travels once it leaves Korea.
 *
 * One list, shared by the admin drawer, the buyer emails and the public
 * tracking page, so a phase renamed here is renamed everywhere.
 */
export type DeliveryStatus =
  | "sent_from_korea"
  | "arrived_in_sri_lanka"
  | "handed_to_delivery"
  | "delivered";

export interface DeliveryPhaseMeta {
  key: DeliveryStatus;
  /** Short label for chips, buttons and the tracker rail. */
  label: string;
  /** Buyer-facing sentence — what has actually happened at this phase. */
  detail: string;
  emoji: string;
}

export const DELIVERY_PHASES: DeliveryPhaseMeta[] = [
  {
    key: "sent_from_korea",
    label: "Sent from Korea",
    detail:
      "Your parcel has left our partner in Korea and is on its way to Sri Lanka.",
    emoji: "✈️",
  },
  {
    key: "arrived_in_sri_lanka",
    label: "Arrived in Sri Lanka",
    detail:
      "Your parcel has landed in Sri Lanka and is being processed at our local hub.",
    emoji: "🛬",
  },
  {
    key: "handed_to_delivery",
    label: "Handed to Delivery",
    detail:
      "Your parcel is with our courier partner and is out for delivery to your address.",
    emoji: "🚚",
  },
  {
    key: "delivered",
    label: "Delivered",
    detail:
      "Your parcel has been delivered. We hope you love every piece — thank you for shopping with Seoul Aura!",
    emoji: "🎉",
  },
];

export const DELIVERY_STATUSES: DeliveryStatus[] = DELIVERY_PHASES.map((p) => p.key);

export function isDeliveryStatus(value: unknown): value is DeliveryStatus {
  return typeof value === "string" && (DELIVERY_STATUSES as string[]).includes(value);
}

export function deliveryPhase(status?: string | null): DeliveryPhaseMeta | undefined {
  return DELIVERY_PHASES.find((p) => p.key === status);
}

/** Position along the journey, or -1 when the parcel hasn't shipped yet. */
export function deliveryPhaseIndex(status?: string | null): number {
  return DELIVERY_PHASES.findIndex((p) => p.key === status);
}

/**
 * URL-safe, unguessable handle for the public tracking page. Long enough that
 * the page can be opened straight from an email without a login.
 */
export function generateTrackingToken(): string {
  return globalThis.crypto.randomUUID().replace(/-/g, "");
}
