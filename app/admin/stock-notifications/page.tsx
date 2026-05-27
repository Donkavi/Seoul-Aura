"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Bell, Mail, X, Check, ExternalLink, Search, Package } from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";
import CountUp from "@/components/admin/CountUp";
import type { StockNotification } from "@/types";

type FilterTab = "pending" | "notified" | "all";

interface GroupedProduct {
  productId: string;
  productName: string;
  subscribers: StockNotification[];
}

export default function StockNotificationsPage() {
  const [subs, setSubs] = useState<StockNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      params.set("limit", "500");
      const data = await fetch(`/api/stock-notifications?${params}`).then((r) => r.json());
      setSubs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab]);

  const grouped: GroupedProduct[] = useMemo(() => {
    const map = new Map<string, GroupedProduct>();
    const filtered = search
      ? subs.filter(
          (s) =>
            s.email.toLowerCase().includes(search.toLowerCase()) ||
            s.productName.toLowerCase().includes(search.toLowerCase()) ||
            (s.name?.toLowerCase().includes(search.toLowerCase()) ?? false)
        )
      : subs;

    filtered.forEach((s) => {
      const existing = map.get(s.productId);
      if (existing) existing.subscribers.push(s);
      else
        map.set(s.productId, {
          productId: s.productId,
          productName: s.productName,
          subscribers: [s],
        });
    });
    return Array.from(map.values()).sort(
      (a, b) => b.subscribers.length - a.subscribers.length
    );
  }, [subs, search]);

  const markNotified = async (id: string) => {
    await fetch(`/api/stock-notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "notified" }),
    });
    await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this subscriber?")) return;
    await fetch(`/api/stock-notifications/${id}`, { method: "DELETE" });
    await load();
  };

  const markAllNotified = async (productId: string) => {
    const targets = subs.filter((s) => s.productId === productId && s.status === "pending");
    if (!confirm(`Mark all ${targets.length} subscribers as notified?`)) return;
    await Promise.all(
      targets.map((s) =>
        fetch(`/api/stock-notifications/${s._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "notified" }),
        })
      )
    );
    await load();
  };

  const pendingCount = subs.filter((s) => s.status === "pending").length;
  const notifiedCount = subs.filter((s) => s.status === "notified").length;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
          Restock Alerts
        </p>
        <h1 className="font-display text-4xl text-ink-900">Stock Notifications</h1>
        <p className="text-sm text-ink-500 mt-1">
          Customers waiting for sold-out products to return
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Active Waitlist" value={pendingCount} accent="rose" />
        <StatTile label="Already Notified" value={notifiedCount} accent="ink" />
        <StatTile label="Products with Waitlist" value={grouped.length} accent="gold" />
      </div>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {(["pending", "notified", "all"] as FilterTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 text-xs font-medium rounded-sm transition-colors uppercase tracking-wider",
                  tab === t ? "bg-rose-600 text-white" : "text-ink-700 hover:bg-ink-50"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="ml-auto relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Search email, name, product…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-ink-50 border-0 rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-72"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading subscribers…</div>
        ) : grouped.length === 0 ? (
          <div className="p-16 text-center">
            <Bell size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900 mb-1">No restock alerts</p>
            <p className="text-sm text-ink-500">
              {tab === "pending"
                ? "Nobody is waiting on a sold-out product right now."
                : "Nothing to show in this view."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {grouped.map((group) => (
              <article key={group.productId} className="p-5 lg:p-6">
                <header className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-sm bg-rose-50 flex items-center justify-center flex-shrink-0">
                      <Package size={16} className="text-rose-600" />
                    </div>
                    <div>
                      <Link
                        href={`/shop/${group.productId}`}
                        className="font-display text-lg text-ink-900 hover:text-rose-600 inline-flex items-center gap-1"
                      >
                        {group.productName}
                        <ExternalLink size={11} />
                      </Link>
                      <p className="text-xs text-ink-500 mt-0.5">
                        {group.subscribers.length} subscriber
                        {group.subscribers.length !== 1 ? "s" : ""} waiting
                      </p>
                    </div>
                  </div>
                  {group.subscribers.some((s) => s.status === "pending") && (
                    <button
                      onClick={() => markAllNotified(group.productId)}
                      className="text-xs bg-ink-900 text-white px-4 py-2 hover:bg-rose-600 transition-colors inline-flex items-center gap-2"
                    >
                      <Check size={12} /> Mark All Notified
                    </button>
                  )}
                </header>

                <div className="grid gap-2">
                  {group.subscribers.map((s) => (
                    <div
                      key={s._id}
                      className="flex items-center gap-3 p-3 bg-ink-50/50 hover:bg-rose-25/30 rounded-sm border border-ink-100 group transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-rose-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {(s.name ?? s.email).charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {s.name && (
                            <p className="text-sm font-medium text-ink-900 truncate">
                              {s.name}
                            </p>
                          )}
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                              s.status === "notified"
                                ? "bg-green-50 text-green-700"
                                : "bg-gold-50 text-gold-700"
                            )}
                          >
                            {s.status}
                          </span>
                        </div>
                        <a
                          href={`mailto:${s.email}?subject=${encodeURIComponent(
                            `Back in stock: ${s.productName}`
                          )}`}
                          className="text-xs text-ink-600 hover:text-rose-600 inline-flex items-center gap-1.5"
                        >
                          <Mail size={11} /> {s.email}
                        </a>
                      </div>
                      <span className="text-[10px] text-ink-400 uppercase tracking-wider">
                        {relativeDate(s.createdAt)}
                      </span>
                      {s.status === "pending" && (
                        <button
                          onClick={() => markNotified(s._id)}
                          className="p-2 text-ink-500 hover:text-green-600 transition-colors"
                          title="Mark as notified"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => remove(s._id)}
                        className="p-2 text-ink-500 hover:text-rose-600 transition-colors"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "rose" | "ink" | "gold";
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-sm p-5">
      <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold">{label}</p>
      <CountUp
        to={value}
        className={cn(
          "font-display text-4xl mt-1 block",
          accent === "rose" && "text-rose-600",
          accent === "ink" && "text-ink-900",
          accent === "gold" && "text-gold-600"
        )}
      />
    </div>
  );
}
