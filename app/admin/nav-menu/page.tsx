"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Save,
  X,
  Link2,
  Layers,
  Star,
  GripVertical,
  Edit2,
  Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavMenuItem, NavColumn, NavLink, Brand } from "@/types";

const emptyFeature = { title: "", description: "", image: "", href: "", cta: "" };

export default function NavMenuAdminPage() {
  const [items, setItems] = useState<NavMenuItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showBrandPicker, setShowBrandPicker] = useState(false);

  // Editor state — mirrors the currently selected item
  const [draft, setDraft] = useState<Partial<NavMenuItem> | null>(null);
  const [newItemForm, setNewItemForm] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newHref, setNewHref] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [navRes, brandRes] = await Promise.all([
        fetch("/api/nav-menu"),
        fetch("/api/brands"),
      ]);
      const navData = await navRes.json();
      const brandData = await brandRes.json();
      setItems(Array.isArray(navData) ? navData : []);
      setBrands(Array.isArray(brandData) ? brandData.filter((b: Brand) => b.active) : []);
    } catch (err) {
      console.error("[nav-menu load]", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const select = (item: NavMenuItem) => {
    setSelectedId(item._id);
    setDraft(JSON.parse(JSON.stringify(item)));
  };

  const save = async () => {
    if (!draft || !selectedId) return;
    setSaving(true);
    await fetch(`/api/nav-menu/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    await load();
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete this nav item?")) return;
    await fetch(`/api/nav-menu/${id}`, { method: "DELETE" });
    if (selectedId === id) { setSelectedId(null); setDraft(null); }
    await load();
  };

  const addItem = async () => {
    if (!newLabel.trim() || !newHref.trim()) return;
    try {
      const res = await fetch("/api/nav-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), href: newHref.trim(), columns: [] }),
      });
      const data = await res.json();
      setNewLabel(""); setNewHref(""); setNewItemForm(false);
      await load();
      if (data._id) select(data);
    } catch (err) {
      console.error("[nav-menu addItem]", err);
    }
  };

  const move = async (id: string, dir: "up" | "down") => {
    const idx = items.findIndex((i) => i._id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    // Swap in a local copy, then assign sequential orders 0,1,2…
    // This avoids issues if any items share the same order value.
    const reordered = [...items];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    // Optimistically update the UI immediately
    setItems(reordered.map((item, i) => ({ ...item, order: i })));

    // Persist new order for both swapped items only
    await Promise.all([
      fetch(`/api/nav-menu/${reordered[idx]._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: idx }),
      }),
      fetch(`/api/nav-menu/${reordered[swapIdx]._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: swapIdx }),
      }),
    ]);
    await load();
  };

  // ── Draft helpers ─────────────────────────────────────────────
  const setField = (key: keyof NavMenuItem, val: unknown) =>
    setDraft((d) => (d ? { ...d, [key]: val } : d));

  const setFeatureField = (key: string, val: string) =>
    setDraft((d) =>
      d ? { ...d, feature: { ...(d.feature ?? emptyFeature), [key]: val } } : d
    );

  const toggleFeature = () =>
    setDraft((d) =>
      d ? { ...d, feature: d.feature ? undefined : { ...emptyFeature } } : d
    );

  // Columns
  const addColumn = () =>
    setDraft((d) =>
      d ? { ...d, columns: [...(d.columns ?? []), { heading: "New Group", links: [] } as any] } : d
    );

  const addBrandColumn = (selectedBrands: Brand[]) => {
    if (!selectedBrands.length) return;
    const newCol = {
      heading: "Shop by Brand",
      links: selectedBrands.map((b) => ({
        label: b.name,
        href: `/shop?brand=${encodeURIComponent(b.name)}`,
      })),
    };
    setDraft((d) => d ? { ...d, columns: [...(d.columns ?? []), newCol as any] } : d);
    setShowBrandPicker(false);
  };

  const removeColumn = (ci: number) =>
    setDraft((d) => {
      if (!d) return d;
      const cols = [...(d.columns ?? [])];
      cols.splice(ci, 1);
      return { ...d, columns: cols };
    });

  const setColumnHeading = (ci: number, val: string) =>
    setDraft((d) => {
      if (!d) return d;
      const cols = [...(d.columns ?? [])];
      cols[ci] = { ...cols[ci], heading: val };
      return { ...d, columns: cols };
    });

  // Links within a column
  const addLink = (ci: number) =>
    setDraft((d) => {
      if (!d) return d;
      const cols = [...(d.columns ?? [])];
      cols[ci] = { ...cols[ci], links: [...cols[ci].links, { label: "", href: "" }] };
      return { ...d, columns: cols };
    });

  const removeLink = (ci: number, li: number) =>
    setDraft((d) => {
      if (!d) return d;
      const cols = [...(d.columns ?? [])];
      const links = [...cols[ci].links];
      links.splice(li, 1);
      cols[ci] = { ...cols[ci], links };
      return { ...d, columns: cols };
    });

  const setLink = (ci: number, li: number, key: "label" | "href", val: string) =>
    setDraft((d) => {
      if (!d) return d;
      const cols = [...(d.columns ?? [])];
      const links = [...cols[ci].links];
      links[li] = { ...links[li], [key]: val };
      cols[ci] = { ...cols[ci], links };
      return { ...d, columns: cols };
    });

  const [expandedCols, setExpandedCols] = useState<Record<number, boolean>>({});
  const toggleCol = (ci: number) =>
    setExpandedCols((prev) => ({ ...prev, [ci]: !prev[ci] }));

  return (
    <div className="p-6 lg:p-10 min-h-screen">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-1">
          Site Navigation
        </p>
        <h1 className="font-display text-4xl text-ink-900">Navigation Menu</h1>
        <p className="text-sm text-ink-500 mt-1">
          Manage the header mega menu — items, groups, and links
        </p>
      </header>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6 items-start">
        {/* ── Left: Item List ── */}
        <div className="bg-white border border-ink-100 rounded-sm overflow-hidden">
          <div className="border-b border-ink-100 px-4 py-3 flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">Nav Items</p>
            <button
              onClick={() => setNewItemForm((v) => !v)}
              className="p-1.5 hover:bg-rose-50 text-ink-600 hover:text-rose-600 rounded transition-colors"
              title="Add item"
            >
              <Plus size={14} />
            </button>
          </div>

          {newItemForm && (
            <div className="border-b border-ink-100 p-3 bg-rose-25/40 space-y-2">
              <input
                placeholder="Label (e.g. Skincare)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full border border-ink-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
              />
              <input
                placeholder="Href (e.g. /shop?subtype=Skincare)"
                value={newHref}
                onChange={(e) => setNewHref(e.target.value)}
                className="w-full border border-ink-200 rounded-sm px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
              />
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  className="flex-1 bg-rose-600 text-white text-xs py-1.5 rounded-sm hover:bg-rose-700 transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => { setNewItemForm(false); setNewLabel(""); setNewHref(""); }}
                  className="flex-1 bg-ink-100 text-ink-700 text-xs py-1.5 rounded-sm hover:bg-ink-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-8 text-center text-sm text-ink-400">Loading…</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-400">No nav items yet.</div>
          ) : (
            <ul className="divide-y divide-ink-50">
              {items.map((item, idx) => (
                <li
                  key={item._id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-3 cursor-pointer hover:bg-rose-25/30 transition-colors group",
                    selectedId === item._id && "bg-rose-50 border-l-2 border-rose-600"
                  )}
                  onClick={() => select(item)}
                >
                  <GripVertical size={14} className="text-ink-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", item.highlight ? "text-rose-600" : "text-ink-900")}>
                      {item.label}
                      {item.highlight && <Star size={10} className="inline ml-1 fill-rose-400 text-rose-400" />}
                    </p>
                    <p className="text-[10px] text-ink-400 truncate">{item.href}</p>
                  </div>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); move(item._id, "up"); }}
                      disabled={idx === 0}
                      className="p-0.5 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); move(item._id, "down"); }}
                      disabled={idx === items.length - 1}
                      className="p-0.5 hover:text-rose-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteItem(item._id); }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 text-ink-400 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Right: Editor ── */}
        {draft ? (
          <div className="space-y-5">
            {/* Basic Info */}
            <section className="bg-white border border-ink-100 rounded-sm overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-3 flex items-center gap-2">
                <Edit2 size={14} className="text-rose-600" />
                <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">Basic Info</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">Label</label>
                    <input
                      value={draft.label ?? ""}
                      onChange={(e) => setField("label", e.target.value)}
                      className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-700 mb-1.5">Link (href)</label>
                    <input
                      value={draft.href ?? ""}
                      onChange={(e) => setField("href", e.target.value)}
                      className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    checked={draft.highlight ?? false}
                    onChange={(e) => setField("highlight", e.target.checked)}
                    className="accent-rose-600"
                  />
                  <span className="text-sm text-ink-700">Highlight this item (rose colour)</span>
                </label>
              </div>
            </section>

            {/* Columns */}
            <section className="bg-white border border-ink-100 rounded-sm overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-rose-600" />
                  <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                    Dropdown Groups
                    {(draft.columns?.length ?? 0) > 0 && (
                      <span className="ml-2 text-ink-400 normal-case tracking-normal font-normal">
                        ({draft.columns!.length})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {brands.length > 0 && (
                    <button
                      onClick={() => setShowBrandPicker(true)}
                      className="inline-flex items-center gap-1.5 text-xs border border-ink-200 text-ink-700 px-3 py-1.5 hover:border-rose-300 hover:text-rose-600 transition-colors"
                    >
                      <Store size={11} /> From Brands
                    </button>
                  )}
                  <button
                    onClick={addColumn}
                    className="inline-flex items-center gap-1.5 text-xs bg-ink-900 text-white px-3 py-1.5 hover:bg-rose-600 transition-colors"
                  >
                    <Plus size={11} /> Add Group
                  </button>
                </div>
              </div>

              {!draft.columns?.length ? (
                <p className="p-5 text-sm text-ink-400">
                  No groups yet. Add groups to create a mega-menu dropdown for this nav item.
                </p>
              ) : (
                <div className="divide-y divide-ink-50">
                  {draft.columns!.map((col, ci) => (
                    <div key={ci} className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => toggleCol(ci)}
                          className="p-1 text-ink-400 hover:text-ink-700 transition-colors"
                        >
                          <ChevronRight
                            size={14}
                            className={cn("transition-transform", expandedCols[ci] && "rotate-90")}
                          />
                        </button>
                        <input
                          value={col.heading}
                          onChange={(e) => setColumnHeading(ci, e.target.value)}
                          className="flex-1 border border-ink-200 rounded-sm px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-rose-300"
                          placeholder="Group heading (e.g. By Concern)"
                        />
                        <span className="text-xs text-ink-400">{col.links.length} links</span>
                        <button
                          onClick={() => removeColumn(ci)}
                          className="p-1 text-ink-400 hover:text-rose-600 transition-colors"
                          title="Remove group"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {expandedCols[ci] && (
                        <div className="ml-8 space-y-2">
                          {col.links.map((link, li) => (
                            <div key={li} className="flex items-center gap-2">
                              <input
                                value={link.label}
                                onChange={(e) => setLink(ci, li, "label", e.target.value)}
                                placeholder="Label"
                                className="flex-1 border border-ink-200 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                              />
                              <input
                                value={link.href}
                                onChange={(e) => setLink(ci, li, "href", e.target.value)}
                                placeholder="/shop?tag=..."
                                className="flex-1 border border-ink-200 rounded-sm px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                              />
                              <button
                                onClick={() => removeLink(ci, li)}
                                className="p-1 text-ink-400 hover:text-rose-600 transition-colors flex-shrink-0"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => addLink(ci)}
                            className="mt-1 inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-medium"
                          >
                            <Plus size={11} /> Add link
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Feature Card */}
            <section className="bg-white border border-ink-100 rounded-sm overflow-hidden">
              <div className="border-b border-ink-100 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link2 size={14} className="text-rose-600" />
                  <p className="text-xs uppercase tracking-widest text-ink-500 font-semibold">
                    Featured Card
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!draft.feature}
                    onChange={toggleFeature}
                    className="accent-rose-600"
                  />
                  <span className="text-xs text-ink-600">Enable</span>
                </label>
              </div>

              {draft.feature ? (
                <div className="p-5 grid sm:grid-cols-2 gap-4">
                  {(["title", "description", "image", "href", "cta"] as const).map((key) => (
                    <div key={key} className={key === "description" || key === "image" ? "sm:col-span-2" : ""}>
                      <label className="block text-xs font-medium text-ink-700 mb-1.5 capitalize">
                        {key === "cta" ? "CTA Text" : key === "href" ? "Link (href)" : key}
                      </label>
                      <input
                        value={(draft.feature as any)?.[key] ?? ""}
                        onChange={(e) => setFeatureField(key, e.target.value)}
                        placeholder={
                          key === "image"
                            ? "https://images.unsplash.com/..."
                            : key === "href"
                            ? "/shop?tag=..."
                            : key === "cta"
                            ? "Shop the routine →"
                            : ""
                        }
                        className="w-full border border-ink-200 rounded-sm px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-rose-300"
                      />
                    </div>
                  ))}
                  {draft.feature.image && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-ink-700 mb-1.5">Preview</p>
                      <img
                        src={draft.feature.image}
                        alt="preview"
                        className="h-32 w-24 object-cover rounded-sm border border-ink-100"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <p className="p-5 text-sm text-ink-400">
                  Enable to show a featured image card in the right column of this dropdown.
                </p>
              )}
            </section>

            {/* Save Bar */}
            <div className="flex items-center gap-3 justify-end py-2">
              <button
                onClick={() => { setSelectedId(null); setDraft(null); setExpandedCols({}); }}
                className="px-5 py-2 text-sm text-ink-700 hover:text-ink-900 border border-ink-200 rounded-sm hover:bg-ink-50 transition-colors"
              >
                Discard
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2 bg-rose-600 text-white text-sm hover:bg-rose-700 disabled:opacity-60 transition-colors rounded-sm"
              >
                <Save size={14} />
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-ink-100 rounded-sm p-16 text-center">
            <Layers size={32} className="mx-auto mb-3 text-ink-300" />
            <p className="font-display text-xl text-ink-900 mb-1">Select a nav item to edit</p>
            <p className="text-sm text-ink-500">
              Choose an item from the list on the left, or add a new one.
            </p>
          </div>
        )}
      </div>

      {/* Brand Picker Modal */}
      {showBrandPicker && (
        <BrandPickerModal
          brands={brands}
          onConfirm={addBrandColumn}
          onClose={() => setShowBrandPicker(false)}
        />
      )}
    </div>
  );
}


function BrandPickerModal({
  brands,
  onConfirm,
  onClose,
}: {
  brands: Brand[];
  onConfirm: (selected: Brand[]) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(brands.map((b) => b._id));

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-sm max-w-sm w-full">
        <header className="border-b border-ink-100 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-rose-600 font-semibold mb-0.5">Nav Menu</p>
            <h3 className="font-display text-xl text-ink-900">Add Brand Group</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-ink-50 rounded"><X size={16} /></button>
        </header>
        <div className="p-5">
          <p className="text-xs text-ink-500 mb-3">Select the brands to include in this group. A new dropdown column will be created with links to each brand's shop page.</p>
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {brands.map((b) => (
              <label key={b._id} className="flex items-center gap-3 p-2 hover:bg-rose-25/30 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.includes(b._id)}
                  onChange={() => toggle(b._id)}
                  className="accent-rose-600"
                />
                <span className="text-sm text-ink-900 flex-1">{b.name}</span>
                <span className="text-[10px] text-ink-400 bg-ink-50 px-2 py-0.5 rounded-full">{b.origin}</span>
              </label>
            ))}
          </div>
        </div>
        <footer className="border-t border-ink-100 px-5 py-3 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-ink-200 text-ink-700 hover:bg-ink-50 rounded-sm transition-colors">Cancel</button>
          <button
            onClick={() => onConfirm(brands.filter((b) => selected.includes(b._id)))}
            disabled={!selected.length}
            className="px-4 py-2 text-sm bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 rounded-sm transition-colors inline-flex items-center gap-1.5"
          >
            <Store size={13} /> Add {selected.length} Brand{selected.length !== 1 ? "s" : ""}
          </button>
        </footer>
      </div>
    </div>
  );
}
