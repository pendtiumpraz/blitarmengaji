import {
  ArrowDownLeft,
  ArrowUpRight,
  FileDown,
  Inbox,
  Paperclip,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import {
  getExpenseComposition,
  getSummary,
  listTransactions,
} from "@/lib/queries/keuangan";

// Membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Transparansi Keuangan · Blitar Mengaji",
  description: "Laporan keuangan terbuka — setiap rupiah pemasukan & pengeluaran dapat ditelusuri publik.",
};

function rupiah(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

// Palet konsisten craft untuk segmen komposisi pengeluaran.
const PIE_COLORS = [
  "var(--c-brand-600)",
  "var(--c-gold)",
  "var(--c-brand-300)",
  "var(--c-brand-800)",
  "var(--c-gold-dark)",
];

export default async function KeuanganPage() {
  const [summary, transactions, compositionRaw] = await Promise.all([
    getSummary(),
    listTransactions(20),
    getExpenseComposition(),
  ]);

  const summaryCards = [
    { label: "Total Pemasukan", value: rupiah(summary.totalIncome), tone: "income" as const, icon: ArrowDownLeft },
    { label: "Total Pengeluaran", value: rupiah(summary.totalExpense), tone: "expense" as const, icon: ArrowUpRight },
    { label: "Saldo Kas", value: rupiah(summary.balance), tone: "balance" as const, icon: TrendingUp },
  ];

  // Komposisi: ambil 4 teratas, sisanya digabung ke "Lainnya".
  const top = compositionRaw.slice(0, 4);
  const rest = compositionRaw.slice(4);
  const restTotal = rest.reduce((s, c) => s + c.value, 0);
  const composition = [
    ...top,
    ...(restTotal > 0 ? [{ label: "Lainnya", value: restTotal }] : []),
  ];
  const compTotal = composition.reduce((s, c) => s + c.value, 0);

  // Bangun conic-gradient donut dari data nyata.
  let acc = 0;
  const stops = composition.map((c, i) => {
    const start = compTotal > 0 ? (acc / compTotal) * 100 : 0;
    acc += c.value;
    const end = compTotal > 0 ? (acc / compTotal) * 100 : 0;
    return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`;
  });
  const donutGradient = `conic-gradient(${stops.join(", ")})`;

  return (
    <>
      {/* HERO amanah */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <Container className="relative z-10 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-light/85">Amanah & Transparan</p>
          <h1 className="display mt-3 flex items-center gap-3 text-4xl leading-[1.05] text-[#FBF4E2] md:text-5xl">
            <Wallet className="h-9 w-9 text-gold-light" /> Laporan Keuangan Terbuka
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-cream/80">
            Disajikan jujur kepada jamaah dan masyarakat Blitar Raya. Setiap rupiah pemasukan dan pengeluaran dapat
            ditelusuri publik, lengkap dengan bukti dan laporan yang bisa diunduh.
          </p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-gold-light">
            <ShieldCheck className="h-4 w-4" /> Laporan terbuka · diaudit pengurus · disajikan amanah
          </span>
        </Container>
      </section>

      <Container className="py-10">
        {/* Unduh laporan PDF (dibuka di tab baru) */}
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted">
            Ringkasan dihitung otomatis dari seluruh transaksi yang tercatat.
          </p>
          <a
            href="/api/laporan/keuangan"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gold px-5 text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light"
          >
            <FileDown className="h-4 w-4" /> Unduh Laporan PDF
          </a>
        </div>

        {/* RIBBON AYAT AMANAH */}
        <div className="relative mt-5 overflow-hidden rounded-[3px] bg-brand-700 text-cream">
          <div className="pat-girih-light absolute inset-0" />
          <div className="relative z-10 flex flex-wrap items-center gap-3 px-5 py-3.5">
            <ShieldCheck className="h-5 w-5 shrink-0 text-gold-light" />
            <p className="min-w-[220px] flex-1 text-sm font-semibold">
              &ldquo;Sesungguhnya Allah memerintahkan kamu menyampaikan amanat kepada yang berhak.&rdquo;{" "}
              <span className="font-arabic text-base" dir="rtl">
                — QS. An-Nisa : 58
              </span>
            </p>
            <span className="text-xs text-cream/70">Komitmen transparansi Blitar Mengaji</span>
          </div>
        </div>

        {/* KARTU RINGKASAN — dari getSummary() (NYATA) */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {summaryCards.map((s) => {
            const Icon = s.icon;
            const balance = s.tone === "balance";
            const valueColor =
              s.tone === "income"
                ? "text-green-600"
                : s.tone === "expense"
                  ? "text-red-500"
                  : "text-cream";
            const iconWrap =
              s.tone === "income"
                ? "bg-brand-50 text-green-600"
                : s.tone === "expense"
                  ? "bg-red-50 text-red-500"
                  : "bg-white/15 text-gold-light";
            return (
              <Card key={s.label} className={cn("p-5", balance && "bg-brand-700 text-cream")}>
                <div className={cn("grid h-9 w-9 place-items-center rounded-[3px]", iconWrap)}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className={cn("mt-3 text-xl font-extrabold sm:text-2xl", valueColor)}>{s.value}</p>
                <p className={cn("text-xs", balance ? "text-cream/70" : "text-muted")}>{s.label}</p>
              </Card>
            );
          })}
        </div>

        {/* GRAFIK: komposisi pengeluaran (disembunyikan bila kosong) */}
        {composition.length > 0 && (
          <Card className="mt-5 p-6">
            <h3 className="font-bold text-ink">Komposisi Pengeluaran</h3>
            <p className="mb-4 text-xs text-muted">Total {rupiah(compTotal)}</p>
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
              <div className="grid place-items-center">
                <div className="relative h-40 w-40 rounded-full" style={{ background: donutGradient }}>
                  <div className="absolute inset-[20%] grid place-items-center rounded-full bg-surface shadow">
                    <div className="text-center">
                      <p className="text-[11px] leading-none text-muted">Total</p>
                      <p className="text-base font-extrabold text-ink">{rupiah(compTotal)}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {composition.map((c, i) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-sm"
                      style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                    <span className="flex-1 text-ink">{c.label}</span>
                    <span className="font-bold text-ink">{rupiah(c.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* TABEL TRANSAKSI TERAKHIR */}
        <Card className="mt-5 overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-line p-5">
            <h3 className="flex items-center gap-2 font-bold text-ink">
              <Wallet className="h-5 w-5 text-brand-600" /> Transaksi Terakhir
            </h3>
            <Badge tone="brand" className="ml-auto">
              <RefreshCw className="h-3 w-3" /> {summary.count} transaksi
            </Badge>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <Inbox className="h-10 w-10 text-brand-300" />
              <p className="font-bold text-ink">Belum ada transaksi tercatat</p>
              <p className="max-w-sm text-sm text-muted">
                Laporan akan tampil di sini begitu pengurus mulai mencatat pemasukan dan pengeluaran.
              </p>
            </div>
          ) : (
            <>
              {/* desktop: tabel lengkap */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="bg-cream/60 text-left text-xs uppercase text-muted">
                      <th className="px-5 py-3 font-bold">Tanggal</th>
                      <th className="px-5 py-3 font-bold">Keterangan</th>
                      <th className="px-5 py-3 font-bold">Titik</th>
                      <th className="px-5 py-3 font-bold">Kategori</th>
                      <th className="px-5 py-3 text-right font-bold">Nominal</th>
                      <th className="px-5 py-3 text-center font-bold">Bukti</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-cream/50">
                        <td className="whitespace-nowrap px-5 py-3 text-muted">{dateFmt.format(tx.trxDate)}</td>
                        <td className="px-5 py-3 font-semibold text-ink">
                          {tx.description ?? tx.categoryName ?? "Transaksi"}
                        </td>
                        <td className="px-5 py-3 text-muted">{tx.scopeName}</td>
                        <td className="px-5 py-3">
                          <Badge tone={tx.type === "income" ? "brand" : "warning"}>
                            {tx.categoryName ?? (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                          </Badge>
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-5 py-3 text-right font-bold",
                            tx.type === "income" ? "text-green-600" : "text-red-500",
                          )}
                        >
                          {tx.type === "income" ? "+ " : "- "}
                          {rupiah(tx.amount)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {tx.proofUrl ? (
                            <a
                              href={tx.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex text-brand-600"
                            >
                              <Paperclip className="h-4 w-4" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* mobile: kartu transaksi */}
              <div className="divide-y divide-line md:hidden">
                {transactions.map((tx) => {
                  const income = tx.type === "income";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 p-4">
                      <div
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-[3px]",
                          income ? "bg-brand-50" : "bg-red-50",
                        )}
                      >
                        {income ? (
                          <ArrowDownLeft className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {tx.description ?? tx.categoryName ?? "Transaksi"}
                        </p>
                        <p className="text-[11px] text-muted">
                          {dateFmt.format(tx.trxDate)} · {tx.scopeName}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn("text-sm font-bold", income ? "text-green-600" : "text-red-500")}>
                          {income ? "+ " : "- "}
                          {rupiah(tx.amount)}
                        </p>
                        {tx.proofUrl ? (
                          <span className="flex items-center justify-end gap-0.5 text-[10px] font-semibold text-brand-600">
                            <Paperclip className="h-3 w-3" /> bukti
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* TOMBOL BESAR UNDUH PDF */}
        <div className="mt-8 text-center">
          <a
            href="/api/laporan/keuangan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[3px] bg-gold px-7 text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light sm:w-auto sm:px-12"
          >
            <FileDown className="h-5 w-5" /> Unduh Laporan PDF
          </a>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Laporan resmi, sah, & dapat diaudit
          </p>
        </div>
      </Container>
    </>
  );
}
