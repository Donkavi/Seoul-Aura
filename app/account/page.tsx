"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  MapPin,
  Heart,
  CreditCard,
  Bell,
  LogOut,
  ChevronRight,
  Sparkles,
  Calendar,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Google SVG ─────────────────────────────────────────────────────────────
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

// ─── Sign-in page ────────────────────────────────────────────────────────────
function SignInPage() {
  return (
    <div className="bg-rose-25/30 min-h-screen flex items-center py-12 lg:py-20">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 bg-white border border-ink-100 rounded-sm overflow-hidden shadow-card">

          {/* Left panel */}
          <div className="hidden lg:block relative bg-gradient-to-br from-rose-100 via-rose-50 to-white p-12">
            <div className="absolute inset-0 opacity-30 pointer-events-none">
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

          {/* Right panel — Google only */}
          <div className="p-8 lg:p-12 flex flex-col justify-center">
            {/* Mobile header */}
            <div className="lg:hidden mb-8">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-600 font-semibold mb-2">
                Seoul Aura · Member
              </p>
            </div>

            <h2 className="font-display text-3xl lg:text-4xl text-ink-900 mb-2">Welcome</h2>
            <p className="text-sm text-ink-500 mb-10 leading-relaxed">
              Sign in to manage your orders and subscriptions.
              <br />
              New here? Your account is created automatically.
            </p>

            <button
              onClick={() => signIn("google", { callbackUrl: "/account" })}
              className="w-full flex items-center justify-center gap-3 border border-ink-200 hover:border-rose-300 hover:bg-rose-25/40 py-3.5 px-6 text-sm font-medium text-ink-800 transition-all duration-200 rounded-sm group"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>

            <p className="text-[11px] text-center text-ink-400 mt-6">
              By continuing you agree to our{" "}
              <Link href="/terms" className="underline hover:text-ink-700">Terms</Link>{" "}
              &amp;{" "}
              <Link href="/privacy" className="underline hover:text-ink-700">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
function Dashboard({ user }: { user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const name = user.name ?? user.email?.split("@")[0] ?? "Member";
  const initials = name
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = [
    { icon: Package, label: "Orders", count: 0, href: "#orders" },
    { icon: Calendar, label: "Subscriptions", count: 0, href: "/subscriptions" },
    { icon: Heart, label: "Wishlist", count: 0, href: "/wishlist" },
    { icon: MapPin, label: "Addresses", count: 0, href: "#addresses" },
    { icon: CreditCard, label: "Payment Methods", count: 0, href: "#payments" },
    { icon: Bell, label: "Notifications", count: 0, href: "#notifications" },
  ];

  return (
    <div className="bg-rose-25/30 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-rose-100/40 border-b border-ink-100 py-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white font-display text-2xl shadow">
                {initials}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold">
                Welcome back
              </p>
              <h1 className="font-display text-3xl lg:text-4xl text-ink-900">{name}</h1>
              <p className="text-xs text-ink-500 mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
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
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full mt-3 pt-3 border-t border-ink-100 flex items-center gap-3 p-3 text-sm text-ink-500 hover:text-rose-600 transition-colors"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* Main */}
        <main className="lg:col-span-3 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <StatCard label="Orders" value="0" trend="No orders yet" color="rose" />
            <StatCard label="Aura Points" value="0" trend="Start shopping to earn" color="gold" />
            <StatCard label="Active Subs" value="0" trend="No active subscription" color="ink" />
          </div>

          {/* Orders placeholder */}
          <section id="orders" className="bg-white border border-ink-100 rounded-sm p-6 lg:p-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-ink-900">Recent Orders</h2>
            </div>
            <div className="text-center py-10 text-sm text-ink-400">
              <Package size={32} className="mx-auto mb-3 text-ink-200" />
              No orders yet. <Link href="/shop" className="text-rose-600 hover:underline">Start shopping →</Link>
            </div>
          </section>

          {/* Referral */}
          <section className="bg-gradient-to-br from-ink-900 to-ink-800 text-white rounded-sm p-8 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl" />
            <div className="relative">
              <p className="text-xs uppercase tracking-widest text-rose-300 mb-2">Refer a Friend</p>
              <h3 className="font-display text-2xl mb-2">Give Rs. 1,000 · Get Rs. 1,000</h3>
              <p className="text-sm text-ink-300 mb-5 max-w-md">
                Share your unique code with friends. When they shop, you both score Rs. 1,000 store credit.
              </p>
              <div className="flex items-center gap-2 max-w-sm">
                <code className="flex-1 bg-white/10 backdrop-blur border border-white/20 px-4 py-2.5 text-sm font-mono">
                  AURA-{initials}-2026
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`AURA-${initials}-2026`)}
                  className="bg-white text-ink-900 px-4 py-2.5 text-sm font-medium hover:bg-rose-50 transition-colors"
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

// ─── Stat card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, trend, color }: {
  label: string; value: string; trend: string; color: "rose" | "gold" | "ink";
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-sm p-5">
      <p className="text-xs uppercase tracking-widest text-ink-500 font-medium">{label}</p>
      <p className={cn("font-display text-3xl mt-1",
        color === "rose" && "text-rose-600",
        color === "gold" && "text-gold-600",
        color === "ink" && "text-ink-900"
      )}>
        {value}
      </p>
      <p className="text-xs text-ink-400 mt-1">{trend}</p>
    </div>
  );
}

// ─── Page root ───────────────────────────────────────────────────────────────
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
    return <Dashboard user={session.user} />;
  }

  return <SignInPage />;
}
