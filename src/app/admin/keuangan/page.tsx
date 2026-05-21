import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  FileDown,
  History,
  Inbox,
  Paperclip,
  Pencil,
  Tags,
  Trash2,
  Wallet,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { createFinanceCategory, softDeleteTransaction } from "@/lib/actions/keuangan";
import {
  countTransactions,
  getSummary,
  listCategories,
  listFinanceCategories,
  listScopes,
  listTransactionsPaged,
} from "@/lib/queries/keuangan";
import { FinanceForm } from "./form";

// Halaman ini membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const dateFmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" });

export default async function AdminKeuanganPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [summary, total, transaksi, scopes, categories, financeCategories] = await Promise.all([
    getSummary(),
    countTransactions(),
    listTransactionsPaged(page, PAGE_SIZE),
    listScopes(),
    listCategories(),
    listFinanceCategories(),
  ]);

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
                <History className="h-4 w-4 text-brand-600" /> Transaksi Terakhir
              </h2>
              <span className="text-[11px] text-muted">{summary.count} transaksi tercatat</span>
            </div>

            {transaksi.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <Inbox className="h-9 w-9 text-brand-300" />
                <p className="font-bold text-ink">Belum ada transaksi</p>
                <p className="max-w-xs text-sm text-muted">
                  Catat pemasukan atau pengeluaran pertama lewat formulir di samping. Saldo akan
                  otomatis dihitung.
                </p>
              </div>
            ) : (
              <Table className="border-0">
                <THead>
                  <TR className="border-0">
                    <TH>Tgl</TH>
                    <TH>Kategori</TH>
                    <TH>Tipe</TH>
                    <TH className="text-right">Jumlah</TH>
                    <TH className="text-center">Bukti</TH>
                    <TH className="text-center">Aksi</TH>
                  </TR>
                </THead>
                <tbody>
                  {transaksi.map((t) => {
                    const masuk = t.type === "income";
                    return (
                      <TR key={t.id}>
                        <TD className="whitespace-nowrap text-muted">{dateFmt.format(t.trxDate)}</TD>
                        <TD>
                          <span className="font-semibold text-ink">
                            {t.categoryName ?? "Tanpa kategori"}
                          </span>
                          <span className="block text-[11px] text-muted">
                            {t.description ?? t.scopeName}
                          </span>
                        </TD>
                        <TD>
                          <Badge tone={masuk ? "success" : "danger"}>
                            {masuk ? "Pemasukan" : "Pengeluaran"}
                          </Badge>
                        </TD>
                        <TD
                          className={cn(
                            "whitespace-nowrap text-right font-bold",
                            masuk ? "text-green-700" : "text-red-600",
                          )}
                        >
                          {masuk ? "+ " : "− "}
                          {rupiah(t.amount)}
                        </TD>
                        <TD className="text-center">
                          {t.proofUrl ? (
                            <a
                              href={t.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex text-brand-600"
                              title="Lihat bukti"
                            >
                              <Paperclip className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-muted">—</span>
                          )}
                        </TD>
                        <TD className="text-center">
                          <div className="inline-flex items-center gap-1">
                            <Link
                              href={`/admin/keuangan/${t.id}`}
                              title="Ubah transaksi"
                              aria-label="Ubah transaksi"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                            <form action={softDeleteTransaction}>
                              <input type="hidden" name="id" value={t.id} />
                              <button
                                type="submit"
                                title="Hapus transaksi"
                                aria-label="Hapus transaksi"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </form>
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </tbody>
              </Table>
            )}

            {total > PAGE_SIZE ? (
              <div className="px-5">
                <Pagination
                  page={page}
                  pageSize={PAGE_SIZE}
                  total={total}
                  baseHref="/admin/keuangan"
                />
              </div>
            ) : null}

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
              <ul className="mb-4 flex flex-wrap gap-2">
                {financeCategories.map((k) => (
                  <li key={k.id}>
                    <Badge tone={k.type === "income" ? "success" : "danger"}>{k.name}</Badge>
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
