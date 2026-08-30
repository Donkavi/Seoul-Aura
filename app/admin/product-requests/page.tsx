"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Trash2,
  Mail,
  Phone,
  Sparkles,
  PackagePlus,
  TrendingUp,
  Plus,
} from "lucide-react";
import { cn, relativeDate } from "@/lib/utils";
import CountUp from "@/components/admin/CountUp";
import type { ProductRequest, ProductRequestStatus } from "@/types";

type Tab = ProductRequestStatus | "all";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "pending", label: "New" },
  { key: "sourcing", label: "Sourcing" },
  { key: "added", label: "Added" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
];

const STATUS_STYLE: Record<ProductRequestStatus, string> = {
  pending: "bg-rose-50 text-rose-700 border-rose-200",
  sourcing: "bg-gold-50 text-gold-600 border-gold-100",
  added: "bg-green-50 text-green-700 border-green-200",
  declined: "bg-ink-100 text-ink-500 border-ink-200",
};

/**
 * Hands the request over to the product form as query params. The form fills
 * itself in, the admin corrects whatever needs correcting, and saving marks this
 * request as added — so sourcing a request never means retyping it.
 */
function buildPrefill(request: ProductRequest): string {
  const params = new URLSearchParams({ prefill: "1", requestId: request._id });
  if (request.productName) params.set("name", request.productName);
  if (request.brand) params.set("brand", request.brand);
  if (request.category) params.set("category", request.category);
  if (request.concern) params.set("concern", request.concern);
  // One param per image — image URLs can contain commas, so they cannot be joined.
  request.images?.forEach((url) => params.append("image", url));
  return params.toString();
}

export default function ProductRequestsPage() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "300" });
      if (tab !== "all") params.set("status", tab);
      const data = await fetch(`/api/product-requests?${params}`).then((r) => r.json());
      setRequests(Array.isArray(data.requests) ? data.requests : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const visible = useMemo(() => {
    if (!search.trim()) return requests;
    const q = search.toLowerCase();
    return requests.filter((r) =>
      [r.productName, r.brand, r.concern, r.customerEmail, r.customerName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [requests, search]);

  const setStatus = async (id: string, status: ProductRequestStatus) => {
    setRequests((prev) => prev.map((r) => (r._id === id ? { ...r, status } : r)));
    await fetch(`/api/product-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (tab !== "all" && tab !== status) await load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    await fetch(`/api/product-requests/${id}`, { method: "DELETE" });
    setRequests((prev) => prev.filter((r) => r._id !== id));
  };

  const totalDemand = requests.reduce((sum, r) => sum + r.requestCount, 0);
  const mostWanted = requests.filter((r) => r.requestCount > 1).length;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
          From the Aura assistant
        </p>
        <h1 className="font-display text-4xl text-ink-900">Product Requests</h1>
        <p className="text-sm text-ink-500 mt-1">
          Products shoppers asked for that we do not stock yet — sorted by how many people asked
        </p>
      </header>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatTile label="Open Requests" value={requests.filter((r) => r.status === "pending").length} accent="rose" />
        <StatTile label="Total Asks" value={totalDemand} accent="ink" />
        <StatTile label="Asked More Than Once" value={mostWanted} accent="gold" />
      </div>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors duration-200",
                  tab === t.key
                    ? "bg-ink-900 text-white"
                    : "text-ink-500 hover:text-ink-900 hover:bg-ink-50"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product, brand, email…"
              className="w-64 border border-ink-200 rounded-sm pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-rose-400 transition-colors"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading requests…</div>
        ) : visible.length === 0 ? (
          <div className="p-16 text-center">
            <PackagePlus size={30} className="mx-auto text-ink-300 mb-3" strokeWidth={1.25} />
            <p className="text-sm text-ink-500">Nothing here yet.</p>
            <p className="text-xs text-ink-400 mt-1">
              Requests appear when Aura cannot find a match for a shopper&apos;s concern.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {visible.map((r) => (
              <li key={r._id} className="p-4 hover:bg-ink-50/40 transition-colors">
                <div className="flex items-start gap-4">
                  {r.images?.[0] ? (
                    <a
                      href={r.images[0]}
                      target="_blank"
                      rel="noreferrer"
                      title="Open full size"
                      className="relative w-16 h-16 flex-shrink-0 rounded-sm overflow-hidden border border-ink-200 bg-ink-50"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.images[0]}
                        alt={r.productName}
                        className="w-full h-full object-cover"
                      />
                      {r.images.length > 1 && (
                        <span className="absolute bottom-0 right-0 bg-ink-900/80 text-white text-[9px] px-1 py-0.5 leading-none">
                          +{r.images.length - 1}
                        </span>
                      )}
                    </a>
                  ) : (
                    <div className="w-16 h-16 flex-shrink-0 rounded-sm border border-dashed border-ink-200 flex items-center justify-center">
                      <PackagePlus size={18} className="text-ink-300" strokeWidth={1.25} />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.brand && (
                        <span className="text-[10px] uppercase tracking-[0.18em] text-ink-400 font-medium">
                          {r.brand}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border font-medium capitalize",
                          STATUS_STYLE[r.status]
                        )}
                      >
                        {r.status}
                      </span>
                      {r.requestCount > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-semibold">
                          <TrendingUp size={9} /> {r.requestCount} asks
                        </span>
                      )}
                      {r.source === "chat" && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-ink-400">
                          <Sparkles size={9} /> via Aura
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-medium text-ink-900 mt-1">{r.productName}</h3>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-ink-500">
                      {r.category && <span>{r.category}</span>}
                      {r.concern && <span className="text-rose-600">Concern: {r.concern}</span>}
                      <span className="text-ink-400">{relativeDate(r.createdAt)}</span>
                    </div>

                    {r.reason && (
                      <p className="text-xs text-ink-500 italic mt-2 leading-relaxed">
                        &ldquo;{r.reason}&rdquo;
                      </p>
                    )}

                    {r.customerMessage && (
                      <p className="text-xs text-ink-400 mt-1.5 leading-relaxed line-clamp-2">
                        Shopper said: {r.customerMessage}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-3 mt-2.5 text-xs">
                      {r.customerEmail && (
                        <a
                          href={`mailto:${r.customerEmail}`}
                          className="inline-flex items-center gap-1.5 text-ink-600 hover:text-rose-600 transition-colors"
                        >
                          <Mail size={12} />
                          {r.customerName ? `${r.customerName} · ` : ""}
                          {r.customerEmail}
                        </a>
                      )}
                      {r.phoneNumber && (
                        <span className="inline-flex items-center gap-1.5 text-ink-500">
                          <Phone size={12} /> {r.phoneNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <select
                      value={r.status}
                      onChange={(e) => setStatus(r._id, e.target.value as ProductRequestStatus)}
                      className="border border-ink-200 rounded-sm px-2 py-1.5 text-xs focus:outline-none focus:border-rose-400 transition-colors"
                    >
                      <option value="pending">New</option>
                      <option value="sourcing">Sourcing</option>
                      <option value="added">Added to store</option>
                      <option value="declined">Declined</option>
                    </select>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/products?${buildPrefill(r)}`}
                        title="Open the new-product form filled in from this request"
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.12em] font-semibold text-white bg-ink-900 hover:bg-rose-600 px-2.5 py-1.5 rounded-sm transition-colors"
                      >
                        <Plus size={11} strokeWidth={3} /> Add
                      </Link>
                      <button
                        onClick={() => remove(r._id)}
                        aria-label="Delete request"
                        className="p-1.5 text-ink-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
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
      <p className="text-[10px] uppercase tracking-widest text-ink-400 font-medium">{label}</p>
      <p
        className={cn(
          "font-display text-3xl mt-1",
          accent === "rose" && "text-rose-600",
          accent === "gold" && "text-gold-600",
          accent === "ink" && "text-ink-900"
        )}
      >
        <CountUp to={value} />
      </p>
    </div>
  );
}
