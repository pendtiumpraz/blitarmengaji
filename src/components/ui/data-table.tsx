"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Pencil, Eye, Search, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { ConfirmSubmit } from "./confirm-submit";
import { cn } from "@/lib/cn";

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
  filter?: boolean;
  type?: "text" | "badge" | "date" | "datetime" | "money" | "code" | "bool";
  className?: string;
};

type ServerAction = (fd: FormData) => void | Promise<void>;

export type RowAction = {
  action: ServerAction;
  label: string;
  idField?: string; // default "id"
  fields?: string[]; // hidden input tambahan dari properti row (mis. "type")
  confirm?: boolean;
  confirmTitle?: string;
  confirmText?: string;
  danger?: boolean;
  className?: string;
};

type Props = {
  columns: Column[];
  rows: Record<string, unknown>[];
  idKey?: string;
  searchKeys?: string[];
  editBase?: string;
  editSuffix?: string; // ditambahkan setelah id, mis. "/edit" → ${editBase}/${id}/edit
  viewBase?: string; // ikon "lihat detail" → ${viewBase}/${id}
  deleteAction?: ServerAction;
  deleteConfirmText?: string;
  rowActions?: RowAction[];
  emptyText?: string;
  pageSize?: number;
};

const money = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? "Rp " + n.toLocaleString("id-ID") : "—";
};
const fmtDate = (v: unknown, withTime = false) => {
  if (!v) return "—";
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("id-ID", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
};
function cellText(row: Record<string, unknown>, col: Column): string {
  const v = row[col.key];
  if (v == null) return "";
  if (col.type === "money") return money(v);
  if (col.type === "date") return fmtDate(v);
  if (col.type === "datetime") return fmtDate(v, true);
  if (col.type === "bool") return v ? "Ya" : "Tidak";
  return String(v);
}

export function DataTable({
  columns,
  rows,
  idKey = "id",
  searchKeys,
  editBase,
  editSuffix = "",
  viewBase,
  deleteAction,
  deleteConfirmText,
  rowActions,
  emptyText = "Belum ada data.",
  pageSize = 10,
}: Props) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);

  const hasActions = Boolean(viewBase || editBase || deleteAction || (rowActions && rowActions.length));
  const sKeys = searchKeys ?? columns.filter((c) => c.type !== "money").map((c) => c.key);
  const filterCols = columns.filter((c) => c.filter);

  const filtered = useMemo(() => {
    let r = rows;
    const query = q.trim().toLowerCase();
    if (query) {
      r = r.filter((row) => sKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(query)));
    }
    for (const [k, val] of Object.entries(filters)) {
      if (val) r = r.filter((row) => String(row[k] ?? "") === val);
    }
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      r = [...r].sort((a, b) => {
        const av = a[sortKey], bv = b[sortKey];
        const an = Number(av), bn = Number(bv);
        if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * dir;
        return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
      });
    }
    return r;
  }, [rows, q, filters, sortKey, sortDir, sKeys]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const curPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((curPage - 1) * pageSize, curPage * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  return (
    <div>
      {/* toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex h-9 flex-1 min-w-[200px] items-center gap-2 rounded-sm border border-line bg-surface px-3">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Cari…"
            className="h-full w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          />
        </div>
        {filterCols.map((c) => {
          const opts = Array.from(new Set(rows.map((r) => String(r[c.key] ?? "")).filter(Boolean))).sort();
          return (
            <select
              key={c.key}
              value={filters[c.key] ?? ""}
              onChange={(e) => { setFilters((f) => ({ ...f, [c.key]: e.target.value })); setPage(1); }}
              className="h-9 rounded-sm border border-line bg-surface px-2 text-sm text-ink focus:outline-none"
            >
              <option value="">{c.label}: semua</option>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-[3px] border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-left text-[11px] uppercase tracking-wide text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={cn("px-4 py-3 font-bold", c.className)}>
                  {c.sortable ? (
                    <button type="button" onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink">
                      {c.label}
                      {sortKey === c.key ? (sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : c.label}
                </th>
              ))}
              {hasActions ? <th className="px-4 py-3 text-right font-bold">Aksi</th> : null}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-muted">{emptyText}</td></tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={String(row[idKey] ?? i)} className="border-t border-line">
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                      {c.type === "badge" ? (
                        <span className="inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{cellText(row, c)}</span>
                      ) : c.type === "code" ? (
                        <code className="text-xs">{cellText(row, c)}</code>
                      ) : (
                        <span>{cellText(row, c)}</span>
                      )}
                    </td>
                  ))}
                  {hasActions ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {viewBase ? (
                          <Link href={`${viewBase}/${String(row[idKey])}`} className="grid h-8 w-8 place-items-center rounded-sm border border-line text-muted hover:bg-brand-50 hover:text-brand-700" aria-label="Lihat detail">
                            <Eye className="h-4 w-4" />
                          </Link>
                        ) : null}
                        {editBase ? (
                          <Link href={`${editBase}/${String(row[idKey])}${editSuffix}`} className="grid h-8 w-8 place-items-center rounded-sm border border-line text-brand-700 hover:bg-brand-50" aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        ) : null}
                        {(rowActions ?? []).map((a, idx) => (
                          <form key={idx} action={a.action}>
                            <input type="hidden" name={a.idField ?? "id"} value={String(row[idKey])} />
                            {(a.fields ?? []).map((f) => <input key={f} type="hidden" name={f} value={String(row[f] ?? "")} />)}
                            {a.confirm ? (
                              <ConfirmSubmit title={a.confirmTitle} text={a.confirmText} danger={a.danger} className={a.className ?? "rounded-sm border border-line px-2 py-1.5 text-xs font-semibold hover:bg-brand-50"}>{a.label}</ConfirmSubmit>
                            ) : (
                              <button type="submit" className={a.className ?? "rounded-sm border border-line px-2 py-1.5 text-xs font-semibold hover:bg-brand-50"}>{a.label}</button>
                            )}
                          </form>
                        ))}
                        {deleteAction ? (
                          <form action={deleteAction}>
                            <input type="hidden" name="id" value={String(row[idKey])} />
                            <ConfirmSubmit text={deleteConfirmText} className="grid h-8 w-8 place-items-center rounded-sm border border-line text-red-600 hover:bg-red-50" aria-label="Hapus">
                              <Trash2 className="h-4 w-4" />
                            </ConfirmSubmit>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* pagination client-side (aman) */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Menampilkan {filtered.length === 0 ? 0 : (curPage - 1) * pageSize + 1}–{Math.min(curPage * pageSize, filtered.length)} dari {filtered.length}</span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={curPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="grid h-8 w-8 place-items-center rounded-sm border border-line disabled:opacity-40 hover:bg-brand-50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-2">Hal {curPage}/{totalPages}</span>
          <button type="button" disabled={curPage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="grid h-8 w-8 place-items-center rounded-sm border border-line disabled:opacity-40 hover:bg-brand-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
