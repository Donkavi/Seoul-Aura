"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Plane } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatLedgerDate, formatMoney, todayInput } from "@/lib/finance";
import type { UnrecordedPreOrder } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  confirmed: "bg-green-50 text-green-700 border-green-200",
  fulfilled: "bg-ink-900 text-white border-ink-900",
  done: "bg-emerald-600 text-white border-emerald-600",
};

/**
 * Confirmed/fulfilled/done pre-orders that aren't in the sales ledger yet.
 * Recording one copies its quoted, available items across as sale lines —
 * exactly what used to be typed into the Sales sheet by hand.
 */
export default function PreOrderQueue({ onRecorded }: { onRecorded: () => void }) {
  const [preOrders, setPreOrders] = useState<UnrecordedPreOrder[]>([]);
  const [date, setDate] = useState(todayInput());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/finance/pre-orders");
    const data = await res.json().catch(() => []);
    setPreOrders(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const recordOne = async (p: UnrecordedPreOrder) => {
    const res = await fetch("/api/finance/pre-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preOrderId: p._id, date }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `Could not record ${p.requestNumber}`);
    }
  };

  const record = async (list: UnrecordedPreOrder[], key: string) => {
    setBusy(key);
    setError("");
    try {
      for (const p of list) await recordOne(p);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
      await load();
      onRecorded();
    }
  };

  if (!preOrders.length) return null;
  const recordable = preOrders.filter((p) => p.lines.length > 0);

  return (
    <div className="bg-rose-25 border border-rose-200 rounded-sm">
      <div className="p-4 flex items-center gap-3 flex-wrap">
        <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 text-left">
          {open ? <ChevronDown size={16} className="text-rose-600" /> : <ChevronRight size={16} className="text-rose-600" />}
          <Plane size={15} className="text-rose-600" />
          <span className="text-sm font-medium text-ink-900">
            {preOrders.length} pre-order{preOrders.length !== 1 ? "s" : ""} not recorded as sales yet
          </span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          <label className="text-[11px] uppercase tracking-widest text-ink-500 font-semibold">Sale date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-ink-200 rounded-sm px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-rose-400"
          />
          {recordable.length > 1 && (
            <button
              onClick={() => record(recordable, "all")}
              disabled={!!busy}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-60"
            >
              {busy === "all" && <Loader2 size={13} className="animate-spin" />} Record all {recordable.length}
            </button>
          )}
        </div>
      </div>

      {error && <p className="mx-4 mb-3 text-sm text-rose-700 bg-white border border-rose-100 rounded-sm px-3 py-2">{error}</p>}

      {open && (
        <ul className="border-t border-rose-100 divide-y divide-rose-100">
          {preOrders.map((p) => (
            <li key={p._id} className="px-4 py-3 flex items-center gap-4 flex-wrap bg-white/60">
              <div className="min-w-[170px]">
                <p className="font-mono text-xs text-ink-700">{p.requestNumber}</p>
                <p className="text-xs text-ink-400">
                  {p.customerName} · {formatLedgerDate(p.createdAt)}
                </p>
              </div>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold",
                  STATUS_STYLE[p.status] ?? "border-ink-200 text-ink-600"
                )}
              >
                {p.status}
              </span>
              <p className="text-xs text-ink-600 flex-1 min-w-[200px] line-clamp-2">
                {p.lines.map((l) => `${l.description} ×${l.quantity}`).join(" · ") || "No quoted items yet"}
                {p.unpricedCount > 0 && (
                  <span className="text-gold-600"> · {p.unpricedCount} item{p.unpricedCount !== 1 ? "s" : ""} not quoted</span>
                )}
              </p>
              <p className="text-sm font-semibold text-ink-900 tabular-nums">{formatMoney(p.total)}</p>
              <button
                onClick={() => record([p], p._id)}
                disabled={!!busy || !p.lines.length}
                title={p.lines.length ? `Add ${p.lines.length} sale line${p.lines.length !== 1 ? "s" : ""}` : "Quote the items first"}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-sm border border-rose-600 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-rose-600"
              >
                {busy === p._id && <Loader2 size={12} className="animate-spin" />} Record
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
