import type { Metadata } from "next";
import Link from "next/link";
import { PackageX } from "lucide-react";
import { connectDB } from "@/lib/mongodb";
import PreOrder from "@/models/PreOrder";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import TrackView, { type TrackData } from "@/components/track/TrackView";

// The page reflects whatever the admin last recorded, so it is never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Follow your Seoul Aura order to your doorstep.",
  // A tracking link is personal — keep it out of search results.
  robots: { index: false, follow: false },
};

interface StoredEvent {
  status: string;
  note?: string;
  at: string | Date;
}

interface StoredItem {
  productBrand: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  comparePrice?: number;
  availability?: "available" | "unavailable";
}

/**
 * Looks the order up by its tracking token and returns what the parcel's
 * recipient needs to follow their delivery — including the price they were
 * quoted, since by the time an order is shipping it's already been confirmed
 * and priced. Contact details (email, phone) are still left out, so the link
 * stays safe to forward on.
 */
async function getTracking(token: string): Promise<TrackData | null> {
  // Tokens are 32 hex characters; anything else can't match, so don't ask Mongo.
  if (!/^[a-f0-9]{32}$/i.test(token)) return null;

  try {
    await connectDB();
    const doc = await PreOrder.findOne({ trackingToken: token })
      .select(
        "requestNumber customerName items productBrand productName quantity deliveryStatus deliveryEvents shippingAddress shippingFee createdAt"
      )
      .lean<{
        requestNumber: string;
        customerName: string;
        items?: StoredItem[];
        productBrand?: string;
        productName?: string;
        quantity?: number;
        deliveryStatus?: string;
        deliveryEvents?: StoredEvent[];
        shippingAddress?: { district?: string; city?: string };
        shippingFee?: number;
        createdAt: string | Date;
      }>();

    if (!doc) return getOrderTracking(token);

    // Older records predate the items array and carry a single product instead.
    const items: StoredItem[] = doc.items?.length
      ? doc.items
      : [
          {
            productBrand: doc.productBrand ?? "—",
            productName: doc.productName ?? "Your order",
            quantity: doc.quantity ?? 1,
          },
        ];

    const settingsDoc = await Settings.findOne().lean().catch(() => null);
    const deliveryCharge =
      doc.shippingFee ?? (settingsDoc as { shippingFee?: number } | null)?.shippingFee ?? 350;

    return JSON.parse(
      JSON.stringify({
        requestNumber: doc.requestNumber,
        customerName: doc.customerName,
        deliveryStatus: doc.deliveryStatus ?? null,
        events: doc.deliveryEvents ?? [],
        items: items.map((it) => ({
          productBrand: it.productBrand,
          productName: it.productName,
          productImage: it.productImage,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          comparePrice: it.comparePrice,
          availability: it.availability,
        })),
        deliveryCharge,
        destination:
          doc.shippingAddress?.city && doc.shippingAddress?.district
            ? { city: doc.shippingAddress.city, district: doc.shippingAddress.district }
            : undefined,
        createdAt: doc.createdAt,
      })
    ) as TrackData;
  } catch {
    return null;
  }
}

/** Same tracking view for a regular (in-stock) order. */
async function getOrderTracking(token: string): Promise<TrackData | null> {
  const doc = await Order.findOne({ trackingToken: token })
    .select("orderNumber customerName items deliveryStatus deliveryEvents shippingAddress shippingFee createdAt")
    .lean<{
      orderNumber: string;
      customerName: string;
      items: { productId?: unknown; name: string; price: number; quantity: number; image?: string }[];
      deliveryStatus?: string;
      deliveryEvents?: StoredEvent[];
      shippingAddress?: { district?: string; city?: string };
      shippingFee?: number;
      createdAt: string | Date;
    }>();
  if (!doc) return null;

  // Order lines don't carry the brand, so read it (and the compare-at price) off the product
  const products = await Product.find({ _id: { $in: doc.items.map((it) => it.productId) } })
    .select("brand comparePrice")
    .lean<{ _id: { toString(): string }; brand?: string; comparePrice?: number }[]>();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  return JSON.parse(
    JSON.stringify({
      kind: "order",
      requestNumber: doc.orderNumber,
      customerName: doc.customerName,
      deliveryStatus: doc.deliveryStatus ?? null,
      events: doc.deliveryEvents ?? [],
      items: doc.items.map((it) => {
        const product = byId.get(String(it.productId));
        return {
          productBrand: product?.brand ?? "",
          productName: it.name,
          productImage: it.image,
          quantity: it.quantity,
          unitPrice: it.price,
          comparePrice: product?.comparePrice,
        };
      }),
      deliveryCharge: doc.shippingFee ?? 0,
      destination:
        doc.shippingAddress?.city && doc.shippingAddress?.district
          ? { city: doc.shippingAddress.city, district: doc.shippingAddress.district }
          : undefined,
      createdAt: doc.createdAt,
    })
  ) as TrackData;
}

export default async function TrackPage({ params }: { params: { token: string } }) {
  const data = await getTracking(params.token);

  if (!data) {
    return (
      <div className="max-w-md mx-auto px-6 py-24 text-center animate-fade-up">
        <PackageX size={40} className="mx-auto text-ink-300" />
        <h1 className="font-display text-2xl text-ink-900 mt-5">
          We couldn&apos;t find that order
        </h1>
        <p className="text-sm text-ink-500 leading-relaxed mt-3">
          This tracking link looks incomplete or has expired. Open the most recent delivery
          email we sent you, or sign in to see all your orders.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-7">
          <Link href="/account?tab=pre-orders" className="btn-primary">
            My Pre-Orders
          </Link>
          <a
            href="https://wa.me/94778362755"
            target="_blank"
            rel="noopener"
            className="btn-outline"
          >
            Ask us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  return <TrackView data={data} />;
}
