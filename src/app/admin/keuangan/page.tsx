import {
  ArrowDownLeft,
  ArrowUpRight,
  FileDown,
  History,
  Pencil,
  Tags,
  Trash2,
  Wallet,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import {
  createFinanceCategory,
  deleteFinanceCategory,
  softDeleteTransaction,
  updateFinanceCategory,
} from "@/lib/actions/keuangan";
import {
  getSummary,
  listCategories,
  listFinanceCategories,
  listScopes,
  listTransactions,
} from "@/lib/queries/keuangan";
import { FinanceForm } from "./form";

// Halaman ini membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

// Kolom DataTable transaksi. Tipe ditampilkan sebagai badge income/expense (Indonesia),
// jumlah & tanggal diformat oleh DataTable (type:'money' & type:'datetime').
const columns: Column[] = [
  { key: "trxDate", label: "Tanggal", type: "datetime", sortable: true },
  { key: "categoryName", label: "Kategori", sortable: true },
  { key: "type", label: "Tipe", type: "badge", sortable: true, filter: true },
  { key: "amount", label: "Jumlah", type: "money", sortable: true, className: "text-right" },
  { key: "description", label: "Deskripsi" },
];

export default async function AdminKeuanganPage() {
  const [summary, transaksi, scopes, categories, financeCategories] = await Promise.all([
    getSummary(),
    listTransactions(),
    listScopes(),
    listCategories(),
    listFinanceCategories(),
  ]);

  // Baris polos untuk DataTable. Tipe di-mapping ke label Indonesia agar badge & filter
  // konsisten dengan tampilan lama (Pemasukan/Pengeluaran).
  const rows = transaksi.map((t) => ({
    id: t.id,
    trxDate: t.trxDate,
    categoryName: t.categoryName ?? "Tanpa kategori",
    type: t.type === "income" ? "Pemasukan" : "Pengeluaran",
    amount: t.amount,
    description: t.description ?? t.scopeName,
  }));

  const cards = [
    {
      label: "Saldo Kas",
      value: rupiah(summary.balance),
      icon: Wallet,
      dark: true,
      iconClass: "text-gold-light",
    },
    {
      label: "Total Pemasukan",
      value: rupiah(summary.totalIncome),
      icon: ArrowDownLeft,
      valueClass: "text-green-700",
      iconClass: "text-green-600",
    },
    {
      label: "Total Pengeluaran",
      value: rupiah(summary.totalExpense),
      icon: ArrowUpRight,
      valueClass: "text-red-600",
      iconClass: "text-red-500",
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Keuangan"
        subtitle="Catat transaksi (global atau per titik), lalu sajikan laporan transparan kepada jamaah."
        action={
          // Ekspor PDF laporan keuangan (dibuka di tab baru).
          <a
            href="/api/laporan/keuangan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gold px-5 text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light"
          >
            <FileDown className="h-4 w-4" /> Unduh Laporan PDF
          </a>
        }
      />

      {/* Kartu ringkasan — dari getSummary() (NYATA) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={cn("p-4", s.dark && "bg-brand-700 text-white")}>
              <Icon className={cn("h-5 w-5", s.iconClass)} />
              <p className={cn("display mt-2 text-2xl", s.valueClass)}>{s.value}</p>
              <p className={cn("text-xs", s.dark ? "text-white/70" : "text-muted")}>{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Dua kolom: form input (kiri) + transaksi (kanan) */}
      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <FinanceForm
            scopes={scopes.map((s) => ({ value: s.id, label: s.name }))}
            categories={categories}
            today={new Date().toISOString().slice(0, 10)}
          />
        </div>

        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 font-bold text-ink">
                <History className="h-4 w-4 text-brand-600" /> Transaksi
              </h2>
              <span className="text-[11px] text-muted">{summary.count} transaksi tercatat</span>
            </div>

            <div className="p-5">
              <DataTable
                columns={columns}
                rows={rows}
                editBase="/admin/keuangan"
                deleteAction={softDeleteTransaction}
                deleteConfirmText="Transaksi akan dipindah ke Recycle Bin (bisa dipulihkan)."
                emptyText="Belum ada transaksi."
              />
            </div>

            <p className="border-t border-line px-5 py-3 text-[11px] text-muted">
              Scope memisahkan kas; saldo dihitung dari seluruh transaksi aktif. Hapus = pindah ke
              recycle bin (soft delete).
            </p>
          </Card>

          {/* Panel kecil: kelola kategori keuangan */}
          <Card className="mt-5 p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <Tags className="h-4 w-4 text-brand-600" /> Kategori
            </h2>

            {financeCategories.length === 0 ? (
              <p className="mb-4 text-sm text-muted">Belum ada kategori.</p>
            ) : (
              <ul className="mb-4 space-y-2">
                {financeCategories.map((k) => (
                  <li
                    key={k.id}
                    className="rounded-sm border border-line bg-brand-50/30 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge tone={k.type === "income" ? "success" : "danger"}>{k.name}</Badge>
                        <span className="text-[11px] text-muted">
                          {k.type === "income" ? "Pemasukan" : "Pengeluaran"}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1">
                        <details className="group inline-flex">
                          <summary
                            title="Ubah kategori"
                            aria-label="Ubah kategori"
                            className="inline-flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-sm text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 [&::-webkit-details-marker]:hidden"
                          >
                            <Pencil className="h-4 w-4" />
                          </summary>
                          {/* Inline form ubah kategori (updateFinanceCategory) */}
                          <form
                            action={updateFinanceCategory}
                            className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end"
                          >
                            <input type="hidden" name="id" value={k.id} />
                            <div className="flex-1">
                              <label
                                htmlFor={`cat-name-${k.id}`}
                                className="mb-1.5 block text-xs font-bold text-muted"
                              >
                                Nama Kategori
                              </label>
                              <Input
                                id={`cat-name-${k.id}`}
                                name="name"
                                defaultValue={k.name}
                                required
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`cat-type-${k.id}`}
                                className="mb-1.5 block text-xs font-bold text-muted"
                              >
                                Tipe
                              </label>
                              <select
                                id={`cat-type-${k.id}`}
                                name="type"
                                defaultValue={k.type}
                                className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 sm:w-40"
                              >
                                <option value="income">Pemasukan</option>
                                <option value="expense">Pengeluaran</option>
                              </select>
                            </div>
                            <Button type="submit" variant="outline" size="sm" className="shrink-0">
                              Simpan
                            </Button>
                          </form>
                        </details>
                        <form action={deleteFinanceCategory}>
                          <input type="hidden" name="id" value={k.id} />
                          <button
                            type="submit"
                            title="Hapus kategori"
                            aria-label="Hapus kategori"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form
              action={createFinanceCategory}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <div className="flex-1">
                <label htmlFor="cat-name" className="mb-1.5 block text-xs font-bold text-muted">
                  Nama Kategori
                </label>
                <Input id="cat-name" name="name" placeholder="Mis. Infaq Jumat" required />
              </div>
              <div>
                <label htmlFor="cat-type" className="mb-1.5 block text-xs font-bold text-muted">
                  Tipe
                </label>
                <select
                  id="cat-type"
                  name="type"
                  defaultValue="income"
                  className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20 sm:w-40"
                >
                  <option value="income">Pemasukan</option>
                  <option value="expense">Pengeluaran</option>
                </select>
              </div>
              <Button type="submit" variant="outline" className="shrink-0">
                Tambah
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
