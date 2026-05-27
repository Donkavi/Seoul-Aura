"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQty, total, itemCount } = useCart();

  return (
    <div className="bg-rose-25/30 min-h-[70vh]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-16">
        <div className="mb-10">
          <p className="section-subtitle text-rose-600 mb-2">Review your order</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900">
            Your Shopping Bag <span className="text-ink-400 text-2xl">({itemCount})</span>
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-ink-100 rounded-sm p-16 text-center max-w-xl mx-auto">
            <div className="w-20 h-20 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag size={32} className="text-rose-400" />
            </div>
            <h2 className="font-display text-3xl text-ink-900 mb-3">Your bag is empty</h2>
            <p className="text-sm text-ink-500 mb-8">
              Discover our curated Korean beauty and Dubai food collections.
            </p>
            <Link href="/shop" className="btn-primary inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <article
                  key={item.product._id}
                  className="bg-white border border-ink-100 rounded-sm p-5 lg:p-6 flex gap-5 group hover:shadow-card transition-shadow"
                >
                  <div className="relative w-24 h-32 lg:w-32 lg:h-40 bg-rose-25 rounded-sm overflow-hidden flex-shrink-0">
                    {item.product.images[0] && (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">
                      {item.product.origin} · {item.product.subtype}
                    </p>
                    <Link
                      href={`/shop/${item.product.slug ?? item.product._id}`}
                      className="font-display text-lg lg:text-xl text-ink-900 hover:text-rose-600 transition-colors line-clamp-2"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-ink-500 mt-1">
                      {formatPrice(item.product.price)} each
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-ink-200 rounded-sm">
                        <button
                          onClick={() => updateQty(item.product._id, item.quantity - 1)}
                          className="p-2 hover:bg-ink-50"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-3 text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(item.product._id, item.quantity + 1)}
                          className="p-2 hover:bg-ink-50"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.product._id)}
                        className="text-xs text-ink-400 hover:text-rose-600 flex items-center gap-1"
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-xl lg:text-2xl text-ink-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                </article>
              ))}
            </div>

            <aside className="lg:sticky lg:top-28 h-fit space-y-4">
              <div className="bg-white border border-ink-100 rounded-sm p-6">
                <h3 className="font-display text-2xl text-ink-900 mb-5">Order Summary</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Subtotal ({itemCount} items)</dt>
                    <dd className="font-medium text-ink-900">{formatPrice(total)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Shipping</dt>
                    <dd className="text-ink-700">{total >= 10000 ? "FREE" : formatPrice(450)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-500">Tax (estimated)</dt>
                    <dd className="text-ink-700">{formatPrice(Math.round(total * 0.02))}</dd>
                  </div>
                  <div className="border-t border-ink-100 pt-3 flex justify-between text-base">
                    <dt className="font-semibold text-ink-900">Total</dt>
                    <dd className="font-display text-2xl text-rose-600">
                      {formatPrice(
                        total + (total >= 10000 ? 0 : 450) + Math.round(total * 0.02)
                      )}
                    </dd>
                  </div>
                </dl>

                {total < 10000 && (
                  <div className="mt-4 p-3 bg-rose-50 rounded-sm text-xs text-rose-700">
                    Add <strong>{formatPrice(10000 - total)}</strong> more for FREE shipping.
                    <div className="mt-2 h-1 bg-rose-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 transition-all"
                        style={{ width: `${Math.min(100, (total / 10000) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <Link
                  href="/checkout"
                  className="btn-primary w-full text-center mt-6 inline-flex items-center justify-center gap-2 group"
                >
                  Proceed to Checkout
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link href="/shop" className="btn-ghost w-full text-center mt-3 block text-xs">
                  Continue Shopping
                </Link>
              </div>

              <div className="bg-rose-50 border border-rose-100 rounded-sm p-5 text-xs text-ink-700 space-y-2">
                <p>✦ Free islandwide shipping on orders Rs. 10,000+</p>
                <p>✦ Cash on Delivery available</p>
                <p>✦ 100% authentic products guaranteed</p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
