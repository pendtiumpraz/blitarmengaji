import { CalendarDays, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable, type Column } from "@/components/ui/data-table";
import { TitikField } from "@/components/map/titik-field";
import { listEventsPaged } from "@/lib/queries/event";
import { listTitikActiveOptions } from "@/lib/queries/titik";
import { createEvent, softDeleteEvent } from "@/lib/actions/event";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  webinar: "Webinar",
  offline: "Offline",
  hybrid: "Hybrid",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Terbit",
  draft: "Draf",
};

const columns: Column[] = [
  { key: "title", label: "Acara", sortable: true },
  { key: "kind", label: "Jenis", type: "badge", sortable: true, filter: true },
  { key: "startAt", label: "Mulai", type: "datetime", sortable: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

export default async function AdminEventPage() {
  // Ambil SEMUA acara (semua status, belum dihapus) untuk DataTable.
  const [events, titikOptions] = await Promise.all([
    listEventsPaged(1, 100000),
    listTitikActiveOptions(),
  ]);
  const rows = events.map((e) => ({
    id: e.id,
    title: e.title,
    kind: KIND_LABEL[e.kind] ?? e.kind,
    startAt: e.startAt,
    status: STATUS_LABEL[e.status] ?? e.status,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Acara & Webinar"
        subtitle="Buat dan kelola acara, webinar, atau kajian akbar untuk jamaah Blitar Raya."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Form buat acara */}
        <form action={createEvent} className="space-y-5">
          <Card className="p-6">
            <h2 className="display text-lg text-ink">Buat Acara</h2>
            <p className="mt-1 text-sm text-muted">
              Sampul diunggah ke Vercel Blob. Acara langsung dipublikasikan.
            </p>

            <div className="mt-5 space-y-4">
              <Field label="Judul acara" htmlFor="title">
                <Input id="title" name="title" placeholder="Mis. Webinar Adab Menuntut Ilmu" required />
              </Field>

              <Field
                label="Slug"
                htmlFor="slug"
                hint="Untuk alamat URL, mis. webinar-adab-ilmu (huruf kecil, tanpa spasi)."
              >
                <Input id="slug" name="slug" placeholder="webinar-adab-ilmu" required />
              </Field>

              <Field label="Jenis acara" htmlFor="kind">
                <select
                  id="kind"
                  name="kind"
                  required
                  defaultValue="offline"
                  className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                >
                  <option value="offline">Offline (tatap muka)</option>
                  <option value="webinar">Webinar (daring)</option>
                  <option value="hybrid">Hybrid (gabungan)</option>
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mulai" htmlFor="startAt">
                  <Input id="startAt" name="startAt" type="datetime-local" required />
                </Field>
                <Field label="Selesai" htmlFor="endAt" hint="Opsional.">
                  <Input id="endAt" name="endAt" type="datetime-local" />
                </Field>
              </div>

              <TitikField name="titikDakwahId" options={titikOptions} label="Titik Dakwah / Lokasi" />

              <Field label="Detail alamat (opsional)" htmlFor="location" hint="Pelengkap titik, mis. ruang/lantai.">
                <Input id="location" name="location" placeholder="Mis. Aula lantai 2" />
              </Field>

              <Field label="Link daring" htmlFor="onlineUrl" hint="Untuk webinar / hybrid.">
                <Input id="onlineUrl" name="onlineUrl" type="url" placeholder="https://zoom.us/j/…" />
              </Field>

              <Field label="Kapasitas" htmlFor="capacity" hint="Kosongkan bila tanpa batas.">
                <Input id="capacity" name="capacity" type="number" min={0} inputMode="numeric" placeholder="Mis. 100" />
              </Field>

              <Field label="Deskripsi" htmlFor="description">
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="Ringkasan acara, pemateri, dan agenda."
                  className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" name="needsRegistration" className="h-4 w-4 rounded border-line" />
                Wajib pendaftaran
              </label>

              <FileUpload name="coverFile" accept="image/*" label="Sampul acara" />

              <Button type="submit" size="md" className="w-full">
                <Save className="h-4 w-4" /> Simpan & Publikasikan
              </Button>
            </div>
          </Card>
        </form>

        {/* Daftar acara */}
        <section>
          <h2 className="display mb-4 flex items-center gap-2 text-lg text-ink">
            <CalendarDays className="h-5 w-5 text-brand-600" /> Daftar Acara
          </h2>

          <DataTable
            columns={columns}
            rows={rows}
            editBase="/admin/event"
            deleteAction={softDeleteEvent}
            deleteConfirmText="Acara akan dipindah ke Recycle Bin (bisa dipulihkan)."
            emptyText="Belum ada acara."
          />
        </section>
      </div>
    </div>
  );
}
