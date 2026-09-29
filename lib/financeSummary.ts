import { BUSINESS_FUND, roundMoney, type FinanceKind } from "@/lib/finance";
import type { FinancePartnerRow, FinanceSummary } from "@/types";

/** Ledger amounts summed per kind × payer × payment status × category × month. */
export interface SummaryBucket {
  _id: { kind: FinanceKind; paidBy?: string; status?: string; category?: string; month: string };
  amount: number;
}

/**
 * The figures the spreadsheet's summary sheets used to calculate:
 *
 *   Net profit    = sales − (purchases − purchase discounts) − expenses
 *   Contribution  = capital invested + expenses and assets a partner paid
 *                   for personally (the sheet's Owner Summary)
 *   Profit share  = net profit × the partner's share %
 *
 * Stock a partner pays for is recorded as their investment, as the sheet did,
 * so a purchase's "paid by" doesn't add to the contribution a second time.
 * Business assets are capital, so they count as contributions but are not
 * deducted from profit — the same treatment as the sheet.
 */
export function buildSummary(
  buckets: SummaryBucket[],
  partners: Array<{ name: string; sharePercent: number; active: boolean }>,
  unrecordedPreOrders: number
): FinanceSummary {
  const totals = {
    sales: 0,
    salesReceived: 0,
    salesPending: 0,
    grossPurchases: 0,
    purchaseDiscounts: 0,
    netPurchases: 0,
    expenses: 0,
    assets: 0,
    investments: 0,
    netProfit: 0,
  };
  const businessFund = { purchases: 0, expenses: 0, assets: 0, total: 0 };
  const monthly = new Map<string, { sales: number; netPurchases: number; expenses: number }>();
  const categories = new Map<string, number>();

  const blankRow = (name: string, sharePercent: number, active: boolean, known: boolean): FinancePartnerRow => ({
    name,
    sharePercent,
    active,
    known,
    capital: 0,
    expenses: 0,
    assets: 0,
    total: 0,
    profitShare: 0,
  });
  const rows = new Map<string, FinancePartnerRow>();
  for (const p of partners) rows.set(p.name, blankRow(p.name, p.sharePercent, p.active, true));
  // Someone named on entries but missing from the partner list still gets a row, flagged.
  const rowFor = (name: string) => {
    let row = rows.get(name);
    if (!row) rows.set(name, (row = blankRow(name, 0, false, false)));
    return row;
  };

  // Only profit-affecting kinds open a month, so a month with nothing but an
  // investment doesn't show up as a row of zeros.
  const monthOf = (key: string) => {
    let m = monthly.get(key);
    if (!m) monthly.set(key, (m = { sales: 0, netPurchases: 0, expenses: 0 }));
    return m;
  };

  for (const { _id: b, amount } of buckets) {
    const fund = b.paidBy === BUSINESS_FUND;
    const payer = b.paidBy && !fund ? rowFor(b.paidBy) : null;

    switch (b.kind) {
      case "sale":
        totals.sales += amount;
        if (b.status === "paid") totals.salesReceived += amount;
        else totals.salesPending += amount;
        monthOf(b.month).sales += amount;
        break;
      case "purchase":
      case "purchase_discount": {
        const signed = b.kind === "purchase" ? amount : -amount;
        if (b.kind === "purchase") totals.grossPurchases += amount;
        else totals.purchaseDiscounts += amount;
        monthOf(b.month).netPurchases += signed;
        if (fund) businessFund.purchases += signed;
        break;
      }
      case "expense": {
        totals.expenses += amount;
        monthOf(b.month).expenses += amount;
        const category = b.category || "Uncategorised";
        categories.set(category, (categories.get(category) ?? 0) + amount);
        if (fund) businessFund.expenses += amount;
        if (payer) payer.expenses += amount;
        break;
      }
      case "asset":
        totals.assets += amount;
        if (fund) businessFund.assets += amount;
        if (payer) payer.assets += amount;
        break;
      case "investment":
        totals.investments += amount;
        if (payer) payer.capital += amount;
        break;
    }
  }

  totals.netPurchases = totals.grossPurchases - totals.purchaseDiscounts;
  totals.netProfit = totals.sales - totals.netPurchases - totals.expenses;
  for (const key of Object.keys(totals) as Array<keyof typeof totals>) totals[key] = roundMoney(totals[key]);

  return {
    totals,
    partners: Array.from(rows.values()).map((r) => ({
      ...r,
      capital: roundMoney(r.capital),
      expenses: roundMoney(r.expenses),
      assets: roundMoney(r.assets),
      total: roundMoney(r.capital + r.expenses + r.assets),
      profitShare: roundMoney((totals.netProfit * r.sharePercent) / 100),
    })),
    businessFund: {
      purchases: roundMoney(businessFund.purchases),
      expenses: roundMoney(businessFund.expenses),
      assets: roundMoney(businessFund.assets),
      total: roundMoney(businessFund.purchases + businessFund.expenses + businessFund.assets),
    },
    monthly: Array.from(monthly.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, m]) => ({
        month,
        sales: roundMoney(m.sales),
        netPurchases: roundMoney(m.netPurchases),
        expenses: roundMoney(m.expenses),
        netProfit: roundMoney(m.sales - m.netPurchases - m.expenses),
      })),
    expenseCategories: Array.from(categories.entries())
      .map(([category, amount]) => ({ category, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount),
    unrecordedPreOrders,
  };
}
