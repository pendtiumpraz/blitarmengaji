import { CalendarPlus, FileText, MessageSquare, AlertTriangle } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { listPendingIngest, listRecentMessages, listTitikOptions } from "@/lib/queries/wa";
import { aiConfigured } from "@/lib/ai";
import { approveKajian, approveFaedah, rejectIngest } from "@/lib/actions/wa";

export const dynamic = "force-dynamic";

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
                    <label className="text-sm">
                      <span className="mb-1 block text-xs font-bold text-muted">Titik Dakwah</span>
                      <select name="titikDakwahId" defaultValue={item.titikDakwahId || ""} className={inputCls}>
                        <option value="">— pilih titik —</option>
                        {titik.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </label>
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
                    <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">Tolak draft ini</button>
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
                  <button type="submit" className="text-xs font-semibold text-red-600 hover:underline">Tolak draft ini</button>
                </form>
              </Card>
            );
          })}
        </div>
      )}

      <h2 className="display mb-3 mt-8 flex items-center gap-2 text-lg text-ink">
        <MessageSquare className="h-5 w-5 text-brand-600" /> Pesan Masuk Terbaru
      </h2>
      <Table>
          <THead>
            <TR><TH>Waktu</TH><TH>Grup</TH><TH>Klasifikasi</TH><TH>Status</TH><TH>Teks</TH></TR>
          </THead>
          <tbody>
            {messages.length === 0 ? (
              <TR><TD>Belum ada pesan masuk.</TD></TR>
            ) : (
              messages.map((m) => (
                <TR key={m.id}>
                  <TD><span className="text-xs text-muted">{new Date(m.createdAt).toLocaleString("id-ID")}</span></TD>
                  <TD>{m.groupName ?? "—"}</TD>
                  <TD>{m.classification ? <Badge tone="muted">{m.classification}</Badge> : "—"}</TD>
                  <TD><span className="text-xs">{m.status}</span></TD>
                  <TD><span className="line-clamp-1 max-w-xs text-xs text-muted">{m.hasImage ? "🖼 " : ""}{m.text ?? ""}</span></TD>
                </TR>
              ))
            )}
          </tbody>
      </Table>
    </div>
  );
}
