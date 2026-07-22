"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Calculator, Save, Search, RefreshCw, Loader2, CheckCircle, AlertCircle, Wand2, TrendingUp } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";

interface Row {
  _id: string;
  name: string;
  image?: string;
  currentPrice: number;
  priceKRW: string;   // editable
  newPrice: string;   // editable
}

export default function AdminPricingPage() {
  const [rate, setRate] = useState("0.23");
  const [margin, setMargin] = useState("0");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculated, setRecalculated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [liveRate, setLiveRate] = useState<{ rate: number; updated: string | null } | null>(null);
  const [fetchingRate, setFetchingRate] = useState(false);

  const fetchLiveRate = () => {
    setFetchingRate(true);
    fetch("/api/exchange-rate?from=KRW&to=LKR")
      .then((r) => r.json())
      .then((d) => { if (typeof d.rate === "number") setLiveRate({ rate: d.rate, updated: d.updated }); })
      .catch(() => {})
      .finally(() => setFetchingRate(false));
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/products?admin=true&limit=1000").then((r) => r.json()),
    ]).then(([settings, prod]) => {
      if (settings?.krwToLkrRate != null) setRate(String(settings.krwToLkrRate));
      if (settings?.priceMarginPercent != null) setMargin(String(settings.priceMarginPercent));
      const products = (prod?.products ?? []) as Array<{ _id: string; name: string; images?: string[]; price: number; priceKRW?: number }>;
      setRows(products.map((p) => ({
        _id: p._id,
        name: p.name,
        image: p.images?.[0],
        currentPrice: p.price,
        priceKRW: p.priceKRW != null ? String(p.priceKRW) : "",
        newPrice: String(p.price),
      })));
    }).catch(() => setError("Failed to load products.")).finally(() => setLoading(false));
    fetchLiveRate();
  }, []);

  const rateNum = parseFloat(rate) || 0;
  const marginNum = parseFloat(margin) || 0;

  const computeLkr = (krw: number) => Math.round(krw * rateNum * (1 + marginNum / 100));

  const recalculate = () => {
    setRows((prev) => prev.map((r) => {
      const krw = parseFloat(r.priceKRW);
      if (!krw || krw <= 0) return r; // leave products without a KRW cost untouched
      return { ...r, newPrice: String(computeLkr(krw)) };
    }));
    setRecalculated(true);
    setResult(null);
  };

  // Reset every KRW cost to 0
  const clearKrw = () => {
    if (!confirm("Set the KRW cost of ALL products to 0? You can re-enter or back-fill them afterward.")) return;
    setRows((prev) => prev.map((r) => ({ ...r, priceKRW: "0" })));
    setRecalculated(true);
    setResult(null);
  };

  // Round every New LKR price to the nearest given step (10 or 100)
  const roundTo = (step: number) => {
    setRows((prev) => prev.map((r) => {
      const p = parseFloat(r.newPrice);
      if (Number.isNaN(p)) return r;
      return { ...r, newPrice: String(Math.round(p / step) * step) };
    }));
    setRecalculated(true);
    setResult(null);
  };

  // Back-fill missing KRW costs from existing LKR prices: KRW = LKR / (rate × (1 + margin%))
  const backfillKrw = () => {
    const divisor = rateNum * (1 + marginNum / 100);
    if (divisor <= 0) { setError("Set a valid exchange rate first."); return; }
    setError("");
    setRows((prev) => prev.map((r) => {
      if (parseFloat(r.priceKRW) > 0) return r; // only fill empty ones
      const krw = Math.round(r.currentPrice / divisor);
      return { ...r, priceKRW: String(krw) };
    }));
    setRecalculated(true);
    setResult(null);
  };

  const setRowField = (id: string, field: "priceKRW" | "newPrice", value: string) => {
    setRows((prev) => prev.map((r) => {
      if (r._id !== id) return r;
      const updated = { ...r, [field]: value };
      // Editing the KRW cost live-updates that row's new LKR price using current rate/margin
      if (field === "priceKRW") {
        const krw = parseFloat(value);
        if (krw > 0) updated.newPrice = String(computeLkr(krw));
      }
      return updated;
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    setError("");
    setResult(null);
    try {
      // Persist rate + margin
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ krwToLkrRate: rateNum, priceMarginPercent: marginNum }),
      });
      // Persist product prices
      const updates = rows.map((r) => ({
        id: r._id,
        price: parseFloat(r.newPrice),
        priceKRW: r.priceKRW ? parseFloat(r.priceKRW) : undefined,
      })).filter((u) => !Number.isNaN(u.price));

      const res = await fetch("/api/products/bulk-price", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setResult(`Saved ${data.updated} product price${data.updated !== 1 ? "s" : ""}.`);
      setRows((prev) => prev.map((r) => ({ ...r, currentPrice: parseFloat(r.newPrice) || r.currentPrice })));
      setRecalculated(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  const missingKrw = rows.filter((r) => !parseFloat(r.priceKRW)).length;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Currency & Pricing</p>
        <h1 className="font-display text-4xl text-ink-900">Price Manager</h1>
        <p className="text-sm text-ink-500 mt-1">Set the won rate, recalculate LKR prices, review &amp; adjust, then save all.</p>
      </header>

      {/* Rate controls */}
      <div className="bg-white border border-ink-100 rounded-sm p-5 mb-5">
        {/* Inputs */}
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl items-start">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
              Exchange Rate · 1 KRW = ? LKR
            </label>
            <input type="number" step="0.0001" value={rate} onChange={(e) => setRate(e.target.value)} className="input-field" placeholder="0.23" />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs">
              {fetchingRate ? (
                <span className="text-ink-400 inline-flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> Fetching live rate…</span>
              ) : liveRate ? (
                <>
                  <span className="inline-flex items-center gap-1 text-ink-500">
                    <TrendingUp size={12} className="text-green-600" />
                    Live: <strong className="text-ink-800">{liveRate.rate.toFixed(4)}</strong>
                  </span>
                  {parseFloat(rate) !== Number(liveRate.rate.toFixed(4)) && (
                    <button onClick={() => setRate(liveRate.rate.toFixed(4))} className="text-rose-600 font-medium hover:underline">
                      Use this
                    </button>
                  )}
                  <button onClick={fetchLiveRate} className="text-ink-400 hover:text-ink-700" title="Refresh live rate">
                    <RefreshCw size={11} />
                  </button>
                </>
              ) : (
                <button onClick={fetchLiveRate} className="text-rose-600 hover:underline inline-flex items-center gap-1">
                  <TrendingUp size={12} /> Fetch live rate
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-ink-700 font-semibold block mb-1.5">
              Margin / Markup %
            </label>
            <input type="number" step="1" value={margin} onChange={(e) => setMargin(e.target.value)} className="input-field" placeholder="0" />
          </div>
        </div>

        <p className="text-xs text-ink-400 mt-4">
          Formula: <strong>LKR = KRW × rate × (1 + margin%)</strong>, rounded. Products without a KRW cost are left unchanged.
          {missingKrw > 0 && <span className="text-rose-500"> · {missingKrw} product{missingKrw !== 1 ? "s" : ""} missing a KRW cost.</span>}
        </p>

        {/* Actions toolbar */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-ink-100">
          <button onClick={recalculate} className="btn-primary inline-flex items-center justify-center gap-2">
            <Calculator size={15} /> Recalculate
          </button>

          <span className="hidden sm:block w-px h-6 bg-ink-200 mx-1" />

          <span className="text-[10px] uppercase tracking-widest text-ink-400 font-semibold w-full sm:w-auto mt-1 sm:mt-0">Tools:</span>

          {missingKrw > 0 && (
            <button onClick={backfillKrw} className="btn-outline inline-flex items-center gap-2 text-sm">
              <Wand2 size={14} /> Back-fill KRW ({missingKrw})
            </button>
          )}
          <button onClick={() => roundTo(10)} className="btn-outline inline-flex items-center gap-2 text-sm">
            <Calculator size={14} /> Round to 10
          </button>
          <button onClick={() => roundTo(100)} className="btn-outline inline-flex items-center gap-2 text-sm">
            <Calculator size={14} /> Round to 100
          </button>
          <button onClick={clearKrw} className="btn-outline inline-flex items-center gap-2 text-sm text-rose-600 border-rose-200 hover:bg-rose-50">
            <RefreshCw size={14} /> Clear KRW
          </button>
        </div>
      </div>

      {/* Status */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-sm p-3 mb-4">
          <AlertCircle size={14} /> {error}
        </div>
      )}
      {result && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-sm p-3 mb-4">
          <CheckCircle size={14} /> {result}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <div className="border-b border-ink-100 p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="bg-ink-50 border-0 rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-64" />
          </div>
          <div className="flex items-center gap-2">
            {recalculated && <span className="text-xs text-rose-500 inline-flex items-center gap-1"><RefreshCw size={12} /> Unsaved changes</span>}
            <button onClick={saveAll} disabled={saving || loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={15} /> Save All Prices</>}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading products…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="text-left p-3 px-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Product</th>
                  <th className="text-right p-3 text-xs uppercase tracking-widest text-ink-500 font-semibold w-36">KRW Cost</th>
                  <th className="text-right p-3 text-xs uppercase tracking-widest text-ink-500 font-semibold w-32">Current LKR</th>
                  <th className="text-right p-3 px-4 text-xs uppercase tracking-widest text-ink-500 font-semibold w-40">New LKR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const changed = parseFloat(r.newPrice) !== r.currentPrice;
                  return (
                    <tr key={r._id} className="border-b border-ink-50 hover:bg-rose-25/20">
                      <td className="p-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded bg-ink-50 border border-ink-100 overflow-hidden flex-shrink-0 relative">
                            {r.image && <Image src={r.image} alt="" fill className="object-cover" sizes="36px" />}
                          </div>
                          <span className="text-sm text-ink-900 truncate max-w-[280px]">{r.name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={r.priceKRW}
                          onChange={(e) => setRowField(r._id, "priceKRW", e.target.value)}
                          placeholder="—"
                          className={cn(
                            "w-full text-right text-sm border rounded-sm px-2 py-1.5 focus:outline-none focus:border-rose-300 font-mono",
                            r.priceKRW ? "border-ink-200" : "border-dashed border-rose-200 bg-rose-25/20"
                          )}
                        />
                      </td>
                      <td className="p-3 text-right text-sm text-ink-400 whitespace-nowrap">{formatPrice(r.currentPrice)}</td>
                      <td className="p-3 px-4">
                        <input
                          type="number"
                          value={r.newPrice}
                          onChange={(e) => setRowField(r._id, "newPrice", e.target.value)}
                          className={cn(
                            "w-full text-right text-sm border rounded-sm px-2 py-1.5 focus:outline-none focus:border-rose-300 font-mono font-semibold",
                            changed ? "border-rose-300 bg-rose-50 text-rose-700" : "border-ink-200 text-ink-900"
                          )}
                        />
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="p-12 text-center text-sm text-ink-400">No products match your search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
