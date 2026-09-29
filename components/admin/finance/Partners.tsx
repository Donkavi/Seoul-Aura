"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { BUSINESS_FUND } from "@/lib/finance";
import type { Partner } from "@/types";
import { LABEL, Modal, TD, TH } from "./ui";

interface FormState {
  name: string;
  sharePercent: string;
  active: boolean;
  notes: string;
}

const emptyForm: FormState = { name: "", sharePercent: "", active: true, notes: "" };

export default function Partners({ partners, onChanged }: { partners: Partner[]; onChanged: () => void }) {
  const [editing, setEditing] = useState<Partner | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const shareTotal = partners.filter((p) => p.active).reduce((s, p) => s + p.sharePercent, 0);

  const open = (p: Partner | null) => {
    setEditing(p);
    setForm(p ? { name: p.name, sharePercent: String(p.sharePercent), active: p.active, notes: p.notes ?? "" } : emptyForm);
    setError("");
    setShowForm(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(editing ? `/api/finance/partners/${editing._id}` : "/api/finance/partners", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sharePercent: parseFloat(form.sharePercent) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save");
        return;
      }
      setShowForm(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Partner) => {
    if (!confirm(`Remove ${p.name} from the partner list?`)) return;
    const res = await fetch(`/api/finance/partners/${p._id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Could not remove");
      return;
    }
    onChanged();
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-ink-100 rounded-sm">
        <div className="border-b border-ink-100 p-4 flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-sm text-ink-900 font-medium">Business partners</p>
            <p className="text-xs text-ink-500">
              Profit shares of active partners add up to{" "}
              <span className={cn("font-semibold", Math.abs(shareTotal - 100) > 0.01 ? "text-gold-600" : "text-emerald-700")}>
                {shareTotal}%
              </span>
              {Math.abs(shareTotal - 100) > 0.01 && " — they should total 100%"}
            </p>
          </div>
          <button onClick={() => open(null)} className="ml-auto btn-primary inline-flex items-center gap-2 py-2">
            <Plus size={14} /> Add partner
          </button>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-16">
            <Users size={32} className="mx-auto mb-3 text-ink-200" strokeWidth={1.2} />
            <p className="text-sm text-ink-500">No partners yet. Add each owner with their share of the profit.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className={TH}>Partner</th>
                <th className={cn(TH, "text-right")}>Profit share</th>
                <th className={TH}>Status</th>
                <th className={TH}>Notes</th>
                <th className={cn(TH, "text-right")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p._id} className="border-b border-ink-50 hover:bg-rose-25/40">
                  <td className={cn(TD, "font-medium text-ink-900")}>{p.name}</td>
                  <td className={cn(TD, "text-right tabular-nums")}>{p.sharePercent}%</td>
                  <td className={TD}>
                    <span
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-medium",
                        p.active ? "bg-green-50 text-green-700" : "bg-ink-100 text-ink-500"
                      )}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={cn(TD, "text-ink-500")}>{p.notes || "—"}</td>
                  <td className={cn(TD, "text-right")}>
                    <div className="inline-flex gap-1">
                      <button onClick={() => open(p)} title="Edit" className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(p)} title="Remove" className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-ink-500 max-w-2xl">
        When money comes out of the partners&apos; pooled capital rather than one person&apos;s pocket, choose{" "}
        <strong>{BUSINESS_FUND}</strong> as &ldquo;Paid by&rdquo; — the spreadsheet called this &ldquo;W,K,C&rdquo;. Expenses and assets a
        partner pays for personally count towards their contribution automatically. When a partner pays for stock, the purchase
        form adds it to their investments for you.
      </p>

      {showForm && (
        <Modal title={editing ? "Edit partner" : "Add partner"} onClose={() => setShowForm(false)}>
          <form onSubmit={save} className="p-6 space-y-4">
            <div>
              <label className={LABEL}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" />
              {editing && form.name.trim() !== editing.name && (
                <p className="text-[11px] text-ink-400 mt-1">Their existing ledger entries will move to the new name.</p>
              )}
            </div>
            <div>
              <label className={LABEL}>Profit share (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="any"
                value={form.sharePercent}
                onChange={(e) => setForm({ ...form, sharePercent: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className={LABEL}>Notes</label>
              <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="accent-rose-600"
              />
              Active (offered in &ldquo;Paid by&rdquo;)
            </label>
            {error && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-sm px-3 py-2">{error}</p>}
            <div className="flex gap-3 pt-2 border-t border-ink-100">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 inline-flex items-center gap-2">
                <Check size={14} /> {saving ? "Saving…" : editing ? "Update" : "Add partner"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
