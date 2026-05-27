"use client";

import { useEffect, useState } from "react";
import { ShoppingBag, ChevronDown } from "lucide-react";
import { formatPrice, relativeDate, cn } from "@/lib/utils";
import type { Order } from "@/types";

type OrderStatus = Order["status"];

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-gold-50 text-gold-700 border-gold-200",
  confirmed: "bg-rose-50 text-rose-700 border-rose-200",
  shipped: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-ink-100 text-ink-500 border-ink-200",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () =>
    fetch("/api/orders?limit=100")
      .then((r) => r.json())
      .then((data) => { setOrders(data.orders ?? []); setLoading(false); })
      .catch(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const changeStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, status } : o))
    );
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

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
          Fulfillment
        </p>
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
                <tr key={o._id} className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors">
                  <td className="p-4 text-xs font-mono text-ink-700">{o.orderNumber}</td>
                  <td className="p-4">
                    <p className="text-sm font-medium text-ink-900">{o.customerName}</p>
                    <p className="text-xs text-ink-400">{o.customerEmail}</p>
                  </td>
                  <td className="p-4 text-sm text-ink-700">{o.items.length}</td>
                  <td className="p-4">
                    <span className={cn(
                      "badge-origin capitalize",
                      o.orderType === "subscription" ? "bg-rose-50 text-rose-700" : "bg-ink-50 text-ink-700"
                    )}>
                      {o.orderType}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-semibold text-ink-900">{formatPrice(o.total)}</td>
                  <td className="p-4">
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
                      <ChevronDown
                        size={11}
                        className="absolute right-2 pointer-events-none opacity-60"
                      />
                    </div>
                  </td>
                  <td className="p-4 text-xs text-ink-500">{relativeDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
