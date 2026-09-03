"use client";

import { useEffect, useState } from "react";
import {
  Search,
  X,
  Clock,
  Eye,
  Check,
  CheckCircle,
  ClipboardCheck,
  BadgeCheck,
  XCircle,
  Package,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare,
  Send,
  Pencil,
  RotateCcw,
  History,
  Trash2,
  Copy,
  type LucideIcon,
} from "lucide-react";
import { cn, relativeDate, formatPrice, lineSavings } from "@/lib/utils";
import CountUp from "@/components/admin/CountUp";
import { DELIVERY_PHASES, type DeliveryStatus } from "@/lib/deliveryStatus";
import type { PreOrder, PreOrderItem, PreOrderPriceChange, PreOrderStatus } from "@/types";

type FilterTab = "all" | PreOrderStatus;

const STATUS_META: Record<
  PreOrderStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  pending: { label: "Pending", color: "bg-gold-50 text-gold-700 border-gold-200", icon: Clock },
  reviewing: { label: "Reviewing", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
  availability: {
    label: "Availability",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    icon: ClipboardCheck,
  },
  confirmed: {
    label: "Confirmed",
    color: "bg-green-50 text-green-700 border-green-200",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
  fulfilled: {
    label: "Fulfilled",
    color: "bg-ink-900 text-white border-ink-900",
    icon: Package,
  },
  done: {
    label: "Done",
    color: "bg-emerald-600 text-white border-emerald-600",
    icon: BadgeCheck,
  },
};

export default function AdminPreOrdersPage() {
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PreOrder | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(350);
  const [counts, setCounts] = useState<Record<PreOrderStatus, number>>({} as Record<PreOrderStatus, number>);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d?.shippingFee != null) setDeliveryCharge(d.shippingFee); })
      .catch(() => {});
  }, []);

  const loadCounts = async () => {
    try {
      const res = await fetch("/api/pre-orders?counts=true");
      const data = await res.json();
      if (data.counts) setCounts(data.counts);
    } catch { /* ignore */ }
  };

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (tab !== "all") params.set("status", tab);
    if (search) params.set("search", search);
    params.set("limit", "100");

    try {
      const res = await fetch(`/api/pre-orders?${params}`);
      const data = await res.json();
      setPreOrders(data.preOrders ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCounts();
  }, []);

  useEffect(() => {
    load();
  }, [tab]);

  useEffect(() => {
    const debounce = setTimeout(load, 250);
    return () => clearTimeout(debounce);
  }, [search]);

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Concierge Requests
          </p>
          <h1 className="font-display text-4xl text-ink-900">Pre-Order Management</h1>
          <p className="text-sm text-ink-500 mt-1">
            {preOrders.length} request{preOrders.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {(["pending", "reviewing", "availability", "confirmed", "rejected", "fulfilled", "done"] as PreOrderStatus[]).map(
          (status) => {
            const meta = STATUS_META[status];
            return (
              <button
                key={status}
                onClick={() => setTab(status)}
                className={cn(
                  "text-left p-4 border rounded-sm transition-all hover:shadow-card",
                  tab === status
                    ? "border-ink-900 bg-white"
                    : "border-ink-100 bg-white/60 hover:border-ink-300"
                )}
              >
                <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold">
                  {meta.label}
                </p>
                <CountUp
                  to={counts[status] ?? 0}
                  className="font-display text-3xl text-ink-900 mt-1 block"
                />
              </button>
            );
          }
        )}
      </div>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-3 flex items-center gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {(["pending", "reviewing", "availability", "confirmed", "rejected", "fulfilled", "done", "all"] as FilterTab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors uppercase tracking-wider",
                    tab === t
                      ? "bg-rose-600 text-white"
                      : "text-ink-700 hover:bg-ink-50"
                  )}
                >
                  {t === "all" ? "All" : STATUS_META[t].label}
                </button>
              )
            )}
          </div>
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by name, brand, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-ink-50 border-0 rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading requests…</div>
        ) : preOrders.length === 0 ? (
          <div className="p-16 text-center">
            <MessageSquare size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900 mb-1">No requests here</p>
            <p className="text-sm text-ink-500">
              {tab === "pending"
                ? "All caught up — no pending pre-orders."
                : "Nothing to show in this view."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Request #
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Customer
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Product
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Qty
                </th>
                <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Est. Total
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Status
                </th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody>
              {preOrders.map((p) => {
                const meta = STATUS_META[p.status];
                const Icon = meta.icon;
                return (
                  <tr
                    key={p._id}
                    onClick={() => setSelected(p)}
                    className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-xs font-mono text-ink-700">{p.requestNumber}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-ink-900">{p.customerName}</p>
                      <p className="text-xs text-ink-400">{p.customerEmail}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">
                        {p.items?.[0]?.productBrand ?? p.productBrand}
                      </p>
                      <p className="text-sm text-ink-900 line-clamp-1 max-w-xs">
                        {p.items?.[0]?.productName ?? p.productName}
                        {(p.items?.length ?? 0) > 1 && (
                          <span className="text-ink-400 font-normal"> +{p.items.length - 1} more</span>
                        )}
                      </p>
                    </td>
                    <td className="p-4 text-sm">
                      {p.items?.length
                        ? `×${p.items.reduce((s, it) => s + it.quantity, 0)}`
                        : `×${p.quantity}`}
                    </td>
                    <td className="p-4 text-right">
                      {(() => {
                        const items = p.items?.length
                          ? p.items
                          : [{ quantity: p.quantity, unitPrice: undefined as number | undefined, availability: undefined as ("available" | "unavailable" | undefined) }];
                        const available = items.filter((it) => it.availability !== "unavailable");
                        const hasUnavailable = available.length < items.length;

                        const rowDeliveryCharge = p.shippingFee ?? deliveryCharge;

                        // Updated total — available, priced items only
                        const availablePriced = available.length > 0 && available.every((it) => it.unitPrice != null);
                        const updatedTotal = availablePriced
                          ? available.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0) + rowDeliveryCharge
                          : null;

                        // Previous full total — all items priced
                        const allPriced = items.every((it) => it.unitPrice != null);
                        const fullTotal = allPriced
                          ? items.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0) + rowDeliveryCharge
                          : null;

                        if (updatedTotal == null) return <span className="text-xs text-ink-400 italic">TBQ</span>;

                        return (
                          <div className="leading-tight">
                            {hasUnavailable && fullTotal != null && fullTotal !== updatedTotal && (
                              <p className="text-[11px] text-ink-400 line-through">{formatPrice(fullTotal)}</p>
                            )}
                            <span className="text-sm font-semibold text-ink-900">{formatPrice(updatedTotal)}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border",
                          meta.color
                        )}
                      >
                        <Icon size={10} />
                        {meta.label}
                      </span>
                      {/* Where the parcel is, once it has shipped */}
                      {(() => {
                        const leg = DELIVERY_PHASES.find((d) => d.key === p.deliveryStatus);
                        if (!leg) return null;
                        return (
                          <span className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-500 whitespace-nowrap">
                            <span>{leg.emoji}</span>
                            {leg.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-xs text-ink-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      <span className="text-ink-400"> · {new Date(p.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <PreOrderDrawer
          preOrder={selected}
          onClose={() => setSelected(null)}
          onUpdate={async () => {
            await Promise.all([load(), loadCounts()]);
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}

/** An item row as edited inside the drawer, before saving. */
type DraftItem = PreOrderItem & {
  availability: "available" | "unavailable";
  /** Reason captured for a not-yet-saved unit-price change. */
  priceChangeReason?: string;
};

/** A product staged to be added to this pre-order — not yet saved. */
type NewItemDraft = {
  productBrand: string;
  productName: string;
  productLink?: string;
  productImage?: string;
  quantity: number;
  unitPrice?: number;
  comparePrice?: number;
};

type ProductSearchResult = {
  _id: string;
  name: string;
  slug: string;
  brand?: string;
  images: string[];
  price: number;
  comparePrice?: number;
};

function PreOrderDrawer({
  preOrder,
  onClose,
  onUpdate,
}: {
  preOrder: PreOrder;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState<PreOrderStatus>(preOrder.status);
  const [adminNotes, setAdminNotes] = useState(preOrder.adminNotes ?? "");
  const [estimatedPrice, setEstimatedPrice] = useState(
    preOrder.estimatedPrice?.toString() ?? ""
  );
  const [estimatedAvailability, setEstimatedAvailability] = useState(
    preOrder.estimatedAvailability ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(350);
  const [depositPaid, setDepositPaid] = useState(!!preOrder.depositPaid);

  // Delivery journey — `null` means the parcel hasn't shipped yet
  const savedDeliveryStatus: DeliveryStatus | null = preOrder.deliveryStatus ?? null;
  const savedEvents = preOrder.deliveryEvents ?? [];
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(savedDeliveryStatus);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);

  const deliveryChanged = deliveryStatus !== savedDeliveryStatus;
  /** Legs already emailed to the customer, so the buttons can show a tick. */
  const recordedPhases = new Set(savedEvents.map((ev) => ev.status));
  const trackingUrl = preOrder.trackingToken
    ? `${typeof window === "undefined" ? "" : window.location.origin}/track/${preOrder.trackingToken}`
    : "";

  const copyTrackingUrl = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
  };

  // Expected arrival date shown to the customer, with an optional note.
  // Saving a change to either emails the buyer with the new estimate.
  const savedEstimatedDeliveryDate = preOrder.estimatedDeliveryDate
    ? preOrder.estimatedDeliveryDate.slice(0, 10)
    : "";
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(savedEstimatedDeliveryDate);
  const [estimatedDeliveryMessage, setEstimatedDeliveryMessage] = useState(
    preOrder.estimatedDeliveryMessage ?? ""
  );
  const estimatedDeliveryChanged =
    estimatedDeliveryDate !== savedEstimatedDeliveryDate ||
    estimatedDeliveryMessage.trim() !== (preOrder.estimatedDeliveryMessage ?? "");

  const [error, setError] = useState<string | null>(null);

  // Saved item state — the baseline every draft edit is compared against
  const savedItems: PreOrderItem[] = preOrder.items?.length
    ? preOrder.items
    : [{
        productBrand: preOrder.productBrand,
        productName: preOrder.productName,
        productLink: preOrder.productLink,
        quantity: preOrder.quantity,
      }];

  // Editable item availability + unit price (availability defaults to "available" for older records)
  const initialItems: DraftItem[] = savedItems.map((it) => ({
    ...it,
    availability: it.availability ?? "available",
  }));
  const [items, setItems] = useState<DraftItem[]>(initialItems);

  // Inline unit-price editor
  const [editingPriceIdx, setEditingPriceIdx] = useState<number | null>(null);
  const [draftPrice, setDraftPrice] = useState("");
  const [draftReason, setDraftReason] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  // Add-product picker — products staged here are appended on Save
  const [stagedItems, setStagedItems] = useState<NewItemDraft[]>([]);
  const [newItemMessage, setNewItemMessage] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<ProductSearchResult[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  useEffect(() => {
    if (productQuery.trim().length < 2) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/products?admin=true&limit=8&search=${encodeURIComponent(productQuery.trim())}`
        );
        const data = await res.json();
        setProductResults(data.products ?? []);
      } catch {
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    }, 300);
    return () => clearTimeout(debounce);
  }, [productQuery]);

  const addStagedItem = (product: ProductSearchResult) => {
    setStagedItems((rows) => [
      ...rows,
      {
        productBrand: product.brand || "—",
        productName: product.name,
        productLink: `${window.location.origin}/shop/${product.slug ?? product._id}`,
        productImage: product.images?.[0],
        quantity: 1,
        unitPrice: product.price,
        comparePrice: product.comparePrice,
      },
    ]);
    setProductQuery("");
    setProductResults([]);
  };

  const removeStagedItem = (idx: number) =>
    setStagedItems((rows) => rows.filter((_, i) => i !== idx));

  const setStagedQty = (idx: number, quantity: number) =>
    setStagedItems((rows) =>
      rows.map((r, i) => (i === idx ? { ...r, quantity: Math.max(1, quantity) } : r))
    );

  const setItemAvailability = (idx: number, availability: "available" | "unavailable") =>
    setItems((rows) => rows.map((r, i) => (i === idx ? { ...r, availability } : r)));

  const openPriceEditor = (idx: number) => {
    setEditingPriceIdx(idx);
    setDraftPrice(items[idx].unitPrice?.toString() ?? "");
    setDraftReason(items[idx].priceChangeReason ?? "");
    setPriceError(null);
  };

  const closePriceEditor = () => {
    setEditingPriceIdx(null);
    setDraftPrice("");
    setDraftReason("");
    setPriceError(null);
  };

  const applyPriceChange = (idx: number) => {
    const value = parseFloat(draftPrice);
    if (!Number.isFinite(value) || value < 0) {
      setPriceError("Enter a valid price.");
      return;
    }
    const savedPrice = savedItems[idx]?.unitPrice;
    if (value === savedPrice) {
      setPriceError("That's the same as the current price.");
      return;
    }
    // A reason is mandatory whenever an existing quote is revised
    if (savedPrice != null && !draftReason.trim()) {
      setPriceError("A reason is required — it's shown to the customer in the email.");
      return;
    }
    setItems((rows) =>
      rows.map((r, i) =>
        i === idx ? { ...r, unitPrice: value, priceChangeReason: draftReason.trim() || undefined } : r
      )
    );
    closePriceEditor();
  };

  const revertPriceChange = (idx: number) =>
    setItems((rows) =>
      rows.map((r, i) =>
        i === idx
          ? { ...r, unitPrice: savedItems[idx]?.unitPrice, priceChangeReason: undefined }
          : r
      )
    );

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d?.shippingFee != null) setDeliveryCharge(d.shippingFee); })
      .catch(() => {});
  }, []);

  const save = async () => {
    if (stagedItems.length > 0 && !newItemMessage.trim()) {
      setError("A message is required when adding new products — it's shown to the customer in the email.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pre-orders/${preOrder._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes,
          estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
          estimatedAvailability: estimatedAvailability || undefined,
          depositPaid,
          estimatedDeliveryDate: estimatedDeliveryDate || null,
          estimatedDeliveryMessage: estimatedDeliveryMessage.trim() || undefined,
          items: items.map((it) => ({
            availability: it.availability,
            unitPrice: it.unitPrice,
            comparePrice: it.comparePrice,
            priceChangeReason: it.priceChangeReason,
          })),
          ...(deliveryChanged
            ? { deliveryStatus, deliveryNote: deliveryNote.trim() || undefined }
            : {}),
          ...(stagedItems.length > 0
            ? { newItems: stagedItems, newItemsMessage: newItemMessage.trim() }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Could not save changes. Please try again.");
        return;
      }
      onUpdate();
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this pre-order request permanently?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/pre-orders/${preOrder._id}`, { method: "DELETE" });
      onUpdate();
    } finally {
      setDeleting(false);
    }
  };

  const mailToHref = `mailto:${preOrder.customerEmail}?subject=Re%3A%20${encodeURIComponent(
    `Pre-Order ${preOrder.requestNumber}`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-ink-100 p-6 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-mono text-ink-500">{preOrder.requestNumber}</p>
            <h2 className="font-display text-2xl text-ink-900 mt-0.5">Pre-Order Request</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink-50 rounded-full"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Customer
            </h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-ink-900">{preOrder.customerName}</p>
              <a
                href={`mailto:${preOrder.customerEmail}`}
                className="flex items-center gap-2 text-ink-700 hover:text-rose-600"
              >
                <Mail size={13} /> {preOrder.customerEmail}
              </a>
              <a
                href={`tel:${preOrder.phoneNumber}`}
                className="flex items-center gap-2 text-ink-700 hover:text-rose-600"
              >
                <Phone size={13} /> {preOrder.phoneNumber}
              </a>
              <a
                href={`https://wa.me/${preOrder.phoneNumber.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline mt-1"
              >
                Open in WhatsApp <ExternalLink size={11} />
              </a>
            </div>
          </section>

          {preOrder.shippingAddress?.district && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
                Delivery Location
              </h3>
              <p className="text-sm text-ink-700">
                {preOrder.shippingAddress.city}, {preOrder.shippingAddress.district}
                {preOrder.shippingFee != null && (
                  <span className="text-ink-400"> · Delivery Rs. {preOrder.shippingFee}</span>
                )}
              </p>
            </section>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Products ({items.length})
            </h3>
            <div className="border border-ink-100 rounded-sm overflow-hidden text-sm">
              {items.map((it, i) => {
                const unavail = it.availability === "unavailable";
                const lineTotal = it.unitPrice != null ? it.unitPrice * it.quantity : null;
                const savedPrice = savedItems[i]?.unitPrice;
                // Unsaved reprice of this row
                const pending = it.unitPrice !== savedPrice;
                const lineSaved =
                  it.unitPrice != null && !unavail
                    ? lineSavings(it.unitPrice, it.comparePrice, it.quantity)
                    : 0;
                const history = it.priceHistory ?? [];
                return (
                  <div key={i} className={cn("px-4 py-3", i > 0 && "border-t border-ink-100", unavail && "bg-ink-50/50")}>
                    <div className="flex items-start gap-3">
                      {it.productImage ? (
                        <img src={it.productImage} alt={it.productName} className={cn("w-10 h-10 rounded object-cover flex-shrink-0 border border-ink-100", unavail && "opacity-40")} />
                      ) : (
                        <div className={cn("w-10 h-10 rounded bg-ink-50 border border-ink-100 flex items-center justify-center flex-shrink-0 text-lg", unavail && "opacity-40")}>🧴</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">{it.productBrand}</p>
                        <p className={cn("text-sm font-medium leading-snug", unavail ? "text-ink-400 line-through" : "text-ink-900")}>{it.productName}</p>
                        {it.productLink && (
                          <a href={it.productLink} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[10px] text-rose-500 hover:underline mt-0.5">
                            Reference <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-ink-500">×{it.quantity}</p>
                        {it.unitPrice != null ? (
                          <>
                            <p className="text-[11px] whitespace-nowrap leading-tight mt-0.5">
                              {/* An unsaved reprice owns the struck slot; otherwise it
                                  shows the shop's compare-at price. */}
                              {pending && savedPrice != null ? (
                                <span className="text-ink-400 line-through mr-1">{formatPrice(savedPrice)}</span>
                              ) : lineSaved > 0 ? (
                                <span className="text-ink-400 line-through mr-1">{formatPrice(it.comparePrice!)}</span>
                              ) : null}
                              <span className={cn(pending ? "text-rose-600 font-semibold" : "text-ink-500")}>
                                {formatPrice(it.unitPrice)}
                              </span>
                              <span className="text-ink-400"> each</span>
                            </p>
                            <p className={cn("text-sm font-semibold whitespace-nowrap", unavail ? "text-ink-400 line-through" : "text-ink-900")}>
                              {formatPrice(lineTotal!)}
                            </p>
                            {lineSaved > 0 && !unavail && (
                              <p className="text-[10px] font-medium text-gold-600 whitespace-nowrap">
                                Saved {formatPrice(lineSaved)}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-ink-300 italic text-xs mt-0.5">TBQ</p>
                        )}
                      </div>
                    </div>
                    {/* Availability toggle */}
                    <div className="flex items-center gap-2 mt-2.5 pl-[52px]">
                      <button
                        onClick={() => setItemAvailability(i, "available")}
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors",
                          !unavail ? "bg-green-50 text-green-700 border-green-300" : "bg-white text-ink-400 border-ink-200 hover:border-green-300"
                        )}
                      >
                        <CheckCircle size={11} /> Available
                      </button>
                      <button
                        onClick={() => setItemAvailability(i, "unavailable")}
                        className={cn(
                          "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors",
                          unavail ? "bg-rose-50 text-rose-700 border-rose-300" : "bg-white text-ink-400 border-ink-200 hover:border-rose-300"
                        )}
                      >
                        <XCircle size={11} /> Unavailable
                      </button>

                      <button
                        onClick={() => (editingPriceIdx === i ? closePriceEditor() : openPriceEditor(i))}
                        className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-ink-200 text-ink-600 hover:border-rose-300 hover:text-rose-600 transition-colors"
                      >
                        <Pencil size={11} /> {it.unitPrice != null ? "Change price" : "Set price"}
                      </button>
                    </div>

                    {/* Pending (unsaved) price change */}
                    {pending && editingPriceIdx !== i && (
                      <div className="mt-2.5 ml-[52px] flex items-start gap-2 bg-rose-25/60 border border-rose-200 rounded-sm px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-ink-700">
                            <span className="font-semibold uppercase tracking-wider text-rose-600 text-[10px]">Price change pending</span>
                            <br />
                            {savedPrice != null ? formatPrice(savedPrice) : "Not quoted"} → <strong>{formatPrice(it.unitPrice!)}</strong> per unit
                          </p>
                          {it.priceChangeReason && (
                            <p className="text-[11px] text-ink-500 mt-1 italic break-words">&quot;{it.priceChangeReason}&quot;</p>
                          )}
                          <p className="text-[10px] text-ink-400 mt-1">The customer is emailed the old and new price on save.</p>
                        </div>
                        <button
                          onClick={() => revertPriceChange(i)}
                          className="inline-flex items-center gap-1 text-[11px] text-ink-500 hover:text-rose-600 flex-shrink-0"
                          title="Undo price change"
                        >
                          <RotateCcw size={11} /> Undo
                        </button>
                      </div>
                    )}

                    {/* Inline price editor */}
                    {editingPriceIdx === i && (
                      <div className="mt-2.5 ml-[52px] border border-rose-200 bg-rose-25/40 rounded-sm p-3 space-y-2.5">
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1">
                              New unit price (LKR)
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draftPrice}
                              onChange={(e) => setDraftPrice(e.target.value)}
                              placeholder="e.g. 7500"
                              className="input-field text-sm"
                              autoFocus
                            />
                            <p className="text-[10px] text-ink-400 mt-1">
                              {savedPrice != null ? `Current: ${formatPrice(savedPrice)} each` : "No price quoted yet"}
                            </p>
                          </div>
                          <div>
                            <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1">
                              Reason {savedPrice != null && <span className="text-rose-600">*</span>}
                            </label>
                            <input
                              type="text"
                              value={draftReason}
                              onChange={(e) => setDraftReason(e.target.value)}
                              placeholder="e.g. Seasonal offer — 10% off"
                              className="input-field text-sm"
                            />
                            <p className="text-[10px] text-ink-400 mt-1">Shown to the customer in the email.</p>
                          </div>
                        </div>

                        {draftPrice !== "" && Number.isFinite(parseFloat(draftPrice)) && (
                          <p className="text-[11px] text-ink-600">
                            New line total for ×{it.quantity}:{" "}
                            <strong className="text-ink-900">{formatPrice(parseFloat(draftPrice) * it.quantity)}</strong>
                          </p>
                        )}

                        {priceError && <p className="text-[11px] text-rose-600">{priceError}</p>}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => applyPriceChange(i)}
                            className="text-[11px] font-semibold uppercase tracking-wider bg-ink-900 text-white px-3 py-1.5 rounded-sm hover:bg-ink-700 transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={closePriceEditor}
                            className="text-[11px] text-ink-500 hover:text-ink-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Saved price history */}
                    {history.length > 0 && (
                      <details className="mt-2.5 ml-[52px]">
                        <summary className="text-[11px] text-ink-500 hover:text-ink-900 cursor-pointer inline-flex items-center gap-1 list-none">
                          <History size={11} /> Price history ({history.length})
                        </summary>
                        <ul className="mt-1.5 space-y-1.5 border-l-2 border-ink-100 pl-3">
                          {history.map((h: PreOrderPriceChange, hi: number) => (
                            <li key={hi} className="text-[11px] text-ink-600">
                              <span className="text-ink-400 line-through">
                                {h.previousUnitPrice != null ? formatPrice(h.previousUnitPrice) : "Not quoted"}
                              </span>{" "}
                              → <strong className="text-ink-900">{formatPrice(h.newUnitPrice)}</strong>
                              <span className="text-ink-400"> · {relativeDate(h.changedAt)}</span>
                              <span className="block text-ink-500 italic">&quot;{h.reason}&quot;</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                );
              })}

              {/* Totals — only available items count */}
              {(() => {
                const available = items.filter((it) => it.availability !== "unavailable");
                const unavailCount = items.length - available.length;
                const allPriced = available.length > 0 && available.every((it) => it.unitPrice != null);
                const subtotal = allPriced
                  ? available.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0)
                  : null;
                const resolvedDeliveryCharge = preOrder.shippingFee ?? deliveryCharge;
                const estTotal = subtotal != null ? subtotal + resolvedDeliveryCharge : null;
                const deposit = estTotal != null ? Math.round(estTotal * 0.25) : null;

                // Same basket at the prices currently on record — shown struck
                // through while unsaved price changes are pending.
                const hasPendingPrice = items.some((it, i) => it.unitPrice !== savedItems[i]?.unitPrice);
                const savedSubtotal = hasPendingPrice && allPriced
                  ? items.reduce(
                      (s, it, i) =>
                        it.availability === "unavailable" ? s : s + (savedItems[i]?.unitPrice ?? 0) * it.quantity,
                      0
                    )
                  : null;
                const balanceLabel = preOrder.balancePaymentMethod === "bank" ? "Bank Transfer"
                  : preOrder.balancePaymentMethod === "cod" ? "Cash on Delivery" : null;

                // Discount given against shop compare-at prices — separate from any
                // unsaved reprice above, which is about the admin's own edits.
                const totalSaved = available.reduce(
                  (s, it) =>
                    it.unitPrice != null ? s + lineSavings(it.unitPrice, it.comparePrice, it.quantity) : s,
                  0
                );
                return (
                  <div className="border-t border-ink-200 bg-ink-50/60 px-4 py-3 space-y-1.5 text-sm">
                    {unavailCount > 0 && (
                      <p className="text-[11px] text-rose-500 mb-1">{unavailCount} unavailable item{unavailCount !== 1 ? "s" : ""} excluded from totals.</p>
                    )}
                    {totalSaved > 0 && subtotal != null && (
                      <>
                        <div className="flex justify-between text-ink-500">
                          <span>Original price</span>
                          <span className="text-ink-400 line-through">{formatPrice(subtotal + totalSaved)}</span>
                        </div>
                        <div className="flex justify-between font-medium text-gold-600">
                          <span>Total discount</span>
                          <span>−{formatPrice(totalSaved)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-ink-500">
                      <span>Subtotal (available)</span>
                      <span>
                        {savedSubtotal != null && savedSubtotal !== subtotal && (
                          <span className="text-ink-400 line-through mr-2">{formatPrice(savedSubtotal)}</span>
                        )}
                        {subtotal != null ? formatPrice(subtotal) : <span className="italic text-xs text-ink-400">Pending quotes</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <span>Delivery Charge</span>
                      <span>{formatPrice(resolvedDeliveryCharge)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-ink-900 pt-1.5 border-t border-ink-200">
                      <span>Est. Total</span>
                      <span className="text-rose-600 font-display text-base">
                        {savedSubtotal != null && savedSubtotal !== subtotal && (
                          <span className="text-ink-400 line-through text-sm font-sans mr-2">
                            {formatPrice(savedSubtotal + resolvedDeliveryCharge)}
                          </span>
                        )}
                        {estTotal != null ? formatPrice(estTotal) : "—"}
                      </span>
                    </div>
                    {estTotal != null && (
                      <div className="pt-1.5 border-t border-ink-200 space-y-1.5">
                        <div className="flex justify-between text-ink-600">
                          <span>25% Deposit <span className="text-ink-400 text-xs">· Bank Transfer</span>{depositPaid && <span className="text-green-600 text-xs font-semibold"> · Paid ✓</span>}</span>
                          <span className="font-medium">{formatPrice(deposit!)}</span>
                        </div>
                        <div className="flex justify-between text-ink-600">
                          <span>Balance {balanceLabel && <span className="text-ink-400 text-xs">· {balanceLabel}</span>}</span>
                          <span>{formatPrice(estTotal - deposit!)}</span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-ink-200">
                      <span className="text-ink-500">Balance Payment Method</span>
                      <span className="font-medium text-ink-900">{balanceLabel ?? <span className="italic text-xs text-ink-400">Not selected</span>}</span>
                    </div>
                  </div>
                );
              })()}

              {preOrder.notes && (
                <div className="border-t border-ink-100 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-1">Customer note</p>
                  <p className="text-sm text-ink-700 italic">&quot;{preOrder.notes}&quot;</p>
                </div>
              )}
            </div>
          </section>

          {/* Add product */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Add Product
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                type="text"
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                placeholder="Search products by name or brand…"
                className="input-field pl-9"
              />
              {productQuery.trim().length >= 2 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-ink-200 rounded-sm shadow-lg max-h-64 overflow-y-auto">
                  {searchingProducts ? (
                    <p className="p-3 text-xs text-ink-400">Searching…</p>
                  ) : productResults.length === 0 ? (
                    <p className="p-3 text-xs text-ink-400">No products found.</p>
                  ) : (
                    productResults.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => addStagedItem(p)}
                        className="w-full flex items-center gap-2.5 p-2.5 hover:bg-rose-25/50 text-left border-b border-ink-50 last:border-0"
                      >
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-8 h-8 rounded object-cover border border-ink-100 flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded bg-ink-50 border border-ink-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold truncate">{p.brand}</p>
                          <p className="text-xs text-ink-900 truncate">{p.name}</p>
                        </div>
                        <p className="text-xs text-ink-500 flex-shrink-0">{formatPrice(p.price)}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {stagedItems.length > 0 && (
              <div className="mt-3 border border-rose-200 bg-rose-25/40 rounded-sm overflow-hidden">
                {stagedItems.map((it, i) => (
                  <div key={i} className={cn("flex items-center gap-3 px-3 py-2.5", i > 0 && "border-t border-rose-100")}>
                    {it.productImage ? (
                      <img src={it.productImage} alt={it.productName} className="w-9 h-9 rounded object-cover border border-ink-100 flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded bg-ink-50 border border-ink-100 flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold truncate">{it.productBrand}</p>
                      <p className="text-xs text-ink-900 truncate">{it.productName}</p>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => setStagedQty(i, parseInt(e.target.value) || 1)}
                      className="w-14 text-xs border border-ink-200 rounded-sm px-2 py-1 text-center flex-shrink-0"
                    />
                    <p className="text-xs text-ink-500 w-20 text-right flex-shrink-0">
                      {it.unitPrice != null ? formatPrice(it.unitPrice) : "TBQ"}
                    </p>
                    <button
                      onClick={() => removeStagedItem(i)}
                      className="text-ink-400 hover:text-rose-600 flex-shrink-0"
                      aria-label="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="px-3 py-3 border-t border-rose-100 bg-white">
                  <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
                    Message to customer <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    value={newItemMessage}
                    onChange={(e) => setNewItemMessage(e.target.value)}
                    rows={2}
                    placeholder="e.g. We found this matching serum in stock — added it to your order."
                    className="input-field resize-none text-sm"
                  />
                  <p className="text-[10px] text-ink-400 mt-1">
                    Sent to the customer by email along with the new product{stagedItems.length !== 1 ? "s" : ""} on save.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Deposit tracking */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Deposit
            </h3>
            <button
              onClick={() => setDepositPaid((v) => !v)}
              className={cn(
                "w-full flex items-center justify-between gap-3 p-3.5 border rounded-sm transition-colors text-left",
                depositPaid ? "bg-green-50 border-green-300" : "border-ink-200 hover:border-rose-300"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0",
                  depositPaid ? "bg-green-600 border-green-600" : "border-ink-300"
                )}>
                  {depositPaid && <Check size={13} className="text-white" />}
                </span>
                <span className="text-sm font-medium text-ink-900">25% deposit received (bank transfer)</span>
              </span>
              <span className={cn("text-[11px] font-semibold uppercase tracking-wider", depositPaid ? "text-green-700" : "text-ink-400")}>
                {depositPaid ? "Paid" : "Not paid"}
              </span>
            </button>
            <p className="text-[11px] text-ink-400 mt-1.5">
              Marking this saves to the order and emails the customer an updated invoice. Best shown once the order is <strong>Confirmed</strong>.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Update Status
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {(["pending", "reviewing", "availability", "confirmed", "rejected", "fulfilled", "done"] as PreOrderStatus[]).map(
                (s) => {
                  const meta = STATUS_META[s];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-3 border rounded-sm transition-all text-[10px] uppercase tracking-wider font-semibold",
                        status === s
                          ? `${meta.color} ring-2 ring-rose-300 ring-offset-1`
                          : "border-ink-200 text-ink-500 hover:border-ink-400"
                      )}
                    >
                      <Icon size={14} />
                      {meta.label}
                    </button>
                  );
                }
              )}
            </div>
          </section>

          {/* Delivery tracking */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600">
                Delivery Status
              </h3>
              {deliveryStatus && (
                <button
                  onClick={() => {
                    if (!confirm("Clear the delivery journey? The recorded steps are removed and no email is sent.")) return;
                    setDeliveryStatus(null);
                    setDeliveryNote("");
                  }}
                  className="text-[11px] text-ink-400 hover:text-rose-600 inline-flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Reset
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {DELIVERY_PHASES.map((phase) => {
                const active = deliveryStatus === phase.key;
                const recorded = recordedPhases.has(phase.key);
                return (
                  <button
                    key={phase.key}
                    onClick={() => setDeliveryStatus(active ? deliveryStatus : phase.key)}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 px-2 py-3 border rounded-sm transition-all text-[10px] uppercase tracking-wider font-semibold leading-tight text-center",
                      active
                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-300 ring-offset-1"
                        : recorded
                        ? "border-green-200 bg-green-50/60 text-green-700"
                        : "border-ink-200 text-ink-500 hover:border-ink-400"
                    )}
                  >
                    <span className="text-base leading-none">{phase.emoji}</span>
                    {phase.label}
                    {recorded && !active && (
                      <Check size={11} className="absolute top-1.5 right-1.5 text-green-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Note + email warning, shown only for an unsaved new leg */}
            {deliveryChanged && deliveryStatus && (
              <div className="mt-3 border border-rose-200 bg-rose-25/40 rounded-sm p-3">
                <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
                  Note to customer (optional)
                </label>
                <textarea
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Expected at your address within 2 working days."
                  className="input-field resize-none text-sm"
                />
                <p className="text-[11px] text-ink-500 mt-1.5">
                  On save the customer is emailed <strong>{DELIVERY_PHASES.find((p) => p.key === deliveryStatus)?.label}</strong> along with their tracking link.
                </p>
              </div>
            )}

            {deliveryChanged && !deliveryStatus && savedDeliveryStatus && (
              <p className="text-[11px] text-ink-500 mt-2">
                The delivery journey is cleared on save. No email is sent.
              </p>
            )}

            {/* What has been recorded so far */}
            {savedEvents.length > 0 && (
              <ol className="mt-3 border border-ink-100 rounded-sm divide-y divide-ink-100">
                {[...savedEvents].reverse().map((ev, i) => {
                  const meta = DELIVERY_PHASES.find((p) => p.key === ev.status);
                  if (!meta) return null;
                  return (
                    <li key={`${ev.status}-${ev.at}-${i}`} className="flex gap-2.5 px-3 py-2.5">
                      <span className="text-sm leading-none pt-0.5">{meta.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-ink-900">{meta.label}</p>
                        <p className="text-[10px] text-ink-400">
                          {new Date(ev.at).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {ev.note && (
                          <p className="text-[11px] text-ink-600 mt-0.5 italic break-words">
                            &quot;{ev.note}&quot;
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {/* The link the customer gets — handy for WhatsApp follow-ups */}
            {preOrder.trackingToken && (
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 min-w-0 truncate text-[11px] text-ink-500 bg-ink-50 border border-ink-100 rounded-sm px-2.5 py-2">
                  {trackingUrl}
                </code>
                <button
                  onClick={copyTrackingUrl}
                  className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-2 border border-ink-200 rounded-sm text-ink-600 hover:border-rose-300 hover:text-rose-600 transition-colors"
                >
                  {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                  {copiedLink ? "Copied" : "Copy link"}
                </button>
                <a
                  href={trackingUrl}
                  target="_blank"
                  rel="noopener"
                  className="flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-2 border border-ink-200 rounded-sm text-ink-600 hover:border-rose-300 hover:text-rose-600 transition-colors"
                >
                  <ExternalLink size={12} /> Open
                </a>
              </div>
            )}

            {status !== "confirmed" && status !== "fulfilled" && status !== "done" && (
              <p className="text-[11px] text-ink-400 mt-2">
                Delivery updates normally start once the request is <strong>Confirmed</strong>.
              </p>
            )}
          </section>

          {/* Estimated arrival date + a message for the customer */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Estimated Delivery Date
            </h3>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
                Expected date
              </label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
                Message to customer
              </label>
              <textarea
                value={estimatedDeliveryMessage}
                onChange={(e) => setEstimatedDeliveryMessage(e.target.value)}
                rows={2}
                placeholder="e.g. Your order will arrive by this date."
                className="input-field resize-none"
              />
            </div>
            {estimatedDeliveryChanged && estimatedDeliveryDate && (
              <p className="text-[11px] text-ink-500 mt-2">
                On save the customer is emailed this updated arrival estimate.
              </p>
            )}
            {estimatedDeliveryChanged && !estimatedDeliveryDate && savedEstimatedDeliveryDate && (
              <p className="text-[11px] text-ink-500 mt-2">
                The estimate is cleared on save. No email is sent.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Quote
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
                  Estimated Price (LKR)
                </label>
                <input
                  type="number"
                  value={estimatedPrice}
                  onChange={(e) => setEstimatedPrice(e.target.value)}
                  placeholder="e.g. 7500"
                  className="input-field"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
                  Availability
                </label>
                <input
                  type="text"
                  value={estimatedAvailability}
                  onChange={(e) => setEstimatedAvailability(e.target.value)}
                  placeholder="e.g. Ships in 2-3 weeks"
                  className="input-field"
                />
              </div>
            </div>
            {preOrder.estimatedPrice && (
              <p className="text-xs text-ink-500 mt-2">
                Current quote: <strong>{formatPrice(preOrder.estimatedPrice)}</strong> ·{" "}
                {preOrder.estimatedAvailability}
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Internal Notes
            </h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Supplier info, sourcing thoughts, rejection reason…"
              className="input-field resize-none"
            />
          </section>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-25/60 border border-rose-200 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          <section className="flex flex-wrap gap-3 pt-4 border-t border-ink-100">
            <button
              onClick={save}
              disabled={saving}
              className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <a
              href={mailToHref}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Send size={14} /> Email Customer
            </a>
            <button
              onClick={remove}
              disabled={deleting}
              className="ml-auto text-sm text-ink-400 hover:text-rose-600 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete request"}
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}
