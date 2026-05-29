"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package, MapPin, Heart, CreditCard, Bell, LogOut,
  ChevronRight, Sparkles, Calendar, Loader2, ShoppingBag,
  Plus, Trash2, Check, X, Shield,
} from "lucide-react";
import { cn, formatPrice, relativeDate } from "@/lib/utils";
import type { Order, Subscription } from "@/types";

// ─── Google Icon ─────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.59 6.59 0 010-4.18V7.07H2.18a10.99 10.99 0 000 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

// ─── Sign-in page ─────────────────────────────────────────────────────────────
function SignInPage() {
  return (
    <div className="bg-rose-25/30 min-h-screen flex items-center py-12 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 bg-white border border-ink-100 rounded-sm overflow-hidden shadow-card">
          <div className="hidden lg:block relative bg-gradient-to-br from-rose-100 via-rose-50 to-white p-12">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-10 left-10 w-64 h-64 bg-rose-200 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold-100 rounded-full blur-3xl" />
            </div>
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-rose-600 font-semibold mb-4">Seoul Aura · Member</p>
                <h1 className="font-display text-5xl text-ink-900 leading-tight">
                  Join the <span className="italic text-rose-600">circle</span>.
                </h1>
                <p className="text-sm text-ink-600 mt-4 max-w-xs leading-relaxed">
                  Track your orders, manage subscriptions, save favorites, and unlock exclusive member perks.
                </p>
              </div>
              <ul className="space-y-3 text-sm text-ink-700">
                {["Early access to new arrivals", "Birthday gifts & double points month",
                  "Pause or skip your subscription anytime", "Personalized skincare recommendations"].map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Sparkles size={14} className="text-rose-600 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            <h2 className="font-display text-3xl lg:text-4xl text-ink-900 mb-2">Welcome</h2>
            <p className="text-sm text-ink-500 mb-10 leading-relaxed">
              Sign in to manage your orders and subscriptions.<br />New here? Your account is created automatically.
            </p>
            <button
              onClick={() => signIn("google", { callbackUrl: "/account" })}
              className="w-full flex items-center justify-center gap-3 border border-ink-200 hover:border-rose-300 hover:bg-rose-25/40 py-3.5 px-6 text-sm font-medium text-ink-800 transition-all duration-200 rounded-sm"
            >
              <GoogleIcon />Continue with Google
            </button>
            <p className="text-[11px] text-center text-ink-400 mt-6">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline hover:text-ink-700">Terms</Link>{" "}&amp;{" "}
              <Link href="/privacy" className="underline hover:text-ink-700">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Status badge styles ──────────────────────────────────────────────────────
const ORDER_STATUS: Record<string, string> = {
  pending:   "bg-gold-50 text-gold-700",
  confirmed: "bg-rose-50 text-rose-700",
  shipped:   "bg-blue-50 text-blue-700",
  delivered: "bg-green-50 text-green-700",
  cancelled: "bg-ink-100 text-ink-500",
};
const SUB_STATUS: Record<string, string> = {
  active:    "bg-green-50 text-green-700",
  paused:    "bg-gold-50 text-gold-700",
  cancelled: "bg-ink-100 text-ink-500",
};

// ─── Tab: Orders ─────────────────────────────────────────────────────────────
function OrdersTab({ email }: { email: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders?email=${encodeURIComponent(email)}&limit=50`)
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <TabLoader />;

  if (orders.length === 0) return (
    <EmptyState icon={Package} message="No orders yet.">
      <Link href="/shop" className="btn-primary mt-4 inline-block px-6 py-2 text-sm">Start Shopping</Link>
    </EmptyState>
  );

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o._id} className="bg-white border border-ink-100 rounded-sm p-5 hover:border-rose-200 transition-colors">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-xs font-mono text-ink-500">{o.orderNumber}</p>
              <p className="text-xs text-ink-400 mt-0.5">{relativeDate(o.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xs px-3 py-1 rounded-full font-medium capitalize", ORDER_STATUS[o.status] ?? "bg-ink-100 text-ink-500")}>
                {o.status}
              </span>
              <span className="text-xs text-ink-500 capitalize">{o.orderType}</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {o.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image ? (
                  <div className="w-10 h-10 relative shrink-0 rounded overflow-hidden border border-ink-100">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 shrink-0 rounded bg-ink-100 flex items-center justify-center">
                    <ShoppingBag size={14} className="text-ink-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink-900 truncate">{item.name}</p>
                  <p className="text-xs text-ink-500">Qty {item.quantity} · {formatPrice(item.price)}</p>
                </div>
                <p className="text-sm font-medium text-ink-900 shrink-0">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-ink-100 pt-3">
            <span className="text-xs text-ink-500">Total</span>
            <span className="text-sm font-semibold text-ink-900">{formatPrice(o.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Subscriptions ───────────────────────────────────────────────────────
function SubscriptionsTab({ email }: { email: string }) {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/subscriptions?search=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => setSubs(Array.isArray(d) ? d.filter((s: Subscription) => s.customerEmail.toLowerCase() === email.toLowerCase()) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  if (loading) return <TabLoader />;

  if (subs.length === 0) return (
    <EmptyState icon={Calendar} message="No active subscriptions.">
      <Link href="/subscriptions" className="btn-primary mt-4 inline-block px-6 py-2 text-sm">Browse Plans</Link>
    </EmptyState>
  );

  return (
    <div className="space-y-4">
      {subs.map((s) => (
        <div key={s._id} className="bg-white border border-ink-100 rounded-sm p-5 hover:border-rose-200 transition-colors">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">{s.origin}</p>
              <h3 className="font-display text-xl text-ink-900">{s.planName}</h3>
              <p className="text-sm text-ink-500 mt-0.5">Rs. {s.planPrice.toLocaleString()} / month</p>
            </div>
            <span className={cn("text-xs px-3 py-1 rounded-full font-medium capitalize shrink-0", SUB_STATUS[s.status] ?? "bg-ink-100 text-ink-500")}>
              {s.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-ink-600 border-t border-ink-100 pt-3">
            <div>
              <p className="text-ink-400 mb-0.5">Started</p>
              <p>{new Date(s.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
            <div>
              <p className="text-ink-400 mb-0.5">Next billing</p>
              <p>{new Date(s.nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Wishlist ────────────────────────────────────────────────────────────
function WishlistTab() {
  const [items, setItems] = useState<{ id: string; name: string; price: number; image: string; slug: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sa-wishlist");
      setItems(raw ? JSON.parse(raw) : []);
    } catch { setItems([]); }
  }, []);

  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    setItems(next);
    localStorage.setItem("sa-wishlist", JSON.stringify(next));
  };

  if (items.length === 0) return (
    <EmptyState icon={Heart} message="Your wishlist is empty.">
      <Link href="/shop" className="btn-primary mt-4 inline-block px-6 py-2 text-sm">Browse Products</Link>
    </EmptyState>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white border border-ink-100 rounded-sm p-4 flex items-center gap-3 hover:border-rose-200 transition-colors">
          {item.image ? (
            <div className="w-16 h-16 relative shrink-0 rounded overflow-hidden border border-ink-100">
              <Image src={item.image} alt={item.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="w-16 h-16 shrink-0 rounded bg-ink-100" />
          )}
          <div className="flex-1 min-w-0">
            <Link href={`/shop/${item.slug}`} className="text-sm font-medium text-ink-900 hover:text-rose-600 truncate block">{item.name}</Link>
            <p className="text-sm text-ink-500 mt-0.5">{formatPrice(item.price)}</p>
          </div>
          <button onClick={() => remove(item.id)} className="p-1.5 hover:bg-rose-50 rounded text-ink-400 hover:text-rose-600 transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Addresses ───────────────────────────────────────────────────────────
interface Address {
  _id?: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  country: string;
  isDefault: boolean;
}

function AddressesTab({ email, userId }: { email: string; userId?: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Address, "_id">>({
    label: "Home", line1: "", city: "", country: "Sri Lanka", isDefault: false,
  });

  const loadAddresses = useCallback(() => {
    setLoading(true);
    fetch(`/api/users?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((d) => {
        const user = d.users?.[0];
        setAddresses(user?.addresses ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [email]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  const saveAddress = async () => {
    if (!form.line1.trim() || !form.city.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/users/address`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, address: form }),
      });
      setAdding(false);
      setForm({ label: "Home", line1: "", city: "", country: "Sri Lanka", isDefault: false });
      loadAddresses();
    } catch { } finally { setSaving(false); }
  };

  if (loading) return <TabLoader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink-700">Saved Addresses</h3>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-xs border border-ink-200 px-3 py-1.5 hover:border-rose-300 hover:text-rose-600 transition-colors"
        >
          <Plus size={12} /> Add Address
        </button>
      </div>

      {adding && (
        <div className="bg-rose-25/30 border border-rose-100 rounded-sm p-4 mb-4">
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">New Address</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {[
              { label: "Label (e.g. Home)", key: "label" as const },
              { label: "Address Line 1 *", key: "line1" as const },
              { label: "Address Line 2", key: "line2" as const },
              { label: "City *", key: "city" as const },
              { label: "Province", key: "province" as const },
              { label: "Postal Code", key: "postalCode" as const },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-ink-700 mb-1">{label}</label>
                <input
                  value={(form as any)[key] ?? ""}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs text-ink-600 mb-3 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="accent-rose-600" />
            Set as default address
          </label>
          <div className="flex gap-2">
            <button onClick={saveAddress} disabled={saving || !form.line1.trim() || !form.city.trim()}
              className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs px-4 py-2 hover:bg-rose-700 disabled:opacity-60 transition-colors">
              <Check size={12} /> {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={() => setAdding(false)}
              className="inline-flex items-center gap-1.5 border border-ink-200 text-ink-700 text-xs px-4 py-2 hover:bg-ink-50 transition-colors">
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      )}

      {addresses.length === 0 && !adding ? (
        <EmptyState icon={MapPin} message="No saved addresses yet." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr, i) => (
            <div key={i} className="bg-white border border-ink-100 rounded-sm p-4 hover:border-rose-200 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <span className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                  {addr.label}{addr.isDefault && " · Default"}
                </span>
              </div>
              <p className="text-sm text-ink-700 leading-relaxed">
                {addr.line1}{addr.line2 && `, ${addr.line2}`}<br />
                {addr.city}{addr.province && `, ${addr.province}`}{addr.postalCode && ` ${addr.postalCode}`}<br />
                {addr.country}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tab: Payment Methods ─────────────────────────────────────────────────────
function PaymentMethodsTab() {
  return (
    <EmptyState icon={CreditCard} message="No saved payment methods.">
      <p className="text-xs text-ink-400 mt-2">Payment methods will be saved when you complete your first order.</p>
    </EmptyState>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function NotificationsTab() {
  return (
    <EmptyState icon={Bell} message="No notifications yet.">
      <p className="text-xs text-ink-400 mt-2">Order updates and promotions will appear here.</p>
    </EmptyState>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function TabLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={22} className="animate-spin text-rose-400" />
    </div>
  );
}

function EmptyState({ icon: Icon, message, children }: {
  icon: React.ElementType; message: string; children?: React.ReactNode;
}) {
  return (
    <div className="text-center py-16">
      <Icon size={36} className="mx-auto mb-3 text-ink-200" strokeWidth={1.2} />
      <p className="text-sm text-ink-500">{message}</p>
      {children}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
type TabKey = "orders" | "subscriptions" | "wishlist" | "addresses" | "payments" | "notifications";

const NAV_ITEMS: { key: TabKey; icon: React.ElementType; label: string }[] = [
  { key: "orders",        icon: Package,       label: "Orders" },
  { key: "subscriptions", icon: Calendar,      label: "Subscriptions" },
  { key: "wishlist",      icon: Heart,         label: "Wishlist" },
  { key: "addresses",     icon: MapPin,        label: "Addresses" },
  { key: "payments",      icon: CreditCard,    label: "Payment Methods" },
  { key: "notifications", icon: Bell,          label: "Notifications" },
];

function Dashboard({ user }: { user: { name?: string | null; email?: string | null; image?: string | null; id?: string; isAdmin?: boolean } }) {
  const [activeTab, setActiveTab] = useState<TabKey>("orders");
  const isAdmin = user.isAdmin ?? false;

  const name = user.name ?? user.email?.split("@")[0] ?? "Member";
  const email = user.email ?? "";
  const initials = name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  const renderTab = () => {
    switch (activeTab) {
      case "orders":        return <OrdersTab email={email} />;
      case "subscriptions": return <SubscriptionsTab email={email} />;
      case "wishlist":      return <WishlistTab />;
      case "addresses":     return <AddressesTab email={email} userId={user.id} />;
      case "payments":      return <PaymentMethodsTab />;
      case "notifications": return <NotificationsTab />;
    }
  };

  return (
    <div className="bg-rose-25/30 min-h-screen">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-rose-100/40 border-b border-ink-100 py-6 lg:py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:gap-4 min-w-0">
              {user.image ? (
                <Image src={user.image} alt={name} width={56} height={56}
                  className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover border-2 border-white shadow shrink-0" />
              ) : (
                <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-display text-xl lg:text-2xl shadow shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">Welcome back</p>
                <h1 className="font-display text-2xl lg:text-4xl text-ink-900 truncate">{name}</h1>
                <p className="text-xs text-ink-500 mt-0.5 truncate">{email}</p>
              </div>
            </div>
            {/* Sign out — visible on mobile in header */}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="lg:hidden shrink-0 flex items-center gap-1.5 text-xs text-ink-500 border border-ink-200 px-3 py-2 rounded-sm hover:text-rose-600 hover:border-rose-200 transition-colors"
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile horizontal tab bar */}
      <div className="lg:hidden bg-white border-b border-ink-100 sticky top-[72px] z-10 overflow-x-auto scrollbar-none">
        <div className="flex min-w-max">
          {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 text-[10px] font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === key
                  ? "border-rose-600 text-rose-600"
                  : "border-transparent text-ink-500"
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex flex-col items-center gap-1 px-4 py-3 text-[10px] font-medium border-b-2 border-transparent text-rose-600 whitespace-nowrap"
            >
              <Shield size={16} />
              Admin
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-10 lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block lg:col-span-1">
          <nav className="bg-white border border-ink-100 rounded-sm p-3 sticky top-28">
            {NAV_ITEMS.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  "w-full flex items-center justify-between p-3 transition-colors rounded-sm group text-left",
                  activeTab === key
                    ? "bg-rose-50 text-rose-600"
                    : "hover:bg-rose-50 text-ink-700 hover:text-rose-600"
                )}
              >
                <span className="flex items-center gap-3 text-sm">
                  <Icon size={15} />
                  {label}
                </span>
                <ChevronRight size={12} className="text-ink-300" />
              </button>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="w-full mt-3 pt-3 border-t border-ink-100 flex items-center gap-3 p-3 text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors"
              >
                <Shield size={15} /> Admin Panel
              </Link>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className={cn(
                "w-full flex items-center gap-3 p-3 text-sm text-ink-500 hover:text-rose-600 transition-colors",
                isAdmin ? "border-t border-ink-100 mt-1 pt-3" : "mt-3 pt-3 border-t border-ink-100"
              )}
            >
              <LogOut size={15} /> Sign Out
            </button>
          </nav>
        </aside>

        {/* Main content */}
        <main className="lg:col-span-3">
          <div className="bg-white border border-ink-100 rounded-sm p-4 lg:p-8 min-h-[400px]">
            <h2 className="font-display text-xl lg:text-2xl text-ink-900 mb-5 pb-4 border-b border-ink-100">
              {NAV_ITEMS.find((n) => n.key === activeTab)?.label}
            </h2>
            {renderTab()}
          </div>

          {/* Referral */}
          <section className="mt-4 lg:mt-6 bg-gradient-to-br from-ink-900 to-ink-800 text-white rounded-sm p-6 lg:p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-rose-300 mb-2">Refer a Friend</p>
              <h3 className="font-display text-xl lg:text-2xl mb-2">Give Rs. 1,000 · Get Rs. 1,000</h3>
              <p className="text-xs lg:text-sm text-ink-300 mb-4 lg:mb-5 max-w-md">
                Share your unique code with friends. When they shop, you both score Rs. 1,000 store credit.
              </p>
              <div className="flex items-center gap-2 max-w-sm">
                <code className="flex-1 min-w-0 bg-white/10 backdrop-blur border border-white/20 px-3 lg:px-4 py-2.5 text-xs lg:text-sm font-mono truncate">
                  AURA-{initials}-2026
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`AURA-${initials}-2026`)}
                  className="shrink-0 bg-white text-ink-900 px-3 lg:px-4 py-2.5 text-xs lg:text-sm font-medium hover:bg-rose-50 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

// ─── Page root ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-rose-500" />
      </div>
    );
  }

  if (session?.user) {
    return <Dashboard user={{
      ...session.user,
      id: (session.user as any).id,
      isAdmin: (session.user as any).isAdmin ?? false,
    }} />;
  }

  return <SignInPage />;
}
