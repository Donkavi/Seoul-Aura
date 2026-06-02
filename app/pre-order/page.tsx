"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";
import {
  Send,
  Check,
  AlertCircle,
  Plane,
  Search,
  PackageCheck,
  MessageSquare,
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Phone,
  Package,
  Link2,
  Hash,
  Plus,
  Trash2,
  ShoppingBag,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

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

interface ProductRow {
  productBrand: string;
  productName: string;
  productLink: string;
  quantity: string;
  origin: string;        // kept internally, not shown
  fromCart: boolean;     // sourced from the pre-order bag
  productId?: string;    // cart product id, so we can sync removals
}

const blankRow = (): ProductRow => ({
  productBrand: "",
  productName: "",
  productLink: "",
  quantity: "1",
  origin: "Other",
  fromCart: false,
});

const steps = [
  {
    icon: MessageSquare,
    title: "Submit your wish",
    text: "Tell us the brand, product, and how many you want — add as many items as you like.",
  },
  {
    icon: Search,
    title: "We hunt the source",
    text: "Our buyers ping verified suppliers in Korea to confirm authenticity and price.",
  },
  {
    icon: PackageCheck,
    title: "You confirm",
    text: "Within 48 hours, we email you the quoted price, ETA, and a link to confirm the order.",
  },
  {
    icon: Plane,
    title: "Imported & delivered",
    text: "We import in our next shipment — typically 2-3 weeks — and ship straight to you.",
  },
];

const faqs = [
  {
    q: "Is there any commitment when I submit a pre-order request?",
    a: "Absolutely none. We'll quote you a price within 48 hours — you decide to confirm or walk away. No payment is taken until you say yes.",
  },
  {
    q: "How long does the whole process take?",
    a: "Most Korean items arrive in 2–3 weeks from confirmation. We'll always give you an honest ETA upfront.",
  },
  {
    q: "What if the product isn't available?",
    a: "We'll mark your request as 'rejected' with a polite note and suggest the closest authentic alternative — no charge.",
  },
  {
    q: "Can I pre-order in bulk for a salon or gift?",
    a: "Yes! Quantities of 10+ get wholesale pricing. Just mention it in the notes and we'll send you a separate quote.",
  },
];

export default function PreOrderPage() {
  const { data: session, status: authStatus } = useSession();
  const { preOrderItems, removeItem, clearPreOrders } = useCart();

  const [contact, setContact] = useState({
    customerName: "",
    customerEmail: "",
    phoneNumber: "",
    notes: "",
  });
  const [products, setProducts] = useState<ProductRow[]>([blankRow()]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [refs, setRefs] = useState<string[]>([]);

  // Pre-fill contact from session
  useEffect(() => {
    if (session?.user) {
      setContact((prev) => ({
        ...prev,
        customerName: prev.customerName || session.user?.name || "",
        customerEmail: prev.customerEmail || session.user?.email || "",
      }));
    }
  }, [session]);

  // Seed product rows from the pre-order bag (once)
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (preOrderItems.length > 0) {
      seeded.current = true;
      setProducts(
        preOrderItems.map((i) => ({
          productBrand: i.product.brand || "",
          productName: i.product.name,
          productLink:
            typeof window !== "undefined"
              ? `${window.location.origin}/shop/${i.product.slug ?? i.product._id}`
              : "",
          quantity: String(i.quantity),
          origin: i.product.origin || "Other",
          fromCart: true,
          productId: i.product._id,
        }))
      );
    }
  }, [preOrderItems]);

  const updateContact = (key: string, value: string) =>
    setContact((prev) => ({ ...prev, [key]: value }));

  const updateRow = (idx: number, key: keyof ProductRow, value: string) =>
    setProducts((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));

  const addRow = () => setProducts((rows) => [...rows, blankRow()]);

  const removeRow = (idx: number) => {
    const row = products[idx];
    if (row?.fromCart && row.productId) removeItem(row.productId); // keep the bag in sync
    setProducts((rows) => (rows.length === 1 ? [blankRow()] : rows.filter((_, i) => i !== idx)));
  };

  // Auth gate
  if (authStatus === "loading") {
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
          <h2 className="font-display text-3xl text-ink-900 mb-2">Sign in to pre-order</h2>
          <p className="text-sm text-ink-500 mb-8 leading-relaxed">
            You need to be signed in to submit a pre-order request so we can follow up with you.
          </p>
          <button
            onClick={() => signIn("google", { callbackUrl: "/pre-order" })}
            className="w-full flex items-center justify-center gap-3 border border-ink-200 hover:border-rose-300 hover:bg-rose-50/40 py-3.5 px-6 text-sm font-medium text-ink-800 transition-all rounded-sm"
          >
            <GoogleIcon /> Continue with Google
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!contact.customerName.trim() || !contact.customerEmail.trim() || !contact.phoneNumber.trim()) {
      setError("Please fill in your name, email, and phone number.");
      return;
    }

    const validRows = products.filter((p) => p.productBrand.trim() && p.productName.trim());
    if (validRows.length === 0) {
      setError("Add at least one product with a brand and product name.");
      return;
    }

    setStatus("submitting");
    try {
      const res = await fetch("/api/pre-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: contact.customerName,
          customerEmail: contact.customerEmail,
          phoneNumber: contact.phoneNumber,
          notes: contact.notes,
          items: validRows.map((row) => ({
            productBrand: row.productBrand,
            productName: row.productName,
            productLink: row.productLink,
            quantity: row.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      setRefs(data.requestNumber ? [data.requestNumber] : []);
      clearPreOrders();
      setProducts([blankRow()]);
      seeded.current = false;
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message || "Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-rose-25/30 min-h-[80vh] flex items-center">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 py-16 text-center">
          <div className="w-20 h-20 mx-auto bg-rose-600 rounded-full flex items-center justify-center mb-6">
            <Check size={36} className="text-white" />
          </div>
          <p className="section-subtitle text-rose-600 mb-3">Request Received</p>
          <h1 className="font-display text-4xl lg:text-5xl text-ink-900 mb-4">We&apos;re on the hunt!</h1>
          <p className="text-base text-ink-600 mb-2">
            {refs.length} request{refs.length !== 1 ? "s" : ""} received
            {refs.length > 0 && (
              <>: <span className="font-mono font-semibold text-ink-900">{refs.join(", ")}</span></>
            )}
          </p>
          <p className="text-sm text-ink-500 mb-8 max-w-md mx-auto leading-relaxed">
            Our team will email you a price quote and ETA within <strong>48 hours</strong>. Track everything under
            Pre-Orders in your account.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/account" className="btn-primary">View My Pre-Orders</Link>
            <button onClick={() => setStatus("idle")} className="btn-outline">Submit Another</button>
          </div>
        </div>
      </div>
    );
  }

  const cartCount = products.filter((p) => p.fromCart).length;

  return (
    <>
      <section className="relative bg-gradient-to-br from-rose-100 via-rose-50 to-white overflow-hidden py-16 lg:py-24">
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-gold-100/40 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-full border border-rose-200 mb-6">
            <Sparkles size={14} className="text-rose-600" />
            <span className="text-xs font-medium tracking-widest uppercase text-ink-700">Pre-Order Concierge</span>
          </div>
          <h1 className="font-display text-5xl lg:text-7xl font-medium text-ink-900 mb-5 leading-[1.05]">
            Can&apos;t find it? <span className="italic text-rose-600">We&apos;ll find it.</span>
          </h1>
          <p className="text-base lg:text-lg text-ink-600 max-w-2xl mx-auto leading-relaxed">
            Got a viral K-Beauty drop in mind? Add as many products as you like — we&apos;ll source them from
            authentic suppliers and import them just for you.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 grid lg:grid-cols-5 gap-10 lg:gap-16">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <p className="section-subtitle text-rose-600 mb-2">How it works</p>
              <h2 className="font-display text-3xl lg:text-4xl text-ink-900 leading-tight">
                Four simple steps. <span className="italic">No commitment.</span>
              </h2>
            </div>

            <ol className="space-y-5">
              {steps.map((step, i) => (
                <li
                  key={step.title}
                  className="flex gap-4 p-5 bg-white border border-ink-100 rounded-sm hover:border-rose-200 hover:shadow-card transition-all"
                >
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center">
                        <step.icon size={18} className="text-rose-600" strokeWidth={1.75} />
                      </div>
                      <span className="absolute -top-2 -right-2 w-6 h-6 bg-ink-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ink-900 mb-1">{step.title}</h3>
                    <p className="text-sm text-ink-600 leading-relaxed">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8 space-y-5 shadow-card"
            >
              <header className="pb-5 border-b border-ink-100">
                <p className="section-subtitle text-rose-600 mb-1">Your request</p>
                <h2 className="font-display text-3xl text-ink-900">Tell us what you want</h2>
                <p className="text-sm text-ink-500 mt-1">We&apos;ll get back to you within 48 hours.</p>
              </header>

              {/* Contact */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-3">Your Details</p>
                <div className="space-y-3">
                  <FormField icon={User} label="Full Name *">
                    <input
                      value={contact.customerName}
                      onChange={(e) => updateContact("customerName", e.target.value)}
                      required
                      placeholder="Jane Doe"
                      readOnly={!!session?.user?.name}
                      className={cn("flex-1 bg-transparent outline-none text-sm", session?.user?.name && "text-ink-400 cursor-not-allowed")}
                    />
                  </FormField>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <FormField icon={Mail} label="Email *">
                      <input
                        type="email"
                        value={contact.customerEmail}
                        onChange={(e) => updateContact("customerEmail", e.target.value)}
                        required
                        placeholder="you@example.com"
                        readOnly={!!session?.user?.email}
                        className={cn("flex-1 bg-transparent outline-none text-sm", session?.user?.email && "text-ink-400 cursor-not-allowed")}
                      />
                    </FormField>
                    <FormField icon={Phone} label="Phone *">
                      <input
                        type="tel"
                        value={contact.phoneNumber}
                        onChange={(e) => updateContact("phoneNumber", e.target.value)}
                        required
                        placeholder="077 123 4567"
                        className="flex-1 bg-transparent outline-none text-sm"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-700">
                    Products {products.length > 1 && <span className="text-ink-400 normal-case tracking-normal">({products.length})</span>}
                  </p>
                  {cartCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                      <ShoppingBag size={11} /> {cartCount} from your bag
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {products.map((row, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "rounded-sm border p-4 space-y-3 relative",
                        row.fromCart ? "border-rose-100 bg-rose-25/30" : "border-ink-100 bg-white"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-widest">
                          Item {idx + 1}
                          {row.fromCart && <span className="ml-2 text-rose-600 normal-case tracking-normal">· from bag</span>}
                        </span>
                        {(products.length > 1 || row.fromCart) && (
                          <button
                            type="button"
                            onClick={() => removeRow(idx)}
                            className="p-1 text-ink-400 hover:text-rose-600 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <FormField icon={Sparkles} label="Brand *">
                          <input
                            value={row.productBrand}
                            onChange={(e) => updateRow(idx, "productBrand", e.target.value)}
                            placeholder="e.g. COSRX"
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </FormField>
                        <FormField icon={Package} label="Product Name *">
                          <input
                            value={row.productName}
                            onChange={(e) => updateRow(idx, "productName", e.target.value)}
                            placeholder="e.g. Advanced Snail 96 Mucin Essence"
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </FormField>
                      </div>

                      <FormField icon={Link2} label="Product Link (optional)">
                        <input
                          type="url"
                          value={row.productLink}
                          onChange={(e) => updateRow(idx, "productLink", e.target.value)}
                          placeholder="https://... (Olive Young, Amazon, Instagram, etc.)"
                          className="flex-1 bg-transparent outline-none text-sm"
                        />
                      </FormField>

                      <div className="sm:w-1/2">
                        <FormField icon={Hash} label="Quantity">
                          <input
                            type="number"
                            min={1}
                            value={row.quantity}
                            onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                            className="flex-1 bg-transparent outline-none text-sm"
                          />
                        </FormField>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium border border-dashed border-rose-200 hover:border-rose-400 rounded-sm w-full justify-center py-2.5 transition-colors"
                >
                  <Plus size={14} /> Add Another Product
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                  Anything we should know? (optional)
                </label>
                <textarea
                  value={contact.notes}
                  onChange={(e) => updateContact("notes", e.target.value)}
                  rows={3}
                  placeholder="Specific size, shade, batch preference, gift wrapping, etc."
                  className="input-field resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-3">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="pt-3 border-t border-ink-100 space-y-3">
                <p className="text-xs text-ink-500">
                  By submitting, you agree to our{" "}
                  <Link href="/terms" className="underline">Terms</Link> &{" "}
                  <Link href="/privacy" className="underline">Privacy Policy</Link>. No payment is taken until you
                  confirm the quote.
                </p>
                <button
                  type="submit"
                  disabled={status === "submitting"}
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === "submitting" ? (
                    <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                  ) : (
                    <><Send size={14} /> Submit Pre-Order Request</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="bg-ink-900 text-white py-16 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest text-rose-300 mb-3">FAQ</p>
            <h2 className="font-display text-3xl lg:text-4xl">
              Pre-order, <span className="italic">explained</span>
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <details
                key={i}
                className="bg-ink-800 border border-ink-700 rounded-sm p-5 group cursor-pointer hover:border-rose-500/40 transition-colors"
              >
                <summary className="font-medium cursor-pointer flex items-center justify-between list-none gap-3">
                  <span>{f.q}</span>
                  <span className="text-rose-300 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                </summary>
                <p className="text-sm text-ink-300 mt-3 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-sm text-ink-300 mb-4">Still have questions?</p>
            <a
              href="https://wa.me/94773398094"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-rose-300 hover:text-rose-200 text-sm underline underline-offset-4"
            >
              Chat with us on WhatsApp <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function FormField({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-ink-600 font-semibold block mb-1">{label}</span>
      <div className="flex items-center gap-2 border border-ink-200 px-3.5 py-2.5 focus-within:border-rose-400 transition-colors bg-white">
        <Icon size={13} className="text-ink-400 flex-shrink-0" />
        {children}
      </div>
    </label>
  );
}
