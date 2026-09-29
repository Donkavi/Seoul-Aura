"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_FUND, formatMoney, formatMonth, roundMoney } from "@/lib/finance";
import type { FinanceSummary } from "@/types";
import { PaidBy, StatTile, TD, TH } from "./ui";

interface Props {
  period: { from: string; to: string };
  onNavigate: (tab: "sales" | "partners") => void;
}

export default function Overview({ period, onNavigate }: Props) {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (period.from) params.set("from", period.from);
    if (period.to) params.set("to", period.to);
    setSummary(null);
    fetch(`/api/finance/summary?${params}`)
      .then((r) => r.json())
      .then((d) => (d.totals ? setSummary(d) : setError(d.error ?? "Could not load the summary")))
      .catch(() => setError("Could not load the summary"));
  }, [period.from, period.to]);

  if (error) return <p className="text-sm text-rose-700">{error}</p>;
  if (!summary) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white border border-ink-100 rounded-sm animate-pulse" />
        ))}
      </div>
    );
  }

  const t = summary.totals;
  const margin = t.sales > 0 ? Math.round((t.netProfit / t.sales) * 1000) / 10 : null;
  const partners = summary.partners.filter((p) => p.known || p.total !== 0);
  const shareTotal = summary.partners.filter((p) => p.known && p.active).reduce((s, p) => s + p.sharePercent, 0);
  const unknown = summary.partners.filter((p) => !p.known);
  const col = (key: "capital" | "expenses" | "assets" | "total" | "profitShare") =>
    roundMoney(partners.reduce((s, p) => s + p[key], 0));

  return (
    <div className="space-y-6">
      {summary.unrecordedPreOrders > 0 && (
        <button
          onClick={() => onNavigate("sales")}
          className="w-full flex items-center gap-3 p-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-sm text-left transition-colors"
        >
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span className="text-sm text-ink-900">
            {summary.unrecordedPreOrders} confirmed pre-order{summary.unrecordedPreOrders !== 1 ? "s aren't" : " isn't"} in the sales
            ledger yet, so the figures below leave {summary.unrecordedPreOrders !== 1 ? "them" : "it"} out.
          </span>
          <span className="ml-auto text-xs font-medium text-rose-600 inline-flex items-center gap-1 whitespace-nowrap">
            Record now <ArrowRight size={12} />
          </span>
        </button>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Total sales"
          value={formatMoney(t.sales)}
          sub={`Received ${formatMoney(t.salesReceived)} · Awaiting ${formatMoney(t.salesPending)}`}
        />
        <StatTile
          label="Net purchases"
          value={formatMoney(t.netPurchases)}
          sub={`${formatMoney(t.grossPurchases)} less ${formatMoney(t.purchaseDiscounts)} discounts`}
        />
        <StatTile
          label="Expenses"
          value={formatMoney(t.expenses)}
          sub={summary.expenseCategories[0] ? `Most on ${summary.expenseCategories[0].category.toLowerCase()}` : undefined}
        />
        <StatTile
          label="Net profit"
          value={formatMoney(t.netProfit)}
          tone={t.netProfit >= 0 ? "good" : "bad"}
          sub={margin != null ? `${margin}% of sales` : undefined}
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Profit Summary sheet */}
        <section className="lg:col-span-3 bg-white border border-ink-100 rounded-sm p-6">
          <h2 className="font-display text-2xl text-ink-900 mb-4">Profit statement</h2>
          <dl className="text-sm">
            <Line label="Total sales" value={t.sales} plain />
            <Line label="Gross purchases" value={-t.grossPurchases} muted />
            <Line label="Purchase discounts" value={t.purchaseDiscounts} muted />
            <Line label="Net purchases" value={-t.netPurchases} />
            <Line label="Expenses" value={-t.expenses} />
            <div className="flex items-baseline justify-between pt-3 mt-2 border-t-2 border-ink-900">
              <dt className="font-semibold text-ink-900">Net profit</dt>
              <dd className={cn("font-display text-2xl tabular-nums", t.netProfit >= 0 ? "text-emerald-700" : "text-rose-700")}>
                {formatMoney(t.netProfit)}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-ink-400 mt-4">
            Business assets ({formatMoney(t.assets)}) are equipment and set-up costs, so they count as partner contributions but
            are not deducted from profit — the same as the spreadsheet. Delivery fees buyers pay on top are not counted as sales.
          </p>
        </section>

        <section className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-ink-100 rounded-sm p-6">
            <h2 className="font-display text-xl text-ink-900 mb-3">Expenses by category</h2>
            {summary.expenseCategories.length === 0 ? (
              <p className="text-sm text-ink-400">No expenses in this period.</p>
            ) : (
              <ul className="space-y-2">
                {summary.expenseCategories.map((c) => (
                  <li key={c.category} className="flex items-center justify-between text-sm">
                    <span className="text-ink-700 capitalize">{c.category}</span>
                    <span className="tabular-nums text-ink-900">
                      {formatMoney(c.amount)}
                      <span className="text-xs text-ink-400 ml-2">{Math.round((c.amount / t.expenses) * 100)}%</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white border border-ink-100 rounded-sm p-6">
            <h2 className="font-display text-xl text-ink-900 mb-1">Paid from the {BUSINESS_FUND}</h2>
            <p className="text-xs text-ink-400 mb-3">Spending from pooled capital — not counted as anyone&apos;s contribution.</p>
            <dl className="text-sm">
              <Line label="Purchases (net)" value={summary.businessFund.purchases} plain />
              <Line label="Expenses" value={summary.businessFund.expenses} plain />
              <Line label="Assets" value={summary.businessFund.assets} plain />
              <div className="flex justify-between pt-2 mt-1 border-t border-ink-100 font-semibold text-ink-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatMoney(summary.businessFund.total)}</dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* Owner Summary + Profit Sharing sheets */}
      <section className="bg-white border border-ink-100 rounded-sm">
        <header className="p-6 pb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-2xl text-ink-900">Partners</h2>
            <p className="text-xs text-ink-400 mt-1">
              Contribution = capital invested + expenses and business assets they paid for themselves. Stock a partner
              pays for is recorded as their investment.
            </p>
          </div>
          {partners.length > 0 && Math.abs(shareTotal - 100) > 0.01 && (
            <button
              onClick={() => onNavigate("partners")}
              className="text-xs text-gold-600 bg-gold-50 border border-gold-100 rounded-sm px-3 py-2 hover:bg-gold-100"
            >
              Profit shares add up to {shareTotal}%, not 100% — fix in Partners
            </button>
          )}
        </header>
        {partners.length === 0 ? (
          <div className="px-6 pb-6">
            <button onClick={() => onNavigate("partners")} className="text-sm text-rose-600 hover:underline">
              Add the business partners to see contributions and profit shares →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50 border-y border-ink-100">
                <tr>
                  <th className={TH}>Partner</th>
                  <th className={cn(TH, "text-right")}>Capital invested</th>
                  <th className={cn(TH, "text-right")}>Expenses paid</th>
                  <th className={cn(TH, "text-right")}>Business assets</th>
                  <th className={cn(TH, "text-right")}>Total contribution</th>
                  <th className={cn(TH, "text-right")}>Share</th>
                  <th className={cn(TH, "text-right")}>Profit share</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {partners.map((p) => (
                  <tr key={p.name} className="border-b border-ink-50">
                    <td className={TD}>
                      <PaidBy name={p.name} />
                      {!p.known && <span className="text-[11px] text-gold-600 ml-2">not on the partner list</span>}
                      {p.known && !p.active && <span className="text-[11px] text-ink-400 ml-2">inactive</span>}
                    </td>
                    <td className={cn(TD, "text-right")}>{formatMoney(p.capital)}</td>
                    <td className={cn(TD, "text-right")}>{formatMoney(p.expenses)}</td>
                    <td className={cn(TD, "text-right")}>{formatMoney(p.assets)}</td>
                    <td className={cn(TD, "text-right font-semibold text-ink-900")}>{formatMoney(p.total)}</td>
                    <td className={cn(TD, "text-right")}>{p.sharePercent}%</td>
                    <td className={cn(TD, "text-right font-semibold", p.profitShare >= 0 ? "text-emerald-700" : "text-rose-700")}>
                      {formatMoney(p.profitShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-ink-50 tabular-nums">
                <tr>
                  <td className={cn(TD, "font-semibold text-ink-900")}>Total</td>
                  <td className={cn(TD, "text-right font-semibold")}>{formatMoney(col("capital"))}</td>
                  <td className={cn(TD, "text-right font-semibold")}>{formatMoney(col("expenses"))}</td>
                  <td className={cn(TD, "text-right font-semibold")}>{formatMoney(col("assets"))}</td>
                  <td className={cn(TD, "text-right font-semibold text-ink-900")}>{formatMoney(col("total"))}</td>
                  <td className={cn(TD, "text-right font-semibold")}>{shareTotal}%</td>
                  <td className={cn(TD, "text-right font-semibold")}>{formatMoney(col("profitShare"))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {unknown.length > 0 && (
          <p className="px-6 py-3 text-xs text-gold-600 border-t border-ink-100">
            Some entries name {unknown.map((u) => `"${u.name}"`).join(", ")}, who isn&apos;t a partner. Add them in Partners, or
            edit those entries.
          </p>
        )}
      </section>

      {/* Month by month */}
      <section className="bg-white border border-ink-100 rounded-sm">
        <h2 className="font-display text-2xl text-ink-900 p-6 pb-4">Month by month</h2>
        {summary.monthly.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-ink-400">Nothing recorded in this period yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full tabular-nums">
              <thead className="bg-ink-50 border-y border-ink-100">
                <tr>
                  <th className={TH}>Month</th>
                  <th className={cn(TH, "text-right")}>Sales</th>
                  <th className={cn(TH, "text-right")}>Net purchases</th>
                  <th className={cn(TH, "text-right")}>Expenses</th>
                  <th className={cn(TH, "text-right")}>Net profit</th>
                </tr>
              </thead>
              <tbody>
                {summary.monthly.map((m) => (
                  <tr key={m.month} className="border-b border-ink-50">
                    <td className={cn(TD, "text-ink-900")}>{formatMonth(m.month)}</td>
                    <td className={cn(TD, "text-right")}>{formatMoney(m.sales)}</td>
                    <td className={cn(TD, "text-right")}>{formatMoney(m.netPurchases)}</td>
                    <td className={cn(TD, "text-right")}>{formatMoney(m.expenses)}</td>
                    <td className={cn(TD, "text-right font-semibold", m.netProfit >= 0 ? "text-emerald-700" : "text-rose-700")}>
                      {formatMoney(m.netProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="px-6 py-3 text-xs text-ink-400 border-t border-ink-100">
          A month can dip below zero when stock is bought ahead of the sales it&apos;s for.
        </p>
      </section>
    </div>
  );
}

/** One statement row; negative values are what gets taken away. */
function Line({ label, value, muted, plain }: { label: string; value: number; muted?: boolean; plain?: boolean }) {
  const sign = plain ? "" : value < 0 ? "− " : "+ ";
  return (
    <div className={cn("flex items-baseline justify-between py-1.5", muted && "pl-4 text-ink-500 text-xs")}>
      <dt className={muted ? "" : "text-ink-700"}>{label}</dt>
      <dd className={cn("tabular-nums", !muted && "text-ink-900")}>
        {sign}
        {formatMoney(Math.abs(value))}
      </dd>
    </div>
  );
}
