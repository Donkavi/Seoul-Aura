"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  CalendarRange,
  LayoutDashboard,
  PiggyBank,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { todayInput } from "@/lib/finance";
import type { Partner } from "@/types";
import Overview from "@/components/admin/finance/Overview";
import Ledger, { type LedgerTab } from "@/components/admin/finance/Ledger";
import Partners from "@/components/admin/finance/Partners";

type Tab = "overview" | LedgerTab | "partners";

const TABS: Array<{ key: Tab; label: string; icon: LucideIcon }> = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "sales", label: "Sales", icon: TrendingUp },
  { key: "purchases", label: "Purchases", icon: ShoppingBag },
  { key: "expenses", label: "Expenses", icon: Receipt },
  { key: "assets", label: "Assets", icon: Briefcase },
  { key: "investments", label: "Investments", icon: PiggyBank },
  { key: "partners", label: "Partners", icon: Users },
];

type Preset = "all" | "month" | "lastMonth" | "year";

const PRESETS: Array<{ key: Preset; label: string }> = [
  { key: "all", label: "All time" },
  { key: "month", label: "This month" },
  { key: "lastMonth", label: "Last month" },
  { key: "year", label: "This year" },
];

function presetRange(key: Preset): { from: string; to: string } {
  const today = todayInput();
  const [y, m] = today.split("-").map(Number);
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (key) {
    case "month":
      return { from: `${y}-${pad(m)}-01`, to: today };
    case "lastMonth": {
      const ly = m === 1 ? y - 1 : y;
      const lm = m === 1 ? 12 : m - 1;
      const lastDay = new Date(Date.UTC(ly, lm, 0)).getUTCDate();
      return { from: `${ly}-${pad(lm)}-01`, to: `${ly}-${pad(lm)}-${pad(lastDay)}` };
    }
    case "year":
      return { from: `${y}-01-01`, to: today };
    default:
      return { from: "", to: "" };
  }
}

function FinancePageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab") as Tab | null;
  const tab: Tab = TABS.some((t) => t.key === requested) ? (requested as Tab) : "overview";

  const [period, setPeriod] = useState({ from: "", to: "" });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [krwRate, setKrwRate] = useState(0.23);

  const loadPartners = useCallback(async () => {
    const data = await fetch("/api/finance/partners").then((r) => r.json()).catch(() => []);
    setPartners(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    loadPartners();
    fetch("/api/brands")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setBrands(d.map((b: { name: string }) => b.name));
      })
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d?.krwToLkrRate != null) setKrwRate(d.krwToLkrRate);
      })
      .catch(() => {});
  }, [loadPartners]);

  const goTo = (next: Tab) => router.replace(`${pathname}?tab=${next}`, { scroll: false });
  const activePreset = PRESETS.find((p) => {
    const r = presetRange(p.key);
    return r.from === period.from && r.to === period.to;
  })?.key;

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-6 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Accounts</p>
          <h1 className="font-display text-4xl text-ink-900">Finance</h1>
          <p className="text-sm text-ink-500 mt-1">Sales, purchases, expenses and what each partner has put in and earned.</p>
        </div>

        {tab !== "partners" && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-white border border-ink-100 rounded-sm p-0.5">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(presetRange(p.key))}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                    activePreset === p.key ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-50"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 bg-white border border-ink-100 rounded-sm px-2 py-1">
              <CalendarRange size={14} className="text-ink-400" />
              <input
                type="date"
                value={period.from}
                max={period.to || undefined}
                onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
                aria-label="From"
                className="text-xs text-ink-700 focus:outline-none bg-transparent"
              />
              <span className="text-ink-300 text-xs">to</span>
              <input
                type="date"
                value={period.to}
                min={period.from || undefined}
                onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
                aria-label="To"
                className="text-xs text-ink-700 focus:outline-none bg-transparent"
              />
            </div>
          </div>
        )}
      </header>

      <nav className="flex gap-1 border-b border-ink-200 mb-6 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => goTo(t.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-rose-600 text-rose-700 font-medium" : "border-transparent text-ink-500 hover:text-ink-900"
            )}
          >
            <t.icon size={15} strokeWidth={tab === t.key ? 2 : 1.5} />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" && <Overview period={period} onNavigate={goTo} />}
      {tab === "partners" && <Partners partners={partners} onChanged={loadPartners} />}
      {tab !== "overview" && tab !== "partners" && (
        <Ledger key={tab} tab={tab} period={period} partners={partners} brands={brands} krwRate={krwRate} />
      )}
    </div>
  );
}

/** useSearchParams (the ?tab= link) needs a Suspense boundary above it. */
export default function AdminFinancePage() {
  return (
    <Suspense fallback={<div className="p-6 lg:p-10 text-sm text-ink-400">Loading finance…</div>}>
      <FinancePageInner />
    </Suspense>
  );
}
