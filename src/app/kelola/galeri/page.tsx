import { redirect } from "next/navigation";
import { Images, ImagePlus, MapPin, Trash2, Upload, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { myTitikOptions, listGallery } from "@/lib/queries/media";
import { addGalleryImage, deleteMedia, updateGalleryImage } from "@/lib/actions/media";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function KelolaGaleriPage() {
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
          title="Galeri"
          subtitle="Dokumentasikan kegiatan titik dakwah Anda dengan galeri foto."
        />
        <Card className="grid place-items-center px-6 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <MapPin className="h-7 w-7" />
          </div>
          <p className="display mt-3 text-lg text-ink">Belum punya titik dakwah</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Anda belum mengelola titik dakwah mana pun. Daftarkan titik dakwah terlebih dahulu untuk
            mulai mengunggah foto galeri.
          </p>
          <Button href="/admin/titik/baru" variant="gold" className="mt-5">
            <MapPin className="h-4 w-4" /> Daftarkan Titik Dakwah
          </Button>
        </Card>
      </div>
    );
  }

  const titikIds = titikOptions.map((t) => t.id);
  const photos = await listGallery(titikIds);

  return (
    <div>
      <AdminPageHeader
        title="Galeri"
        subtitle="Unggah & kelola foto dokumentasi kegiatan titik dakwah milik Anda."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ===== Form upload ===== */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
            <ImagePlus className="h-5 w-5 text-brand-600" /> Unggah Foto
          </h2>

          <form action={addGalleryImage} encType="multipart/form-data" className="space-y-4">
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

            <FileUpload name="imageFile" accept="image/*" label="Foto (JPG/PNG)" />

            <Field label="Keterangan" htmlFor="caption" hint="Opsional — keterangan singkat foto.">
              <Input id="caption" name="caption" placeholder="Mis. Kajian Subuh Ahad" />
            </Field>

            <Button type="submit" variant="gold" className="w-full">
              <Upload className="h-4 w-4" /> Unggah Foto
            </Button>

            <p className="text-[11px] text-muted">Format JPG/PNG · maks 5 MB/foto.</p>
          </form>
        </Card>

        {/* ===== Grid foto ===== */}
        <div className="lg:col-span-3">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="display flex items-center gap-2 text-base text-ink">
                <Images className="h-5 w-5 text-brand-600" /> Galeri Foto
              </h2>
              <span className="text-sm text-muted">{photos.length} foto</span>
            </div>

            {photos.length === 0 ? (
              <div className="grid place-items-center rounded-sm border border-dashed border-line bg-brand-50/40 px-6 py-14 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Images className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold text-ink">Belum ada foto</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Unggah foto pertama lewat formulir di samping untuk mendokumentasikan kegiatan
                  titik dakwah Anda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {photos.map((p) => (
                  <div
                    key={p.id}
                    className="overflow-hidden rounded-sm border border-line bg-cream"
                  >
                    <div className="group relative aspect-video overflow-hidden bg-cream">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt={p.caption ?? "Foto galeri"}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <form action={deleteMedia}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmit
                            aria-label="Hapus foto"
                            text="Foto akan dipindah ke Recycle Bin (bisa dipulihkan)."
                            className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </ConfirmSubmit>
                        </form>
                      </div>
                    </div>
                    {/* Edit caption inline */}
                    <form action={updateGalleryImage} className="space-y-2 p-2.5">
                      <input type="hidden" name="id" value={p.id} />
                      <Input
                        name="caption"
                        defaultValue={p.caption ?? ""}
                        placeholder="Keterangan foto…"
                        className="h-9 text-xs"
                      />
                      <div className="flex items-center justify-between gap-2">
                        {p.titikName ? (
                          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{p.titikName}</span>
                          </span>
                        ) : (
                          <span />
                        )}
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
              Ubah keterangan lalu klik Simpan. Arahkan kursor ke foto untuk menghapus.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
