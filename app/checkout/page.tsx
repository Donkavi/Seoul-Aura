"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronRight, CreditCard, Truck, MapPin, User, ShieldCheck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, cn } from "@/lib/utils";

const steps = ["Information", "Shipping", "Payment", "Review"];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionPlan = searchParams.get("plan");

  const { items, total, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    phone: "",
    line1: "",
    line2: "",
    city: "Colombo",
    province: "Western",
    postalCode: "",
    country: "Sri Lanka",
    shippingMethod: "standard",
    paymentMethod: "cod",
    notes: "",
  });

  const shippingFee = form.shippingMethod === "express" ? 950 : total >= 10000 ? 0 : 450;
  const tax = Math.round(total * 0.02);
  const grandTotal = total + shippingFee + tax;

  const isSubscription = !!subscriptionPlan;

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const orderData = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        items: items.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images[0],
        })),
        subtotal: total,
        shippingFee,
        discount: 0,
        total: grandTotal,
        orderType: isSubscription ? "subscription" : "standard",
        subscriptionPlan,
        shippingAddress: {
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
          country: form.country,
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const order = await res.json();

      if (res.ok) {
        setSuccess(order.orderNumber);
        clearCart();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-rose-25/30 min-h-[80vh] flex items-center">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 mx-auto bg-rose-600 rounded-full flex items-center justify-center mb-6">
            <Check size={36} className="text-white" />
          </div>
          <p className="section-subtitle text-rose-600 mb-2">Order Confirmed</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
            Thank you for your order!
          </h1>
          <p className="text-base text-ink-600 mb-2">
            Your order <span className="font-mono font-semibold">{success}</span> has been placed.
          </p>
          <p className="text-sm text-ink-500 mb-8">
            We've sent a confirmation email to <strong>{form.customerEmail}</strong>.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/shop" className="btn-primary">
              Continue Shopping
            </Link>
            <Link href="/" className="btn-outline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isSubscription) {
    return (
      <div className="bg-rose-25/30 min-h-[60vh] flex items-center justify-center text-center px-4">
        <div>
          <h2 className="font-display text-3xl text-ink-900 mb-3">Your bag is empty</h2>
          <Link href="/shop" className="btn-primary">
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-25/30 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-14">
        <h1 className="font-display text-3xl lg:text-4xl text-ink-900 mb-2">
          {isSubscription ? "Subscribe to" : "Secure"} Checkout
        </h1>
        {isSubscription && (
          <p className="text-sm text-rose-600 mb-6">Subscription plan: <strong>{subscriptionPlan}</strong></p>
        )}

        <div className="flex items-center gap-2 mb-8 text-sm overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setStep(i)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-sm transition-colors",
                  i === step
                    ? "bg-rose-600 text-white"
                    : i < step
                    ? "text-rose-600"
                    : "text-ink-400"
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold",
                    i === step
                      ? "bg-white text-rose-600"
                      : i < step
                      ? "bg-rose-100 text-rose-600"
                      : "bg-ink-100"
                  )}
                >
                  {i < step ? <Check size={10} /> : i + 1}
                </span>
                <span className="font-medium">{s}</span>
              </button>
              {i < steps.length - 1 && <ChevronRight size={12} className="text-ink-300" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8">
              {step === 0 && (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <User size={18} className="text-rose-600" />
                    <h2 className="font-display text-2xl text-ink-900">Contact Information</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                        Full Name *
                      </label>
                      <input
                        value={form.customerName}
                        onChange={(e) => update("customerName", e.target.value)}
                        required
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={form.customerEmail}
                        onChange={(e) => update("customerEmail", e.target.value)}
                        required
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        required
                        className="input-field"
                      />
                    </div>
                  </div>
                </>
              )}

              {step === 1 && (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <MapPin size={18} className="text-rose-600" />
                    <h2 className="font-display text-2xl text-ink-900">Shipping Address</h2>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                        Address Line 1 *
                      </label>
                      <input
                        value={form.line1}
                        onChange={(e) => update("line1", e.target.value)}
                        required
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                        Apartment, Suite (optional)
                      </label>
                      <input
                        value={form.line2}
                        onChange={(e) => update("line2", e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <input
                        placeholder="City"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className="input-field"
                      />
                      <input
                        placeholder="Province"
                        value={form.province}
                        onChange={(e) => update("province", e.target.value)}
                        className="input-field"
                      />
                      <input
                        placeholder="Postal Code"
                        value={form.postalCode}
                        onChange={(e) => update("postalCode", e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-3 mt-6">
                        Shipping Method
                      </h3>
                      <div className="space-y-2">
                        {[
                          { id: "standard", label: "Standard Delivery", note: "3-5 business days", fee: total >= 10000 ? 0 : 450 },
                          { id: "express", label: "Express Delivery", note: "1-2 business days", fee: 950 },
                        ].map((opt) => (
                          <label
                            key={opt.id}
                            className={cn(
                              "flex items-center gap-3 border rounded-sm p-4 cursor-pointer transition-colors",
                              form.shippingMethod === opt.id
                                ? "border-rose-600 bg-rose-50/30"
                                : "border-ink-200 hover:border-ink-300"
                            )}
                          >
                            <input
                              type="radio"
                              checked={form.shippingMethod === opt.id}
                              onChange={() => update("shippingMethod", opt.id)}
                              className="accent-rose-600"
                            />
                            <Truck size={16} className="text-ink-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-ink-900">{opt.label}</p>
                              <p className="text-xs text-ink-500">{opt.note}</p>
                            </div>
                            <p className="text-sm font-semibold">
                              {opt.fee === 0 ? "FREE" : formatPrice(opt.fee)}
                            </p>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard size={18} className="text-rose-600" />
                    <h2 className="font-display text-2xl text-ink-900">Payment Method</h2>
                  </div>
                  <div className="space-y-2">
                    {[
                      { id: "cod", label: "Cash on Delivery", note: "Pay when your order arrives" },
                      { id: "card", label: "Credit / Debit Card", note: "Visa, Mastercard, Amex" },
                      { id: "koko", label: "KOKO · Buy Now Pay Later", note: "Pay in 3 interest-free installments" },
                      { id: "bank", label: "Bank Transfer", note: "Direct bank deposit" },
                    ].map((opt) => (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex items-center gap-3 border rounded-sm p-4 cursor-pointer transition-colors",
                          form.paymentMethod === opt.id
                            ? "border-rose-600 bg-rose-50/30"
                            : "border-ink-200 hover:border-ink-300"
                        )}
                      >
                        <input
                          type="radio"
                          checked={form.paymentMethod === opt.id}
                          onChange={() => update("paymentMethod", opt.id)}
                          className="accent-rose-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-ink-900">{opt.label}</p>
                          <p className="text-xs text-ink-500">{opt.note}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6">
                    <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                      Order Notes (optional)
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      rows={3}
                      className="input-field resize-none"
                      placeholder="Delivery instructions, gift message, allergies…"
                    />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck size={18} className="text-rose-600" />
                    <h2 className="font-display text-2xl text-ink-900">Review Your Order</h2>
                  </div>
                  <div className="space-y-5 text-sm">
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-2">Contact</h3>
                      <p>{form.customerName} · {form.customerEmail} · {form.phone}</p>
                    </section>
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-2">Shipping</h3>
                      <p>{form.line1}{form.line2 && `, ${form.line2}`}, {form.city}, {form.province}, {form.country}</p>
                    </section>
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-2">Payment</h3>
                      <p>{form.paymentMethod.toUpperCase()}</p>
                    </section>
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-2">Items ({items.length})</h3>
                      <ul className="space-y-2">
                        {items.map((i) => (
                          <li key={i.product._id} className="flex justify-between">
                            <span>{i.product.name} × {i.quantity}</span>
                            <span className="font-medium">{formatPrice(i.product.price * i.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center mt-8 pt-6 border-t border-ink-100">
                {step > 0 ? (
                  <button onClick={() => setStep(step - 1)} className="btn-ghost">
                    ← Back
                  </button>
                ) : (
                  <Link href="/cart" className="btn-ghost">
                    ← Return to Cart
                  </Link>
                )}
                {step < steps.length - 1 ? (
                  <button onClick={() => setStep(step + 1)} className="btn-primary">
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="btn-primary disabled:opacity-60"
                  >
                    {submitting ? "Placing Order…" : `Place Order · ${formatPrice(grandTotal)}`}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28 h-fit">
            <div className="bg-white border border-ink-100 rounded-sm p-6">
              <h3 className="font-display text-xl text-ink-900 mb-4">Order Summary</h3>

              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((i) => (
                  <div key={i.product._id} className="flex gap-3 text-sm">
                    <div className="w-14 h-16 bg-ink-50 rounded-sm flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-900 line-clamp-2">{i.product.name}</p>
                      <p className="text-xs text-ink-500">Qty {i.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold">{formatPrice(i.product.price * i.quantity)}</p>
                  </div>
                ))}
              </div>

              <dl className="space-y-2 text-sm border-t border-ink-100 pt-4">
                <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(total)}</dd></div>
                <div className="flex justify-between"><dt>Shipping</dt><dd>{shippingFee === 0 ? "FREE" : formatPrice(shippingFee)}</dd></div>
                <div className="flex justify-between"><dt>Tax</dt><dd>{formatPrice(tax)}</dd></div>
                <div className="flex justify-between text-base pt-3 border-t border-ink-100">
                  <dt className="font-semibold text-ink-900">Total</dt>
                  <dd className="font-display text-xl text-rose-600">{formatPrice(grandTotal)}</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-rose-25" />}>
      <CheckoutContent />
    </Suspense>
  );
}
