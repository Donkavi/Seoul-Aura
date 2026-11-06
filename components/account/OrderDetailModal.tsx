"use client";

import Image from "next/image";
import { ChevronRight, ShoppingBag, X } from "lucide-react";
import { cn, formatPrice, relativeDate } from "@/lib/utils";
import { DELIVERY_PHASES } from "@/lib/deliveryStatus";
import { ORDER_STATUS_LABELS, paymentMethodLabel, orderPayment } from "@/lib/orderStatus";
import DeliveryFeePayment from "@/components/order/DeliveryFeePayment";
import type { Order } from "@/types";

export const ORDER_STATUS_STYLES: Record<string, string> = {
  pending:      "bg-gold-50 text-gold-700",
  reviewing:    "bg-blue-50 text-blue-700",
  availability: "bg-indigo-50 text-indigo-700",
  confirmed:    "bg-green-50 text-green-700",
  rejected:     "bg-ink-100 text-ink-500",
  fulfilled:    "bg-ink-900 text-white",
  done:         "bg-emerald-600 text-white",
};

export function orderStatusLabel(status: string) {
  return ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status;
}

/** Everything about one regular order, plus the delivery-charge slip upload. */
export default function OrderDetailModal({
  order,
  onClose,
  onUpdated,
}: {
  order: Order;
  onClose: () => void;
  onUpdated: (order: Order) => void;
}) {
  const leg = DELIVERY_PHASES.find((d) => d.key === order.deliveryStatus);
  const rejected = order.status === "rejected";
  const addr = order.shippingAddress;
  const payment = orderPayment(order);

  const uploadReceipt = async (url: string) => {
    const res = await fetch(`/api/orders/${order._id}/receipt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.error ?? "Could not save your slip. Please try again.");
    onUpdated(data as Order);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-sm max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-mono text-ink-500">{order.orderNumber}</p>
            <p className="text-xs text-ink-400">{relativeDate(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", ORDER_STATUS_STYLES[order.status] ?? "bg-ink-100 text-ink-500")}>
              {orderStatusLabel(order.status)}
            </span>
            <button onClick={onClose} className="p-1.5 hover:bg-ink-100 rounded transition-colors" aria-label="Close">
              <X size={16} className="text-ink-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Live delivery tracking */}
          {order.trackingToken && !rejected && (
            <a
              href={`/track/${order.trackingToken}`}
              className="flex items-center gap-3 rounded-sm border border-rose-200 bg-rose-25/60 px-4 py-3 hover:border-rose-300 transition-colors group"
            >
              <span className="text-xl leading-none">{leg?.emoji ?? "📦"}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-ink-900">{leg?.label ?? "Preparing your order"}</span>
                <span className="block text-xs text-ink-500 mt-0.5">Follow your parcel to your door</span>
              </span>
              <ChevronRight size={16} className="text-rose-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </a>
          )}

          {order.estimatedDeliveryDate && !rejected && (
            <div className="bg-ink-50 rounded-sm px-4 py-3">
              <p className="text-xs text-ink-700">
                <span className="text-ink-400">Expected by</span>{" "}
                <strong>
                  {new Date(order.estimatedDeliveryDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </strong>
              </p>
              {order.estimatedDeliveryMessage && (
                <p className="text-xs text-ink-600 italic mt-1">&quot;{order.estimatedDeliveryMessage}&quot;</p>
              )}
            </div>
          )}

          {/* Delivery charge payment — this is what confirms the order */}
          {!rejected && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-2">Delivery Charge Payment</p>
              {!order.deliveryFeePaid && (
                <p className="text-xs text-ink-600 mb-3">
                  Your order is confirmed once we receive the delivery charge of{" "}
                  <strong>{formatPrice(order.shippingFee)}</strong> by bank transfer.
                </p>
              )}
              <DeliveryFeePayment
                amount={order.shippingFee}
                receiptUrl={order.deliveryFeeReceipt?.url}
                paid={order.deliveryFeePaid}
                onUploaded={uploadReceipt}
              />
            </div>
          )}

          {rejected && (
            <p className="text-sm text-ink-600 bg-ink-50 rounded-sm px-4 py-3">
              This order was cancelled. If you&apos;ve already paid the delivery charge, we&apos;ll refund it — contact us if you have questions.
            </p>
          )}

          {/* Items */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-3">Items ({order.items.length})</p>
            <div className="space-y-2.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-sm border border-ink-100 bg-ink-50/50">
                  {item.image ? (
                    <div className="w-14 h-14 relative shrink-0 rounded overflow-hidden border border-ink-100 bg-white">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 shrink-0 rounded bg-white border border-ink-100 flex items-center justify-center">
                      <ShoppingBag size={16} className="text-ink-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink-900 leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-xs text-ink-500 mt-0.5">Qty {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink-900 shrink-0">{formatPrice(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border border-ink-100 rounded-sm overflow-hidden text-sm">
            {(order.savings ?? 0) > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-50">
                <span className="text-xs font-medium text-gold-600">You saved</span>
                <span className="font-semibold text-gold-600">−{formatPrice(order.savings!)}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-50">
              <span className="text-xs text-ink-500">Subtotal · {paymentMethodLabel(order.paymentMethod)}</span>
              <span className="text-ink-900">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-50">
              <span className="text-xs text-ink-500">
                Delivery Charge · Bank Transfer
                {order.deliveryFeePaid && <span className="text-green-600 font-semibold"> · Paid ✓</span>}
              </span>
              <span className="text-ink-900">{formatPrice(order.shippingFee)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-rose-50">
              <span className="text-xs font-semibold text-ink-700 uppercase tracking-wide">
                {payment.complete ? "Total Paid" : "Total"}
              </span>
              <span className="text-base font-bold text-rose-600">{formatPrice(order.total)}</span>
            </div>
            {!payment.complete && !rejected && (
              payment.deliveryFeePaid ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-ink-50">
                    <span className="text-xs font-medium text-green-700">Paid · delivery charge</span>
                    <span className="font-medium text-green-700">−{formatPrice(payment.paid)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100">
                    <span className="text-xs font-semibold text-ink-900">
                      Balance to pay <span className="font-normal text-ink-500">· {paymentMethodLabel(order.paymentMethod)}</span>
                    </span>
                    <span className="font-bold text-ink-900">{formatPrice(payment.balance)}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-ink-50">
                    <span className="text-xs font-medium text-rose-700">Due now · delivery charge (bank transfer)</span>
                    <span className="font-semibold text-rose-700">{formatPrice(order.shippingFee)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-ink-50">
                    <span className="text-xs text-ink-500">Then · {paymentMethodLabel(order.paymentMethod)}</span>
                    <span className="text-ink-900">{formatPrice(order.total - order.shippingFee)}</span>
                  </div>
                </>
              )
            )}
          </div>

          {/* Delivery details */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-1.5">Delivering To</p>
              <p className="text-ink-900 font-medium">{order.customerName}</p>
              {order.phoneNumber && <p className="text-ink-600">{order.phoneNumber}</p>}
              <p className="text-ink-600 leading-relaxed mt-0.5">
                {addr.line1}
                {addr.line2 && `, ${addr.line2}`}
                <br />
                {addr.city}, {addr.district}
                {addr.postalCode && ` ${addr.postalCode}`}
              </p>
            </div>
            {order.notes && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold mb-1.5">Your Notes</p>
                <p className="text-ink-600 italic">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
