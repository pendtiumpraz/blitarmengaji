"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { QaCategory } from "@/lib/queries/tanya";

/**
 * Pemilih kategori (client). Mengirim hidden input `category_id`.
 * Bila daftar kategori kosong, komponen tidak dirender (kategori opsional).
 */
export function CategoryPicker({ categories }: { categories: QaCategory[] }) {
  const [selected, setSelected] = useState<string>("");

  if (categories.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-bold text-muted">Kategori</span>
      <input type="hidden" name="category_id" value={selected} />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelected("")}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
            selected === ""
              ? "bg-brand-600 text-white"
              : "border border-line bg-surface text-ink hover:bg-brand-50",
          )}
        >
          Umum
        </button>
        {categories.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setSelected(k.id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              selected === k.id
                ? "bg-brand-600 text-white"
                : "border border-line bg-surface text-ink hover:bg-brand-50",
            )}
          >
            {k.name}
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted">Pilih satu kategori yang paling sesuai (opsional).</p>
    </div>
  );
}
