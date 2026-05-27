"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Concern } from "@/types";

export default function ConcernsAdminPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetch("/api/concerns").then((r) => r.json());
      setConcerns(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (c: Concern) => {
    setEditingId(c._id);
    setEditName(c.name);
    setEditDesc(c.description ?? "");
    setError("");
  };

  const cancelEdit = () => { setEditingId(null); setEditName(""); setEditDesc(""); setError(""); };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/concerns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      cancelEdit();
      await load();
    } finally {
      setSaving(false);
    }
  };

  const deleteConcern = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Products using this concern will keep the value but it won't appear in filters.`)) return;
    await fetch(`/api/concerns/${id}`, { method: "DELETE" });
    await load();
  };

  const addConcern = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error"); return; }
      setNewName(""); setNewDesc(""); setAdding(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Skin Concerns
          </p>
          <h1 className="font-display text-4xl text-ink-900">Concern Management</h1>
          <p className="text-sm text-ink-500 mt-1">
            Manage concern tags used to filter products (e.g. /shop?concern=brightening)
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setError(""); }}
          className="inline-flex items-center gap-2 bg-ink-900 text-white px-5 py-2.5 text-sm hover:bg-rose-600 transition-colors"
        >
          <Plus size={15} /> Add Concern
        </button>
      </header>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        {/* Add form */}
        {adding && (
          <div className="border-b border-ink-100 bg-rose-25/30 p-4">
            <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-3">New Concern</p>
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Name *</label>
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addConcern()}
                  placeholder="e.g. Brightening"
                  className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-700 mb-1">Description</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addConcern()}
                  placeholder="Short description for admin reference"
                  className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addConcern}
                disabled={saving || !newName.trim()}
                className="inline-flex items-center gap-1.5 bg-rose-600 text-white text-xs px-4 py-2 hover:bg-rose-700 disabled:opacity-60 transition-colors"
              >
                <Check size={12} /> {saving ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setAdding(false); setNewName(""); setNewDesc(""); setError(""); }}
                className="inline-flex items-center gap-1.5 border border-ink-200 text-ink-700 text-xs px-4 py-2 hover:bg-ink-50 transition-colors"
              >
                <X size={12} /> Cancel
              </button>
            </div>
          </div>
        )}

        <table className="w-full">
          <thead className="bg-ink-50 border-b border-ink-100">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Name</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Slug (URL key)</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Description</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-16 text-sm text-ink-400">Loading…</td>
              </tr>
            ) : concerns.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-16">
                  <Tag size={32} className="mx-auto mb-3 text-ink-300" />
                  <p className="text-sm text-ink-500">No concerns yet. Add your first one above.</p>
                </td>
              </tr>
            ) : (
              concerns.map((c) => (
                <tr key={c._id} className="border-b border-ink-50 hover:bg-rose-25/20 transition-colors">
                  <td className="p-4">
                    {editingId === c._id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(c._id); if (e.key === "Escape") cancelEdit(); }}
                        className="border border-rose-300 rounded-sm px-2.5 py-1.5 text-sm w-40 focus:outline-none focus:ring-1 focus:ring-rose-400"
                      />
                    ) : (
                      <span className="text-sm font-medium text-ink-900">{c.name}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <code className="text-xs bg-ink-50 text-rose-700 px-2 py-1 rounded">
                      ?concern={c.slug}
                    </code>
                  </td>
                  <td className="p-4">
                    {editingId === c._id ? (
                      <input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(c._id); if (e.key === "Escape") cancelEdit(); }}
                        placeholder="Description"
                        className="border border-rose-300 rounded-sm px-2.5 py-1.5 text-sm w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-rose-400"
                      />
                    ) : (
                      <span className="text-sm text-ink-500">{c.description || "—"}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      {editingId === c._id ? (
                        <>
                          <button
                            onClick={() => saveEdit(c._id)}
                            disabled={saving}
                            className="p-2 hover:bg-green-50 rounded text-ink-600 hover:text-green-600 transition-colors"
                            title="Save"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 hover:bg-ink-100 rounded text-ink-600 transition-colors"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(c)}
                            className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deleteConcern(c._id, c.name)}
                            className="p-2 hover:bg-rose-50 rounded text-ink-600 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 bg-ink-50 border border-ink-100 rounded-sm p-4 text-sm text-ink-600">
        <p className="font-medium text-ink-800 mb-1">How concerns connect to products</p>
        <p>When you add a concern here (e.g. <code className="bg-white px-1.5 py-0.5 rounded text-rose-700 text-xs">Brightening</code>), it appears as a checkbox in the product form. Tick it on any product that addresses that concern. The nav menu link <code className="bg-white px-1.5 py-0.5 rounded text-rose-700 text-xs">/shop?concern=brightening</code> will then show all those products.</p>
      </div>
    </div>
  );
}
