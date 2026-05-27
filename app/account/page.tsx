"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Package,
  MapPin,
  Heart,
  CreditCard,
  Bell,
  LogOut,
  ChevronRight,
  Sparkles,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "signin" | "register";

interface AccountData {
  name: string;
  email: string;
  joinedAt: string;
}

export default function AccountPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [tab, setTab] = useState<Tab>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("sa-account");
    if (stored) setAccount(JSON.parse(stored));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (tab === "register") {
      if (!form.name.trim() || !form.email.trim() || !form.password) {
        setError("All fields are required");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError("Passwords don't match");
        return;
      }
      if (form.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    } else {
      if (!form.email.trim() || !form.password) {
        setError("Email and password are required");
        return;
      }
    }

    setSubmitting(true);
    setTimeout(() => {
      const data: AccountData = {
        name: form.name || form.email.split("@")[0],
        email: form.email,
        joinedAt: new Date().toISOString(),
      };
      localStorage.setItem("sa-account", JSON.stringify(data));
      setAccount(data);
      setSubmitting(false);
    }, 600);
  };

  const handleSignOut = () => {
    localStorage.removeItem("sa-account");
    setAccount(null);
    setForm({ name: "", email: "", password: "", confirmPassword: "" });
  };

  if (account) return <Dashboard account={account} onSignOut={handleSignOut} />;

  return (
    <div className="bg-rose-25/30 min-h-screen flex items-center py-12 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 bg-white border border-ink-100 rounded-sm overflow-hidden shadow-card">
          <div className="hidden lg:block relative bg-gradient-to-br from-rose-100 via-rose-50 to-white p-12">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-10 left-10 w-64 h-64 bg-rose-200 rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-72 h-72 bg-gold-100 rounded-full blur-3xl" />
            </div>
            <div className="relative h-full flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-rose-600 font-semibold mb-4">
                  Seoul Aura · Member
                </p>
                <h1 className="font-display text-5xl text-ink-900 leading-tight">
                  Join the <span className="italic text-rose-600">circle</span>.
                </h1>
                <p className="text-sm text-ink-600 mt-4 max-w-xs leading-relaxed">
                  Track your orders, manage subscriptions, save favorites, and unlock exclusive
                  member perks.
                </p>
              </div>

              <ul className="space-y-3 text-sm text-ink-700">
                {[
                  "Early access to new arrivals",
                  "Birthday gifts & double points month",
                  "Pause or skip your subscription anytime",
                  "Personalized skincare recommendations",
                ].map((perk) => (
                  <li key={perk} className="flex items-center gap-2">
                    <Sparkles size={14} className="text-rose-600 flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            <div className="flex gap-1 mb-8 border-b border-ink-100">
              <button
                onClick={() => {
                  setTab("signin");
                  setError("");
                }}
                className={cn(
                  "pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative",
                  tab === "signin" ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
                )}
              >
                Sign In
                {tab === "signin" && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-rose-600" />
                )}
              </button>
              <button
                onClick={() => {
                  setTab("register");
                  setError("");
                }}
                className={cn(
                  "pb-3 px-4 text-sm font-medium tracking-wide transition-colors relative",
                  tab === "register" ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
                )}
              >
                Create Account
                {tab === "register" && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 bg-rose-600" />
                )}
              </button>
            </div>

            <h2 className="font-display text-3xl text-ink-900 mb-2">
              {tab === "signin" ? "Welcome back" : "Hello, beautiful"}
            </h2>
            <p className="text-sm text-ink-500 mb-7">
              {tab === "signin"
                ? "Sign in to manage your orders and subscriptions."
                : "Create your account in seconds — no payment required."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "register" && (
                <Field icon={User} label="Full Name">
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="bg-transparent flex-1 outline-none text-sm"
                  />
                </Field>
              )}

              <Field icon={Mail} label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="bg-transparent flex-1 outline-none text-sm"
                />
              </Field>

              <Field icon={Lock} label="Password">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="bg-transparent flex-1 outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-ink-400 hover:text-ink-700"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </Field>

              {tab === "register" && (
                <Field icon={Lock} label="Confirm Password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    className="bg-transparent flex-1 outline-none text-sm"
                  />
                </Field>
              )}

              {tab === "signin" && (
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-ink-600 cursor-pointer">
                    <input type="checkbox" className="accent-rose-600" />
                    Remember me
                  </label>
                  <button type="button" className="text-rose-600 hover:underline">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60"
              >
                {submitting
                  ? "Just a moment…"
                  : tab === "signin"
                  ? "Sign In"
                  : "Create My Account"}
              </button>

              <div className="text-center text-xs text-ink-400">
                <span>or</span>
              </div>

              <button
                type="button"
                className="w-full border border-ink-200 hover:border-ink-400 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09a6.59 6.59 0 010-4.18V7.07H2.18a10.99 10.99 0 000 9.86l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.2 1.65l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 002.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
                  />
                </svg>
                Continue with Google
              </button>

              <p className="text-[11px] text-center text-ink-400 mt-2">
                By continuing you agree to our{" "}
                <Link href="/terms" className="underline">Terms</Link> &{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2 border border-ink-200 px-4 py-3 focus-within:border-rose-400 transition-colors">
        <Icon size={14} className="text-ink-400 flex-shrink-0" />
        {children}
      </div>
    </label>
  );
}

function Dashboard({
  account,
  onSignOut,
}: {
  account: AccountData;
  onSignOut: () => void;
}) {
  const initials = account.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = new Date(account.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const navItems = [
    { icon: Package, label: "Orders", count: 3, href: "#orders" },
    { icon: Calendar, label: "Subscriptions", count: 1, href: "/subscriptions" },
    { icon: Heart, label: "Wishlist", count: 7, href: "/wishlist" },
    { icon: MapPin, label: "Addresses", count: 1, href: "#addresses" },
    { icon: CreditCard, label: "Payment Methods", count: 2, href: "#payments" },
    { icon: Bell, label: "Notifications", count: 0, href: "#notifications" },
  ];

  return (
    <div className="bg-rose-25/30 min-h-screen">
      <div className="bg-gradient-to-br from-rose-50 via-white to-rose-100/40 border-b border-ink-100 py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-display text-2xl">
              {initials}
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                Welcome back
              </p>
              <h1 className="font-display text-3xl lg:text-4xl text-ink-900">{account.name}</h1>
              <p className="text-xs text-ink-500 mt-0.5">
                {account.email} · Member since {memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <nav className="bg-white border border-ink-100 rounded-sm p-3 sticky top-28">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between p-3 hover:bg-rose-50 transition-colors rounded-sm group"
              >
                <span className="flex items-center gap-3 text-sm text-ink-700 group-hover:text-rose-600">
                  <item.icon size={15} />
                  {item.label}
                </span>
                <span className="flex items-center gap-2 text-xs text-ink-400">
                  {item.count > 0 && (
                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                      {item.count}
                    </span>
                  )}
                  <ChevronRight size={12} />
                </span>
              </Link>
            ))}
            <button
              onClick={onSignOut}
              className="w-full mt-3 pt-3 border-t border-ink-100 flex items-center gap-3 p-3 text-sm text-ink-500 hover:text-rose-600 transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </nav>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard label="Orders" value="3" trend="+1 this month" color="rose" />
            <StatCard label="Aura Points" value="1,240" trend="158 to next reward" color="gold" />
            <StatCard label="Active Subs" value="1" trend="Next: Jun 1" color="ink" />
          </div>

          <section id="orders" className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-ink-900">Recent Orders</h2>
              <Link href="#" className="text-xs text-rose-600 hover:underline">
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: "SA-K9MZ-7X2P",
                  date: "May 18, 2026",
                  total: 14250,
                  status: "Delivered",
                  items: 3,
                },
                {
                  id: "SA-K9LR-4N8B",
                  date: "May 02, 2026",
                  total: 6950,
                  status: "Shipped",
                  items: 1,
                },
                {
                  id: "SA-K9JC-2H5W",
                  date: "Apr 14, 2026",
                  total: 22500,
                  status: "Delivered",
                  items: 5,
                },
              ].map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-ink-100 rounded-sm hover:border-rose-200 hover:bg-rose-25/30 transition-colors"
                >
                  <div>
                    <p className="text-xs font-mono text-ink-500">{o.id}</p>
                    <p className="text-sm text-ink-900 font-medium mt-0.5">
                      {o.items} items · Rs. {o.total.toLocaleString()}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">{o.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "text-xs px-3 py-1 rounded-full font-medium",
                        o.status === "Delivered" && "bg-green-50 text-green-700",
                        o.status === "Shipped" && "bg-blue-50 text-blue-700"
                      )}
                    >
                      {o.status}
                    </span>
                    <Link
                      href="#"
                      className="text-xs text-ink-700 hover:text-rose-600 inline-flex items-center gap-1"
                    >
                      Track <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="addresses" className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-ink-900">Saved Address</h2>
              <button className="text-xs text-rose-600 hover:underline">+ Add new</button>
            </div>
            <div className="border border-ink-100 rounded-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
                    Home · Default
                  </p>
                  <p className="text-sm font-medium text-ink-900">{account.name}</p>
                  <p className="text-sm text-ink-600 mt-1">
                    No. 24, Galle Road, Colombo 03,
                    <br />
                    Western Province, Sri Lanka
                  </p>
                </div>
                <button className="text-xs text-ink-500 hover:text-rose-600">Edit</button>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-br from-ink-900 to-ink-800 text-white rounded-sm p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-rose-300 mb-2">
                Refer a Friend
              </p>
              <h3 className="font-display text-2xl mb-2">
                Give Rs. 1,000 · Get Rs. 1,000
              </h3>
              <p className="text-sm text-ink-300 mb-5 max-w-md">
                Share your unique code with friends. When they shop, you both score Rs. 1,000 store
                credit.
              </p>
              <div className="flex items-center gap-2 max-w-sm">
                <code className="flex-1 bg-white/10 backdrop-blur border border-white/20 px-4 py-2.5 text-sm font-mono">
                  AURA-{initials}-2026
                </code>
                <button className="bg-white text-ink-900 px-4 py-2.5 text-sm font-medium hover:bg-rose-50 transition-colors">
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

function StatCard({
  label,
  value,
  trend,
  color,
}: {
  label: string;
  value: string;
  trend: string;
  color: "rose" | "gold" | "ink";
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-sm p-5">
      <p className="text-xs uppercase tracking-widest text-ink-500 font-medium">{label}</p>
      <p
        className={cn(
          "font-display text-3xl mt-1",
          color === "rose" && "text-rose-600",
          color === "gold" && "text-gold-600",
          color === "ink" && "text-ink-900"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-ink-400 mt-1">{trend}</p>
    </div>
  );
}
