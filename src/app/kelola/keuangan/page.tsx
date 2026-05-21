import { redirect } from "next/navigation";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  Save,
  Trash2,
  Store,
  FileText,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import {
  myTitikOptions,
  myTitikTransactions,
  mySummary,
  listFinanceCategories,
} from "@/lib/queries/kelola-keuangan";
import {
  createOwnTransaction,
  softDeleteOwnTransaction,
} from "@/lib/actions/kelola-keuangan";

export const dynamic = "force-dynamic";

const TZ = "Asia/Jakarta";
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});
const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function KelolaKeuanganPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const [titikOptions, rows, summary, categories] = await Promise.all([
    myTitikOptions(userId),
    myTitikTransactions(userId),
    mySummary(userId),
    listFinanceCategories(),
  ]);

  const hasTitik = titikOptions.length > 0;

  return (
    <div>
      <AdminPageHeader
        title="Kelola Keuangan"
        subtitle="Catat kas (pemasukan & pengeluaran) untuk titik dakwah yang Anda kelola. Ringkasan tampil transparan ke jamaah."
      />

      {!hasTitik ? (
        <Card className="px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Store className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada titik dakwah</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Anda perlu mengelola minimal satu titik dakwah sebelum dapat mencatat kas. Ajukan titik
            dakwah ke admin terlebih dahulu.
          </p>
          <div className="mt-5">
            <Button href="/kelola" variant="outline">
              Kembali ke Ringkasan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Kartu ringkasan kas */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-green-100 text-green-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">Pemasukan</p>
              <p className="display mt-0.5 text-xl text-green-700">{rupiah.format(summary.totalIncome)}</p>
            </Card>
            <Card className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">Pengeluaran</p>
              <p className="display mt-0.5 text-xl text-red-600">{rupiah.format(summary.totalExpense)}</p>
            </Card>
            <Card className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-muted">Saldo Kas</p>
              <p className="display mt-0.5 text-xl text-ink">{rupiah.format(summary.balance)}</p>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Daftar transaksi */}
            <div>
              {rows.length === 0 ? (
                <Card className="px-6 py-16 text-center">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <Wallet className="h-7 w-7" />
                  </span>
                  <h2 className="display mt-4 text-lg text-ink">Belum ada transaksi</h2>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                    Catat transaksi kas pertama lewat formulir di samping agar pembukuan titik Anda
                    rapi dan transparan.
                  </p>
                </Card>
              ) : (
                <>
                  <Table className="min-w-[680px]">
                    <THead>
                      <TR>
                        <TH>Tanggal</TH>
                        <TH>Keterangan</TH>
                        <TH>Titik</TH>
                        <TH className="text-right">Jumlah</TH>
                        <TH className="text-right">Aksi</TH>
                      </TR>
                    </THead>
                    <tbody>
                      {rows.map((r) => (
                        <TR key={r.id} className="hover:bg-brand-50/50">
                          <TD className="whitespace-nowrap text-ink">{dateFmt.format(r.trxDate)}</TD>
                          <TD>
                            <div className="font-bold text-ink">
                              {r.description ?? <span className="text-muted">Tanpa keterangan</span>}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              {r.type === "income" ? (
                                <Badge tone="success">Pemasukan</Badge>
                              ) : (
                                <Badge tone="danger">Pengeluaran</Badge>
                              )}
                              {r.categoryName ? (
                                <span className="text-xs text-muted">{r.categoryName}</span>
                              ) : null}
                              {r.proofUrl ? (
                                <a
                                  href={r.proofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"
                                >
                                  <FileText className="h-3 w-3" /> Bukti
                                </a>
                              ) : null}
                            </div>
                          </TD>
                          <TD className="text-ink">
                            {r.titikName ?? <span className="text-muted">—</span>}
                          </TD>
                          <TD
                            className={`whitespace-nowrap text-right font-bold ${
                              r.type === "income" ? "text-green-700" : "text-red-600"
                            }`}
                          >
                            {r.type === "income" ? "+" : "−"} {rupiah.format(r.amount)}
                          </TD>
                          <TD className="text-right">
                            <form action={softDeleteOwnTransaction} className="inline-flex">
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                type="submit"
                                aria-label="Hapus transaksi"
                                title="Hapus"
                                className="text-muted hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </form>
                          </TD>
                        </TR>
                      ))}
                    </tbody>
                  </Table>
                  <p className="mt-3 text-xs text-muted">
                    Menampilkan {rows.length} transaksi aktif. Tombol Hapus melakukan{" "}
                    <em>soft delete</em> (masuk recycle bin, bukan dihapus permanen). Tanggal dalam
                    zona WIB.
                  </p>
                </>
              )}
            </div>

            {/* Form tambah transaksi */}
            <Card className="p-5">
              <p className="mb-3 flex items-center gap-2 font-bold text-ink">
                <PlusCircle className="h-4 w-4 text-brand-600" /> Catat Transaksi
              </p>
              <form action={createOwnTransaction} className="space-y-4">
                <Field label="Titik Dakwah" htmlFor="titikDakwahId">
                  <select id="titikDakwahId" name="titikDakwahId" className={selectCls} defaultValue="" required>
                    <option value="" disabled>
                      Pilih titik milik Anda…
                    </option>
                    {titikOptions.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Tanggal" htmlFor="trxDate">
                  <Input id="trxDate" name="trxDate" type="date" required />
                </Field>

                <Field label="Jenis" htmlFor="type">
                  <select id="type" name="type" className={selectCls} defaultValue="income" required>
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                  </select>
                </Field>

                <Field
                  label="Kategori (opsional)"
                  htmlFor="categoryId"
                  hint="Bantu klasifikasi laporan, boleh dikosongkan."
                >
                  {categories.length > 0 ? (
                    <select id="categoryId" name="categoryId" className={selectCls} defaultValue="">
                      <option value="">Tanpa kategori…</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.type === "income" ? "Pemasukan" : "Pengeluaran"})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-xs text-muted">
                      Belum ada kategori. Transaksi tetap bisa dicatat tanpa kategori.
                    </p>
                  )}
                </Field>

                <Field label="Jumlah (Rp)" htmlFor="amount" hint="Tanpa titik/koma juga boleh, mis. 250000.">
                  <Input
                    id="amount"
                    name="amount"
                    inputMode="numeric"
                    placeholder="Mis. 250.000"
                    required
                  />
                </Field>

                <Field label="Keterangan (opsional)" htmlFor="description">
                  <Input id="description" name="description" placeholder="Mis. Infaq Jumat" />
                </Field>

                <FileUpload name="proofFile" label="Bukti (opsional)" accept="image/*" />

                <Button type="submit" variant="primary" className="w-full">
                  <Save className="h-4 w-4" /> Simpan Transaksi
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
