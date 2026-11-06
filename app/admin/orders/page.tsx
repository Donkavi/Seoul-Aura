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
  ShoppingBag,
  Send,
  RotateCcw,
  Copy,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import CountUp from "@/components/admin/CountUp";
import { DELIVERY_PHASES, type DeliveryStatus } from "@/lib/deliveryStatus";
import { ORDER_STATUSES, paymentMethodLabel, orderPayment, type OrderStatus } from "@/lib/orderStatus";
import type { Order } from "@/types";

type FilterTab = "all" | OrderStatus;

const STATUS_META: Record<OrderStatus, { label: string; color: string; icon: LucideIcon }> = {
  pending: { label: "Pending", color: "bg-gold-50 text-gold-700 border-gold-200", icon: Clock },
  reviewing: { label: "Reviewing", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
  availability: { label: "Availability", color: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: ClipboardCheck },
  confirmed: { label: "Confirmed", color: "bg-green-50 text-green-700 border-green-200", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
  fulfilled: { label: "Fulfilled", color: "bg-ink-900 text-white border-ink-900", icon: Package },
  done: { label: "Done", color: "bg-emerald-600 text-white border-emerald-600", icon: BadgeCheck },
};

/** Older orders may carry a retired status — show them as pending rather than crash. */
function metaFor(status: string) {
  return STATUS_META[status as OrderStatus] ?? STATUS_META.pending;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const loadCounts = async () => {
    try {
      const res = await fetch("/api/orders?counts=true");
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
      const res = await fetch(`/api/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
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
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Fulfillment</p>
        <h1 className="font-display text-4xl text-ink-900">Orders</h1>
        <p className="text-sm text-ink-500 mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </p>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={cn(
              "text-left p-4 border rounded-sm transition-all hover:shadow-card",
              tab === status ? "border-ink-900 bg-white" : "border-ink-100 bg-white/60 hover:border-ink-300"
            )}
          >
            <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold">{STATUS_META[status].label}</p>
            <CountUp to={counts[status] ?? 0} className="font-display text-3xl text-ink-900 mt-1 block" />
          </button>
        ))}
      </div>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-3 flex items-center gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {([...ORDER_STATUSES, "all"] as FilterTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors uppercase tracking-wider",
                  tab === t ? "bg-rose-600 text-white" : "text-ink-700 hover:bg-ink-50"
                )}
              >
                {t === "all" ? "All" : STATUS_META[t].label}
              </button>
            ))}
          </div>
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search by order #, name, email, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-ink-50 border-0 rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingBag size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900 mb-1">No orders here</p>
            <p className="text-sm text-ink-500">
              {tab === "pending" ? "All caught up — no pending orders." : "Nothing to show in this view."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                {["Order #", "Customer", "Items", "Delivery Charge", "Total", "Status", "Placed"].map((h) => (
                  <th
                    key={h}
                    className={cn(
                      "p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold",
                      h === "Total" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const meta = metaFor(o.status);
                const Icon = meta.icon;
                const leg = DELIVERY_PHASES.find((d) => d.key === o.deliveryStatus);
                const units = o.items.reduce((s, it) => s + it.quantity, 0);
                return (
                  <tr
                    key={o._id}
                    onClick={() => setSelected(o)}
                    className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors cursor-pointer"
                  >
                    <td className="p-4 text-xs font-mono text-ink-700">{o.orderNumber}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-ink-900">{o.customerName}</p>
                      <p className="text-xs text-ink-400">{o.customerEmail}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-ink-900 line-clamp-1 max-w-xs">
                        {o.items[0]?.name}
                        {o.items.length > 1 && <span className="text-ink-400"> +{o.items.length - 1} more</span>}
                      </p>
                      <p className="text-xs text-ink-400">×{units}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-ink-900">{formatPrice(o.shippingFee)}</p>
                      <DeliveryFeeChip order={o} />
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-sm font-semibold text-ink-900">{formatPrice(o.total)}</p>
                      {(() => {
                        const payment = orderPayment(o);
                        if (payment.complete) return <p className="text-[10px] font-semibold text-green-700">Fully paid</p>;
                        if (o.status === "rejected") return null;
                        return (
                          <p className="text-[10px] text-ink-500 whitespace-nowrap">
                            Balance <span className="font-semibold text-rose-600">{formatPrice(payment.balance)}</span>
                          </p>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <span className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium border", meta.color)}>
                        <Icon size={10} />
                        {meta.label}
                      </span>
                      {leg && (
                        <span className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-500 whitespace-nowrap">
                          <span>{leg.emoji}</span>
                          {leg.label}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-ink-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      <span className="text-ink-400"> · {new Date(o.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selected && (
        <OrderDrawer
          order={selected}
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

function DeliveryFeeChip({ order }: { order: Order }) {
  if (order.deliveryFeePaid) {
    return <span className="text-[10px] font-semibold text-green-700">Paid ✓</span>;
  }
  if (order.deliveryFeeReceipt?.url) {
    return <span className="text-[10px] font-semibold text-blue-700">Slip to verify</span>;
  }
  return <span className="text-[10px] font-semibold text-gold-700">Awaiting slip</span>;
}

function OrderDrawer({
  order,
  onClose,
  onUpdate,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [status, setStatus] = useState<OrderStatus>((STATUS_META[order.status] ? order.status : "pending") as OrderStatus);
  const [adminNotes, setAdminNotes] = useState(order.adminNotes ?? "");
  const [deliveryFeePaid, setDeliveryFeePaid] = useState(!!order.deliveryFeePaid);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivery journey — `null` means the parcel hasn't shipped yet
  const savedDeliveryStatus: DeliveryStatus | null = order.deliveryStatus ?? null;
  const savedEvents = order.deliveryEvents ?? [];
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus | null>(savedDeliveryStatus);
  const [deliveryNote, setDeliveryNote] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const deliveryChanged = deliveryStatus !== savedDeliveryStatus;
  const recordedPhases = new Set(savedEvents.map((ev) => ev.status));
  const trackingUrl = order.trackingToken
    ? `${typeof window === "undefined" ? "" : window.location.origin}/track/${order.trackingToken}`
    : "";

  const savedEstimatedDeliveryDate = order.estimatedDeliveryDate ? order.estimatedDeliveryDate.slice(0, 10) : "";
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState(savedEstimatedDeliveryDate);
  const [estimatedDeliveryMessage, setEstimatedDeliveryMessage] = useState(order.estimatedDeliveryMessage ?? "");
  const estimatedDeliveryChanged =
    estimatedDeliveryDate !== savedEstimatedDeliveryDate ||
    estimatedDeliveryMessage.trim() !== (order.estimatedDeliveryMessage ?? "");

  const stockChange =
    status !== order.status && (status === "rejected" || order.status === "rejected")
      ? status === "rejected"
        ? "Rejecting returns the ordered quantities to stock."
        : "Reopening this order takes the quantities out of stock again."
      : null;

  const copyTrackingUrl = async () => {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      /* clipboard blocked — the link is on screen to copy by hand */
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes,
          deliveryFeePaid,
          estimatedDeliveryDate: estimatedDeliveryDate || null,
          estimatedDeliveryMessage: estimatedDeliveryMessage.trim() || undefined,
          ...(deliveryChanged ? { deliveryStatus, deliveryNote: deliveryNote.trim() || undefined } : {}),
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
    if (!confirm("Delete this order permanently? Any stock it is holding goes back on the shelf.")) return;
    setDeleting(true);
    try {
      await fetch(`/api/orders/${order._id}`, { method: "DELETE" });
      onUpdate();
    } finally {
      setDeleting(false);
    }
  };

  const addr = order.shippingAddress;
  const phone = order.phoneNumber ?? "";
  // Follows the unsaved toggle and status, so the admin sees the effect before saving
  const payment = orderPayment({ ...order, status, deliveryFeePaid });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink-900/50 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-slide-in-right overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-ink-100 p-6 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-mono text-ink-500">{order.orderNumber}</p>
            <h2 className="font-display text-2xl text-ink-900 mt-0.5">Order</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-50 rounded-full" aria-label="Close">
            <X size={18} />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">Customer</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-ink-900">{order.customerName}</p>
              <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-2 text-ink-700 hover:text-rose-600">
                <Mail size={13} /> {order.customerEmail}
              </a>
              {phone && (
                <>
                  <a href={`tel:${phone}`} className="flex items-center gap-2 text-ink-700 hover:text-rose-600">
                    <Phone size={13} /> {phone}
                  </a>
                  <a
                    href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:underline mt-1"
                  >
                    Open in WhatsApp <ExternalLink size={11} />
                  </a>
                </>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">Delivery Location</h3>
            <p className="text-sm text-ink-900">
              {addr.line1}
              {addr.line2 && `, ${addr.line2}`}
            </p>
            <p className="text-sm text-ink-700">
              {addr.city}, {addr.district}
              {addr.postalCode && ` ${addr.postalCode}`}
              <span className="text-ink-400"> · Delivery {formatPrice(order.shippingFee)}</span>
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Products ({order.items.length})
            </h3>
            <div className="border border-ink-100 rounded-sm overflow-hidden text-sm">
              {order.items.map((it, i) => (
                <div key={i} className={cn("px-4 py-3 flex items-center gap-3", i > 0 && "border-t border-ink-100")}>
                  {it.image ? (
                    <img src={it.image} alt={it.name} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-ink-100" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-ink-50 border border-ink-100 flex items-center justify-center flex-shrink-0 text-lg">🧴</div>
                  )}
                  <p className="flex-1 min-w-0 text-sm font-medium text-ink-900 leading-snug">{it.name}</p>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[11px] text-ink-500 whitespace-nowrap">
                      ×{it.quantity} · {formatPrice(it.price)} each
                    </p>
                    <p className="text-sm font-semibold text-ink-900 whitespace-nowrap">{formatPrice(it.price * it.quantity)}</p>
                  </div>
                </div>
              ))}

              <div className="border-t border-ink-200 bg-ink-50/60 px-4 py-3 space-y-1.5 text-sm">
                {(order.savings ?? 0) > 0 && (
                  <div className="flex justify-between text-gold-600">
                    <span>Customer saved</span>
                    <span>{formatPrice(order.savings!)}</span>
                  </div>
                )}
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal <span className="text-ink-400 text-xs">· {paymentMethodLabel(order.paymentMethod)}</span></span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-500">
                  <span>
                    Delivery Charge <span className="text-ink-400 text-xs">· Bank Transfer</span>
                    {deliveryFeePaid && <span className="text-green-600 text-xs font-semibold"> · Paid ✓</span>}
                  </span>
                  <span>{formatPrice(order.shippingFee)}</span>
                </div>
                <div className="flex justify-between font-semibold text-ink-900 pt-1.5 border-t border-ink-200">
                  <span>{payment.complete ? "Total Paid" : "Total"}</span>
                  <span className="text-rose-600 font-display text-base">{formatPrice(order.total)}</span>
                </div>
                {!payment.complete && (
                  <div className="pt-1.5 border-t border-ink-200 space-y-1.5">
                    <div className="flex justify-between">
                      <span className={payment.deliveryFeePaid ? "text-green-700" : "text-ink-500"}>
                        Paid so far {payment.deliveryFeePaid && <span className="text-xs">· delivery charge</span>}
                      </span>
                      <span className={payment.deliveryFeePaid ? "text-green-700 font-medium" : "text-ink-500"}>
                        {formatPrice(payment.paid)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-ink-900">
                      <span>
                        Remaining to collect{" "}
                        <span className="text-xs font-normal text-ink-400">
                          · {payment.deliveryFeePaid
                            ? paymentMethodLabel(order.paymentMethod)
                            : `delivery ${formatPrice(order.shippingFee)} by bank + ${paymentMethodLabel(order.paymentMethod)}`}
                        </span>
                      </span>
                      <span>{formatPrice(payment.balance)}</span>
                    </div>
                  </div>
                )}
              </div>

              {order.notes && (
                <div className="border-t border-ink-100 px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-1">Customer note</p>
                  <p className="text-sm text-ink-700 italic">&quot;{order.notes}&quot;</p>
                </div>
              )}
            </div>
          </section>

          {/* Delivery charge — paid up front by bank transfer to confirm the order */}
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">Delivery Charge Payment</h3>
            {order.deliveryFeeReceipt?.url ? (
              <div className="flex items-center gap-3 border border-ink-100 rounded-sm p-3 mb-3">
                <a href={order.deliveryFeeReceipt.url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <img src={order.deliveryFeeReceipt.url} alt="Bank slip" className="w-16 h-16 object-cover rounded-sm border border-ink-100" />
                </a>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900 flex items-center gap-1.5">
                    <Receipt size={13} className="text-rose-600" /> Bank slip uploaded
                  </p>
                  <p className="text-xs text-ink-500">
                    {new Date(order.deliveryFeeReceipt.uploadedAt).toLocaleString("en-GB", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}{" "}
                    · check it matches {formatPrice(order.shippingFee)}
                  </p>
                  <a
                    href={order.deliveryFeeReceipt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1"
                  >
                    Open full size <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-500 bg-ink-50 rounded-sm px-3 py-2.5 mb-3">
                No slip uploaded yet. The customer can upload it from My Orders, or send it on WhatsApp.
              </p>
            )}
            <button
              onClick={() => setDeliveryFeePaid((v) => !v)}
              className={cn(
                "w-full flex items-center justify-between gap-3 p-3.5 border rounded-sm transition-colors text-left",
                deliveryFeePaid ? "bg-green-50 border-green-300" : "border-ink-200 hover:border-rose-300"
              )}
            >
              <span className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0",
                    deliveryFeePaid ? "bg-green-600 border-green-600" : "border-ink-300"
                  )}
                >
                  {deliveryFeePaid && <Check size={13} className="text-white" />}
                </span>
                <span className="text-sm font-medium text-ink-900">
                  Delivery charge received ({formatPrice(order.shippingFee)})
                </span>
              </span>
              <span className={cn("text-[11px] font-semibold uppercase tracking-wider", deliveryFeePaid ? "text-green-700" : "text-ink-400")}>
                {deliveryFeePaid ? "Paid" : "Not paid"}
              </span>
            </button>
            <p className="text-[11px] text-ink-400 mt-1.5">
              Marking it received emails the customer that their order is locked in. Usually followed by moving the order to <strong>Confirmed</strong>.
            </p>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">Update Status</h3>
            <div className="grid grid-cols-5 gap-2">
              {ORDER_STATUSES.map((s) => {
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
              })}
            </div>
            {stockChange && <p className="text-[11px] text-ink-500 mt-2">{stockChange}</p>}
            {status !== order.status && (
              <p className="text-[11px] text-ink-400 mt-1">The customer is emailed the new status on save.</p>
            )}
          </section>

          {/* Delivery tracking */}
          <section>
            <div className="flex items-center justify-between gap-3 mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600">Delivery Status</h3>
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
                    {recorded && !active && <Check size={11} className="absolute top-1.5 right-1.5 text-green-600" />}
                  </button>
                );
              })}
            </div>

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
                  Shown on the customer&apos;s tracking page as soon as you save.
                </p>
              </div>
            )}

            {deliveryChanged && !deliveryStatus && savedDeliveryStatus && (
              <p className="text-[11px] text-ink-500 mt-2">The delivery journey is cleared on save. No email is sent.</p>
            )}

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
                            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                        {ev.note && <p className="text-[11px] text-ink-600 mt-0.5 italic break-words">&quot;{ev.note}&quot;</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {order.trackingToken && (
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
                Delivery updates normally start once the order is <strong>Confirmed</strong>.
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">Estimated Delivery Date</h3>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">Expected date</label>
              <input
                type="date"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">Message to customer</label>
              <textarea
                value={estimatedDeliveryMessage}
                onChange={(e) => setEstimatedDeliveryMessage(e.target.value)}
                rows={2}
                placeholder="e.g. Your order will arrive by this date."
                className="input-field resize-none"
              />
            </div>
            {estimatedDeliveryChanged && estimatedDeliveryDate && (
              <p className="text-[11px] text-ink-500 mt-2">On save the customer is emailed this updated arrival estimate.</p>
            )}
            {estimatedDeliveryChanged && !estimatedDeliveryDate && savedEstimatedDeliveryDate && (
              <p className="text-[11px] text-ink-500 mt-2">The estimate is cleared on save. No email is sent.</p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">Internal Notes</h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              placeholder="Courier details, payment follow-ups, rejection reason…"
              className="input-field resize-none"
            />
          </section>

          {error && (
            <p className="text-sm text-rose-600 bg-rose-25/60 border border-rose-200 rounded-sm px-3 py-2">{error}</p>
          )}

          <section className="flex flex-wrap gap-3 pt-4 border-t border-ink-100">
            <button onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <a
              href={`mailto:${order.customerEmail}?subject=Re%3A%20${encodeURIComponent(`Order ${order.orderNumber}`)}`}
              className="btn-outline inline-flex items-center gap-2"
            >
              <Send size={14} /> Email Customer
            </a>
            <button
              onClick={remove}
              disabled={deleting}
              className="ml-auto text-sm text-ink-400 hover:text-rose-600 transition-colors"
            >
              {deleting ? "Deleting…" : "Delete order"}
            </button>
          </section>
        </div>
      </aside>
    </div>
  );
}
