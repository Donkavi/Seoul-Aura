"use client";

import { useState } from "react";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BUSINESS_FUND,
  CATEGORY_SUGGESTIONS,
  KIND_LABELS,
  formatMoney,
  isPricedKind,
  roundMoney,
  toDateInput,
  todayInput,
  type FinanceKind,
} from "@/lib/finance";
import type { FinanceEntry, Partner } from "@/types";
import { LABEL, Modal } from "./ui";

interface FormState {
  date: string;
  description: string;
  brand: string;
  category: string;
  quantity: string;
  unitPrice: string;
  unitPriceKRW: string;
  amount: string;
  paidBy: string;
  reference: string;
  customer: string;
  paymentStatus: "paid" | "pending";
  paymentMethod: string;
  source: string;
  deliveryFeeCharged: boolean;
  notes: string;
  /** Purchase paid by a partner: also record it as their investment. */
  alsoInvestment: boolean;
}

const str = (v: number | string | undefined) => (v == null ? "" : String(v));

function initialForm(kind: FinanceKind, from?: Partial<FinanceEntry> | null): FormState {
  return {
    date: from?.date ? toDateInput(from.date) : todayInput(),
    description: from?.description ?? "",
    brand: from?.brand ?? "",
    category: from?.category ?? (kind === "purchase" ? "Product" : ""),
    quantity: str(from?.quantity ?? 1),
    unitPrice: str(from?.unitPrice),
    unitPriceKRW: str(from?.unitPriceKRW),
    amount: str(from?.amount),
    // Most stock is bought from the pooled fund; other kinds make you choose.
    paidBy: from?.paidBy ?? (kind === "purchase" ? BUSINESS_FUND : ""),
    reference: from?.reference ?? "",
    customer: from?.customer ?? "",
    paymentStatus: from?.paymentStatus ?? (kind === "sale" ? "pending" : "paid"),
    paymentMethod: from?.paymentMethod ?? "",
    source: from?.source ?? "",
    deliveryFeeCharged: from?.deliveryFeeCharged ?? false,
    notes: from?.notes ?? "",
    alsoInvestment: true,
  };
}

const DESCRIPTION_LABEL: Record<FinanceKind, string> = {
  sale: "Item sold *",
  purchase: "Item bought *",
  purchase_discount: "Discount reason *",
  expense: "Description *",
  asset: "Description *",
  investment: "Description *",
};

interface Props {
  kind: FinanceKind;
  /** The entry being edited — omit to add a new one. */
  entry?: FinanceEntry | null;
  /** Starting values for a new entry (Duplicate). */
  prefill?: Partial<FinanceEntry> | null;
  partners: Partner[];
  brands: string[];
  /** Categories already used in the ledger, offered alongside the defaults. */
  categories: string[];
  krwRate: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function EntryModal({ kind, entry, prefill, partners, brands, categories, krwRate, onClose, onSaved }: Props) {
  const editing = !!entry?._id;
  const [form, setForm] = useState<FormState>(() => initialForm(kind, entry ?? prefill));
  const [rate, setRate] = useState(String(krwRate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedCount, setSavedCount] = useState(0);

  const priced = isPricedKind(kind);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const lineTotal = roundMoney((parseFloat(form.quantity) || 0) * (parseFloat(form.unitPrice) || 0));

  const setKrw = (value: string, rateValue = rate) => {
    const krw = parseFloat(value);
    const r = parseFloat(rateValue);
    setForm((f) => ({
      ...f,
      unitPriceKRW: value,
      unitPrice: krw > 0 && r > 0 ? String(roundMoney(krw * r)) : f.unitPrice,
    }));
  };

  // Inactive partners stay selectable only on entries that already name them.
  const payerOptions = [
    ...partners.filter((p) => p.active || p.name === form.paidBy).map((p) => p.name),
    ...(kind === "investment" ? [] : [BUSINESS_FUND]),
  ];
  if (form.paidBy && !payerOptions.includes(form.paidBy)) payerOptions.push(form.paidBy);

  // Stock a partner pays for out of pocket is their investment (the sheet
  // recorded it in Owner Investments); offered on new purchases only.
  const offerInvestment = kind === "purchase" && !editing && !!form.paidBy && form.paidBy !== BUSINESS_FUND;

  const categoryOptions = Array.from(new Set([...(CATEGORY_SUGGESTIONS[kind] ?? []), ...categories]));

  const save = async (addAnother: boolean) => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editing ? `/api/finance/entries/${entry!._id}` : "/api/finance/entries", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, ...form, alsoInvestment: offerInvestment && form.alsoInvestment }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      onSaved();
      if (addAnother) {
        // Keep what repeats between lines of one bill or order; clear the line itself.
        setForm((f) => ({
          ...initialForm(kind),
          date: f.date,
          paidBy: f.paidBy,
          category: f.category,
          paymentStatus: f.paymentStatus,
          paymentMethod: f.paymentMethod,
          source: f.source,
          reference: f.reference,
          customer: f.customer,
          deliveryFeeCharged: f.deliveryFeeCharged,
          alsoInvestment: f.alsoInvestment,
        }));
        setSavedCount((n) => n + 1);
      } else {
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  const title = `${editing ? "Edit" : "Add"} ${kind === "purchase_discount" ? "supplier discount" : KIND_LABELS[kind].toLowerCase()}`;

  return (
    <Modal title={title} onClose={onClose} wide={priced}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save(false);
        }}
        className="p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LABEL}>Date *</label>
            <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required className="input-field" />
          </div>
          {kind === "sale" ? (
            <div>
              <label className={LABEL}>Pre-order #</label>
              <input
                value={form.reference}
                onChange={(e) => set("reference", e.target.value)}
                placeholder="PRE-… (optional)"
                className="input-field font-mono"
              />
            </div>
          ) : (
            <div>
              <label className={LABEL}>{kind === "investment" ? "Partner *" : kind === "purchase_discount" ? "Bill paid by *" : "Paid by *"}</label>
              <select value={form.paidBy} onChange={(e) => set("paidBy", e.target.value)} required className="input-field">
                <option value="">Choose…</option>
                {payerOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              {partners.length === 0 && (
                <p className="text-[11px] text-gold-600 mt-1">Add the partners in the Partners tab first.</p>
              )}
            </div>
          )}
        </div>

        {kind === "sale" && (
          <div>
            <label className={LABEL}>Customer</label>
            <input value={form.customer} onChange={(e) => set("customer", e.target.value)} className="input-field" />
          </div>
        )}

        <div>
          <label className={LABEL}>{DESCRIPTION_LABEL[kind]}</label>
          <input value={form.description} onChange={(e) => set("description", e.target.value)} required className="input-field" />
        </div>

        {(priced || kind === "expense" || kind === "asset") && (
          <div className={cn("grid gap-4", priced && kind === "purchase" ? "grid-cols-2" : "grid-cols-1")}>
            {priced && (
              <div>
                <label className={LABEL}>Brand</label>
                <input value={form.brand} onChange={(e) => set("brand", e.target.value)} list="finance-brands" className="input-field" />
                <datalist id="finance-brands">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            )}
            {kind !== "sale" && (
              <div>
                <label className={LABEL}>Category</label>
                <input value={form.category} onChange={(e) => set("category", e.target.value)} list="finance-categories" className="input-field" />
                <datalist id="finance-categories">
                  {categoryOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
            )}
          </div>
        )}

        {priced ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Qty *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => set("quantity", e.target.value)}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className={LABEL}>{kind === "sale" ? "Selling price *" : "Cost price *"}</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={form.unitPrice}
                  onChange={(e) => set("unitPrice", e.target.value)}
                  required
                  placeholder="Per unit, Rs."
                  className="input-field"
                />
              </div>
              <div>
                <label className={LABEL}>Total</label>
                <p className="input-field bg-ink-50 tabular-nums">{formatMoney(lineTotal)}</p>
              </div>
            </div>

            {kind === "purchase" && (
              <div className="bg-ink-50 border border-ink-100 rounded-sm p-3">
                <p className="text-[11px] uppercase tracking-widest text-ink-500 font-semibold mb-2">Bought in Korean won? (optional)</p>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.unitPriceKRW}
                    onChange={(e) => setKrw(e.target.value)}
                    placeholder="Cost per unit, ₩"
                    className="input-field bg-white py-2"
                  />
                  <span className="text-ink-400">×</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={rate}
                    onChange={(e) => {
                      setRate(e.target.value);
                      if (form.unitPriceKRW) setKrw(form.unitPriceKRW, e.target.value);
                    }}
                    title="KRW → LKR rate"
                    className="input-field bg-white py-2 w-28"
                  />
                  <span className="text-ink-500 whitespace-nowrap text-xs">fills the cost price</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={LABEL}>{kind === "sale" ? "Payment" : "Supplier paid?"}</label>
                <div className="flex gap-2">
                  {(["paid", "pending"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("paymentStatus", s)}
                      className={cn(
                        "flex-1 px-3 py-2.5 text-xs font-medium rounded-sm border transition-colors",
                        form.paymentStatus === s ? "bg-ink-900 text-white border-ink-900" : "border-ink-200 text-ink-700 hover:border-ink-400"
                      )}
                    >
                      {s === "paid" ? (kind === "sale" ? "Received" : "Paid") : kind === "sale" ? "Awaiting" : "Unpaid"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={LABEL}>Payment method</label>
                <input
                  value={form.paymentMethod}
                  onChange={(e) => set("paymentMethod", e.target.value)}
                  list="finance-methods"
                  className="input-field"
                />
                <datalist id="finance-methods">
                  {["Bank transfer", "Cash on delivery", "Cash", "Card"].map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>
            </div>

            {kind === "purchase" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Bought from</label>
                  <input
                    value={form.source}
                    onChange={(e) => set("source", e.target.value)}
                    placeholder="Shop or website"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className={LABEL}>For pre-order #</label>
                  <input
                    value={form.reference}
                    onChange={(e) => set("reference", e.target.value)}
                    placeholder="PRE-… (optional)"
                    className="input-field font-mono"
                  />
                </div>
              </div>
            )}

            {offerInvestment && (
              <label className="flex items-start gap-2 text-sm cursor-pointer bg-rose-25 border border-rose-100 rounded-sm p-3">
                <input
                  type="checkbox"
                  checked={form.alsoInvestment}
                  onChange={(e) => set("alsoInvestment", e.target.checked)}
                  className="accent-rose-600 mt-0.5"
                />
                <span>
                  Also add {formatMoney(lineTotal)} to {form.paidBy}&apos;s investments
                  <span className="block text-[11px] text-ink-500">
                    They paid out of their own pocket, so it counts towards their contribution. Untick if it&apos;s already in
                    Investments.
                  </span>
                </span>
              </label>
            )}

            {kind === "sale" && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.deliveryFeeCharged}
                  onChange={(e) => set("deliveryFeeCharged", e.target.checked)}
                  className="accent-rose-600"
                />
                Buyer paid a delivery fee on top (not added to the sale)
              </label>
            )}
          </>
        ) : (
          <div>
            <label className={LABEL}>Amount (Rs.) *</label>
            <input
              type="number"
              min="0"
              step="any"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              required
              className="input-field"
            />
          </div>
        )}

        <div>
          <label className={LABEL}>Notes</label>
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="input-field resize-none" />
        </div>

        {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-sm px-3 py-2">{error}</p>}
        {savedCount > 0 && !error && (
          <p className="text-xs text-emerald-700">
            {savedCount} saved — add the next one.
          </p>
        )}

        <div className="flex flex-wrap gap-3 pt-2 border-t border-ink-100">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 inline-flex items-center gap-2">
            <Check size={14} /> {saving ? "Saving…" : editing ? "Update" : "Save"}
          </button>
          {!editing && (
            <button
              type="button"
              disabled={saving}
              onClick={(e) => {
                // Run the browser's required-field checks before saving.
                const formEl = (e.currentTarget as HTMLButtonElement).form;
                if (formEl && !formEl.reportValidity()) return;
                save(true);
              }}
              className="btn-outline disabled:opacity-60 inline-flex items-center gap-2"
            >
              <Plus size={14} /> Save & add another
            </button>
          )}
          <button type="button" onClick={onClose} className="btn-ghost ml-auto">
            {savedCount > 0 ? "Done" : "Cancel"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
