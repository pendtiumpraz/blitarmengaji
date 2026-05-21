import { BadgeDollarSign, CircleDot, Check, X, FileText, History, Inbox } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { listPendingConfirmations, listConfirmationHistory } from "@/lib/queries/pembayaran";
import { verifyPayment, rejectPayment } from "@/lib/actions/pembayaran-admin";

export const dynamic = "force-dynamic";

function rupiah(amount: string | null): string {
  const n = Number(amount ?? 0);
  return Number.isFinite(n) ? "Rp " + n.toLocaleString("id-ID") : "—";
}

function tanggal(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function donaturName(payerName: string | null, isAnonymous: boolean): string {
  if (isAnonymous) return "Hamba Allah";
  return payerName?.trim() || "Hamba Allah";
}

function jenisLabel(kind: "donation" | "order"): string {
  return kind === "donation" ? "Donasi" : "Pesanan";
}

export default async function AdminPembayaranPage() {
  const [pending, history] = await Promise.all([
    listPendingConfirmations(),
    listConfirmationHistory(20),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Konfirmasi Pembayaran"
        subtitle="Verifikasi bukti transfer donasi & pesanan dari jamaah Blitar Raya. Donasi yang diverifikasi otomatis menambah progress kampanye."
        action={
          pending.length > 0 ? (
            <Badge tone="gold">
              <CircleDot className="h-3 w-3" /> {pending.length} menunggu verifikasi
            </Badge>
          ) : undefined
        }
      />

      {/* === PENDING === */}
      <section>
        <h2 className="display flex items-center gap-2 text-lg text-ink">
          <Inbox className="h-5 w-5 text-brand-600" /> Menunggu Verifikasi
        </h2>

        {pending.length === 0 ? (
          <Card className="mt-4 grid place-items-center px-6 py-14 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Check className="h-7 w-7" />
            </div>
            <p className="display mt-3 text-lg text-ink">Tidak ada yang menunggu</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Semua konfirmasi pembayaran sudah diproses. Konfirmasi baru akan muncul di sini.
            </p>
          </Card>
        ) : (
          <Table className="mt-4">
            <THead>
              <TR>
                <TH>Donatur</TH>
                <TH>Jenis / Kampanye</TH>
                <TH className="text-right">Jumlah</TH>
                <TH>Bukti</TH>
                <TH>Tanggal</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <tbody>
              {pending.map((p) => (
                <TR key={p.id}>
                  <TD>
                    <span className="font-bold text-ink">{donaturName(p.payerName, p.isAnonymous)}</span>
                    {p.note ? <p className="mt-0.5 text-[11px] text-muted">{p.note}</p> : null}
                  </TD>
                  <TD>
                    <Badge tone={p.kind === "donation" ? "brand" : "muted"}>{jenisLabel(p.kind)}</Badge>
                    {p.kind === "donation" ? (
                      <p className="mt-1 text-xs text-muted">{p.campaignTitle ?? "Kampanye tidak ditemukan"}</p>
                    ) : null}
                  </TD>
                  <TD className="text-right font-bold text-brand-700">{rupiah(p.amount)}</TD>
                  <TD>
                    {p.proofUrl ? (
                      <a
                        href={p.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-700 underline-offset-2 hover:underline"
                      >
                        <FileText className="h-3.5 w-3.5" /> Lihat
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-muted">{tanggal(p.createdAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-2">
                      <form action={verifyPayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button type="submit" variant="primary" size="sm">
                          <Check className="h-3.5 w-3.5" /> Verifikasi
                        </Button>
                      </form>
                      <form action={rejectPayment}>
                        <input type="hidden" name="id" value={p.id} />
                        <Button
                          type="submit"
                          variant="danger"
                          size="sm"
                          className="bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <X className="h-3.5 w-3.5" /> Tolak
                        </Button>
                      </form>
                    </div>
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </section>

      {/* === RIWAYAT === */}
      <section className="mt-8">
        <h2 className="display flex items-center gap-2 text-lg text-ink">
          <History className="h-5 w-5 text-brand-600" /> Riwayat Konfirmasi
        </h2>

        {history.length === 0 ? (
          <Card className="mt-4 grid place-items-center px-6 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <History className="h-6 w-6" />
            </div>
            <p className="display mt-3 text-base text-ink">Belum ada riwayat</p>
            <p className="mt-1 max-w-md text-sm text-muted">
              Pembayaran yang sudah diverifikasi atau ditolak akan tercatat di sini.
            </p>
          </Card>
        ) : (
          <Table className="mt-4">
            <THead>
              <TR>
                <TH>Donatur</TH>
                <TH>Jenis / Kampanye</TH>
                <TH className="text-right">Jumlah</TH>
                <TH>Status</TH>
                <TH>Diproses</TH>
              </TR>
            </THead>
            <tbody>
              {history.map((h) => (
                <TR key={h.id}>
                  <TD>
                    <span className="font-bold text-ink">{donaturName(h.payerName, h.isAnonymous)}</span>
                  </TD>
                  <TD>
                    <Badge tone={h.kind === "donation" ? "brand" : "muted"}>{jenisLabel(h.kind)}</Badge>
                    {h.kind === "donation" ? (
                      <p className="mt-1 text-xs text-muted">{h.campaignTitle ?? "Kampanye tidak ditemukan"}</p>
                    ) : null}
                  </TD>
                  <TD className="text-right font-bold text-brand-700">{rupiah(h.amount)}</TD>
                  <TD>
                    {h.status === "confirmed" ? (
                      <Badge tone="success">
                        <Check className="h-3 w-3" /> Terverifikasi
                      </Badge>
                    ) : (
                      <Badge tone="danger">
                        <X className="h-3 w-3" /> Ditolak
                      </Badge>
                    )}
                  </TD>
                  <TD className="whitespace-nowrap text-muted">{tanggal(h.confirmedAt)}</TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
      </section>
    </div>
  );
}
