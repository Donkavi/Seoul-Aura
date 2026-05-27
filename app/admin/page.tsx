"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertCircle,
  Tag,
  MessageSquare,
  Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";
import CountUp from "@/components/admin/CountUp";
import type { AdminStats } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Total Revenue",
      value: stats?.totalRevenue ?? 0,
      prefix: "Rs. ",
      icon: TrendingUp,
      change: "+12.5%",
      positive: true,
      accent: "rose",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? 0,
      icon: ShoppingBag,
      change: "+8.2%",
      positive: true,
      accent: "ink",
    },
    {
      label: "Registered Users",
      value: stats?.totalUsers ?? 0,
      icon: Users,
      change: "+5.1%",
      positive: true,
      accent: "gold",
    },
    {
      label: "Active Products",
      value: stats?.totalProducts ?? 0,
      icon: Package,
      change: "+2",
      positive: true,
      accent: "rose",
    },
  ];

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Welcome back
          </p>
          <h1 className="font-display text-4xl text-ink-900">Dashboard Overview</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-ink-500">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </header>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <article
            key={c.label}
            className="bg-white rounded-sm p-6 border border-ink-100 hover:shadow-card transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={cn(
                  "w-11 h-11 rounded-sm flex items-center justify-center",
                  c.accent === "rose" && "bg-rose-50 text-rose-600",
                  c.accent === "ink" && "bg-ink-900 text-white",
                  c.accent === "gold" && "bg-gold-50 text-gold-600"
                )}
              >
                <c.icon size={18} strokeWidth={1.75} />
              </div>
              <span
                className={cn(
                  "text-xs font-semibold flex items-center gap-0.5",
                  c.positive ? "text-green-600" : "text-rose-600"
                )}
              >
                {c.positive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                {c.change}
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-ink-500 font-medium mb-2">
              {c.label}
            </p>
            <p className="font-display text-3xl text-ink-900">
              {loading ? (
                <span className="inline-block bg-ink-100 w-20 h-8 rounded animate-pulse" />
              ) : (
                <CountUp to={c.value} prefix={c.prefix ?? ""} />
              )}
            </p>
          </article>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-sm p-6 border border-ink-100">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-rose-600" />
              <h2 className="font-display text-xl text-ink-900">Pending Tasks</h2>
            </div>
          </div>
          <div className="space-y-3">
            <Link
              href="/admin/orders?status=pending"
              className="flex items-center justify-between p-4 bg-rose-50/50 hover:bg-rose-50 rounded-sm border border-rose-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">Pending Orders</p>
                <p className="text-xs text-ink-500">Awaiting confirmation</p>
              </div>
              <CountUp to={stats?.pendingOrders ?? 0} className="text-2xl font-display text-rose-600" />
            </Link>
            <Link
              href="/admin/reviews"
              className="flex items-center justify-between p-4 bg-gold-50/50 hover:bg-gold-50 rounded-sm border border-gold-100 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-ink-900">Reviews to Moderate</p>
                <p className="text-xs text-ink-500">Awaiting approval</p>
              </div>
              <CountUp to={stats?.pendingReviews ?? 0} className="text-2xl font-display text-gold-600" />
            </Link>
            <Link
              href="/admin/pre-orders"
              className="flex items-center justify-between p-4 bg-rose-50 hover:bg-rose-100 rounded-sm border border-rose-200 transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-ink-900 flex items-center gap-2">
                  <Plane size={14} className="text-rose-600" /> Pre-Order Requests
                </p>
                <p className="text-xs text-ink-500">Pending or under review</p>
              </div>
              <CountUp to={stats?.pendingPreOrders ?? 0} className="text-2xl font-display text-rose-600" />
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-sm p-6 border border-ink-100">
          <h2 className="font-display text-xl text-ink-900 mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/admin/products"
              className="p-4 border border-ink-200 hover:border-rose-400 hover:bg-rose-50/30 rounded-sm transition-colors group"
            >
              <Package size={18} className="text-rose-600 mb-2" />
              <p className="text-sm font-medium text-ink-900 group-hover:text-rose-600">
                Add Product
              </p>
              <p className="text-xs text-ink-500">New inventory item</p>
            </Link>
            <Link
              href="/admin/categories"
              className="p-4 border border-ink-200 hover:border-rose-400 hover:bg-rose-50/30 rounded-sm transition-colors group"
            >
              <Tag size={18} className="text-rose-600 mb-2" />
              <p className="text-sm font-medium text-ink-900 group-hover:text-rose-600">
                Manage Categories
              </p>
              <p className="text-xs text-ink-500">Types & subtypes</p>
            </Link>
            <Link
              href="/admin/reviews"
              className="p-4 border border-ink-200 hover:border-rose-400 hover:bg-rose-50/30 rounded-sm transition-colors group"
            >
              <MessageSquare size={18} className="text-rose-600 mb-2" />
              <p className="text-sm font-medium text-ink-900 group-hover:text-rose-600">
                Moderate Reviews
              </p>
              <p className="text-xs text-ink-500">Approve / flag</p>
            </Link>
            <Link
              href="/admin/orders"
              className="p-4 border border-ink-200 hover:border-rose-400 hover:bg-rose-50/30 rounded-sm transition-colors group"
            >
              <ShoppingBag size={18} className="text-rose-600 mb-2" />
              <p className="text-sm font-medium text-ink-900 group-hover:text-rose-600">
                View Orders
              </p>
              <p className="text-xs text-ink-500">Process & ship</p>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-ink-900 to-ink-800 text-white rounded-sm p-8 lg:p-10 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-rose-600/20 rounded-full blur-3xl" />
        <div className="relative">
          <AlertCircle size={20} className="text-rose-300 mb-3" />
          <h3 className="font-display text-2xl mb-2">Need to onboard a new product line?</h3>
          <p className="text-sm text-ink-300 mb-5 max-w-md">
            Add new categories, upload inventory, and assign origin tags — all from the admin panel.
          </p>
          <Link
            href="/admin/products"
            className="inline-block bg-white text-ink-900 px-5 py-2.5 text-sm font-medium hover:bg-rose-50 transition-colors"
          >
            Start Adding Products
          </Link>
        </div>
      </div>
    </div>
  );
}

