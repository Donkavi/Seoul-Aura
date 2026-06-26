"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tag,
  MessageSquare,
  ShoppingCart,
  Users,
  Settings,
  Home,
  Plane,
  Bell,
  Navigation,
  Sparkles,
  Box,
  UserCheck,
  Shield,
  Store,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/brands", label: "Brands", icon: Store },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/concerns", label: "Concerns", icon: Sparkles },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/pre-orders", label: "Pre-Orders", icon: Plane },
  { href: "/admin/stock-notifications", label: "Restock Alerts", icon: Bell },
  { href: "/admin/subscriptions", label: "Sub Plans", icon: Box },
  { href: "/admin/subscribers", label: "Subscribers", icon: UserCheck },
  { href: "/admin/notify", label: "Notify", icon: Send },
  { href: "/admin/nav-menu", label: "Nav Menu", icon: Navigation },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/admins", label: "Admins", icon: Shield },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-ink-900 text-ink-100 flex-shrink-0 min-h-screen flex flex-col">
      <div className="p-6 border-b border-ink-800">
        <Link href="/admin" className="block">
          <div className="font-display text-xl text-white leading-none tracking-[0.18em] uppercase font-normal">
            Seoul <span className="text-[#C08A98]">Aura</span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-ink-400 mt-2">Admin Console</p>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-all duration-200",
                active
                  ? "bg-rose-600 text-white shadow-rose"
                  : "text-ink-300 hover:bg-ink-800 hover:text-white"
              )}
            >
              <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-ink-800">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-ink-400 hover:text-rose-300 transition-colors"
        >
          <Home size={14} /> Back to Store
        </Link>
      </div>
    </aside>
  );
}
