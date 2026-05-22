import { redirect } from "next/navigation";
import {
  Radio,
  Video,
  Link2,
  Trash2,
  Plus,
  Play,
  ExternalLink,
  BadgeCheck,
  Clock,
  Globe,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { myMediaPartners, myMediaVideos } from "@/lib/queries/media-partner";
import { addMediaVideo, deleteMediaVideo } from "@/lib/actions/media-partner";

export const dynamic = "force-dynamic";

const PERMS_OK = ["*", "media.manage_own"];

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

function statusBadge(status: "active" | "pending" | "rejected") {
  if (status === "active") {
    return (
      <Badge tone="success">
        <BadgeCheck className="h-3.5 w-3.5" /> Terverifikasi
      </Badge>
    );
  }
  if (status === "rejected") {
    return <Badge tone="danger">Ditolak</Badge>;
  }
  return (
    <Badge tone="warning">
      <Clock className="h-3.5 w-3.5" /> Menunggu verifikasi
    </Badge>
  );
}

export default async function KelolaMediaPartnerPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const perms = await getUserPermissions(userId);
  if (!perms.some((p) => PERMS_OK.includes(p))) redirect("/");

  const [partners, videos] = await Promise.all([
    myMediaPartners(userId),
    myMediaVideos(userId),
  ]);

  const hasPartner = partners.length > 0;

  return (
    <div>
      <AdminPageHeader
        title="Media Partner"
        subtitle="Kelola profil kanal serta video & siaran langsung (YouTube/Facebook) yang tampil ke jamaah."
      />

      {!hasPartner ? (
        // Empty state: user belum terdaftar sebagai media partner.
        <Card className="grid place-items-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <Radio className="h-7 w-7" />
          </div>
          <p className="display mt-3 text-lg text-ink">Belum terdaftar sebagai media partner</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Akun Anda belum ditautkan ke kanal media partner mana pun. Hubungi admin Blitar Mengaji
            untuk pendaftaran kanal TV/radio/media dakwah Anda agar dapat menyematkan video dan
            siaran langsung.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* ===== Profil media partner milik user ===== */}
          <div className="space-y-4">
            {partners.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex items-center gap-4">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-brand-600 text-white">
                    {p.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.logo} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      <Radio className="h-7 w-7" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="display truncate text-lg text-ink">{p.name}</h2>
                      {statusBadge(p.status)}
                      <Badge tone="brand">Media Partner</Badge>
                    </div>
                    {p.description ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.description}</p>
                    ) : null}
                    {p.website ? (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700 hover:underline"
                      >
                        <Globe className="h-3 w-3" /> {p.website}
                      </a>
                    ) : null}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {/* ===== Form tambah video / livestream ===== */}
            <Card className="p-5 lg:col-span-2">
              <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
                <Link2 className="h-5 w-5 text-brand-600" /> Sematkan Video / Livestream
              </h2>

              <form action={addMediaVideo} className="space-y-4">
                <Field label="Media partner" htmlFor="mediaPartnerId">
                  <select
                    id="mediaPartnerId"
                    name="mediaPartnerId"
                    required
                    className={selectCls}
                    defaultValue={partners.length === 1 ? partners[0].id : ""}
                  >
                    <option value="" disabled>
                      Pilih media partner…
                    </option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="Judul tayangan"
                  htmlFor="title"
                  hint="Opsional — judul yang tampil ke jamaah."
                >
                  <Input id="title" name="title" placeholder="Mis. Live Kajian Subuh Hari Ini" />
                </Field>

                <Field
                  label="URL YouTube / Facebook"
                  htmlFor="sourceUrl"
                  hint="Tempel tautan, mis. https://youtu.be/… atau https://fb.watch/…"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 shrink-0 text-muted" />
                    <Input
                      id="sourceUrl"
                      name="sourceUrl"
                      type="url"
                      required
                      placeholder="https://youtu.be/…"
                    />
                  </div>
                </Field>

                <label className="flex items-center gap-2.5 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5">
                  <input
                    type="checkbox"
                    name="isLive"
                    className="h-4 w-4 rounded border-line text-red-600 focus:ring-red-500"
                  />
                  <Radio className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-bold text-red-600">
                    Tandai sebagai LIVE sekarang
                  </span>
                </label>

                <Button type="submit" variant="gold" className="w-full">
                  <Plus className="h-4 w-4" /> Sematkan
                </Button>
              </form>
            </Card>

            {/* ===== Daftar video / livestream ===== */}
            <div className="lg:col-span-3">
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="display flex items-center gap-2 text-base text-ink">
                    <Video className="h-5 w-5 text-brand-600" /> Video &amp; Livestream
                  </h2>
                  <span className="text-sm text-muted">{videos.length} tayangan</span>
                </div>

                {videos.length === 0 ? (
                  <div className="grid place-items-center rounded-sm border border-dashed border-line bg-brand-50/40 px-6 py-14 text-center">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                      <Video className="h-6 w-6" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-ink">Belum ada tayangan</p>
                    <p className="mt-1 max-w-sm text-sm text-muted">
                      Sematkan video atau siaran langsung pertama lewat formulir di samping.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {videos.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 rounded-sm border border-line bg-cream/60 p-2.5"
                      >
                        <div className="relative grid h-11 w-16 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
                          <Play className="h-4 w-4" />
                          {v.isLive ? (
                            <span className="absolute left-0.5 top-0.5 rounded bg-red-600 px-1 text-[8px] font-bold text-white">
                              ● LIVE
                            </span>
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">
                            {v.title ?? "Tanpa judul"}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <Badge tone={v.platform === "youtube" ? "danger" : "brand"}>
                              {v.platform === "youtube" ? "YouTube" : "Facebook"}
                            </Badge>
                            {v.isLive ? (
                              <Badge tone="danger" className="bg-red-100 text-red-600">
                                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />{" "}
                                LIVE
                              </Badge>
                            ) : null}
                            {v.mediaPartnerName ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                                <Radio className="h-3 w-3" /> {v.mediaPartnerName}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <a
                          href={v.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Buka tayangan"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <form action={deleteMediaVideo} className="shrink-0">
                          <input type="hidden" name="id" value={v.id} />
                          <ConfirmSubmit
                            aria-label="Hapus tayangan"
                            text="Tayangan akan dipindah ke Recycle Bin (bisa dipulihkan)."
                            className="grid h-9 w-9 place-items-center rounded-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmSubmit>
                        </form>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-[11px] text-muted">
                  Video disimpan sebagai embed URL (tanpa upload berat). Toggle LIVE memunculkan
                  badge merah berkedip di aplikasi jamaah.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
