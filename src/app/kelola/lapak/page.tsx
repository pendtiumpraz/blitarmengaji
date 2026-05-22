import {
  Info,
  MessageCircle,
  PlusCircle,
  Save,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
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
import { myBusinessPartners, myProducts } from "@/lib/queries/kelola-usaha";
import { createProduct, softDeleteProduct } from "@/lib/actions/lapak";

export const dynamic = "force-dynamic";

const PERMS_OK = ["*", "lapak.manage_own", "partner.manage_own"];

function rupiah(price: string | null) {
  if (price == null) return "—";
  const n = Number(price);
  if (!Number.isFinite(n)) return "—";
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function KelolaLapakPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const perms = await getUserPermissions(userId);
  if (!perms.some((p) => PERMS_OK.includes(p))) redirect("/");

  const [partners, { products, activeCount, maxActive, remaining }] = await Promise.all([
    myBusinessPartners(userId),
    myProducts(userId),
  ]);

  const hasPartner = partners.length > 0;

  // Indikator slot: tiap segmen mewakili 1 kuota produk aktif.
  const slots = Array.from({ length: maxActive }, (_, i) => i < activeCount);

  return (
    <div>
      <AdminPageHeader
        title="Kelola Lapak"
        subtitle="Kelola produk UMKM usaha Anda. Maksimal 3 produk aktif per usaha — poster diunggah ke Vercel Blob."
      />

      {!hasPartner ? (
        // Empty state: user belum punya partner usaha aktif.
        <Card className="grid place-items-center px-6 py-16 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-gold/15 text-gold-dark">
            <Store className="h-8 w-8" />
          </span>
          <p className="display mt-4 text-xl text-ink">Belum ada usaha terdaftar</p>
          <p className="mt-1.5 max-w-md text-sm text-muted">
            Anda belum memiliki profil partner usaha. Ajukan pendaftaran usaha terlebih dahulu agar
            bisa membuka lapak dan menambahkan produk. Tim admin akan meninjau pengajuan Anda.
          </p>
          <div className="mt-5">
            <Button href="/lapak" variant="outline" size="md">
              <ShoppingBag className="h-4 w-4" /> Lihat Lapak Publik
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,360px)]">
          {/* Daftar produk + indikator kuota */}
          <section className="space-y-4">
            <Card className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="display flex items-center gap-2 text-lg text-ink">
                  <ShoppingBag className="h-5 w-5 text-brand-600" /> Produk Aktif
                </p>
                <Badge tone={remaining > 0 ? "brand" : "warning"}>
                  {activeCount}/{maxActive} produk aktif
                </Badge>
              </div>

              {/* Bar indikator kuota slot */}
              <div className="mt-3 flex gap-1.5">
                {slots.map((filled, i) => (
                  <span
                    key={i}
                    className={
                      "h-2 flex-1 rounded-full " + (filled ? "bg-brand-500" : "bg-black/10")
                    }
                  />
                ))}
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted">
                <Info className="h-3.5 w-3.5 shrink-0" />
                {remaining > 0
                  ? `Sisa ${remaining} slot. Tambah produk lewat formulir di samping.`
                  : "Kuota penuh. Hapus produk lama untuk menambah produk baru."}
              </p>
            </Card>

            {products.length === 0 ? (
              <Card className="grid place-items-center px-6 py-14 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Store className="h-7 w-7" />
                </span>
                <p className="display mt-3 text-lg text-ink">Belum ada produk</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  Tambah produk pertama usaha Anda lewat formulir di samping agar tampil di lapak
                  jamaah Blitar Raya.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {products.map((p) => (
                  <Card key={p.id} className="flex flex-col overflow-hidden">
                    <div className="grid h-28 place-items-center overflow-hidden bg-brand-600 text-white">
                      {p.posterImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.posterImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-8 w-8 opacity-80" />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold leading-tight text-ink">{p.title}</p>
                        <Badge tone={p.status === "active" ? "success" : "muted"}>
                          {p.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">{p.partnerName}</p>
                      <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
                        <Tag className="h-3.5 w-3.5" /> {rupiah(p.price)}
                      </p>
                      {p.partnerCategory ? (
                        <Badge tone="muted" className="mt-2 self-start">
                          {p.partnerCategory}
                        </Badge>
                      ) : null}

                      <div className="mt-auto flex justify-end border-t border-line pt-3">
                        <form action={softDeleteProduct}>
                          <input type="hidden" name="id" value={p.id} />
                          <ConfirmSubmit
                            text="Produk akan dipindah ke Recycle Bin (bisa dipulihkan)."
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

          {/* Form tambah produk */}
          <form action={createProduct} className="lg:sticky lg:top-6 lg:self-start">
            <Card className="p-6">
              <h2 className="display flex items-center gap-2 text-lg text-ink">
                <PlusCircle className="h-5 w-5 text-brand-600" /> Tambah Produk
              </h2>
              <p className="mt-1 text-sm text-muted">Produk langsung tampil aktif di lapak.</p>

              <div className="mt-5 space-y-4">
                <Field label="Usaha" htmlFor="businessPartnerId">
                  <select
                    id="businessPartnerId"
                    name="businessPartnerId"
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

                <Field label="Nama produk" htmlFor="title">
                  <Input
                    id="title"
                    name="title"
                    placeholder="Mis. Kurma Ajwa Premium 500g"
                    required
                  />
                </Field>

                <Field label="Harga" htmlFor="price" hint="Dalam Rupiah, angka saja (mis. 75000).">
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="75000"
                    required
                  />
                </Field>

                <Field
                  label="Kontak WhatsApp / link pesan"
                  htmlFor="contactLink"
                  hint="Mis. https://wa.me/62812xxxx atau nomor WA aktif."
                >
                  <div className="flex items-center gap-2 rounded-sm border border-line bg-surface px-3 focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-600/20">
                    <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                    <input
                      id="contactLink"
                      name="contactLink"
                      placeholder="https://wa.me/62812xxxxxxx"
                      required
                      className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
                    />
                  </div>
                </Field>

                <Field label="Deskripsi" htmlFor="description">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="Detail produk, varian, dan keunggulan."
                    className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  />
                </Field>

                <FileUpload name="posterFile" accept="image/*" label="Poster produk" />

                <div className="flex items-start gap-2 rounded-sm bg-brand-50 px-3 py-2 text-[11px] text-brand-700">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    Maksimal {maxActive} produk aktif per usaha.{" "}
                    {remaining > 0
                      ? `Sisa ${remaining} slot.`
                      : "Kuota penuh — hapus produk lama dahulu."}
                  </span>
                </div>

                <Button type="submit" size="md" className="w-full" disabled={remaining === 0}>
                  <Save className="h-4 w-4" /> Simpan Produk
                </Button>
              </div>
            </Card>
          </form>
        </div>
      )}
    </div>
  );
}
