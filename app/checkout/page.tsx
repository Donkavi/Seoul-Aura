"use client";

import { useState, Suspense, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Check, ChevronRight, CreditCard, Truck, MapPin, User, ShieldCheck, Loader2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice, cn } from "@/lib/utils";
import SavingsLine, { OriginalPriceLine } from "@/components/cart/SavingsLine";
import DeliveryFeePayment from "@/components/order/DeliveryFeePayment";
import { ORDER_PAYMENT_METHODS, paymentMethodLabel } from "@/lib/orderStatus";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.59 6.59 0 010-4.18V7.07H2.18a10.99 10.99 0 000 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

const steps = ["Information", "Shipping", "Payment", "Review"];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionPlan = searchParams.get("plan");
  const { data: session, status } = useSession();

  const { cartItems: items, total, savings, originalTotal, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    phone: "",
    line1: "",
    line2: "",
    district: "",
    city: "",
    postalCode: "",
    country: "Sri Lanka",
    paymentMethod: "cod",
    notes: "",
  });

  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<{ city: string; charge: number }[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState("");

  // The delivery charge is paid up front by bank transfer — that is what confirms the order
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [placed, setPlaced] = useState<{ _id: string; shippingFee: number; receiptUploaded: boolean } | null>(null);

  // District and city set the delivery charge, same as the pre-order flow
  const selectedCity = cities.find((c) => c.city === form.city);
  const shippingFee = selectedCity?.charge ?? 0;
  const grandTotal = total + shippingFee;

  const isSubscription = !!subscriptionPlan;

  const contactComplete = !!(form.customerName.trim() && form.customerEmail.trim() && form.phone.trim());
  const addressComplete = !!(form.line1.trim() && form.district && selectedCity);
  // Steps can't be skipped ahead of the details they depend on
  const canReach = (target: number) =>
    target <= 0 || (contactComplete && (target <= 1 || addressComplete));

  // Pre-fill from session when it loads
  useEffect(() => {
    if (session?.user) {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user?.name || "",
        customerEmail: prev.customerEmail || session.user?.email || "",
        phone: prev.phone || (session.user as { phone?: string } | undefined)?.phone || "",
      }));
    }
  }, [session]);

  // Load district list once
  useEffect(() => {
    fetch("/api/delivery-rates")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d?.districts)) setDistricts(d.districts); })
      .catch(() => {});
  }, []);

  const update = (key: string, value: string) => setForm({ ...form, [key]: value });

  const onDistrictChange = (district: string) => {
    setForm((prev) => ({ ...prev, district, city: "" }));
    setCities([]);
    if (!district) return;
    setLoadingCities(true);
    fetch(`/api/delivery-rates?district=${encodeURIComponent(district)}`)
      .then((r) => r.json())
      .then((d) => setCities(Array.isArray(d?.cities) ? d.cities : []))
      .catch(() => {})
      .finally(() => setLoadingCities(false));
  };

  const handleSubmit = async () => {
    if (!canReach(3)) {
      setError("Please complete your contact details and delivery address.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please agree to pay the delivery charge to confirm your order.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const orderData = {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        phoneNumber: form.phone,
        items: items.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          image: i.product.images?.[0],
        })),
        subtotal: total,
        shippingFee,
        discount: 0,
        savings,
        total: grandTotal,
        orderType: isSubscription ? "subscription" : "standard",
        subscriptionPlan,
        shippingAddress: {
          line1: form.line1,
          line2: form.line2,
          district: form.district,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes,
        acceptedTerms,
        deliveryFeeReceiptUrl: receiptUrl || undefined,
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });
      const order = await res.json();
      if (!res.ok) throw new Error(order.error ?? "Failed");

      setSuccess(order.orderNumber);
      setPlaced({ _id: order._id, shippingFee: order.shippingFee, receiptUploaded: !!order.deliveryFeeReceipt?.url });
      clearCart();
    } catch (err) {
      console.error(err);
      setError((err as Error).message || "Something went wrong. Please try again.");
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
          <p className="section-subtitle text-rose-600 mb-2">Order Placed</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">
            Thank you for your order!
          </h1>
          <p className="text-base text-ink-600 mb-2">
            Your order <span className="font-mono font-semibold">{success}</span> has been placed.
          </p>
          <p className="text-sm text-ink-500 mb-8">
            We've sent a confirmation email to <strong>{form.customerEmail}</strong>.
          </p>

          {/* Nothing ships until the delivery charge is in, so make the next step obvious */}
          {placed && (
            <div className="text-left max-w-md mx-auto mb-8">
              {placed.receiptUploaded ? (
                <p className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-sm px-4 py-3">
                  We've got your delivery charge slip. We'll verify it and confirm your order shortly.
                </p>
              ) : (
                <>
                  <p className="text-sm text-ink-700 mb-3">
                    <strong>One more step:</strong> pay the delivery charge of{" "}
                    <strong>{formatPrice(placed.shippingFee)}</strong> and upload the slip to confirm your order.
                    You can also do this later from <Link href="/account?tab=orders" className="text-rose-600 hover:underline">My Orders</Link>.
                  </p>
                  <DeliveryFeePayment
                    amount={placed.shippingFee}
                    receiptUrl={receiptUrl || undefined}
                    onUploaded={async (url) => {
                      const res = await fetch(`/api/orders/${placed._id}/receipt`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url }),
                      });
                      const data = await res.json().catch(() => null);
                      if (!res.ok) throw new Error(data?.error ?? "Could not save your slip. Please try again.");
                      setReceiptUrl(url);
                    }}
                  />
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/account?tab=orders" className="btn-primary">
              View My Order
            </Link>
            <Link href="/shop" className="btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Auth gate
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-rose-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-rose-25/30 min-h-[80vh] flex items-center">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 mx-auto bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
            <ShieldCheck size={28} className="text-rose-600" />
          </div>
          <h2 className="font-display text-3xl text-ink-900 mb-2">Sign in to checkout</h2>
          <p className="text-sm text-ink-500 mb-8 leading-relaxed">
            You need to be signed in to place an order. Your cart will be saved.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/checkout" })}
            className="w-full flex items-center justify-center gap-3 border border-ink-200 hover:border-rose-300 hover:bg-rose-50/40 py-3.5 px-6 text-sm font-medium text-ink-800 transition-all rounded-sm"
          >
            <GoogleIcon /> Continue with Google
          </button>
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
                onClick={() => canReach(i) && setStep(i)}
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
                        readOnly={!!session?.user?.name}
                        className={cn("input-field", session?.user?.name && "bg-ink-50 text-ink-500 cursor-not-allowed")}
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
                        readOnly={!!session?.user?.email}
                        className={cn("input-field", session?.user?.email && "bg-ink-50 text-ink-500 cursor-not-allowed")}
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
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                          District *
                        </label>
                        <select
                          value={form.district}
                          onChange={(e) => onDistrictChange(e.target.value)}
                          required
                          className="input-field"
                        >
                          <option value="">Select district</option>
                          {districts.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                          City *
                        </label>
                        <select
                          value={form.city}
                          onChange={(e) => update("city", e.target.value)}
                          required
                          disabled={!form.district || loadingCities}
                          className="input-field disabled:bg-ink-50 disabled:text-ink-400"
                        >
                          <option value="">
                            {loadingCities ? "Loading…" : form.district ? "Select city" : "Select district first"}
                          </option>
                          {cities.map((c) => (
                            <option key={c.city} value={c.city}>{c.city}</option>
                          ))}
                        </select>
                      </div>
                      <input
                        placeholder="Postal Code"
                        value={form.postalCode}
                        onChange={(e) => update("postalCode", e.target.value)}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-3 mt-6">
                        Delivery Charge
                      </h3>
                      <div className="flex items-center gap-3 border border-ink-200 rounded-sm p-4">
                        <Truck size={16} className="text-ink-500 flex-shrink-0" />
                        <div className="flex-1">
                          {selectedCity ? (
                            <>
                              <p className="text-sm font-medium text-ink-900">{form.city}, {form.district}</p>
                              <p className="text-xs text-ink-500">Islandwide delivery via courier</p>
                            </>
                          ) : (
                            <p className="text-sm text-ink-500">Select a district and city to see your delivery charge.</p>
                          )}
                        </div>
                        {selectedCity && (
                          <p className="text-sm font-semibold">{formatPrice(shippingFee)}</p>
                        )}
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
                  <p className="text-xs text-ink-500 mb-4">
                    How you'll pay for your items. The delivery charge of{" "}
                    <strong>{formatPrice(shippingFee)}</strong> is paid up front by bank transfer to confirm the order.
                  </p>
                  <div className="space-y-2">
                    {ORDER_PAYMENT_METHODS.map((opt) => (
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
                      <p>{form.line1}{form.line2 && `, ${form.line2}`}, {form.city}, {form.district}, {form.country}</p>
                      <p className="text-xs text-ink-500 mt-1">Delivery charge: {formatPrice(shippingFee)}</p>
                    </section>
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-2">Payment</h3>
                      <p>{paymentMethodLabel(form.paymentMethod)}</p>
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

                    {/* The delivery charge is what confirms the order */}
                    <section>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-600 mb-2">Confirm Your Order</h3>
                      <p className="text-ink-600 mb-3">
                        Pay the delivery charge of <strong>{formatPrice(shippingFee)}</strong> by bank transfer and upload the slip.
                        You can upload it now or later from <strong>My Orders</strong>.
                      </p>
                      <DeliveryFeePayment
                        amount={shippingFee}
                        receiptUrl={receiptUrl || undefined}
                        onUploaded={(url) => setReceiptUrl(url)}
                      />

                      <label
                        className={cn(
                          "mt-4 flex items-start gap-3 border rounded-sm p-4 cursor-pointer transition-colors",
                          acceptedTerms ? "border-rose-600 bg-rose-50/30" : "border-ink-200 hover:border-ink-300"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="accent-rose-600 mt-0.5"
                        />
                        <span className="text-ink-700 leading-relaxed">
                          I understand my order is only confirmed once the delivery charge of{" "}
                          <strong>{formatPrice(shippingFee)}</strong> is paid by bank transfer, and that orders without a
                          verified payment may be cancelled. The remaining{" "}
                          <strong>{formatPrice(total)}</strong> is paid by{" "}
                          {form.paymentMethod === "bank" ? "bank transfer" : "cash on delivery"}. I agree to the{" "}
                          <Link href="/terms" target="_blank" className="text-rose-600 hover:underline">
                            Terms &amp; Conditions
                          </Link>
                          .
                        </span>
                      </label>
                    </section>
                  </div>
                </>
              )}

              {error && (
                <p className="mt-6 text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-sm px-4 py-3">
                  {error}
                </p>
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
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canReach(step + 1)}
                    className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !canReach(3) || !acceptedTerms}
                    className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
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
                    <div className="w-14 h-16 bg-ink-50 rounded-sm flex-shrink-0 relative overflow-hidden">
                      {i.product.images?.[0] && (
                        <Image src={i.product.images[0]} alt={i.product.name} fill className="object-cover" sizes="56px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink-900 line-clamp-2">{i.product.name}</p>
                      <p className="text-xs text-ink-500">Qty {i.quantity}</p>
                    </div>
                    <p className="text-xs font-semibold">{formatPrice(i.product.price * i.quantity)}</p>
                  </div>
                ))}
              </div>

              <dl className="space-y-2 text-sm border-t border-ink-100 pt-4">
                <OriginalPriceLine
                  originalTotal={originalTotal}
                  total={total}
                  savings={savings}
                />
                <SavingsLine amount={savings} />
                {savings > 0 && (
                  <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(total)}</dd></div>
                )}
                <div className="flex justify-between">
                  <dt>Shipping</dt>
                  <dd>{selectedCity ? formatPrice(shippingFee) : "Select location"}</dd>
                </div>
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
