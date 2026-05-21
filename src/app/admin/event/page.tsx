import { CalendarDays, Eye, MapPin, Pencil, Save, Trash2, Users, Video } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Pagination } from "@/components/ui/pagination";
import { listEventsPaged, countEvents } from "@/lib/queries/event";
import { createEvent, softDeleteEvent } from "@/lib/actions/event";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function KindBadge({ kind }: { kind: "webinar" | "offline" | "hybrid" }) {
  if (kind === "webinar")
    return (
      <Badge tone="brand">
        <Video className="h-3 w-3" /> Webinar
      </Badge>
    );
  if (kind === "hybrid")
    return (
      <Badge tone="gold">
        <MapPin className="h-3 w-3" /> Hybrid
      </Badge>
    );
  return (
    <Badge tone="muted">
      <MapPin className="h-3 w-3" /> Offline
    </Badge>
  );
}

function formatTanggal(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminEventPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [events, total] = await Promise.all([
    listEventsPaged(page, PAGE_SIZE),
    countEvents(),
  ]);

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

              <Field label="Lokasi" htmlFor="location" hint="Untuk acara offline / hybrid.">
                <Input id="location" name="location" placeholder="Mis. Masjid Agung Blitar" />
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
          <h2 className="display flex items-center gap-2 text-lg text-ink">
            <CalendarDays className="h-5 w-5 text-brand-600" /> Daftar Acara
          </h2>

          {events.length === 0 ? (
            <Card className="mt-4 grid place-items-center px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <CalendarDays className="h-7 w-7" />
              </span>
              <p className="display mt-3 text-lg text-ink">Belum ada acara</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Buat acara atau webinar pertama lewat formulir di samping agar muncul di halaman publik.
              </p>
            </Card>
          ) : (
            <div className="mt-4 space-y-3">
              {events.map((e) => (
                <Card key={e.id} className="flex items-start gap-3 p-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-sm bg-brand-600 text-white">
                    {e.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.coverImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <CalendarDays className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-bold leading-tight text-ink">{e.title}</p>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <KindBadge kind={e.kind} />
                        <Badge tone={e.status === "published" ? "success" : "muted"}>
                          {e.status === "published" ? "Terbit" : "Draf"}
                        </Badge>
                      </span>
                    </div>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" /> {formatTanggal(e.startAt)}
                      </span>
                      {e.location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {e.location}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" /> {e.registeredCount} pendaftar
                      </span>
                    </p>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                      <Button href={`/event/${e.slug}`} variant="ghost" size="sm">
                        <Eye className="h-3.5 w-3.5" /> Lihat Publik
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button href={`/admin/event/${e.id}`} variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <form action={softDeleteEvent}>
                          <input type="hidden" name="id" value={e.id} />
                          <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            className="bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {total > 0 ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/admin/event" />
          ) : null}
        </section>
      </div>
    </div>
  );
}
