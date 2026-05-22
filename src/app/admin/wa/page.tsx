import { CalendarPlus, FileText, MessageSquare, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { TitikField } from "@/components/map/titik-field";
import { listPendingIngest, listRecentMessages, listTitikOptions } from "@/lib/queries/wa";
import { aiConfigured } from "@/lib/ai";
import { approveKajian, approveFaedah, rejectIngest } from "@/lib/actions/wa";

export const dynamic = "force-dynamic";

const messageColumns: Column[] = [
  { key: "createdAt", label: "Waktu", type: "datetime", sortable: true },
  { key: "groupName", label: "Grup", sortable: true, filter: true },
  { key: "classification", label: "Klasifikasi", type: "badge", sortable: true, filter: true },
  { key: "status", label: "Status", sortable: true, filter: true },
  { key: "text", label: "Teks" },
];

const inputCls =
  "h-10 w-full rounded-sm border border-line bg-cream px-3 text-sm text-ink focus:border-brand-600 focus:outline-none";
const areaCls =
  "w-full rounded-sm border border-line bg-cream px-3 py-2 text-sm leading-relaxed text-ink focus:border-brand-600 focus:outline-none";

type KajianPayload = { judul?: string; ustadz?: string; tanggal?: string; waktu?: string; lokasi?: string; titikHint?: string; kitab?: string };
type FaedahPayload = { judul?: string; ringkasan?: string };

export default async function AdminWaPage() {
  const [pending, messages, titik, ready] = await Promise.all([
    listPendingIngest(),
    listRecentMessages(50),
    listTitikOptions(),
    aiConfigured("wa_extract"),
  ]);

  const messageRows = messages.map((m) => ({
    id: m.id,
    createdAt: m.createdAt,
    groupName: m.groupName ?? "—",
    classification: m.classification ?? "—",
    status: m.status,
    text: `${m.hasImage ? "🖼 " : ""}${m.text ?? ""}`.trim() || "—",
  }));

  return (
    <div>
      <AdminPageHeader title="WA Ingest" subtitle="Tinjau info kajian & faedah dari grup WhatsApp (read-only) sebelum tayang." />

      {!ready ? (
        <Card className="mb-5 flex items-start gap-3 border-gold/40 bg-gold/5 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" />
          <div className="text-sm">
            <p className="font-bold text-ink">AI ekstraksi belum dikonfigurasi</p>
            <p className="text-muted">
              Tambahkan provider+model di <strong>/admin/ai/providers</strong> & <strong>/admin/ai/models</strong>
              (mis. DeepSeek <code>deepseek-v4-flash</code>), lalu bind task <strong>wa_extract</strong> di <strong>/admin/ai</strong>.
              Pesan tetap tersimpan & bisa diproses setelah AI aktif.
            </p>
          </div>
        </Card>
      ) : null}

      <h2 className="display mb-3 flex items-center gap-2 text-lg text-ink">
        Antrian Review <Badge tone="warning">{pending.length}</Badge>
      </h2>

      {pending.length === 0 ? (
        <Card className="p-6 text-sm text-muted">Belum ada draft menunggu review.</Card>
      ) : (
        <div className="space-y-4">
          {pending.map((item) => {
            if (item.type === "kajian") {
              const p = (item.payloadJson || {}) as KajianPayload;
              return (
                <Card key={item.id} className="p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <Badge tone="success"><CalendarPlus className="mr-1 inline h-3.5 w-3.5" />Kajian</Badge>
                    <span className="text-xs text-muted">dari grup {item.groupName ?? "—"}</span>
                  </div>
                  <p className="mb-3 rounded-sm bg-cream px-3 py-2 text-xs text-muted">
                    Saran AI — Tanggal: {p.tanggal || "?"} · Waktu: {p.waktu || "?"} · Lokasi: {p.lokasi || p.titikHint || "?"}
                  </p>
                  <form action={approveKajian} className="grid gap-3 md:grid-cols-2">
                    <input type="hidden" name="id" value={item.id} />
                    <label className="text-sm md:col-span-2">
                      <span className="mb-1 block text-xs font-bold text-muted">Judul Kajian</span>
                      <input name="title" defaultValue={p.judul || ""} required className={inputCls} />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-bold text-muted">Penceramah</span>
                      <input name="ustadz" defaultValue={p.ustadz || ""} className={inputCls} />
                    </label>
                    <div className="text-sm">
                      <TitikField
                        name="titikDakwahId"
                        options={titik}
                        defaultValue={item.titikDakwahId ?? ""}
                        label="Titik Dakwah"
                      />
                    </div>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-bold text-muted">Waktu Mulai</span>
                      <input type="datetime-local" name="startAt" required className={inputCls} />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-bold text-muted">Kitab (opsional)</span>
                      <input name="kitab" defaultValue={p.kitab || ""} className={inputCls} />
                    </label>
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                      <input type="checkbox" name="isOnline" /> <span>Online / livestream</span>
                      <input name="streamUrl" placeholder="URL stream (bila online)" className={inputCls + " ml-2 flex-1"} />
                    </label>
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="poster" className="h-24 w-24 rounded object-cover md:col-span-2" />
                    ) : null}
                    <div className="flex gap-2 md:col-span-2">
                      <button type="submit" className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">Setujui → Jadwal</button>
                    </div>
                  </form>
                  <form action={rejectIngest} className="mt-2">
                    <input type="hidden" name="id" value={item.id} />
                    <ConfirmSubmit
                      title="Tolak draft ini?"
                      text="Draft kajian ini akan ditandai ditolak dan tidak diproses."
                      confirmText="Ya, tolak"
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Tolak draft ini
                    </ConfirmSubmit>
                  </form>
                </Card>
              );
            }
            // faedah
            const p = (item.payloadJson || {}) as FaedahPayload;
            return (
              <Card key={item.id} className="p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Badge tone="brand"><FileText className="mr-1 inline h-3.5 w-3.5" />Faedah</Badge>
                  <span className="text-xs text-muted">dari grup {item.groupName ?? "—"}</span>
                </div>
                <form action={approveFaedah} className="space-y-3">
                  <input type="hidden" name="id" value={item.id} />
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-bold text-muted">Judul</span>
                    <input name="title" defaultValue={p.judul || ""} required className={inputCls} />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block text-xs font-bold text-muted">Isi Faedah</span>
                    <textarea name="body" defaultValue={p.ringkasan || ""} rows={5} required className={areaCls} />
                  </label>
                  <button type="submit" className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">Setujui → Catatan</button>
                </form>
                <form action={rejectIngest} className="mt-2">
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmit
                    title="Tolak draft ini?"
                    text="Draft faedah ini akan ditandai ditolak dan tidak diproses."
                    confirmText="Ya, tolak"
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Tolak draft ini
                  </ConfirmSubmit>
                </form>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="display mb-3 mt-8 flex items-center gap-2 text-lg text-ink">
        <MessageSquare className="h-5 w-5 text-brand-600" /> Pesan Masuk Terbaru
      </h2>
      <DataTable
        columns={messageColumns}
        rows={messageRows}
        emptyText="Belum ada pesan masuk."
      />
    </div>
  );
}
