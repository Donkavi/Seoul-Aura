"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Check, Store } from "lucide-react";
import type { Brand } from "@/types";

interface FormState {
  name: string;
  logo: string;
  origin: "Korea" | "Dubai" | "Other";
  description: string;
  active: boolean;
}

const emptyForm: FormState = { name: "", logo: "", origin: "Korea", description: "", active: true };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/brands");
    const data = await res.json();
    setBrands(Array.isArray(data) ? data : []);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = editingId ? `/api/brands/${editingId}` : "/api/brands";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await load();
      setShowForm(false);
      setForm(emptyForm);
      setEditingId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (b: Brand) => {
    setForm({ name: b.name, logo: b.logo ?? "", origin: b.origin, description: b.description ?? "", active: b.active });
    setEditingId(b._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand?")) return;
    await fetch(`/api/brands/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">Catalog</p>
          <h1 className="font-display text-4xl text-ink-900">Brands</h1>
          <p className="text-sm text-ink-500 mt-1">{brands.length} brand{brands.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => { setEditingId(null); setForm(emptyForm); setShowForm(true); }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={16} /> Add Brand
        </button>
      </header>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        {brands.length === 0 ? (
          <div className="text-center py-20">
            <Store size={36} className="mx-auto mb-3 text-ink-200" strokeWidth={1.2} />
            <p className="text-sm text-ink-500">No brands yet. Add your first brand.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-ink-50 border-b border-ink-100">
              <tr>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Brand</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Origin</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold hidden sm:table-cell">Description</th>
                <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Status</th>
                <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b._id} className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {b.logo ? (
                        <div className="w-10 h-10 relative rounded border border-ink-100 overflow-hidden flex-shrink-0 bg-ink-50">
                          <Image src={b.logo} alt={b.name} fill className="object-contain p-1" sizes="40px" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded border border-ink-100 bg-ink-50 flex items-center justify-center flex-shrink-0">
                          <Store size={16} className="text-ink-300" />
                        </div>
                      )}
                      <p className="text-sm font-medium text-ink-900">{b.name}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-xs bg-rose-50 text-rose-700 px-2.5 py-1 rounded-full">{b.origin}</span>
                  </td>
                  <td className="p-4 text-sm text-ink-500 hidden sm:table-cell max-w-xs truncate">{b.description || "—"}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${b.active ? "bg-green-50 text-green-700" : "bg-ink-100 text-ink-500"}`}>
                      {b.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(b)} className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(b._id)} className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600 transition-colors">
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

      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-lg w-full">
            <header className="border-b border-ink-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink-900">{editingId ? "Edit Brand" : "Add Brand"}</h2>
              <button onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="p-2 hover:bg-ink-50 rounded">
                <X size={18} />
              </button>
            </header>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">Brand Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">Origin</label>
                <select value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value as FormState["origin"] })} className="input-field">
                  <option value="Korea">Korea 🇰🇷</option>
                  <option value="Dubai">Dubai 🇦🇪</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">Logo URL</label>
                <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." className="input-field" />
                {form.logo && (
                  <div className="mt-2 w-16 h-16 relative rounded border border-ink-100 overflow-hidden bg-ink-50">
                    <Image src={form.logo} alt="logo preview" fill className="object-contain p-1" sizes="64px" />
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-rose-600" />
                Active (show in dropdowns)
              </label>
              <div className="flex gap-3 pt-2 border-t border-ink-100">
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60 inline-flex items-center gap-2">
                  <Check size={14} /> {loading ? "Saving…" : editingId ? "Update Brand" : "Create Brand"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingId(null); }} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
