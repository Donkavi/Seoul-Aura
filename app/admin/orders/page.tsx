"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ShoppingBag, ChevronDown, ChevronUp, MapPin, CreditCard,
  Package, X, StickyNote,
} from "lucide-react";
import { formatPrice, relativeDate, cn } from "@/lib/utils";
import type { Order } from "@/types";

type OrderStatus = Order["status"];

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   "bg-gold-50 text-gold-700 border-gold-200",
  confirmed: "bg-rose-50 text-rose-700 border-rose-200",
  shipped:   "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-ink-100 text-ink-500 border-ink-200",
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending:  "bg-gold-50 text-gold-700",
  paid:     "bg-green-50 text-green-700",
  failed:   "bg-rose-50 text-rose-700",
  refunded: "bg-ink-100 text-ink-500",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () =>
    fetch("/api/orders?limit=100")
      .then((r) => r.json())
      .then((data) => { setOrders(data.orders ?? []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const changeStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, status } : o)));
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch {
      load();
    } finally {
      setUpdating(null);
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Fulfillment</p>
        <h1 className="font-display text-4xl text-ink-900">Orders</h1>
        <p className="text-sm text-ink-500 mt-1">{orders.length} total orders</p>
      </header>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-16 text-center">
            <ShoppingBag size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900">No orders yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold w-8" />
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Order #</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Customer</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Items</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Type</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Total</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Status</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <>
                  {/* ── Summary row ── */}
                  <tr
                    key={o._id}
                    onClick={() => toggleExpand(o._id)}
                    className={cn(
                      "border-b border-ink-50 cursor-pointer transition-colors",
                      expanded === o._id
                        ? "bg-rose-25/40 border-rose-100"
                        : "hover:bg-rose-25/30"
                    )}
                  >
                    {/* Expand chevron */}
                    <td className="p-4 text-ink-400">
                      {expanded === o._id
                        ? <ChevronUp size={14} />
                        : <ChevronDown size={14} />}
                    </td>
                    <td className="p-4 text-xs font-mono text-ink-700">{o.orderNumber}</td>
                    <td className="p-4">
                      <p className="text-sm font-medium text-ink-900">{o.customerName}</p>
                      <p className="text-xs text-ink-400">{o.customerEmail}</p>
                    </td>
                    <td className="p-4 text-sm text-ink-700">{o.items.length}</td>
                    <td className="p-4">
                      <span className={cn(
                        "badge-origin capitalize",
                        o.orderType === "subscription"
                          ? "bg-rose-50 text-rose-700"
                          : "bg-ink-50 text-ink-700"
                      )}>
                        {o.orderType}
                      </span>
                    </td>
                    <td className="p-4 text-sm font-semibold text-ink-900">{formatPrice(o.total)}</td>
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="relative inline-flex items-center">
                        <select
                          value={o.status}
                          disabled={updating === o._id}
                          onChange={(e) => changeStatus(o._id, e.target.value as OrderStatus)}
                          className={cn(
                            "appearance-none text-xs font-semibold capitalize pl-2.5 pr-7 py-1.5 rounded-sm border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-rose-300 disabled:opacity-60",
                            STATUS_STYLES[o.status]
                          )}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-ink-900 capitalize">
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 pointer-events-none opacity-60" />
                      </div>
                    </td>
                    <td className="p-4 text-xs text-ink-500">{relativeDate(o.createdAt)}</td>
                  </tr>

                  {/* ── Detail panel ── */}
                  {expanded === o._id && (
                    <tr key={`${o._id}-detail`} className="bg-rose-25/20 border-b border-rose-100">
                      <td colSpan={8} className="p-0">
                        <div className="p-6 grid lg:grid-cols-3 gap-6">

                          {/* Items */}
                          <div className="lg:col-span-2">
                            <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold mb-3 flex items-center gap-1.5">
                              <Package size={12} /> Order Items
                            </p>
                            <div className="space-y-3">
                              {o.items.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white border border-ink-100 rounded-sm p-3">
                                  {item.image ? (
                                    <div className="w-14 h-14 relative shrink-0 rounded-sm overflow-hidden border border-ink-100">
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-14 h-14 shrink-0 rounded-sm bg-ink-100 flex items-center justify-center">
                                      <ShoppingBag size={18} className="text-ink-400" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-ink-900 truncate">{item.name}</p>
                                    <p className="text-xs text-ink-500 mt-0.5">
                                      {formatPrice(item.price)} × {item.quantity}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold text-ink-900 shrink-0">
                                    {formatPrice(item.price * item.quantity)}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Price breakdown */}
                            <div className="mt-4 bg-white border border-ink-100 rounded-sm p-4 space-y-2 text-sm">
                              <div className="flex justify-between text-ink-600">
                                <span>Subtotal</span>
                                <span>{formatPrice(o.subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-ink-600">
                                <span>Shipping</span>
                                <span>{o.shippingFee ? formatPrice(o.shippingFee) : "Free"}</span>
                              </div>
                              {o.discount > 0 && (
                                <div className="flex justify-between text-green-700">
                                  <span>Discount</span>
                                  <span>−{formatPrice(o.discount)}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold text-ink-900 border-t border-ink-100 pt-2">
                                <span>Total</span>
                                <span>{formatPrice(o.total)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Right column: address + payment + notes */}
                          <div className="space-y-4">
                            {/* Shipping address */}
                            <div className="bg-white border border-ink-100 rounded-sm p-4">
                              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold mb-2 flex items-center gap-1.5">
                                <MapPin size={11} /> Shipping Address
                              </p>
                              <p className="text-sm font-medium text-ink-900">{o.customerName}</p>
                              <p className="text-sm text-ink-600 mt-1 leading-relaxed">
                                {o.shippingAddress.line1}
                                {o.shippingAddress.line2 && <>, {o.shippingAddress.line2}</>}
                                <br />
                                {o.shippingAddress.city}
                                {o.shippingAddress.province && `, ${o.shippingAddress.province}`}
                                {o.shippingAddress.postalCode && ` ${o.shippingAddress.postalCode}`}
                                <br />
                                {o.shippingAddress.country}
                              </p>
                            </div>

                            {/* Payment */}
                            <div className="bg-white border border-ink-100 rounded-sm p-4">
                              <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold mb-2 flex items-center gap-1.5">
                                <CreditCard size={11} /> Payment
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-ink-700 capitalize">{o.paymentMethod === "cod" ? "Cash on Delivery" : o.paymentMethod}</span>
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                                  PAYMENT_STATUS_STYLES[o.paymentStatus] ?? "bg-ink-100 text-ink-500"
                                )}>
                                  {o.paymentStatus}
                                </span>
                              </div>
                            </div>

                            {/* Notes */}
                            {o.notes && (
                              <div className="bg-white border border-ink-100 rounded-sm p-4">
                                <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold mb-2 flex items-center gap-1.5">
                                  <StickyNote size={11} /> Notes
                                </p>
                                <p className="text-sm text-ink-700 leading-relaxed">{o.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
