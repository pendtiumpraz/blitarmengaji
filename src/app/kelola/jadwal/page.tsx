import { redirect } from "next/navigation";
import { CalendarDays, CalendarPlus, Radio, Save, Link as LinkIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { DataTable, type Column } from "@/components/ui/data-table";
import { TitikField } from "@/components/map/titik-field";
import {
  mySchedules,
  myTitikOptions,
  myKajianOptions,
} from "@/lib/queries/kelola";
import { createSchedule, deleteSchedule } from "@/lib/actions/jadwal";

export const dynamic = "force-dynamic";

const TZ = "Asia/Jakarta";
const scheduleFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: TZ,
});

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Terjadwal",
  ongoing: "● Berlangsung",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

const COLUMNS: Column[] = [
  { key: "title", label: "Kajian / Judul", sortable: true },
  { key: "titikName", label: "Titik", sortable: true, filter: true },
  { key: "schedule", label: "Jadwal", sortable: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function KelolaJadwalPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const [schedules, titikOptions, kajianOptions] = await Promise.all([
    mySchedules(userId),
    myTitikOptions(userId),
    myKajianOptions(userId),
  ]);

  const hasTitik = titikOptions.length > 0;

  // Baris polos untuk DataTable (search/sort/filter/pagination + hapus berkonfirmasi).
  const rows = schedules.map((r) => ({
    id: r.id,
    title:
      (r.title ?? r.kajianTitle ?? "Tanpa judul") + (r.isOnline ? " · Online" : ""),
    titikName: r.titikName ?? "—",
    schedule: scheduleFmt.format(r.startAt) + " WIB",
    status: STATUS_LABEL[r.status] ?? r.status,
  }));

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
            <DataTable
              columns={COLUMNS}
              rows={rows}
              deleteAction={deleteSchedule}
              deleteConfirmText="Jadwal akan dipindah ke Recycle Bin (bisa dipulihkan)."
              emptyText="Belum ada jadwal. Tambahkan lewat formulir di samping."
            />
            <p className="mt-3 text-xs text-muted">
              Tombol Hapus melakukan <em>soft delete</em> (masuk recycle bin, bukan dihapus
              permanen). Waktu ditampilkan dalam zona WIB.
            </p>
          </div>

          {/* Form tambah jadwal */}
          <Card className="p-5">
            <p className="mb-3 flex items-center gap-2 font-bold text-ink">
              <CalendarPlus className="h-4 w-4 text-brand-600" /> Tambah Jadwal
            </p>
            <form action={createSchedule} className="space-y-4">
              <TitikField
                name="titikDakwahId"
                options={titikOptions}
                required
                label="Titik Dakwah"
              />

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
