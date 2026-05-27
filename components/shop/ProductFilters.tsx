"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface Props {
  types: FilterOption[];
  subtypes: FilterOption[];
  origins: FilterOption[];
  selected: { type?: string; subtype?: string; origin?: string };
  onChange: (key: "type" | "subtype" | "origin", value: string | undefined) => void;
  onReset: () => void;
  totalCount: number;
}

function FilterGroup({
  title,
  options,
  selected,
  onSelect,
}: {
  title: string;
  options: FilterOption[];
  selected?: string;
  onSelect: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-ink-100 pb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <h4 className="text-sm font-semibold text-ink-900 uppercase tracking-widest">{title}</h4>
        <ChevronDown
          size={16}
          className={cn("text-ink-500 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <ul className="space-y-2">
          {options.map((opt) => (
            <li key={opt.value}>
              <button
                onClick={() => onSelect(selected === opt.value ? undefined : opt.value)}
                className={cn(
                  "w-full flex items-center justify-between text-sm py-1 px-2 -mx-2 rounded transition-colors",
                  selected === opt.value
                    ? "text-rose-600 font-medium bg-rose-50"
                    : "text-ink-600 hover:text-ink-900"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-colors",
                      selected === opt.value
                        ? "bg-rose-600 border-rose-600"
                        : "border-ink-300"
                    )}
                  >
                    {selected === opt.value && (
                      <svg
                        viewBox="0 0 12 12"
                        className="w-2.5 h-2.5 text-white"
                        fill="currentColor"
                      >
                        <path d="M10.28 2.28L4 8.56 1.72 6.28a.75.75 0 10-1.06 1.06l2.81 2.81a.75.75 0 001.06 0l6.81-6.81a.75.75 0 10-1.06-1.06z" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </span>
                {opt.count !== undefined && (
                  <span className="text-xs text-ink-400">{opt.count}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductFilters({
  types,
  subtypes,
  origins,
  selected,
  onChange,
  onReset,
  totalCount,
}: Props) {
  const hasFilters = selected.type || selected.subtype || selected.origin;

  return (
    <aside className="bg-white border border-ink-100 rounded-sm p-5 lg:p-6 space-y-5 sticky top-28">
      <div className="flex items-center justify-between pb-4 border-b border-ink-100">
        <h3 className="font-display text-xl text-ink-900">Filters</h3>
        <span className="text-xs text-ink-400">{totalCount} items</span>
      </div>

      {hasFilters && (
        <button
          onClick={onReset}
          className="text-xs text-rose-600 hover:text-rose-700 underline flex items-center gap-1"
        >
          <X size={12} /> Clear all
        </button>
      )}

      <FilterGroup
        title="Type"
        options={types}
        selected={selected.type}
        onSelect={(v) => onChange("type", v)}
      />
      <FilterGroup
        title="Category"
        options={subtypes}
        selected={selected.subtype}
        onSelect={(v) => onChange("subtype", v)}
      />
      <FilterGroup
        title="Origin"
        options={origins}
        selected={selected.origin}
        onSelect={(v) => onChange("origin", v)}
      />
    </aside>
  );
}
