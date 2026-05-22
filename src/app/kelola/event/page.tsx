import {
  CalendarDays,
  CalendarPlus,
  Eye,
  Link2,
  MapPin,
  Save,
  Store,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { TitikField } from "@/components/map/titik-field";
import { myBusinessPartners, myEvents } from "@/lib/queries/kelola-usaha";
import { listTitikActiveOptions } from "@/lib/queries/titik";
import { createEvent, softDeleteEvent } from "@/lib/actions/event";

export const dynamic = "force-dynamic";

const PERMS_OK = ["*", "event.create", "partner.manage_own"];

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
  return new Date(d).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default async function KelolaEventPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const perms = await getUserPermissions(userId);
  if (!perms.some((p) => PERMS_OK.includes(p))) redirect("/");

  const [partners, events, titikOptions] = await Promise.all([
    myBusinessPartners(userId),
    myEvents(userId),
    listTitikActiveOptions(),
  ]);

  const hasPartner = partners.length > 0;

  return (
    <div>
      <AdminPageHeader
        title="Kelola Event"
        subtitle="Adakan event atau webinar atas nama usaha Anda. Sampul diunggah ke Vercel Blob."
      />

      {!hasPartner ? (
        // Empty state: user belum punya partner usaha.
        <Card className="grid place-items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold-dark">
            <Store className="h-8 w-8" />
          </span>
          <p className="display mt-4 text-xl text-ink">Belum ada usaha terdaftar</p>
          <p className="mt-1.5 max-w-md text-sm text-muted">
            Anda belum memiliki profil partner usaha. Daftarkan usaha terlebih dahulu agar bisa
            menyelenggarakan event atau webinar untuk jamaah Blitar Raya.
          </p>
          <div className="mt-5">
            <Button href="/event" variant="outline" size="md">
              <CalendarDays className="h-4 w-4" /> Lihat Acara Publik
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          {/* Form buat acara */}
          <form action={createEvent} className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-6">
              <h2 className="display flex items-center gap-2 text-lg text-ink">
                <CalendarPlus className="h-5 w-5 text-brand-600" /> Buat Acara
              </h2>
              <p className="mt-1 text-sm text-muted">
                Sampul diunggah ke Vercel Blob. Acara langsung dipublikasikan.
              </p>

              <div className="mt-5 space-y-4">
                <Field label="Atas nama usaha" htmlFor="organizerId">
                  <select
                    id="organizerId"
                    name="organizerId"
                    required
                    defaultValue={partners.length === 1 ? partners[0].id : ""}
                    className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  >
                    <option value="" disabled>
                      Pilih usaha…
                    </option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.category ? ` · ${p.category}` : ""}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Judul acara" htmlFor="title">
                  <Input
                    id="title"
                    name="title"
                    placeholder="Mis. Webinar Bisnis Berkah"
                    required
                  />
                </Field>

                <Field
                  label="Slug"
                  htmlFor="slug"
                  hint="Untuk alamat URL, mis. webinar-bisnis-berkah (huruf kecil, tanpa spasi)."
                >
                  <Input id="slug" name="slug" placeholder="webinar-bisnis-berkah" required />
                </Field>

                <Field label="Jenis acara" htmlFor="kind">
                  <select
                    id="kind"
                    name="kind"
                    required
                    defaultValue="webinar"
                    className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  >
                    <option value="webinar">Webinar (daring)</option>
                    <option value="offline">Offline (tatap muka)</option>
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

                <Field label="Detail alamat (opsional)" htmlFor="location" hint="Pelengkap titik.">
                  <div className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                    <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                    <input
                      id="location"
                      name="location"
                      placeholder="Mis. Aula lantai 2"
                      className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                    />
                  </div>
                </Field>

                <Field label="Link daring" htmlFor="onlineUrl" hint="Untuk webinar / hybrid.">
                  <div className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                    <Link2 className="h-4 w-4 shrink-0 text-brand-600" />
                    <input
                      id="onlineUrl"
                      name="onlineUrl"
                      type="url"
                      placeholder="https://zoom.us/j/…"
                      className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                    />
                  </div>
                </Field>

                <Field label="Kapasitas" htmlFor="capacity" hint="Kosongkan bila tanpa batas.">
                  <Input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Mis. 100"
                  />
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
                  <input
                    type="checkbox"
                    name="needsRegistration"
                    className="h-4 w-4 rounded border-line"
                  />
                  Wajib pendaftaran peserta
                </label>

                <FileUpload name="coverFile" accept="image/*" label="Sampul acara" />

                <Button type="submit" size="md" className="w-full">
                  <Save className="h-4 w-4" /> Simpan & Publikasikan
                </Button>
              </div>
            </Card>
          </form>

          {/* Daftar acara milik usaha */}
          <section>
            <h2 className="display flex items-center gap-2 text-lg text-ink">
              <CalendarDays className="h-5 w-5 text-brand-600" /> Acara Usaha Anda
            </h2>

            {events.length === 0 ? (
              <Card className="mt-4 grid place-items-center px-6 py-16 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <CalendarDays className="h-7 w-7" />
                </span>
                <p className="display mt-3 text-lg text-ink">Belum ada acara</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Buat acara atau webinar pertama lewat formulir di samping agar muncul di halaman
                  publik jamaah.
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
                        <div className="flex shrink-0 items-center gap-1.5">
                          <KindBadge kind={e.kind} />
                          <Badge tone={e.status === "published" ? "success" : "muted"}>
                            {e.status === "published" ? "Terbit" : "Draft"}
                          </Badge>
                        </div>
                      </div>
                      {e.organizerName ? (
                        <p className="mt-0.5 text-[11px] text-muted">{e.organizerName}</p>
                      ) : null}
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatTanggal(e.startAt)}
                        </span>
                        {e.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {e.location}
                          </span>
                        ) : null}
                        {e.capacity != null ? (
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> Kuota {e.capacity}
                          </span>
                        ) : null}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                        <Button href={`/event/${e.slug}`} variant="ghost" size="sm">
                          <Eye className="h-3.5 w-3.5" /> Lihat Publik
                        </Button>
                        <form action={softDeleteEvent}>
                          <input type="hidden" name="id" value={e.id} />
                          <ConfirmSubmit
                            text="Acara akan dipindah ke Recycle Bin (bisa dipulihkan)."
                            className="inline-flex items-center gap-1.5 rounded-sm bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
