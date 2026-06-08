"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, X, Package, Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice, cn } from "@/lib/utils";
import type { Product, Category, Concern, ProductVariant, Brand } from "@/types";

interface VariantRow {
  name: string;
  price: string;
}

interface DescSection {
  title: string;
  content: string;
}

const PRESET_TITLES = [
  "What It Is",
  "Product Benefits",
  "Skin Type",
  "Key Ingredients",
  "How To Use",
  "Size",
  "Net Weight",
  "Country of Origin",
  "Custom",
];

function sectionsToDescription(sections: DescSection[]): string {
  return sections
    .filter((s) => s.title.trim())
    .map((s) => `${s.title.trim()}:\n${s.content.trim()}`)
    .join("\n\n");
}

function descriptionToSections(desc: string): DescSection[] {
  if (!desc) return [];
  const lines = desc.split(/\r?\n/).map((l) => l.trim());
  const sections: DescSection[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];
  for (const line of lines) {
    if (/^.{1,50}:$/.test(line)) {
      if (currentTitle) sections.push({ title: currentTitle.replace(/:$/, ""), content: currentLines.join("\n") });
      currentTitle = line;
      currentLines = [];
    } else if (line) {
      currentLines.push(line);
    }
  }
  if (currentTitle) sections.push({ title: currentTitle.replace(/:$/, ""), content: currentLines.join("\n") });
  return sections;
}

interface FormState {
  name: string;
  description: string;
  shortDescription: string;
  brand: string;
  price: string;
  comparePrice: string;
  origin: "Korea" | "Dubai" | "Global" | "Other";
  type: string;
  subtype: string;
  images: string;
  stock: string;
  tags: string;
  concerns: string[];
  variants: VariantRow[];
  active: boolean;
  isPreOrder: boolean;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  shortDescription: "",
  brand: "",
  price: "",
  comparePrice: "",
  origin: "Korea",
  type: "",
  subtype: "",
  images: "",
  stock: "",
  tags: "",
  concerns: [],
  variants: [],
  active: true,
  isPreOrder: false,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "preorder">("all");
  const [loading, setLoading] = useState(false);
  const [descSections, setDescSections] = useState<DescSection[]>([]);
  const [showRawDesc, setShowRawDesc] = useState(false);
  // Inline new brand
  const [addingBrand, setAddingBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandOrigin, setNewBrandOrigin] = useState<"Korea" | "Dubai" | "Global" | "Other">("Korea");
  const [savingBrand, setSavingBrand] = useState(false);

  const loadData = async () => {
    const [pRes, cRes, concRes, bRes] = await Promise.all([
      fetch("/api/products?limit=100&admin=true").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/concerns").then((r) => r.json()),
      fetch("/api/brands").then((r) => r.json()),
    ]);
    setProducts(pRes.products ?? []);
    setCategories(Array.isArray(cRes) ? cRes : []);
    setConcerns(Array.isArray(concRes) ? concRes : []);
    setBrands(Array.isArray(bRes) ? bRes : []);
  };

  const saveNewBrand = async () => {
    if (!newBrandName.trim()) return;
    setSavingBrand(true);
    try {
      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName.trim(), origin: newBrandOrigin }),
      });
      const created = await res.json();
      setBrands((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setForm((f) => ({ ...f, brand: created.name }));
      setNewBrandName("");
      setNewBrandOrigin("Korea");
      setAddingBrand(false);
    } finally {
      setSavingBrand(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Sync sections → form.description
  useEffect(() => {
    setForm((f) => ({ ...f, description: sectionsToDescription(descSections) }));
  }, [descSections]);

  const addDescSection = () =>
    setDescSections((prev) => [...prev, { title: "", content: "" }]);

  const removeDescSection = (i: number) =>
    setDescSections((prev) => prev.filter((_, idx) => idx !== i));

  const moveDescSection = (i: number, dir: "up" | "down") => {
    setDescSections((prev) => {
      const next = [...prev];
      const swap = dir === "up" ? i - 1 : i + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next;
    });
  };

  const updateDescSection = (i: number, field: keyof DescSection, value: string) =>
    setDescSections((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      price: parseFloat(form.price),
      comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
      stock: parseInt(form.stock || "0"),
      images: form.images.split(",").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      concerns: form.concerns,
      variants: form.variants
        .filter((v) => v.name.trim() && v.price)
        .map((v) => ({ name: v.name.trim(), price: parseFloat(v.price) })),
    };

    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      await loadData();
      setShowForm(false);
      setForm(emptyForm);
      setDescSections([]);
      setEditingId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: Product) => {
    setForm({
      name: p.name,
      description: p.description,
      shortDescription: p.shortDescription,
      brand: p.brand ?? "",
      price: p.price.toString(),
      comparePrice: p.comparePrice?.toString() ?? "",
      origin: p.origin,
      type: p.type,
      subtype: p.subtype,
      images: p.images.join(", "),
      stock: p.stock.toString(),
      tags: p.tags.join(", "),
      concerns: p.concerns ?? [],
      variants: (p.variants ?? []).map((v: ProductVariant) => ({ name: v.name, price: v.price.toString() })),
      active: p.active ?? true,
      isPreOrder: p.isPreOrder ?? false,
      isFeatured: p.isFeatured,
      isBestSeller: p.isBestSeller,
      isNewArrival: p.isNewArrival,
    });
    setDescSections(descriptionToSections(p.description));
    setEditingId(p._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await loadData();
  };

  const filtered = products.filter((p) => {
    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter === "preorder" && !p.isPreOrder) return false;
    if (typeFilter === "regular" && p.isPreOrder) return false;
    return true;
  });

  const selectedCategory = categories.find((c) => c.type === form.type);

  return (
    <div className="p-6 lg:p-10">
      <header className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
            Inventory
          </p>
          <h1 className="font-display text-4xl text-ink-900">Product Management</h1>
          <p className="text-sm text-ink-500 mt-1">
            {products.length} products in catalog
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
            setShowForm(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={16} /> Add Product
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="bg-white border border-ink-100 rounded-sm p-4 flex items-center gap-3 flex-1">
          <Search size={16} className="text-ink-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent"
          />
        </div>
        <div className="flex items-center bg-white border border-ink-100 rounded-sm p-1 gap-1">
          {([
            { val: "all",      label: "All" },
            { val: "regular",  label: "Regular" },
            { val: "preorder", label: "Pre-Order" },
          ] as const).map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setTypeFilter(val)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-sm transition-colors",
                typeFilter === val
                  ? "bg-rose-600 text-white"
                  : "text-ink-500 hover:text-ink-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-ink-50 border-b border-ink-100">
            <tr>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Product</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Type</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Category</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Origin</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Price</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Stock</th>
              <th className="text-left p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Status</th>
              <th className="text-right p-4 text-xs uppercase tracking-widest text-ink-500 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-16 text-sm text-ink-400">
                  <Package size={32} className="mx-auto mb-3 opacity-40" />
                  No products yet. Add your first product to get started.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p._id} className="border-b border-ink-50 hover:bg-rose-25/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-14 bg-ink-50 rounded-sm overflow-hidden flex-shrink-0 relative">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt="" fill className="object-cover" sizes="48px" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink-900 line-clamp-1 max-w-xs">{p.name}</p>
                        <p className="text-xs text-ink-400">SKU-{p._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {p.isPreOrder ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                        Pre-Order
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Regular
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-ink-700">{p.type} / {p.subtype}</td>
                  <td className="p-4">
                    <span className="badge-origin bg-rose-50 text-rose-700">{p.origin}</span>
                  </td>
                  <td className="p-4 text-sm font-medium text-ink-900">{formatPrice(p.price)}</td>
                  <td className="p-4">
                    <span className={`text-sm font-medium ${p.stock < 5 ? "text-rose-600" : "text-ink-700"}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await fetch(`/api/products/${p._id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ active: !(p.active ?? true) }),
                        });
                        await loadData();
                      }}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${(p.active ?? true) ? "bg-green-500" : "bg-ink-300"}`}
                      title={(p.active ?? true) ? "Active — click to deactivate" : "Inactive — click to activate"}
                    >
                      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${(p.active ?? true) ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="p-2 hover:bg-ink-100 rounded text-ink-600 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-sm max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <header className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink-900">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setForm(emptyForm);
                  setEditingId(null);
                }}
                className="p-2 hover:bg-ink-50 rounded"
              >
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Product Type */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-2 block">Product Type *</label>
                <div className="flex gap-4">
                  {[
                    { val: false, label: "Regular Order", desc: "In-stock product with quantity tracking" },
                    { val: true,  label: "Pre-Order",     desc: "No stock — customer requests import" },
                  ].map(({ val, label, desc }) => (
                    <label
                      key={label}
                      className={cn(
                        "flex-1 flex items-start gap-3 border rounded-sm p-3 cursor-pointer transition-colors",
                        form.isPreOrder === val ? "border-rose-600 bg-rose-25/40" : "border-ink-200 hover:border-ink-300"
                      )}
                    >
                      <input
                        type="radio"
                        checked={form.isPreOrder === val}
                        onChange={() => setForm({ ...form, isPreOrder: val })}
                        className="accent-rose-600 mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="text-sm font-medium text-ink-900">{label}</p>
                        <p className="text-[11px] text-ink-400 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                  Product Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="input-field"
                />
              </div>

              {/* Brand */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700">Brand</label>
                  <button type="button" onClick={() => setAddingBrand((v) => !v)}
                    className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1">
                    <Plus size={11} /> Add new brand
                  </button>
                </div>
                <select
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  className="input-field"
                >
                  <option value="">— No brand —</option>
                  {brands.map((b) => (
                    <option key={b._id} value={b.name}>{b.name} ({b.origin})</option>
                  ))}
                </select>
                {addingBrand && (
                  <div className="mt-2 p-3 bg-rose-25/40 border border-rose-100 rounded-sm space-y-2">
                    <p className="text-[10px] uppercase tracking-widest text-rose-600 font-semibold">New Brand</p>
                    <div className="flex gap-2">
                      <input
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        placeholder="Brand name"
                        className="input-field flex-1"
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), saveNewBrand())}
                      />
                      <select
                        value={newBrandOrigin}
                        onChange={(e) => setNewBrandOrigin(e.target.value as "Korea" | "Dubai" | "Global" | "Other")}
                        className="input-field w-28"
                      >
                        <option value="Korea">Korea</option>
                        <option value="Dubai">Dubai</option>
                        <option value="Global">Global</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={saveNewBrand} disabled={savingBrand || !newBrandName.trim()}
                        className="inline-flex items-center gap-1 bg-rose-600 text-white text-xs px-3 py-1.5 hover:bg-rose-700 disabled:opacity-60 transition-colors">
                        <Check size={11} /> {savingBrand ? "Saving…" : "Save Brand"}
                      </button>
                      <button type="button" onClick={() => { setAddingBrand(false); setNewBrandName(""); }}
                        className="inline-flex items-center gap-1 border border-ink-200 text-ink-600 text-xs px-3 py-1.5 hover:bg-ink-50 transition-colors">
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                    Price (LKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                    Compare Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.comparePrice}
                    onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700">
                    Variants (optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, variants: [...form.variants, { name: "", price: "" }] })}
                    className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 border border-rose-200 px-2.5 py-1 hover:bg-rose-50 transition-colors"
                  >
                    <Plus size={11} /> Add Variant
                  </button>
                </div>
                <p className="text-[11px] text-ink-400 mb-3">
                  e.g. 100ml / Rs. 4500, 200ml / Rs. 7500. When set, customers choose a variant — each with its own price.
                </p>
                {form.variants.length === 0 ? (
                  <p className="text-xs text-ink-400 italic">No variants — single price product.</p>
                ) : (
                  <div className="space-y-2">
                    {form.variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={v.name}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i] = { ...next[i], name: e.target.value };
                            setForm({ ...form, variants: next });
                          }}
                          placeholder="e.g. 100ml"
                          className="input-field flex-1"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={v.price}
                          onChange={(e) => {
                            const next = [...form.variants];
                            next[i] = { ...next[i], price: e.target.value };
                            setForm({ ...form, variants: next });
                          }}
                          placeholder="Price (LKR)"
                          className="input-field w-36"
                        />
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, variants: form.variants.filter((_, j) => j !== i) })}
                          className="p-2 hover:bg-rose-50 text-ink-400 hover:text-rose-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                    Origin *
                  </label>
                  <select
                    value={form.origin}
                    onChange={(e) =>
                      setForm({ ...form, origin: e.target.value as FormState["origin"] })
                    }
                    className="input-field"
                  >
                    <option value="Korea">Korea</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                    Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value, subtype: "" })}
                    required
                    className="input-field"
                  >
                    <option value="">Select…</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c.type}>{c.type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                    Subtype *
                  </label>
                  <select
                    value={form.subtype}
                    onChange={(e) => setForm({ ...form, subtype: e.target.value })}
                    required
                    className="input-field"
                    disabled={!selectedCategory}
                  >
                    <option value="">Select…</option>
                    {selectedCategory?.subtypes.map((s) => (
                      <option key={s.slug} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {!form.isPreOrder && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    required
                    className="input-field"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                  Image URLs (comma separated)
                </label>
                <input
                  value={form.images}
                  onChange={(e) => setForm({ ...form, images: e.target.value })}
                  placeholder="https://..., https://..."
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                  Short Description
                </label>
                <input
                  value={form.shortDescription}
                  onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                  maxLength={160}
                  className="input-field"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-ink-700">
                    Full Description *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRawDesc((v) => !v)}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    {showRawDesc ? "Hide raw text" : "View raw text"}
                  </button>
                </div>

                {/* Section builder */}
                <div className="space-y-2 mb-2">
                  {descSections.map((s, i) => (
                    <div key={i} className="border border-ink-100 rounded-sm p-3 space-y-2 bg-ink-50">
                      <div className="flex items-center gap-2">
                        <select
                          value={PRESET_TITLES.includes(s.title) ? s.title : "Custom"}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateDescSection(i, "title", val === "Custom" ? "" : val);
                          }}
                          className="text-xs border border-ink-200 rounded-sm px-2 py-1.5 bg-white text-ink-700 focus:outline-none focus:border-rose-300 flex-1"
                        >
                          <option value="">— Select title —</option>
                          {PRESET_TITLES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <div className="flex items-center gap-0.5">
                          <button type="button" onClick={() => moveDescSection(i, "up")} disabled={i === 0} className="p-1 hover:bg-ink-200 rounded disabled:opacity-30"><ChevronUp size={13} /></button>
                          <button type="button" onClick={() => moveDescSection(i, "down")} disabled={i === descSections.length - 1} className="p-1 hover:bg-ink-200 rounded disabled:opacity-30"><ChevronDown size={13} /></button>
                          <button type="button" onClick={() => removeDescSection(i)} className="p-1 hover:bg-rose-50 text-ink-400 hover:text-rose-600 rounded"><X size={13} /></button>
                        </div>
                      </div>
                      {/* Custom title input */}
                      {!PRESET_TITLES.slice(0, -1).includes(s.title) && (
                        <input
                          value={s.title}
                          onChange={(e) => updateDescSection(i, "title", e.target.value)}
                          placeholder="Custom title (e.g. Allergen Info)"
                          className="w-full text-xs border border-ink-200 rounded-sm px-2 py-1.5 bg-white text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300"
                        />
                      )}
                      <textarea
                        value={s.content}
                        onChange={(e) => updateDescSection(i, "content", e.target.value)}
                        placeholder="Enter content for this section…"
                        rows={2}
                        className="w-full text-xs border border-ink-200 rounded-sm px-2 py-1.5 bg-white text-ink-700 placeholder:text-ink-300 focus:outline-none focus:border-rose-300 resize-none"
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addDescSection}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 border border-rose-200 px-3 py-1.5 hover:bg-rose-50 transition-colors rounded-sm mb-2"
                >
                  <Plus size={12} /> Add Section
                </button>

                {/* Raw preview */}
                {showRawDesc && (
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      setDescSections(descriptionToSections(e.target.value));
                    }}
                    rows={6}
                    className="input-field resize-none font-mono text-xs mt-1"
                    placeholder="Raw description text (auto-generated from sections above)"
                  />
                )}

                {descSections.length === 0 && !showRawDesc && (
                  <p className="text-[11px] text-ink-400">
                    Click <strong>Add Section</strong> to build structured product info, or use <strong>View raw text</strong> to type manually.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                  Tags (comma separated)
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="serum, toner, vitamin-c, mask"
                  className="input-field"
                />
                <p className="text-[11px] text-ink-400 mt-1">Used for tag-based nav links (e.g. /shop?tag=serum)</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-ink-700 mb-1.5 block">
                  Skin Concerns
                </label>
                {concerns.length === 0 ? (
                  <p className="text-sm text-ink-400">
                    No concerns found.{" "}
                    <a href="/admin/concerns" target="_blank" className="text-rose-600 underline">
                      Add concerns →
                    </a>
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {concerns.map((c) => (
                      <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={form.concerns.includes(c.name)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...form.concerns, c.name]
                              : form.concerns.filter((n) => n !== c.name);
                            setForm({ ...form, concerns: next });
                          }}
                          className="accent-rose-600"
                        />
                        <span className="text-ink-700 group-hover:text-rose-600 transition-colors">{c.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-ink-400 mt-1">Manage concerns in <a href="/admin/concerns" target="_blank" className="text-rose-600 underline">Admin → Concerns</a></p>
              </div>

              {/* Active toggle — prominent at top of flags */}
              <div className="flex items-center justify-between bg-ink-50 border border-ink-200 rounded-sm px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">Product Status</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {form.active ? "Visible in shop" : "Hidden from shop"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, active: !form.active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.active ? "bg-green-500" : "bg-ink-300"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { key: "isFeatured",  label: "Featured" },
                  { key: "isBestSeller", label: "Best Seller" },
                  { key: "isNewArrival", label: "New Arrival" },
                ].map((f) => (
                  <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[f.key as keyof FormState] as boolean}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: e.target.checked } as FormState)
                      }
                      className="accent-rose-600"
                    />
                    {f.label}
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-4 border-t border-ink-100">
                <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
                  {loading ? "Saving…" : editingId ? "Update Product" : "Create Product"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setForm(emptyForm);
                    setEditingId(null);
                  }}
                  className="btn-ghost"
                >
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
