"use client";

import { useEffect, useState } from "react";
import {
  Search,
  X,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Package,
  Mail,
  Phone,
  ExternalLink,
  MessageSquare,
  Send,
  type LucideIcon,
} from "lucide-react";
import { cn, relativeDate, formatPrice } from "@/lib/utils";
import CountUp from "@/components/admin/CountUp";
import type { PreOrder, PreOrderStatus } from "@/types";

type FilterTab = "all" | PreOrderStatus;

const STATUS_META: Record<
  PreOrderStatus,
  { label: string; color: string; icon: LucideIcon }
> = {
  pending: { label: "Pending", color: "bg-gold-50 text-gold-700 border-gold-200", icon: Clock },
  reviewing: { label: "Reviewing", color: "bg-blue-50 text-blue-700 border-blue-200", icon: Eye },
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

      <div className="grid sm:grid-cols-5 gap-3 mb-6">
        {(["pending", "reviewing", "confirmed", "rejected", "fulfilled"] as PreOrderStatus[]).map(
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
            {(["pending", "reviewing", "confirmed", "rejected", "fulfilled", "all"] as FilterTab[]).map(
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
                        const items = p.items?.length ? p.items : [{ quantity: p.quantity, unitPrice: undefined as number | undefined }];
                        const allPriced = items.every((it) => it.unitPrice != null);
                        if (!allPriced) return <span className="text-xs text-ink-400 italic">TBQ</span>;
                        const subtotal = items.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0);
                        return <span className="text-sm font-semibold text-ink-900">{formatPrice(subtotal + deliveryCharge)}</span>;
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
                    </td>
                    <td className="p-4 text-xs text-ink-500">{relativeDate(p.createdAt)}</td>
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

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => { if (d?.shippingFee != null) setDeliveryCharge(d.shippingFee); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/pre-orders/${preOrder._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes,
          estimatedPrice: estimatedPrice ? parseFloat(estimatedPrice) : undefined,
          estimatedAvailability: estimatedAvailability || undefined,
        }),
      });
      onUpdate();
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

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Products {(preOrder.items?.length ?? 0) > 0 && `(${preOrder.items.length})`}
            </h3>
            <div className="border border-ink-100 rounded-sm overflow-hidden text-sm">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] bg-ink-50 border-b border-ink-100 px-4 py-2 gap-3 text-[10px] uppercase tracking-widest text-ink-500 font-semibold">
                <span>Product</span>
                <span className="text-right w-10">Qty</span>
                <span className="text-right w-20">Unit Price</span>
                <span className="text-right w-20">Total</span>
              </div>

              {(preOrder.items?.length
                ? preOrder.items
                : [{ productBrand: preOrder.productBrand, productName: preOrder.productName, productLink: preOrder.productLink, quantity: preOrder.quantity, unitPrice: undefined, productImage: undefined }]
              ).map((it, i) => {
                const lineTotal = it.unitPrice != null ? it.unitPrice * it.quantity : null;
                return (
                  <div key={i} className={cn("grid grid-cols-[1fr_auto_auto_auto] items-start px-4 py-3 gap-3", i > 0 && "border-t border-ink-100")}>
                    <div className="flex items-start gap-3 min-w-0">
                      {it.productImage ? (
                        <img src={it.productImage} alt={it.productName} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-ink-100" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-ink-50 border border-ink-100 flex items-center justify-center flex-shrink-0 text-lg">🧴</div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">{it.productBrand}</p>
                        <p className="text-sm text-ink-900 font-medium leading-snug">{it.productName}</p>
                        {it.productLink && (
                          <a href={it.productLink} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[10px] text-rose-500 hover:underline mt-0.5">
                            Reference <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                    <span className="text-right w-10 text-ink-700 font-medium pt-1">×{it.quantity}</span>
                    <span className="text-right w-20 text-ink-500 pt-1 whitespace-nowrap">
                      {it.unitPrice != null ? formatPrice(it.unitPrice) : <span className="text-ink-300 italic text-xs">TBQ</span>}
                    </span>
                    <span className="text-right w-20 text-ink-900 font-semibold pt-1 whitespace-nowrap">
                      {lineTotal != null ? formatPrice(lineTotal) : <span className="text-ink-300">—</span>}
                    </span>
                  </div>
                );
              })}

              {/* Totals */}
              {(() => {
                const items = preOrder.items?.length
                  ? preOrder.items
                  : [{ quantity: preOrder.quantity, unitPrice: undefined as number | undefined }];
                const subtotal = items.every((it) => it.unitPrice != null)
                  ? items.reduce((s, it) => s + (it.unitPrice ?? 0) * it.quantity, 0)
                  : null;
                return (
                  <div className="border-t border-ink-200 bg-ink-50/60 px-4 py-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-ink-500">
                      <span>Subtotal</span>
                      <span>{subtotal != null ? formatPrice(subtotal) : <span className="italic text-xs text-ink-400">Pending quotes</span>}</span>
                    </div>
                    <div className="flex justify-between text-ink-500">
                      <span>Delivery Charge</span>
                      <span>{formatPrice(deliveryCharge)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-ink-900 pt-1.5 border-t border-ink-200">
                      <span>Est. Total</span>
                      <span className="text-rose-600 font-display text-base">
                        {subtotal != null ? formatPrice(subtotal + deliveryCharge) : "—"}
                      </span>
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

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-3">
              Update Status
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {(["pending", "reviewing", "confirmed", "rejected", "fulfilled"] as PreOrderStatus[]).map(
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
