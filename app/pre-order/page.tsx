"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronDown,
  X,
  Clock,
  CreditCard,
  Tag,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { useCart } from "@/context/CartContext";

interface DbBrand { _id: string; name: string; }
interface DbProduct {
  _id: string; name: string; slug: string; images: string[]; price?: number;
  brand?: string; origin?: string; subtype?: string; type?: string;
}

// ─── Combobox ─────────────────────────────────────────────────────────────────
function Combobox({
  value, onChange, options, placeholder, disabled = false, allowCustom = true,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // keep local query in sync when value changes externally (e.g. cart seed)
  useEffect(() => { setQuery(value); }, [value]);

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  const exactMatch = options.some((o) => o.toLowerCase() === query.toLowerCase());

  const select = (v: string) => {
    setQuery(v);
    onChange(v);
    setOpen(false);
  };

  const handleBlur = () => {
    if (!allowCustom && !exactMatch) {
      setQuery("");
      onChange("");
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative flex-1">
      <div className="flex items-center gap-1.5">
        <input
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            // Only push raw text to parent when custom entry is allowed
            if (allowCustom) onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm disabled:text-ink-400"
        />
        {options.length > 0 && (
          <button type="button" tabIndex={-1} onClick={() => setOpen((o) => !o)}
            className="text-ink-300 hover:text-ink-600 flex-shrink-0">
            <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180")} />
          </button>
        )}
      </div>

      {open && (filtered.length > 0 || (!exactMatch && query.trim())) && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-ink-200 rounded-sm shadow-card-hover max-h-52 overflow-y-auto">
          {filtered.slice(0, 20).map((o) => (
            <li key={o}>
              <button type="button" onMouseDown={() => select(o)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-rose-50 hover:text-rose-700 transition-colors">
                {o}
              </button>
            </li>
          ))}
          {allowCustom && !exactMatch && query.trim() && (
            <li>
              <button type="button" onMouseDown={() => select(query.trim())}
                className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 border-t border-ink-100 flex items-center gap-1.5 font-medium">
                <Plus size={12} /> Use &ldquo;{query.trim()}&rdquo;
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

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
  unitPrice?: number;    // listed price for invoice
  productImage?: string; // first image url for invoice
}

const blankRow = (): ProductRow => ({
  productBrand: "",
  productName: "",
  productLink: "",
  quantity: "1",
  origin: "Other",
  fromCart: false,
  unitPrice: undefined,
  productImage: undefined,
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
    text: "We confirm your order from our side within 2 business days. Once confirmed, you pay a non-refundable 25% deposit of the total bill — and your order is locked in.",
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
  const { preOrderItems, removeItem, clearPreOrders, preOrderTotal, addItemSilent, updateQty } = useCart();

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

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreements, setAgreements] = useState({ confirm: false, deposit: false, pricing: false });
  const [balanceMethod, setBalanceMethod] = useState<"cod" | "bank" | "">("");
  const allAgreed = agreements.confirm && agreements.deposit && agreements.pricing && balanceMethod !== "";

  // DB data for comboboxes
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbProductsCache, setDbProductsCache] = useState<Record<string, DbProduct[]>>({});
  const [deliveryCharge, setDeliveryCharge] = useState(350);
  const [allowManualEntry, setAllowManualEntry] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Fetch brands + settings once
  useEffect(() => {
    fetch("/api/brands").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setDbBrands(d);
    }).catch(() => {});
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      if (d?.shippingFee != null) setDeliveryCharge(d.shippingFee);
      if (d?.allowManualPreOrderEntry != null) setAllowManualEntry(d.allowManualPreOrderEntry);
      if (d?.whatsappNumber) setWhatsappNumber(d.whatsappNumber);
    }).catch(() => {});
  }, []);

  // Fetch products for a brand (cached)
  const fetchBrandProducts = useCallback(async (brand: string) => {
    if (!brand.trim() || dbProductsCache[brand]) return;
    try {
      const res = await fetch(`/api/products?brand=${encodeURIComponent(brand)}&limit=100`);
      const data = await res.json();
      setDbProductsCache((prev) => ({ ...prev, [brand]: data.products ?? [] }));
    } catch { /* ignore */ }
  }, [dbProductsCache]);

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

  // Bidirectional sync: keep form rows in sync with the pre-order bag
  useEffect(() => {
    setProducts((prev) => {
      let changed = false;
      const bagIds = new Set(preOrderItems.map((i) => i.product._id));

      // Remove catalog rows whose bag item was deleted
      const filtered = prev.filter((r) => {
        if (!r.productId) return true;
        if (!bagIds.has(r.productId)) { changed = true; return false; }
        return true;
      });

      // Sync quantities for existing catalog rows
      const synced = filtered.map((r) => {
        if (!r.productId) return r;
        const bi = preOrderItems.find((i) => i.product._id === r.productId);
        if (!bi) return r;
        const newQty = String(bi.quantity);
        if (r.quantity !== newQty) { changed = true; return { ...r, quantity: newQty }; }
        return r;
      });

      // Add new bag items not yet represented in form
      const existingIds = new Set(synced.map((r) => r.productId).filter(Boolean) as string[]);
      const newRows = preOrderItems
        .filter((i) => !existingIds.has(i.product._id))
        .map((i) => {
          changed = true;
          return {
            productBrand: i.product.brand || "",
            productName: i.product.name,
            productLink: typeof window !== "undefined"
              ? `${window.location.origin}/shop/${i.product.slug ?? i.product._id}`
              : "",
            quantity: String(i.quantity),
            origin: i.product.origin || "Other",
            fromCart: true,
            productId: i.product._id,
            unitPrice: i.product.price,
            productImage: i.product.images?.[0],
          };
        });

      if (!changed) return prev;
      const merged = [...newRows, ...synced];
      return merged.length > 0 ? merged : [blankRow()];
    });
    // Pre-fetch products for brands in the bag
    preOrderItems.forEach((i) => { if (i.product.brand) fetchBrandProducts(i.product.brand); });
  }, [preOrderItems, fetchBrandProducts]);

  const updateContact = (key: string, value: string) =>
    setContact((prev) => ({ ...prev, [key]: value }));

  const updateRow = (idx: number, key: keyof ProductRow, value: string) => {
    setProducts((rows) => rows.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));
    // Sync quantity changes to the pre-order bag
    if (key === "quantity") {
      const row = products[idx];
      if (row.productId) updateQty(row.productId, Math.max(1, parseInt(value) || 1));
    }
  };

  const onBrandChange = (idx: number, brand: string) => {
    const row = products[idx];
    if (row.productId) removeItem(row.productId); // remove old catalog product from bag
    setProducts((rows) => rows.map((r, i) =>
      i === idx ? { ...r, productBrand: brand, productName: "", productLink: "", productId: undefined, unitPrice: undefined } : r
    ));
    fetchBrandProducts(brand);
  };

  const onProductChange = (idx: number, name: string) => {
    const brand = products[idx].productBrand;
    const cached = dbProductsCache[brand] ?? [];
    const matched = cached.find((p) => p.name === name);
    const oldRow = products[idx];

    // Remove old catalog product from bag if switching to a different one
    if (oldRow.productId && matched?._id !== oldRow.productId) {
      removeItem(oldRow.productId);
    }

    setProducts((rows) => rows.map((r, i) =>
      i === idx ? {
        ...r,
        productName: name,
        productLink: matched
          ? `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${matched.slug ?? matched._id}`
          : r.productLink,
        unitPrice: matched?.price ?? r.unitPrice,
        productImage: matched?.images?.[0] ?? r.productImage,
        productId: matched?._id,
      } : r
    ));

    // Form → Bag: add matched catalog product to pre-order bag (silently)
    if (matched) {
      const qty = Math.max(1, parseInt(products[idx].quantity) || 1);
      addItemSilent({
        _id: matched._id,
        name: matched.name,
        slug: matched.slug,
        images: matched.images,
        price: matched.price ?? 0,
        brand: matched.brand ?? brand,
        origin: (matched.origin ?? "Other") as "Korea" | "Dubai" | "Other",
        subtype: matched.subtype ?? "",
        type: matched.type ?? "",
        description: "",
        shortDescription: "",
        stock: 99,
        tags: [],
        concerns: [],
        isFeatured: false,
        isBestSeller: false,
        isNewArrival: false,
        averageRating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        isPreOrder: true,
      }, qty);
    }
  };

  const addRow = () => setProducts((rows) => [...rows, blankRow()]);

  const removeRow = (idx: number) => {
    const row = products[idx];
    if (row.productId) removeItem(row.productId); // sync removal to bag
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

  const handleSubmit = (e: React.FormEvent) => {
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

    // Open the confirmation modal — actual submit happens after the user agrees
    setAgreements({ confirm: false, deposit: false, pricing: false });
    setBalanceMethod("");
    setShowConfirm(true);
  };

  const confirmAndSubmit = async () => {
    if (!allAgreed) return;
    setError("");

    const validRows = products.filter((p) => p.productBrand.trim() && p.productName.trim());
    if (validRows.length === 0) {
      setShowConfirm(false);
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
          balancePaymentMethod: balanceMethod,
          items: validRows.map((row) => ({
            productBrand: row.productBrand,
            productName: row.productName,
            productLink: row.productLink,
            quantity: row.quantity,
            unitPrice: row.unitPrice,
            productImage: row.productImage,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      setRefs(data.requestNumber ? [data.requestNumber] : []);
      clearPreOrders();
      setProducts([blankRow()]);
      setShowConfirm(false);
      setStatus("success");
    } catch (err) {
      setShowConfirm(false);
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
            <Link href="/account?tab=pre-orders" className="btn-primary">View My Pre-Orders</Link>
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

      <section id="request-form" className="py-16 lg:py-20">
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
                          <Combobox
                            value={row.productBrand}
                            onChange={(v) => onBrandChange(idx, v)}
                            options={dbBrands.map((b) => b.name)}
                            placeholder="e.g. COSRX"
                            allowCustom={allowManualEntry}
                          />
                        </FormField>
                        <FormField icon={Package} label="Product Name *">
                          <Combobox
                            value={row.productName}
                            onChange={(v) => onProductChange(idx, v)}
                            options={(dbProductsCache[row.productBrand] ?? []).map((p) => p.name)}
                            placeholder={row.productBrand ? "Select or type a product" : "Enter brand first"}
                            allowCustom={allowManualEntry}
                            disabled={false}
                          />
                        </FormField>
                      </div>

                      <FormField icon={Link2} label="Product Link (optional)">
                        <input
                          type="url"
                          value={row.productLink}
                          onChange={(e) => updateRow(idx, "productLink", e.target.value)}
                          placeholder="https://... (Nolimit, Waxworks, Glam Lanka, House of Makeup, etc.)"
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

              {/* Estimated order total — shown when items have known prices */}
              {(() => {
                const validRows = products.filter(r => r.productBrand.trim() && r.productName.trim());
                const pricedRows = validRows.filter(r => r.unitPrice != null);
                if (pricedRows.length === 0) return null;
                const subtotal = pricedRows.reduce((s, r) => s + (r.unitPrice! * parseInt(r.quantity || "1")), 0);
                const total = subtotal + deliveryCharge;
                const allPriced = pricedRows.length === validRows.length;
                return (
                  <div className="bg-rose-50/60 border border-rose-100 rounded-sm p-4 space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold mb-3">Order Summary</p>
                    {pricedRows.map((r, i) => (
                      <div key={i} className="flex justify-between text-xs text-ink-600">
                        <span className="truncate max-w-[220px]">{r.productName} <span className="text-ink-400">× {r.quantity}</span></span>
                        <span className="font-medium ml-2 whitespace-nowrap">{formatPrice(r.unitPrice! * parseInt(r.quantity || "1"))}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-rose-100 space-y-1.5">
                      <div className="flex justify-between text-xs text-ink-500">
                        <span>{allPriced ? "Subtotal" : "Subtotal (partial)"}</span>
                        <span>~{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-ink-500">
                        <span>Delivery Charge</span>
                        <span>{formatPrice(deliveryCharge)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-rose-100">
                        <span className="text-xs font-semibold text-ink-700">Est. Total</span>
                        <span className="text-base font-bold text-rose-600">~{formatPrice(total)}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-ink-400">Final pricing confirmed within 48 hrs. No payment until you approve.</p>
                  </div>
                );
              })()}

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

      {/* WhatsApp contact nudge */}
      <section className="py-12 bg-rose-50 border-y border-rose-100">
        <div className="max-w-3xl mx-auto px-4 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white border border-rose-200 mb-4">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-green-500">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl lg:text-3xl text-ink-900 mb-2">
            Can&apos;t find your product in the list?
          </h2>
          <p className="text-sm text-ink-600 max-w-md mx-auto mb-6 leading-relaxed">
            If the brand or product you&apos;re looking for isn&apos;t in our catalog yet, just message us directly on WhatsApp — we&apos;ll source it for you.
          </p>
          <a
            href={`https://wa.me/${(whatsappNumber || "+94778362755").replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-3 rounded-sm transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Chat with us on WhatsApp
          </a>
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
              href={`https://wa.me/${(whatsappNumber || "+94778362755").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-rose-300 hover:text-rose-200 text-sm underline underline-offset-4"
            >
              Chat with us on WhatsApp <ArrowRight size={14} />
            </a>
          </div>
        </div>
      </section>

      {/* Confirmation modal */}
      {showConfirm && (() => {
        const validRows = products.filter(r => r.productBrand.trim() && r.productName.trim());
        const pricedRows = validRows.filter(r => r.unitPrice != null);
        const allPriced = pricedRows.length > 0 && pricedRows.length === validRows.length;
        const subtotal = pricedRows.reduce((s, r) => s + (r.unitPrice! * parseInt(r.quantity || "1")), 0);
        const estTotal = subtotal + deliveryCharge;
        const deposit = Math.round(estTotal * 0.25);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in"
              onClick={() => status !== "submitting" && setShowConfirm(false)}
            />
            <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
              <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
                <h3 className="font-display text-xl text-ink-900">Before we place your request</h3>
                <button
                  onClick={() => status !== "submitting" && setShowConfirm(false)}
                  className="p-1.5 hover:bg-ink-50 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X size={18} className="text-ink-500" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-ink-600 leading-relaxed">
                  Please review and acknowledge how pre-orders work before we submit your request:
                </p>

                {/* Checkbox 1 — confirmation window */}
                <label className="flex items-start gap-3 p-3.5 border border-ink-200 rounded-sm cursor-pointer hover:border-rose-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={agreements.confirm}
                    onChange={(e) => setAgreements((a) => ({ ...a, confirm: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-rose-600 cursor-pointer flex-shrink-0"
                  />
                  <span className="flex items-start gap-2 text-sm text-ink-700 leading-relaxed">
                    <Clock size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>We&apos;ll review and <strong>confirm your order from our side within 2 business days</strong>.</span>
                  </span>
                </label>

                {/* Checkbox 2 — deposit */}
                <label className="flex items-start gap-3 p-3.5 border border-ink-200 rounded-sm cursor-pointer hover:border-rose-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={agreements.deposit}
                    onChange={(e) => setAgreements((a) => ({ ...a, deposit: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-rose-600 cursor-pointer flex-shrink-0"
                  />
                  <span className="flex items-start gap-2 text-sm text-ink-700 leading-relaxed">
                    <CreditCard size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>
                      Once confirmed, I agree to pay a <strong>25% deposit
                      {allPriced && <> (~{formatPrice(deposit)})</>} via bank transfer</strong> to lock in my order. I understand this <strong>deposit is non-refundable</strong>.
                    </span>
                  </span>
                </label>

                {/* Checkbox 3 — estimated pricing */}
                <label className="flex items-start gap-3 p-3.5 border border-ink-200 rounded-sm cursor-pointer hover:border-rose-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={agreements.pricing}
                    onChange={(e) => setAgreements((a) => ({ ...a, pricing: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 accent-rose-600 cursor-pointer flex-shrink-0"
                  />
                  <span className="flex items-start gap-2 text-sm text-ink-700 leading-relaxed">
                    <Tag size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                    <span>I understand the <strong>estimated total is based on current listed prices</strong>, and final pricing will be confirmed within 48 hours.</span>
                  </span>
                </label>

                {allPriced && (
                  <div className="bg-rose-50/60 border border-rose-100 rounded-sm p-3 text-xs space-y-1">
                    <div className="flex justify-between text-ink-500">
                      <span>Estimated Total</span>
                      <span>~{formatPrice(estTotal)}</span>
                    </div>
                    <div className="flex justify-between text-ink-900 font-semibold">
                      <span>Deposit via bank transfer (25%)</span>
                      <span className="text-rose-600">~{formatPrice(deposit)}</span>
                    </div>
                    {balanceMethod !== "" && (
                      <div className="flex justify-between text-ink-500 pt-1 border-t border-rose-100">
                        <span>Balance ({balanceMethod === "bank" ? "Bank Transfer" : "Cash on Delivery"})</span>
                        <span>~{formatPrice(estTotal - deposit)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Balance payment method */}
                <div>
                  <p className="text-xs font-semibold text-ink-700 mb-2">How would you like to pay the remaining balance?</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setBalanceMethod("cod")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 border rounded-sm text-center transition-colors",
                        balanceMethod === "cod"
                          ? "border-rose-500 bg-rose-50/60 ring-1 ring-rose-300"
                          : "border-ink-200 hover:border-rose-300"
                      )}
                    >
                      <ShoppingBag size={18} className={balanceMethod === "cod" ? "text-rose-600" : "text-ink-400"} />
                      <span className="text-xs font-medium text-ink-800">Cash on Delivery</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBalanceMethod("bank")}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 border rounded-sm text-center transition-colors",
                        balanceMethod === "bank"
                          ? "border-rose-500 bg-rose-50/60 ring-1 ring-rose-300"
                          : "border-ink-200 hover:border-rose-300"
                      )}
                    >
                      <CreditCard size={18} className={balanceMethod === "bank" ? "text-rose-600" : "text-ink-400"} />
                      <span className="text-xs font-medium text-ink-800">Bank Transfer</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-ink-400 mt-1.5">The 25% deposit is always paid via bank transfer. This is for the remaining balance.</p>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-ink-100 px-6 py-4 flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={status === "submitting"}
                  className="btn-outline flex-1 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAndSubmit}
                  disabled={!allAgreed || status === "submitting"}
                  className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "submitting" ? (
                    <><Loader2 size={14} className="animate-spin" /> Placing…</>
                  ) : (
                    <><Check size={14} /> Place Pre-Order</>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
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
