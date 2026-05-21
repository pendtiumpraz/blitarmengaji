"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { updateTransaction } from "@/lib/actions/keuangan";
import { cn } from "@/lib/cn";

type Tipe = "income" | "expense";

type Option = { value: string; label: string };

const selectClass = cn(
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink",
  "focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20",
);

export function FinanceEditForm({
  id,
  scopes,
  categories,
  initial,
}: {
  id: string;
  scopes: Option[];
  categories: { id: string; name: string; type: Tipe }[];
  initial: {
    scope: string;
    trxDate: string;
    categoryId: string | null;
    type: Tipe;
    amount: string;
    description: string | null;
    proofUrl: string | null;
  };
}) {
  const [tipe, setTipe] = useState<Tipe>(initial.type);

  // Kategori difilter sesuai tipe (income/expense) agar konsisten.
  const filteredKategori = categories.filter((k) => k.type === tipe);

  return (
    <form action={updateTransaction} className="space-y-3.5">
      <input type="hidden" name="id" value={id} />

      <Field
        label="Scope"
        htmlFor="scope"
        hint="Pilihan: Global (Kas Pusat) atau salah satu titik dakwah."
      >
        <select id="scope" name="scope" className={selectClass} defaultValue={initial.scope}>
          {scopes.map((s) => (
            <option key={s.value || "global"} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tanggal" htmlFor="trxDate">
          <Input id="trxDate" name="trxDate" type="date" defaultValue={initial.trxDate} required />
        </Field>
        <Field label="Kategori" htmlFor="categoryId">
          {filteredKategori.length > 0 ? (
            <select
              id="categoryId"
              name="categoryId"
              className={selectClass}
              defaultValue={initial.categoryId ?? ""}
            >
              {filteredKategori.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex h-11 items-center rounded-sm border border-dashed border-line bg-surface px-3 text-xs text-muted">
              Belum ada kategori {tipe === "income" ? "pemasukan" : "pengeluaran"}.
            </div>
          )}
        </Field>
      </div>

      <div className="space-y-1.5">
        <span className="text-xs font-bold text-muted">Tipe</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTipe("income")}
            aria-pressed={tipe === "income"}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-sm border-2 text-sm font-bold transition-colors",
              tipe === "income"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-line text-muted hover:bg-brand-50",
            )}
          >
            <ArrowDownLeft className="h-4 w-4" /> Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setTipe("expense")}
            aria-pressed={tipe === "expense"}
            className={cn(
              "flex h-11 flex-1 items-center justify-center gap-2 rounded-sm border-2 text-sm font-bold transition-colors",
              tipe === "expense"
                ? "border-red-500 bg-red-50 text-red-600"
                : "border-line text-muted hover:bg-brand-50",
            )}
          >
            <ArrowUpRight className="h-4 w-4" /> Pengeluaran
          </button>
        </div>
        <input type="hidden" name="type" value={tipe} />
      </div>

      <Field label="Jumlah (Rp)" htmlFor="amount">
        <div className="flex h-11 items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
          <span className="text-sm font-semibold text-muted">Rp</span>
          <input
            id="amount"
            name="amount"
            inputMode="numeric"
            required
            defaultValue={initial.amount}
            placeholder="2.450.000"
            className="h-full w-full bg-transparent text-sm font-bold text-ink placeholder:font-normal placeholder:text-muted focus:outline-none"
          />
        </div>
      </Field>

      <Field label="Deskripsi" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial.description ?? ""}
          placeholder="Mis. Infaq kotak amal Jumat pekan ke-3…"
          className={cn(
            "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink",
            "placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20",
          )}
        />
      </Field>

      <FileUpload
        name="proofFile"
        accept="image/*,application/pdf,.pdf"
        label="Bukti (opsional)"
        defaultUrl={initial.proofUrl}
      />

      <Button type="submit" variant="primary" className="w-full">
        <Save className="h-4 w-4" /> Simpan Perubahan
      </Button>
    </form>
  );
}
