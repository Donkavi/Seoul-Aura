"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Star, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import type { SubscriptionPlan } from "@/types";

interface FormState {
  name: string;
  description: string;
  price: string;
  origin: "Korea" | "Dubai" | "Mixed" | "Other";
  badge: string;
  featured: boolean;
  active: boolean;
  items: string[];
  newItem: string;
}

const emptyForm: FormState = {
  name: "", description: "", price: "", origin: "Korea",
  badge: "", featured: false, active: true, items: [], newItem: "",
};

const ORIGIN_COLORS: Record<string, string> = {
  Korea: "bg-rose-50 text-rose-700",
  Dubai: "bg-gold-50 text-gold-700",
  Mixed: "bg-blue-50 text-blue-700",
  Other: "bg-ink-50 text-ink-700",
};

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/subscription-plans").then((r) => r.json());
      setPlans(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const openEdit = (p: SubscriptionPlan) => {
    setForm({
      name: p.name, description: p.description, price: p.price.toString(),
      origin: p.origin, badge: p.badge ?? "", featured: p.featured,
      active: p.active, items: [...p.items], newItem: "",
    });
    setEditingId(p._id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setForm(emptyForm); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      name: form.name.trim(), description: form.description.trim(),
      price: parseFloat(form.price) || 0, origin: form.origin,
      badge: form.badge.trim(), featured: form.featured,
      active: form.active, items: form.items.filter(Boolean),
    };
    try {
      if (editingId) {
        await fetch(`/api/subscription-plans/${editingId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/subscription-plans", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await load();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await fetch(`/api/subscription-plans/${id}`, { method: "DELETE" });
    await load();
  };

  const toggle = async (id: string, field: "featured" | "active", val: boolean) => {
    setPlans((prev) => prev.map((p) => p._id === id ? { ...p, [field]: val } : p));
    await fetch(`/api/subscription-plans/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: val }),
    });
  };

  const move = async (id: string, dir: "up" | "down") => {
    const idx = plans.findIndex((p) => p._id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= plans.length) return;
    const reordered = [...plans];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    setPlans(reordered.map((p, i) => ({ ...p, order: i })));
    await Promise.all([
      fetch(`/api/subscription-plans/${reordered[idx]._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: idx }),
      }),
      fetch(`/api/subscription-plans/${reordered[swapIdx]._id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapIdx }),
      }),
    ]);
  };

  const addItem = () => {
    if (!form.newItem.trim()) return;
    setForm((f) => ({ ...f, items: [...f.items, f.newItem.trim()], newItem: "" }));
  };

  const removeItem = (i: number) =>
    setForm((f) => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Monthly Boxes</p>
          <h1 className="font-display text-4xl text-ink-900">Subscription Plans</h1>
          <p className="text-sm text-ink-500 mt-1">{plans.length} plans · shown on /subscriptions</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 text-sm hover:bg-rose-600 transition-colors">
          <Plus size={15} /> Add Plan
        </button>
      </header>

      {loading ? (
        <div className="bg-white border border-ink-100 rounded-sm p-16 text-center text-sm text-ink-400">Loading…</div>
      ) : plans.length === 0 ? (
        <div className="bg-white border border-ink-100 rounded-sm p-16 text-center text-sm text-ink-400">No plans yet.</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {plans.map((p, idx) => (
            <div key={p._id} className={cn(
              "bg-white border-2 rounded-sm p-5 flex flex-col gap-3 relative transition-all",
              p.featured ? "border-rose-500 shadow-rose" : "border-ink-100",
              !p.active && "opacity-50"
            )}>
              {p.badge && (
                <span className={cn(
                  "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded-full",
                  p.featured ? "bg-rose-600 text-white" : "bg-ink-900 text-white"
                )}>
                  {p.badge}
                </span>
              )}

              <div>
                <span className={cn("badge-origin text-[10px] mb-2 inline-block", ORIGIN_COLORS[p.origin])}>
                  {p.origin}
                </span>
                <h3 className="font-display text-xl text-ink-900 leading-tight">{p.name}</h3>
                <p className="text-xs text-ink-500 mt-1 line-clamp-2">{p.description}</p>
              </div>

              <p className="font-display text-3xl text-ink-900">
                {formatPrice(p.price)}<span className="text-sm text-ink-400 font-body">/mo</span>
              </p>

              <ul className="space-y-1.5 flex-1">
                {p.items.map((item) => (
                  <li key={item} className="text-xs text-ink-600 flex items-start gap-1.5">
                    <span className="text-rose-400 mt-0.5">✓</span> {item}
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between pt-3 border-t border-ink-50">
                <div className="flex items-center gap-1">
                  <button onClick={() => move(p._id, "up")} disabled={idx === 0} className="p-1.5 hover:bg-ink-50 rounded disabled:opacity-30 transition-colors" title="Move up">
                    <ChevronUp size={13} />
                  </button>
                  <button onClick={() => move(p._id, "down")} disabled={idx === plans.length - 1} className="p-1.5 hover:bg-ink-50 rounded disabled:opacity-30 transition-colors" title="Move down">
                    <ChevronDown size={13} />
                  </button>
                  <button onClick={() => toggle(p._id, "featured", !p.featured)} className={cn("p-1.5 rounded transition-colors", p.featured ? "text-rose-600 bg-rose-50" : "text-ink-400 hover:bg-ink-50")} title={p.featured ? "Remove featured" : "Set featured"}>
                    <Star size={13} className={p.featured ? "fill-rose-500" : ""} />
                  </button>
                  <button onClick={() => toggle(p._id, "active", !p.active)} className={cn("p-1.5 rounded transition-colors", p.active ? "text-green-600 hover:bg-green-50" : "text-ink-400 hover:bg-ink-50")} title={p.active ? "Hide from site" : "Show on site"}>
                    {p.active ? <Eye size={13} /> : <EyeOff size={13} />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-ink-50 text-ink-600 hover:text-rose-600 rounded transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => deletePlan(p._id, p.name)} className="p-1.5 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <header className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink-900">{editingId ? "Edit Plan" : "New Plan"}</h2>
              <button onClick={closeForm} className="p-2 hover:bg-ink-50 rounded"><X size={18} /></button>
            </header>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">Plan Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="K-Beauty Essentials" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">Price (LKR/mo) *</label>
                  <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="input-field" placeholder="6500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">Origin</label>
                  <select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as FormState["origin"] })} className="input-field">
                    <option value="Korea">Korea</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">Badge Label</label>
                <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Most Popular" className="input-field" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2">What's Included</label>
                <ul className="space-y-1.5 mb-2">
                  {form.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm bg-ink-50 px-3 py-1.5 rounded-sm">
                      <span className="flex-1 text-ink-700">{item}</span>
                      <button type="button" onClick={() => removeItem(i)} className="text-ink-400 hover:text-rose-600"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={form.newItem}
                    onChange={(e) => setForm({ ...form, newItem: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                    placeholder="Add an item (press Enter)"
                    className="input-field flex-1"
                  />
                  <button type="button" onClick={addItem} className="px-3 py-2 bg-ink-900 text-white text-sm hover:bg-rose-600 transition-colors">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="flex gap-5 pt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="accent-rose-600" />
                  Featured (highlighted card)
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rose-600" />
                  Active (show on site)
                </label>
              </div>

              <div className="flex gap-3 pt-3 border-t border-ink-100">
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
                  {saving ? "Saving…" : editingId ? "Update Plan" : "Create Plan"}
                </button>
                <button type="button" onClick={closeForm} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
