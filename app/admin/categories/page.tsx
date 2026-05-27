"use client";

import { useEffect, useState } from "react";
import { Plus, Tag, Trash2, X, Check } from "lucide-react";
import type { Category } from "@/types";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newType, setNewType] = useState("");
  const [newSubtypes, setNewSubtypes] = useState("");
  const [addingSubtype, setAddingSubtype] = useState<string | null>(null);
  const [subtypeInput, setSubtypeInput] = useState("");

  const load = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newType.trim()) return;

    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newType.trim(),
        subtypes: newSubtypes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }),
    });

    setNewType("");
    setNewSubtypes("");
    setShowForm(false);
    await load();
  };

  const handleAddSubtype = async (categoryId: string) => {
    if (!subtypeInput.trim()) return;
    await fetch(`/api/categories/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtypeName: subtypeInput.trim() }),
    });
    setSubtypeInput("");
    setAddingSubtype(null);
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category and all its subtypes?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    await load();
  };

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Catalog Structure
          </p>
          <h1 className="font-display text-4xl text-ink-900">Category Management</h1>
          <p className="text-sm text-ink-500 mt-1">
            Organize your catalog with types & subtypes
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={16} /> {showForm ? "Cancel" : "Add Category"}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={handleAddCategory}
          className="bg-white border border-ink-100 rounded-sm p-6 mb-6 animate-fade-up"
        >
          <h2 className="font-display text-xl text-ink-900 mb-4">New Category</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                Type Name *
              </label>
              <input
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                required
                placeholder="e.g. Food"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                Subtypes (comma separated)
              </label>
              <input
                value={newSubtypes}
                onChange={(e) => setNewSubtypes(e.target.value)}
                placeholder="Snacks, Ramen, Beverages"
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4">
            Create Category
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {categories.length === 0 ? (
          <div className="md:col-span-2 bg-white border border-ink-100 rounded-sm p-16 text-center">
            <Tag size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-2xl text-ink-900 mb-2">No categories yet</p>
            <p className="text-sm text-ink-500 mb-6">
              Create your first category to start organizing products.
            </p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Add First Category
            </button>
          </div>
        ) : (
          categories.map((cat) => (
            <article
              key={cat._id}
              className="bg-white border border-ink-100 rounded-sm p-6 hover:shadow-card transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-sm bg-rose-50 flex items-center justify-center">
                    <Tag size={16} className="text-rose-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-ink-900">{cat.type}</h3>
                    <p className="text-xs text-ink-400">
                      {cat.subtypes.length} subtype{cat.subtypes.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cat._id)}
                  className="p-2 text-ink-400 hover:text-rose-600 transition-colors"
                  aria-label="Delete category"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {cat.subtypes.map((s) => (
                  <span
                    key={s.slug}
                    className="text-xs px-3 py-1 bg-rose-50 text-rose-700 rounded-full font-medium"
                  >
                    {s.name}
                  </span>
                ))}
              </div>

              {addingSubtype === cat._id ? (
                <div className="flex gap-2 mt-4">
                  <input
                    value={subtypeInput}
                    onChange={(e) => setSubtypeInput(e.target.value)}
                    autoFocus
                    placeholder="New subtype name"
                    className="input-field flex-1 text-xs"
                  />
                  <button
                    onClick={() => handleAddSubtype(cat._id)}
                    className="px-3 bg-rose-600 text-white text-xs"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setAddingSubtype(null);
                      setSubtypeInput("");
                    }}
                    className="px-3 border border-ink-200 text-xs"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAddingSubtype(cat._id)}
                  className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add Subtype
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
