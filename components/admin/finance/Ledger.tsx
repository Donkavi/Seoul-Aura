"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, Download, Inbox, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUSINESS_FUND,
  formatLedgerDate,
  formatMoney,
  formatMonth,
  roundMoney,
  signedAmount,
  toDateInput,
  type FinanceKind,
} from "@/lib/finance";
import type { FinanceEntry, Partner } from "@/types";
import EntryModal from "./EntryModal";
import PreOrderQueue from "./PreOrderQueue";
import { PaidBy, StatTile, StatusPill, TD, TH, downloadCsv } from "./ui";

export type LedgerTab = "sales" | "purchases" | "expenses" | "assets" | "investments";

const TAB_KINDS: Record<LedgerTab, FinanceKind[]> = {
  sales: ["sale"],
  purchases: ["purchase", "purchase_discount"],
  expenses: ["expense"],
  assets: ["asset"],
  investments: ["investment"],
};

const ADD_ACTIONS: Record<LedgerTab, Array<{ kind: FinanceKind; label: string }>> = {
  sales: [{ kind: "sale", label: "Add sale" }],
  purchases: [
    { kind: "purchase_discount", label: "Add discount" },
    { kind: "purchase", label: "Add purchase" },
  ],
  expenses: [{ kind: "expense", label: "Add expense" }],
  assets: [{ kind: "asset", label: "Add asset" }],
  investments: [{ kind: "investment", label: "Add investment" }],
};

const EMPTY_TEXT: Record<LedgerTab, string> = {
  sales: "No sales in this period. Record them from the pre-orders above, or add one by hand.",
  purchases: "No purchases in this period.",
  expenses: "No expenses in this period.",
  assets: "No business assets in this period.",
  investments: "No partner investments in this period.",
};

interface Column {
  label: string;
  right?: boolean;
  cell: (e: FinanceEntry) => React.ReactNode;
}

interface Props {
  tab: LedgerTab;
  period: { from: string; to: string };
  partners: Partner[];
  brands: string[];
  krwRate: number;
}

type ModalState = { kind: FinanceKind; entry?: FinanceEntry; prefill?: Partial<FinanceEntry> } | null;

const qty = (n?: number) => (n == null ? "—" : n.toLocaleString("en-LK"));

export default function Ledger({ tab, period, partners, brands, krwRate }: Props) {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | "paid" | "pending">("");
  const [payer, setPayer] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ kinds: TAB_KINDS[tab].join(",") });
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
    try {
      const res = await fetch(`/api/finance/entries?${params}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [tab, period.from, period.to]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (status && e.paymentStatus !== status) return false;
      if (payer && e.paidBy !== payer) return false;
      if (!q) return true;
      return [e.description, e.brand, e.category, e.reference, e.customer, e.paidBy, e.source, e.notes]
        .some((v) => v?.toLowerCase().includes(q));
    });
  }, [entries, search, status, payer]);

  // Newest month first; rows inside a month stay in the API's newest-first order.
  const groups = useMemo(() => {
    const out: Array<{ month: string; rows: FinanceEntry[]; total: number }> = [];
    for (const e of filtered) {
      const month = toDateInput(e.date).slice(0, 7);
      let g = out[out.length - 1];
      if (!g || g.month !== month) out.push((g = { month, rows: [], total: 0 }));
      g.rows.push(e);
      g.total += signedAmount(e);
    }
    return out;
  }, [filtered]);

  const categories = useMemo(
    () => Array.from(new Set(entries.map((e) => e.category).filter((c): c is string => !!c))),
    [entries]
  );

  const toggleStatus = async (e: FinanceEntry) => {
    const next = e.paymentStatus === "paid" ? "pending" : "paid";
    setEntries((list) => list.map((x) => (x._id === e._id ? { ...x, paymentStatus: next } : x)));
    const res = await fetch(`/api/finance/entries/${e._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    });
    if (!res.ok) load();
  };

  const remove = async (e: FinanceEntry) => {
    if (!confirm(`Delete "${e.description}" (${formatMoney(e.amount)})?`)) return;
    await fetch(`/api/finance/entries/${e._id}`, { method: "DELETE" });
    load();
  };

  const duplicate = (e: FinanceEntry) => {
    const { _id, createdAt, updatedAt, createdBy, ...rest } = e;
    void _id; void createdAt; void updatedAt; void createdBy;
    setModal({ kind: e.kind, prefill: rest });
  };

  // ── Summary strip ──────────────────────────────────────────────────────────
  const sum = (list: FinanceEntry[]) => roundMoney(list.reduce((s, e) => s + e.amount, 0));
  const tiles = (() => {
    if (tab === "sales") {
      const orders = new Set(filtered.map((e) => e.reference).filter(Boolean)).size;
      const pending = sum(filtered.filter((e) => e.paymentStatus !== "paid"));
      return [
        { label: "Total sales", value: formatMoney(sum(filtered)), sub: `${filtered.length} lines · ${orders} orders` },
        { label: "Received", value: formatMoney(sum(filtered.filter((e) => e.paymentStatus === "paid"))), tone: "good" as const },
        { label: "Awaiting payment", value: formatMoney(pending), tone: pending > 0 ? ("warn" as const) : undefined },
      ];
    }
    if (tab === "purchases") {
      const bought = filtered.filter((e) => e.kind === "purchase");
      const gross = sum(bought);
      const discounts = sum(filtered.filter((e) => e.kind === "purchase_discount"));
      const unpaid = sum(bought.filter((e) => e.paymentStatus === "pending"));
      return [
        { label: "Gross purchases", value: formatMoney(gross), sub: `${bought.length} lines` },
        { label: "Discounts", value: formatMoney(discounts), tone: "good" as const },
        { label: "Net purchases", value: formatMoney(roundMoney(gross - discounts)) },
        ...(unpaid > 0 ? [{ label: "Unpaid to suppliers", value: formatMoney(unpaid), tone: "warn" as const }] : []),
      ];
    }
    if (tab === "investments") {
      const byPartner = new Map<string, number>();
      for (const e of filtered) byPartner.set(e.paidBy ?? "—", (byPartner.get(e.paidBy ?? "—") ?? 0) + e.amount);
      return [
        { label: "Total invested", value: formatMoney(sum(filtered)), sub: `${filtered.length} entries` },
        ...Array.from(byPartner.entries()).map(([name, amount]) => ({ label: name, value: formatMoney(roundMoney(amount)) })),
      ];
    }
    const fund = sum(filtered.filter((e) => e.paidBy === BUSINESS_FUND));
    const total = sum(filtered);
    return [
      { label: tab === "assets" ? "Total assets" : "Total expenses", value: formatMoney(total), sub: `${filtered.length} entries` },
      { label: "Paid by partners", value: formatMoney(roundMoney(total - fund)), sub: "Counts as their contribution" },
      { label: "From Business Fund", value: formatMoney(fund) },
    ];
  })();

  // ── Columns ────────────────────────────────────────────────────────────────
  const dateCol: Column = { label: "Date", cell: (e) => <span className="whitespace-nowrap text-ink-500 text-xs">{formatLedgerDate(e.date)}</span> };
  const notesLine = (e: FinanceEntry) => e.notes && <p className="text-xs text-ink-400 italic mt-0.5">{e.notes}</p>;

  const columns: Column[] = (() => {
    switch (tab) {
      case "sales":
        return [
          dateCol,
          {
            label: "Order",
            cell: (e) =>
              e.reference || e.customer ? (
                <div>
                  {e.reference && <p className="font-mono text-xs text-ink-700 whitespace-nowrap">{e.reference}</p>}
                  {e.customer && <p className="text-xs text-ink-400">{e.customer}</p>}
                </div>
              ) : (
                <span className="text-ink-300">—</span>
              ),
          },
          {
            label: "Item",
            cell: (e) => (
              <div className="max-w-sm">
                {e.brand && <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">{e.brand}</p>}
                <p className="text-ink-900">{e.description}</p>
                {e.deliveryFeeCharged && <p className="text-[11px] text-ink-400">+ delivery fee paid by buyer</p>}
                {notesLine(e)}
              </div>
            ),
          },
          { label: "Qty", right: true, cell: (e) => qty(e.quantity) },
          { label: "Price", right: true, cell: (e) => formatMoney(e.unitPrice ?? 0) },
          { label: "Total", right: true, cell: (e) => <span className="font-semibold text-ink-900">{formatMoney(e.amount)}</span> },
          { label: "Payment", cell: (e) => <StatusPill status={e.paymentStatus} sale onClick={() => toggleStatus(e)} /> },
        ];
      case "purchases":
        return [
          dateCol,
          {
            label: "Item",
            cell: (e) =>
              e.kind === "purchase_discount" ? (
                <div className="max-w-sm">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-700 font-semibold">Supplier discount</span>
                  <p className="text-ink-900">{e.description}</p>
                  {notesLine(e)}
                </div>
              ) : (
                <div className="max-w-sm">
                  <p className="text-[10px] uppercase tracking-widest font-semibold">
                    {e.brand && <span className="text-rose-600">{e.brand}</span>}
                    {e.brand && e.category && <span className="text-ink-300"> · </span>}
                    {e.category && <span className="text-ink-500">{e.category}</span>}
                  </p>
                  <p className="text-ink-900">{e.description}</p>
                  {(e.source || e.reference) && (
                    <p className="text-[11px] text-ink-400">
                      {e.source && `from ${e.source}`}
                      {e.source && e.reference && " · "}
                      {e.reference && <span className="font-mono">{e.reference}</span>}
                    </p>
                  )}
                  {notesLine(e)}
                </div>
              ),
          },
          { label: "Paid by", cell: (e) => <PaidBy name={e.paidBy} /> },
          { label: "Qty", right: true, cell: (e) => (e.kind === "purchase" ? qty(e.quantity) : "—") },
          {
            label: "Unit cost",
            right: true,
            cell: (e) =>
              e.kind === "purchase" ? (
                <div className="whitespace-nowrap">
                  {formatMoney(e.unitPrice ?? 0)}
                  {e.unitPriceKRW != null && <p className="text-[11px] text-ink-400">₩{e.unitPriceKRW.toLocaleString("en-LK")}</p>}
                </div>
              ) : (
                "—"
              ),
          },
          {
            label: "Total",
            right: true,
            cell: (e) =>
              e.kind === "purchase_discount" ? (
                <span className="font-semibold text-emerald-700 whitespace-nowrap">−{formatMoney(e.amount)}</span>
              ) : (
                <span className="font-semibold text-ink-900">{formatMoney(e.amount)}</span>
              ),
          },
          {
            label: "Status",
            cell: (e) => (e.kind === "purchase" ? <StatusPill status={e.paymentStatus} onClick={() => toggleStatus(e)} /> : null),
          },
        ];
      case "investments":
        return [
          dateCol,
          { label: "Partner", cell: (e) => <PaidBy name={e.paidBy} /> },
          { label: "Description", cell: (e) => <div className="max-w-md text-ink-900">{e.description}{notesLine(e)}</div> },
          { label: "Amount", right: true, cell: (e) => <span className="font-semibold text-ink-900">{formatMoney(e.amount)}</span> },
        ];
      default:
        return [
          dateCol,
          { label: "Description", cell: (e) => <div className="max-w-md text-ink-900">{e.description}{notesLine(e)}</div> },
          { label: "Category", cell: (e) => e.category || <span className="text-ink-300">—</span> },
          { label: "Paid by", cell: (e) => <PaidBy name={e.paidBy} /> },
          { label: "Amount", right: true, cell: (e) => <span className="font-semibold text-ink-900">{formatMoney(e.amount)}</span> },
        ];
    }
  })();

  const totalAt = columns.findIndex((c) => c.label === "Total" || c.label === "Amount");

  const exportCsv = () => {
    const d = (e: FinanceEntry) => toDateInput(e.date);
    const name = `seoul-aura-${tab}${period.from || period.to ? `-${period.from || "start"}-to-${period.to || "today"}` : ""}.csv`;
    switch (tab) {
      case "sales":
        return downloadCsv(
          name,
          ["Date", "Pre-order #", "Customer", "Item", "Brand", "Qty", "Selling price", "Total", "Payment", "Payment method", "Delivery fee paid by buyer", "Notes"],
          filtered.map((e) => [d(e), e.reference, e.customer, e.description, e.brand, e.quantity, e.unitPrice, e.amount, e.paymentStatus === "paid" ? "Received" : "Awaiting payment", e.paymentMethod, e.deliveryFeeCharged ? "Yes" : "", e.notes])
        );
      case "purchases":
        return downloadCsv(
          name,
          ["Date", "Type", "Paid by", "Item / reason", "Brand", "Category", "Qty", "Cost price", "Cost price (KRW)", "Total", "Status", "Payment method", "Bought from", "Pre-order #", "Notes"],
          filtered.map((e) =>
            e.kind === "purchase_discount"
              ? [d(e), "Discount", e.paidBy, e.description, "", "", "", "", "", -e.amount, "", "", "", "", e.notes]
              : [d(e), "Purchase", e.paidBy, e.description, e.brand, e.category, e.quantity, e.unitPrice, e.unitPriceKRW, e.amount, e.paymentStatus === "paid" ? "Paid" : "Unpaid", e.paymentMethod, e.source, e.reference, e.notes]
          )
        );
      case "investments":
        return downloadCsv(name, ["Date", "Partner", "Description", "Amount", "Notes"], filtered.map((e) => [d(e), e.paidBy, e.description, e.amount, e.notes]));
      default:
        return downloadCsv(
          name,
          ["Date", "Paid by", "Description", "Category", "Amount", "Notes"],
          filtered.map((e) => [d(e), e.paidBy, e.description, e.category, e.amount, e.notes])
        );
    }
  };

  const payerChoices = [...partners.map((p) => p.name), ...(tab === "investments" ? [] : [BUSINESS_FUND])];

  return (
    <div className="space-y-5">
      {tab === "sales" && <PreOrderQueue onRecorded={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <StatTile key={t.label} {...t} />
        ))}
      </div>

      <div className="bg-white border border-ink-100 rounded-sm">
        <div className="border-b border-ink-100 p-3 flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === "sales" ? "Search item, brand, order, customer…" : "Search…"}
              className="bg-ink-50 border-0 rounded-sm pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300 w-64"
            />
          </div>
          {tab === "sales" ? (
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="bg-ink-50 border-0 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
            >
              <option value="">All payments</option>
              <option value="paid">Received</option>
              <option value="pending">Awaiting payment</option>
            </select>
          ) : (
            <select
              value={payer}
              onChange={(e) => setPayer(e.target.value)}
              className="bg-ink-50 border-0 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
            >
              <option value="">{tab === "investments" ? "All partners" : "Anyone paid"}</option>
              {payerChoices.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={exportCsv}
              disabled={!filtered.length}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 border border-ink-200 rounded-sm text-ink-700 hover:border-ink-400 disabled:opacity-40"
            >
              <Download size={13} /> Export CSV
            </button>
            {ADD_ACTIONS[tab].map((a, i) => (
              <button
                key={a.kind}
                onClick={() => setModal({ kind: a.kind })}
                className={cn(
                  "inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-sm transition-colors",
                  i === ADD_ACTIONS[tab].length - 1
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "border border-rose-600 text-rose-600 hover:bg-rose-50"
                )}
              >
                <Plus size={13} /> {a.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-sm text-ink-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Inbox size={32} className="mx-auto mb-3 text-ink-200" strokeWidth={1.2} />
            <p className="text-sm text-ink-500">{entries.length ? "Nothing matches these filters." : EMPTY_TEXT[tab]}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  {columns.map((c) => (
                    <th key={c.label} className={cn(TH, c.right && "text-right")}>
                      {c.label}
                    </th>
                  ))}
                  <th className={cn(TH, "text-right")}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <MonthGroup key={g.month} month={g.month} total={g.total} totalAt={totalAt} span={columns.length}>
                    {g.rows.map((e) => (
                      <tr key={e._id} className="border-b border-ink-50 hover:bg-rose-25/40 transition-colors group">
                        {columns.map((c) => (
                          <td key={c.label} className={cn(TD, c.right && "text-right tabular-nums whitespace-nowrap")}>
                            {c.cell(e)}
                          </td>
                        ))}
                        <td className={cn(TD, "text-right whitespace-nowrap")}>
                          <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => duplicate(e)} title="Duplicate" className="p-1.5 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600">
                              <Copy size={13} />
                            </button>
                            <button onClick={() => setModal({ kind: e.kind, entry: e })} title="Edit" className="p-1.5 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600">
                              <Pencil size={13} />
                            </button>
                            <button onClick={() => remove(e)} title="Delete" className="p-1.5 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </MonthGroup>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <EntryModal
          kind={modal.kind}
          entry={modal.entry}
          prefill={modal.prefill}
          partners={partners}
          brands={brands}
          categories={categories}
          krwRate={krwRate}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}

/** Month header row whose subtotal sits in the Total/Amount column (`totalAt`). */
function MonthGroup({
  month,
  total,
  totalAt,
  span,
  children,
}: {
  month: string;
  total: number;
  totalAt: number;
  span: number;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="bg-ink-50/70 border-b border-ink-100">
        <td colSpan={totalAt} className="px-3 py-2 text-[11px] uppercase tracking-widest font-semibold text-ink-600">
          {formatMonth(month)}
        </td>
        <td className="px-3 py-2 text-right text-xs font-semibold text-ink-700 tabular-nums whitespace-nowrap">
          {formatMoney(roundMoney(total))}
        </td>
        {/* The remaining data columns plus the actions column. */}
        <td colSpan={span - totalAt} />
      </tr>
      {children}
    </>
  );
}
