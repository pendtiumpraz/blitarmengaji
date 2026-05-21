import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { getEventById } from "@/lib/queries/event";
import { updateEvent } from "@/lib/actions/event";

export const dynamic = "force-dynamic";

/** Format Date → string untuk input datetime-local (YYYY-MM-DDTHH:mm, waktu lokal). */
function toLocalInput(d: Date | null): string {
  if (!d) return "";
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}` +
    `T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  );
}

export default async function AdminEventEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Edit Acara"
        subtitle="Perbarui detail acara, webinar, atau kajian akbar untuk jamaah Blitar Raya."
        action={
          <Button href="/admin/event" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form action={updateEvent} className="max-w-2xl space-y-5">
        <input type="hidden" name="id" value={event.id} />
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Detail Acara</h2>
          <p className="mt-1 text-sm text-muted">
            Unggah sampul baru untuk mengganti; biarkan kosong untuk mempertahankan sampul lama.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Judul acara" htmlFor="title">
              <Input
                id="title"
                name="title"
                placeholder="Mis. Webinar Adab Menuntut Ilmu"
                defaultValue={event.title}
                required
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Untuk alamat URL, mis. webinar-adab-ilmu (huruf kecil, tanpa spasi)."
            >
              <Input
                id="slug"
                name="slug"
                placeholder="webinar-adab-ilmu"
                defaultValue={event.slug}
                required
              />
            </Field>

            <Field label="Jenis acara" htmlFor="kind">
              <select
                id="kind"
                name="kind"
                required
                defaultValue={event.kind}
                className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="offline">Offline (tatap muka)</option>
                <option value="webinar">Webinar (daring)</option>
                <option value="hybrid">Hybrid (gabungan)</option>
              </select>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mulai" htmlFor="startAt">
                <Input
                  id="startAt"
                  name="startAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(event.startAt)}
                  required
                />
              </Field>
              <Field label="Selesai" htmlFor="endAt" hint="Opsional.">
                <Input
                  id="endAt"
                  name="endAt"
                  type="datetime-local"
                  defaultValue={toLocalInput(event.endAt)}
                />
              </Field>
            </div>

            <Field label="Lokasi" htmlFor="location" hint="Untuk acara offline / hybrid.">
              <Input
                id="location"
                name="location"
                placeholder="Mis. Masjid Agung Blitar"
                defaultValue={event.location ?? ""}
              />
            </Field>

            <Field label="Link daring" htmlFor="onlineUrl" hint="Untuk webinar / hybrid.">
              <Input
                id="onlineUrl"
                name="onlineUrl"
                type="url"
                placeholder="https://zoom.us/j/…"
                defaultValue={event.onlineUrl ?? ""}
              />
            </Field>

            <Field label="Kapasitas" htmlFor="capacity" hint="Kosongkan bila tanpa batas.">
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Mis. 100"
                defaultValue={event.capacity ?? ""}
              />
            </Field>

            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Ringkasan acara, pemateri, dan agenda."
                defaultValue={event.description ?? ""}
                className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="needsRegistration"
                defaultChecked={event.needsRegistration}
                className="h-4 w-4 rounded border-line"
              />
              Wajib pendaftaran
            </label>

            <FileUpload
              name="coverFile"
              accept="image/*"
              label="Sampul acara"
              defaultUrl={event.coverImage}
            />
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button href="/admin/event" variant="outline" size="md">
            Batal
          </Button>
          <Button type="submit" size="md">
            <Save className="h-4 w-4" /> Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  );
}
