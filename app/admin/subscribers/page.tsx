"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, X, Search, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import type { Subscription, SubscriptionPlan } from "@/types";

type StatusFilter = "all" | "active" | "paused" | "cancelled";

interface FormState {
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  planId: string;
  status: "active" | "paused" | "cancelled";
  startDate: string;
  nextBillingDate: string;
  line1: string;
  city: string;
  country: string;
  notes: string;
}

const emptyForm: FormState = {
  customerName: "", customerEmail: "", phoneNumber: "",
  planId: "", status: "active",
  startDate: new Date().toISOString().slice(0, 10),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  line1: "", city: "", country: "Sri Lanka", notes: "",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
};

const TAB_LABELS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "cancelled", label: "Cancelled" },
];

export default function SubscribersPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tab !== "all") params.set("status", tab);
      if (search) params.set("search", search);
      const data = await fetch(`/api/subscriptions?${params}`).then((r) => r.json());
      setSubs(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/subscription-plans")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setPlans(d))
      .catch(() => {});
  }, []);

  const counts = {
    all: subs.length,
    active: subs.filter((s) => s.status === "active").length,
    paused: subs.filter((s) => s.status === "paused").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
  };

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const openEdit = (s: Subscription) => {
    setForm({
      customerName: s.customerName,
      customerEmail: s.customerEmail,
      phoneNumber: s.phoneNumber ?? "",
      planId: s.planId,
      status: s.status,
      startDate: s.startDate.slice(0, 10),
      nextBillingDate: s.nextBillingDate.slice(0, 10),
      line1: s.shippingAddress?.line1 ?? "",
      city: s.shippingAddress?.city ?? "",
      country: s.shippingAddress?.country ?? "Sri Lanka",
      notes: s.notes ?? "",
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setForm(emptyForm); setEditingId(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const selectedPlan = plans.find((p) => p._id === form.planId);
    const payload = {
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      phoneNumber: form.phoneNumber.trim(),
      planId: form.planId,
      planName: selectedPlan?.name ?? "",
      planPrice: selectedPlan?.price ?? 0,
      origin: selectedPlan?.origin ?? "Korea",
      status: form.status,
      startDate: form.startDate,
      nextBillingDate: form.nextBillingDate,
      shippingAddress: {
        line1: form.line1.trim(),
        city: form.city.trim(),
        country: form.country.trim(),
      },
      notes: form.notes.trim(),
    };
    try {
      if (editingId) {
        await fetch(`/api/subscriptions/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await load();
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (id: string, status: Subscription["status"]) => {
    setSubs((prev) => prev.map((s) => s._id === id ? { ...s, status } : s));
    await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const deleteSub = async (id: string, name: string) => {
    if (!confirm(`Delete subscription for "${name}"?`)) return;
    await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Recurring Members
          </p>
          <h1 className="font-display text-4xl text-ink-900">Subscribers</h1>
          <p className="text-sm text-ink-500 mt-1">
            {subs.filter((s) => s.status === "active").length} active ·{" "}
            {subs.length} total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 text-sm hover:bg-rose-600 transition-colors"
        >
          <Plus size={15} /> Add Subscriber
        </button>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-ink-50 p-1 rounded-sm">
          {TAB_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-sm transition-all",
                tab === key
                  ? "bg-white text-ink-900 shadow-sm"
                  : "text-ink-500 hover:text-ink-700"
              )}
            >
              {label}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]",
                tab === key ? "bg-rose-100 text-rose-700" : "bg-ink-100 text-ink-500"
              )}>
                {counts[key]}
              </span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, plan…"
            className="input-field pl-9 py-2 text-sm w-full"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-ink-100 rounded-sm p-16 text-center text-sm text-ink-400">
          Loading…
        </div>
      ) : subs.length === 0 ? (
        <div className="bg-white border border-ink-100 rounded-sm p-16 text-center text-sm text-ink-400">
          No subscribers found.
        </div>
      ) : (
        <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-500 w-6" />
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-500">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-500">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-500">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-500">Next Billing</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-ink-500">Price</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <>
                  <tr
                    key={s._id}
                    className="border-b border-ink-50 hover:bg-ink-50/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === s._id ? null : s._id)}
                        className="p-0.5 text-ink-400 hover:text-ink-700 transition-colors"
                      >
                        {expandedId === s._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{s.customerName}</p>
                      <p className="text-xs text-ink-400">{s.customerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ink-800">{s.planName}</p>
                      <p className="text-[10px] uppercase tracking-wide text-ink-400">{s.origin}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={s.status}
                        onChange={(e) => changeStatus(s._id, e.target.value as Subscription["status"])}
                        className={cn(
                          "text-xs px-2 py-1 rounded-sm border font-medium capitalize cursor-pointer",
                          STATUS_STYLES[s.status]
                        )}
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-ink-600 text-xs">
                      {new Date(s.nextBillingDate).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {formatPrice(s.planPrice ?? 0)}
                      <span className="text-ink-400 font-normal text-xs">/mo</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 hover:bg-ink-100 text-ink-500 hover:text-rose-600 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteSub(s._id, s.customerName)}
                          className="p-1.5 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedId === s._id && (
                    <tr key={`${s._id}-expand`} className="border-b border-ink-50 bg-ink-50/30">
                      <td />
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-ink-600">
                          <div>
                            <p className="font-semibold text-ink-500 uppercase tracking-widest mb-0.5">Phone</p>
                            <p>{s.phoneNumber || "—"}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-500 uppercase tracking-widest mb-0.5">Start Date</p>
                            <p>{new Date(s.startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-500 uppercase tracking-widest mb-0.5">Address</p>
                            <p>{[s.shippingAddress?.line1, s.shippingAddress?.city, s.shippingAddress?.country].filter(Boolean).join(", ") || "—"}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-ink-500 uppercase tracking-widest mb-0.5">Notes</p>
                            <p>{s.notes || "—"}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-xl w-full max-h-[90vh] overflow-y-auto">
            <header className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink-900">
                {editingId ? "Edit Subscriber" : "Add Subscriber"}
              </h2>
              <button onClick={closeForm} className="p-2 hover:bg-ink-50 rounded">
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    required
                    className="input-field"
                    placeholder="Kavindya Perera"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    required
                    className="input-field"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                    Phone
                  </label>
                  <input
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="input-field"
                    placeholder="+94 77 000 0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
                    className="input-field"
                  >
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                  Subscription Plan *
                </label>
                <select
                  value={form.planId}
                  onChange={(e) => setForm({ ...form, planId: e.target.value })}
                  required
                  className="input-field"
                >
                  <option value="">Select a plan…</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — Rs. {p.price.toLocaleString()}/mo ({p.origin})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                    Next Billing *
                  </label>
                  <input
                    type="date"
                    value={form.nextBillingDate}
                    onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              </div>

              <fieldset className="border border-ink-100 rounded-sm p-4 space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-widest text-ink-500 px-1">
                  Shipping Address
                </legend>
                <input
                  value={form.line1}
                  onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  placeholder="Address line 1"
                  className="input-field"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    className="input-field"
                  />
                  <input
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                    placeholder="Country"
                    className="input-field"
                  />
                </div>
              </fieldset>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="Allergies, preferences, special requests…"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-ink-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-60"
                >
                  {saving ? "Saving…" : editingId ? "Update Subscriber" : "Add Subscriber"}
                </button>
                <button type="button" onClick={closeForm} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
