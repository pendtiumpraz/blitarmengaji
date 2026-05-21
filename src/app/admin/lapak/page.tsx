import { Eye, Info, Pencil, Save, Store, Tag, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Pagination } from "@/components/ui/pagination";
import {
  listProductsPaged,
  countProducts,
  listBusinessPartners,
} from "@/lib/queries/lapak";
import { createProduct, softDeleteProduct } from "@/lib/actions/lapak";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

function rupiah(price: string | null) {
  if (price == null) return "—";
  const n = Number(price);
  if (!Number.isFinite(n)) return "—";
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function AdminLapakPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [products, total, partners] = await Promise.all([
    listProductsPaged(page, PAGE_SIZE),
    countProducts(),
    listBusinessPartners(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Lapak Jamaah"
        subtitle="Kelola produk UMKM jamaah Blitar Raya. Poster diunggah ke Vercel Blob."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* Form tambah produk */}
        <form action={createProduct} className="space-y-5">
          <Card className="p-6">
            <h2 className="display text-lg text-ink">Tambah Produk</h2>
            <p className="mt-1 text-sm text-muted">Produk langsung tampil aktif di lapak.</p>

            <div className="mt-5 space-y-4">
              <Field label="Partner usaha" htmlFor="businessPartnerId">
                <select
                  id="businessPartnerId"
                  name="businessPartnerId"
                  required
                  defaultValue=""
                  className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                  disabled={partners.length === 0}
                >
                  <option value="" disabled>
                    {partners.length === 0 ? "Belum ada partner usaha aktif" : "Pilih partner usaha…"}
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
                <Input id="title" name="title" placeholder="Mis. Kurma Ajwa Premium 500g" required />
              </Field>

              <Field label="Harga" htmlFor="price" hint="Dalam Rupiah, angka saja (mis. 75000).">
                <Input id="price" name="price" type="number" min={0} inputMode="numeric" placeholder="75000" required />
              </Field>

              <Field
                label="Kontak WhatsApp / link pesan"
                htmlFor="contactLink"
                hint="Mis. https://wa.me/62812xxxx atau nomor WA."
              >
                <Input id="contactLink" name="contactLink" placeholder="https://wa.me/62812xxxxxxx" required />
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
                <span>Maksimal 3 produk aktif per partner usaha. Hapus produk lama untuk menambah baru.</span>
              </div>

              <Button type="submit" size="md" className="w-full" disabled={partners.length === 0}>
                <Save className="h-4 w-4" /> Simpan Produk
              </Button>
            </div>
          </Card>
        </form>

        {/* Daftar produk */}
        <section>
          <h2 className="display flex items-center gap-2 text-lg text-ink">
            <Store className="h-5 w-5 text-brand-600" /> Produk Lapak
          </h2>

          {products.length === 0 ? (
            <Card className="mt-4 grid place-items-center px-6 py-16 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Store className="h-7 w-7" />
              </span>
              <p className="display mt-3 text-lg text-ink">Belum ada produk</p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Tambah produk UMKM jamaah lewat formulir di samping. Maksimal 3 produk aktif per partner usaha.
              </p>
            </Card>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {products.map((p) => (
                <Card key={p.id} className="flex flex-col p-4">
                  <div className="flex items-start gap-3">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-sm bg-brand-600 text-white">
                      {p.posterImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.posterImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Store className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-bold leading-tight text-ink">{p.title}</p>
                        <Badge tone={p.status === "active" ? "success" : "muted"}>
                          {p.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">{p.partnerName}</p>
                      <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-brand-700">
                        <Tag className="h-3.5 w-3.5" /> {rupiah(p.price)}
                      </p>
                      {p.partnerCategory ? (
                        <Badge tone="muted" className="mt-1.5">
                          {p.partnerCategory}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                    <Button href="/lapak" variant="ghost" size="sm">
                      <Eye className="h-3.5 w-3.5" /> Lihat Publik
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button href={`/admin/lapak/${p.id}`} variant="ghost" size="sm">
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <form action={softDeleteProduct}>
                        <input type="hidden" name="id" value={p.id} />
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
                </Card>
              ))}
            </div>
          )}

          {total > 0 ? (
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} baseHref="/admin/lapak" />
          ) : null}

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
            <Info className="h-3.5 w-3.5" /> Kebijakan lapak: maksimal 3 produk aktif per partner usaha.
          </p>
        </section>
      </div>
    </div>
  );
}
