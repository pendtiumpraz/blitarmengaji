import { CircleDot, Check, History, Inbox } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listPendingConfirmations, listConfirmationHistory } from "@/lib/queries/pembayaran";
import { verifyPayment, rejectPayment } from "@/lib/actions/pembayaran-admin";

export const dynamic = "force-dynamic";

function donaturName(payerName: string | null, isAnonymous: boolean): string {
  if (isAnonymous) return "Hamba Allah";
  return payerName?.trim() || "Hamba Allah";
}

function jenisLabel(kind: "donation" | "order"): string {
  return kind === "donation" ? "Donasi" : "Pesanan";
}

function jenisKampanye(kind: "donation" | "order", campaignTitle: string | null): string {
  if (kind === "donation") {
    return "Donasi — " + (campaignTitle?.trim() || "Kampanye tidak ditemukan");
  }
  return jenisLabel(kind);
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Terverifikasi",
  rejected: "Ditolak",
  pending: "Menunggu",
};

const pendingColumns: Column[] = [
  { key: "payer", label: "Donatur", sortable: true },
  { key: "campaignTitle", label: "Jenis / Kampanye", filter: true },
  { key: "amount", label: "Jumlah", type: "money", sortable: true, className: "text-right" },
  { key: "status", label: "Status", type: "badge" },
  { key: "createdAt", label: "Tanggal", type: "datetime", sortable: true },
];

const historyColumns: Column[] = [
  { key: "payer", label: "Donatur", sortable: true },
  { key: "campaignTitle", label: "Jenis / Kampanye", filter: true },
  { key: "amount", label: "Jumlah", type: "money", sortable: true, className: "text-right" },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
  { key: "createdAt", label: "Diproses", type: "datetime", sortable: true },
];

export default async function AdminPembayaranPage() {
  const [pending, history] = await Promise.all([
    listPendingConfirmations(),
    listConfirmationHistory(20),
  ]);

  const pendingRows = pending.map((p) => ({
    id: p.id,
    payer: donaturName(p.payerName, p.isAnonymous),
    campaignTitle: jenisKampanye(p.kind, p.campaignTitle),
    amount: p.amount,
    status: STATUS_LABEL[p.status] ?? p.status,
    createdAt: p.createdAt,
  }));

  const historyRows = history.map((h) => ({
    id: h.id,
    payer: donaturName(h.payerName, h.isAnonymous),
    campaignTitle: jenisKampanye(h.kind, h.campaignTitle),
    amount: h.amount,
    status: STATUS_LABEL[h.status] ?? h.status,
    createdAt: h.confirmedAt ?? h.createdAt,
  }));

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
          <div className="mt-4">
            <DataTable
              columns={pendingColumns}
              rows={pendingRows}
              rowActions={[
                { action: verifyPayment, label: "Verifikasi", idField: "id" },
                {
                  action: rejectPayment,
                  label: "Tolak",
                  idField: "id",
                  confirm: true,
                  danger: true,
                  confirmTitle: "Tolak pembayaran ini?",
                  confirmText: "Konfirmasi pembayaran akan ditandai ditolak.",
                },
              ]}
              emptyText="Tidak ada konfirmasi menunggu verifikasi."
            />
          </div>
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
          <div className="mt-4">
            <DataTable
              columns={historyColumns}
              rows={historyRows}
              emptyText="Belum ada riwayat konfirmasi."
            />
          </div>
        )}
      </section>
    </div>
  );
}
