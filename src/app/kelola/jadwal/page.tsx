import { redirect } from "next/navigation";
import { CalendarDays, CalendarPlus, Pencil, Radio, Save, Trash2, Link as LinkIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import {
  mySchedules,
  myTitikOptions,
  myKajianOptions,
  type MyScheduleItem,
} from "@/lib/queries/kelola";
import { createSchedule, deleteSchedule, updateSchedule } from "@/lib/actions/jadwal";

export const dynamic = "force-dynamic";

const TZ = "Asia/Jakarta";
const dateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});
const timeFmt = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

// Format Date -> "YYYY-MM-DDTHH:mm" pada zona WIB untuk prefill <input type="datetime-local">.
const dtLocalParts = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});
function toDatetimeLocal(d: Date): string {
  const p = Object.fromEntries(dtLocalParts.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

function StatusBadge({ item }: { item: MyScheduleItem }) {
  if (item.status === "ongoing") return <Badge tone="danger">● Berlangsung</Badge>;
  if (item.status === "cancelled") return <Badge tone="muted">Dibatalkan</Badge>;
  if (item.status === "done") return <Badge tone="muted">Selesai</Badge>;
  return <Badge tone="brand">Terjadwal</Badge>;
}

export default async function KelolaJadwalPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const [rows, titikOptions, kajianOptions] = await Promise.all([
    mySchedules(userId),
    myTitikOptions(userId),
    myKajianOptions(userId),
  ]);

  const hasTitik = titikOptions.length > 0;

  return (
    <div>
      <AdminPageHeader
        title="Kelola Jadwal Kajian"
        subtitle="Atur jadwal kajian untuk titik dakwah yang Anda kelola. Jadwal langsung tampil di halaman jamaah."
      />

      {!hasTitik ? (
        <Card className="px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <CalendarDays className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Belum ada titik dakwah</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Anda perlu mengelola minimal satu titik dakwah sebelum dapat menambah jadwal kajian. Ajukan titik dakwah ke
            admin terlebih dahulu.
          </p>
          <div className="mt-5">
            <Button href="/kelola" variant="outline">
              Kembali ke Ringkasan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Daftar jadwal */}
          <div>
            {rows.length === 0 ? (
              <Card className="px-6 py-16 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <CalendarPlus className="h-7 w-7" />
                </span>
                <h2 className="display mt-4 text-lg text-ink">Belum ada jadwal</h2>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                  Tambahkan jadwal kajian pertama lewat formulir di samping agar jamaah tahu kapan kajian berlangsung.
                </p>
              </Card>
            ) : (
              <>
                <Table className="min-w-[640px]">
                  <THead>
                    <TR>
                      <TH>Kajian / Judul</TH>
                      <TH>Titik</TH>
                      <TH>Jadwal</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Aksi</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {rows.map((r) => (
                      <TR key={r.id} className="hover:bg-brand-50/50">
                        <TD>
                          <div className="font-bold text-ink">{r.title ?? r.kajianTitle ?? "Tanpa judul"}</div>
                          {r.kajianTitle && r.title ? (
                            <div className="text-xs text-muted">{r.kajianTitle}</div>
                          ) : null}
                          {r.isOnline ? (
                            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700">
                              <Radio className="h-3 w-3" /> Online
                            </div>
                          ) : null}
                        </TD>
                        <TD className="text-ink">{r.titikName ?? <span className="text-muted">—</span>}</TD>
                        <TD>
                          <div className="text-ink">{dateFmt.format(r.startAt)}</div>
                          <div className="text-xs text-muted">{timeFmt.format(r.startAt)} WIB</div>
                        </TD>
                        <TD>
                          <StatusBadge item={r} />
                        </TD>
                        <TD className="text-right align-top">
                          <div className="inline-flex items-start gap-3">
                            <details className="group relative">
                              <summary
                                aria-label={`Edit jadwal ${r.title ?? r.kajianTitle ?? ""}`}
                                title="Edit"
                                className="inline-flex cursor-pointer list-none items-center text-muted hover:text-brand-700 [&::-webkit-details-marker]:hidden"
                              >
                                <Pencil className="h-4 w-4" />
                              </summary>
                              <div className="absolute right-0 z-20 mt-2 w-80 rounded-sm border border-line bg-surface p-4 text-left shadow-lg">
                                <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                                  <Pencil className="h-4 w-4 text-brand-600" /> Edit Jadwal
                                </p>
                                <form action={updateSchedule} className="space-y-3">
                                  <input type="hidden" name="id" value={r.id} />

                                  <Field label="Titik Dakwah" htmlFor={`edit-titik-${r.id}`}>
                                    <select
                                      id={`edit-titik-${r.id}`}
                                      name="titikDakwahId"
                                      className={selectCls}
                                      defaultValue={r.titikDakwahId ?? ""}
                                      required
                                    >
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

                                  {kajianOptions.length > 0 ? (
                                    <Field label="Kajian (opsional)" htmlFor={`edit-kajian-${r.id}`}>
                                      <select
                                        id={`edit-kajian-${r.id}`}
                                        name="kajianId"
                                        className={selectCls}
                                        defaultValue={r.kajianId ?? ""}
                                      >
                                        <option value="">Tanpa kajian / acara lepas…</option>
                                        {kajianOptions.map((k) => (
                                          <option key={k.id} value={k.id}>
                                            {k.title}
                                          </option>
                                        ))}
                                      </select>
                                    </Field>
                                  ) : null}

                                  <Field label="Judul Jadwal" htmlFor={`edit-title-${r.id}`}>
                                    <Input
                                      id={`edit-title-${r.id}`}
                                      name="title"
                                      defaultValue={r.title ?? ""}
                                      placeholder="Mis. Kajian Tafsir Ba'da Subuh"
                                      required
                                    />
                                  </Field>

                                  <Field label="Mulai (tanggal & jam)" htmlFor={`edit-startAt-${r.id}`}>
                                    <Input
                                      id={`edit-startAt-${r.id}`}
                                      name="startAt"
                                      type="datetime-local"
                                      defaultValue={toDatetimeLocal(r.startAt)}
                                      required
                                    />
                                  </Field>

                                  <Field label="Status" htmlFor={`edit-status-${r.id}`}>
                                    <select
                                      id={`edit-status-${r.id}`}
                                      name="status"
                                      className={selectCls}
                                      defaultValue={r.status}
                                    >
                                      <option value="scheduled">Terjadwal</option>
                                      <option value="ongoing">Berlangsung</option>
                                      <option value="done">Selesai</option>
                                      <option value="cancelled">Dibatalkan</option>
                                    </select>
                                  </Field>

                                  <label className="flex items-center gap-2 rounded-sm border border-line bg-cream/60 px-3 py-2.5 text-sm text-ink">
                                    <input
                                      type="checkbox"
                                      name="isOnline"
                                      defaultChecked={r.isOnline}
                                      className="h-4 w-4 accent-[var(--c-brand-600)]"
                                    />
                                    <Radio className="h-4 w-4 text-brand-600" />
                                    <span className="font-semibold">Kajian online / livestream</span>
                                  </label>

                                  <Field label="Link Streaming" htmlFor={`edit-streamUrl-${r.id}`}>
                                    <div className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                                      <LinkIcon className="h-4 w-4 shrink-0 text-muted" />
                                      <input
                                        id={`edit-streamUrl-${r.id}`}
                                        name="streamUrl"
                                        type="url"
                                        defaultValue={r.streamUrl ?? ""}
                                        placeholder="https://youtu.be/…"
                                        className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                                      />
                                    </div>
                                  </Field>

                                  <Button type="submit" variant="primary" className="w-full">
                                    <Save className="h-4 w-4" /> Simpan Perubahan
                                  </Button>
                                </form>
                              </div>
                            </details>

                            <form action={deleteSchedule} className="inline-flex">
                              <input type="hidden" name="id" value={r.id} />
                              <button
                                type="submit"
                                aria-label={`Hapus jadwal ${r.title ?? r.kajianTitle ?? ""}`}
                                title="Hapus"
                                className="text-muted hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </form>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
                <p className="mt-3 text-xs text-muted">
                  Menampilkan {rows.length} jadwal aktif. Tombol Hapus melakukan <em>soft delete</em> (masuk recycle bin,
                  bukan dihapus permanen). Waktu ditampilkan dalam zona WIB.
                </p>
              </>
            )}
          </div>

          {/* Form tambah jadwal */}
          <Card className="p-5">
            <p className="mb-3 flex items-center gap-2 font-bold text-ink">
              <CalendarPlus className="h-4 w-4 text-brand-600" /> Tambah Jadwal
            </p>
            <form action={createSchedule} className="space-y-4">
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

              <Field
                label="Kajian (opsional)"
                htmlFor="kajianId"
                hint="Tautkan ke kajian yang sudah ada, atau biarkan kosong."
              >
                {kajianOptions.length > 0 ? (
                  <select id="kajianId" name="kajianId" className={selectCls} defaultValue="">
                    <option value="">Tanpa kajian / acara lepas…</option>
                    {kajianOptions.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-xs text-muted">
                    Belum ada kajian terdaftar untuk titik Anda. Jadwal tetap bisa dibuat tanpa kajian.
                  </p>
                )}
              </Field>

              <Field label="Judul Jadwal" htmlFor="title">
                <Input id="title" name="title" placeholder="Mis. Kajian Tafsir Ba'da Subuh" required />
              </Field>

              <Field label="Mulai (tanggal & jam)" htmlFor="startAt" hint="Zona waktu mengikuti perangkat Anda.">
                <Input id="startAt" name="startAt" type="datetime-local" required />
              </Field>

              <label className="flex items-center gap-2 rounded-sm border border-line bg-cream/60 px-3 py-2.5 text-sm text-ink">
                <input type="checkbox" name="isOnline" className="h-4 w-4 accent-[var(--c-brand-600)]" />
                <Radio className="h-4 w-4 text-brand-600" />
                <span className="font-semibold">Kajian online / livestream</span>
              </label>

              <Field label="Link Streaming" htmlFor="streamUrl" hint="Diisi jika kajian online (YouTube/Facebook).">
                <div className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                  <LinkIcon className="h-4 w-4 shrink-0 text-muted" />
                  <input
                    id="streamUrl"
                    name="streamUrl"
                    type="url"
                    placeholder="https://youtu.be/…"
                    className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                  />
                </div>
              </Field>

              <Button type="submit" variant="primary" className="w-full">
                <Save className="h-4 w-4" /> Simpan Jadwal
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
