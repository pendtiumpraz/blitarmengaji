import { redirect } from "next/navigation";
import { Video, Link2, MapPin, Trash2, Plus, Play, ExternalLink, Radio, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, Input } from "@/components/ui/input";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { myTitikOptions, listVideos } from "@/lib/queries/media";
import { addVideo, deleteVideo, updateVideo } from "@/lib/actions/media";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function KelolaVideoPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const [titikOptions, perms] = await Promise.all([
    myTitikOptions(userId),
    getUserPermissions(userId),
  ]);
  const isSuper = perms.includes("*");

  // Guard: user wajib punya titik milik (atau akses penuh '*').
  if (titikOptions.length === 0 && !isSuper) {
    return (
      <div>
        <AdminPageHeader
          title="Video / Livestream"
          subtitle="Sematkan video & siaran langsung YouTube/Facebook untuk titik dakwah Anda."
        />
        <Card className="grid place-items-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <MapPin className="h-7 w-7" />
          </div>
          <p className="display mt-3 text-lg text-ink">Belum punya titik dakwah</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Anda belum mengelola titik dakwah mana pun. Daftarkan titik dakwah terlebih dahulu untuk
            menyematkan video atau siaran langsung.
          </p>
          <Button href="/admin/titik/baru" variant="gold" className="mt-5">
            <MapPin className="h-4 w-4" /> Daftarkan Titik Dakwah
          </Button>
        </Card>
      </div>
    );
  }

  const titikIds = titikOptions.map((t) => t.id);
  const videos = await listVideos(titikIds);

  return (
    <div>
      <AdminPageHeader
        title="Video / Livestream"
        subtitle="Sematkan tautan YouTube/Facebook (tanpa upload berat) dan tandai siaran LIVE."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ===== Form sematkan ===== */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
            <Link2 className="h-5 w-5 text-brand-600" /> Sematkan Video
          </h2>

          <form action={addVideo} className="space-y-4">
            <Field label="Titik dakwah" htmlFor="titikId">
              <select
                id="titikId"
                name="titikId"
                required
                className={selectCls}
                defaultValue={titikOptions.length === 1 ? titikOptions[0].id : ""}
              >
                <option value="" disabled>
                  Pilih titik dakwah…
                </option>
                {titikOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.kecamatan ? ` · ${t.kecamatan}` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Judul tayangan" htmlFor="title" hint="Opsional — judul yang tampil ke jamaah.">
              <Input id="title" name="title" placeholder="Mis. Kajian Subuh — Live YouTube" />
            </Field>

            <Field
              label="URL YouTube / Facebook"
              htmlFor="sourceUrl"
              hint="Tempel tautan video, mis. https://youtu.be/… atau https://fb.watch/…"
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 shrink-0 text-muted" />
                <Input id="sourceUrl" name="sourceUrl" type="url" required placeholder="https://youtu.be/…" />
              </div>
            </Field>

            <label className="flex items-center gap-2.5 rounded-sm border border-red-200 bg-red-50 px-3 py-2.5">
              <input
                type="checkbox"
                name="isLive"
                className="h-4 w-4 rounded border-line text-red-600 focus:ring-red-500"
              />
              <Radio className="h-4 w-4 text-red-600" />
              <span className="text-sm font-bold text-red-600">Tandai sebagai LIVE sekarang</span>
            </label>

            <Button type="submit" variant="gold" className="w-full">
              <Plus className="h-4 w-4" /> Sematkan Video
            </Button>
          </form>
        </Card>

        {/* ===== Daftar video ===== */}
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="display flex items-center gap-2 text-base text-ink">
                <Video className="h-5 w-5 text-brand-600" /> Daftar Video
              </h2>
              <span className="text-sm text-muted">{videos.length} video</span>
            </div>

            {videos.length === 0 ? (
              <div className="grid place-items-center rounded-sm border border-dashed border-line bg-brand-50/40 px-6 py-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Video className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold text-ink">Belum ada video</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Sematkan video atau siaran langsung pertama lewat formulir di samping.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {videos.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-sm border border-line bg-cream/60 p-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-16 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
                        <Play className="h-4 w-4" />
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
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
                            </Badge>
                          ) : null}
                          {v.titikName ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted">
                              <MapPin className="h-3 w-3" /> {v.titikName}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <a
                        href={v.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Buka video"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <form action={deleteVideo} className="shrink-0">
                        <input type="hidden" name="id" value={v.id} />
                        <button
                          type="submit"
                          aria-label="Hapus video"
                          className="grid h-9 w-9 place-items-center rounded-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>

                    {/* Edit video inline */}
                    <form
                      action={updateVideo}
                      className="mt-2.5 space-y-2 border-t border-line pt-2.5"
                    >
                      <input type="hidden" name="id" value={v.id} />
                      <Field label="Judul tayangan" htmlFor={`title-${v.id}`}>
                        <Input
                          id={`title-${v.id}`}
                          name="title"
                          defaultValue={v.title ?? ""}
                          placeholder="Mis. Kajian Subuh — Live YouTube"
                          className="h-9 text-xs"
                        />
                      </Field>
                      <Field label="URL YouTube / Facebook" htmlFor={`sourceUrl-${v.id}`}>
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 shrink-0 text-muted" />
                          <Input
                            id={`sourceUrl-${v.id}`}
                            name="sourceUrl"
                            type="url"
                            required
                            defaultValue={v.sourceUrl}
                            placeholder="https://youtu.be/…"
                            className="h-9 text-xs"
                          />
                        </div>
                      </Field>
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 rounded-sm border border-red-200 bg-red-50 px-2.5 py-1.5">
                          <input
                            type="checkbox"
                            name="isLive"
                            defaultChecked={v.isLive}
                            className="h-4 w-4 rounded border-line text-red-600 focus:ring-red-500"
                          />
                          <Radio className="h-3.5 w-3.5 text-red-600" />
                          <span className="text-xs font-bold text-red-600">LIVE sekarang</span>
                        </label>
                        <Button type="submit" variant="outline" size="sm" className="shrink-0">
                          <Save className="h-3.5 w-3.5" /> Simpan
                        </Button>
                      </div>
                    </form>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-[11px] text-muted">
              Video disimpan sebagai embed URL. Toggle LIVE memunculkan badge merah di aplikasi jamaah.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
