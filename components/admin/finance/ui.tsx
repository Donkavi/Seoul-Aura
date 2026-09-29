"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_FUND } from "@/lib/finance";

export const TH = "text-left p-3 text-[10px] uppercase tracking-widest text-ink-500 font-semibold whitespace-nowrap";
export const TD = "p-3 text-sm text-ink-700 align-top";
export const LABEL = "text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block";

export function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "bad" | "warn";
}) {
  return (
    <div className="bg-white border border-ink-100 rounded-sm p-4">
      <p className="text-[10px] uppercase tracking-widest text-ink-500 font-semibold">{label}</p>
      <p
        className={cn(
          "font-display text-2xl mt-1 tabular-nums",
          tone === "default" && "text-ink-900",
          tone === "good" && "text-emerald-700",
          tone === "bad" && "text-rose-700",
          tone === "warn" && "text-gold-600"
        )}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-ink-500 mt-0.5">{sub}</p>}
    </div>
  );
}

/** Paid/pending pill, worded from the buyer's side for sales ("Received") and ours for purchases ("Paid"). */
export function StatusPill({
  status,
  sale,
  onClick,
}: {
  status?: "paid" | "pending";
  sale?: boolean;
  onClick?: () => void;
}) {
  if (!status) return <span className="text-ink-300">—</span>;
  const paid = status === "paid";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={onClick ? `Mark as ${paid ? "pending" : sale ? "received" : "paid"}` : undefined}
      className={cn(
        "text-[11px] px-2.5 py-1 rounded-full font-medium border whitespace-nowrap transition-colors",
        paid ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-gold-50 text-gold-600 border-gold-100",
        onClick && (paid ? "hover:bg-emerald-100" : "hover:bg-gold-100")
      )}
    >
      {paid ? (sale ? "Received" : "Paid") : sale ? "Awaiting payment" : "Unpaid"}
    </button>
  );
}

export function PaidBy({ name }: { name?: string }) {
  if (!name) return <span className="text-ink-300">—</span>;
  return name === BUSINESS_FUND ? (
    <span className="text-[11px] bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full whitespace-nowrap">{name}</span>
  ) : (
    <span className="text-[11px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full whitespace-nowrap">{name}</span>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={cn("bg-white rounded-sm w-full max-h-[92vh] flex flex-col", wide ? "max-w-2xl" : "max-w-lg")}>
        <header className="border-b border-ink-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h2 className="font-display text-2xl text-ink-900">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-50 rounded" aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** Downloads rows as a CSV that Excel opens cleanly (BOM for UTF-8, quoted cells). */
export function downloadCsv(filename: string, header: string[], rows: Array<Array<string | number | undefined>>) {
  const cell = (v: string | number | undefined) => {
    const s = v == null ? "" : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
