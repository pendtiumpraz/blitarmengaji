import { notFound } from "next/navigation";
import { ArrowLeft, Info, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { getProductById } from "@/lib/queries/lapak";
import { updateProduct } from "@/lib/actions/lapak";

export const dynamic = "force-dynamic";

export default async function AdminLapakEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Edit Produk"
        subtitle="Perbarui detail produk UMKM jamaah Blitar Raya. Poster diunggah ke Vercel Blob."
        action={
          <Button href="/admin/lapak" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form action={updateProduct} className="max-w-2xl space-y-5">
        <input type="hidden" name="id" value={product.id} />
        <Card className="p-6">
          <h2 className="display text-lg text-ink">Detail Produk</h2>
          <p className="mt-1 text-sm text-muted">
            Unggah poster baru untuk mengganti; biarkan kosong untuk mempertahankan poster lama.
          </p>

          <div className="mt-5 space-y-4">
            <Field label="Nama produk" htmlFor="title">
              <Input
                id="title"
                name="title"
                placeholder="Mis. Kurma Ajwa Premium 500g"
                defaultValue={product.title}
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
                defaultValue={product.price ?? ""}
                required
              />
            </Field>

            <Field
              label="Kontak WhatsApp / link pesan"
              htmlFor="contactLink"
              hint="Mis. https://wa.me/62812xxxx atau nomor WA."
            >
              <Input
                id="contactLink"
                name="contactLink"
                placeholder="https://wa.me/62812xxxxxxx"
                defaultValue={product.contactLink ?? ""}
                required
              />
            </Field>

            <Field label="Status" htmlFor="status">
              <select
                id="status"
                name="status"
                required
                defaultValue={product.status}
                className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="active">Aktif (tampil di lapak)</option>
                <option value="inactive">Nonaktif (disembunyikan)</option>
              </select>
            </Field>

            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Detail produk, varian, dan keunggulan."
                defaultValue={product.description ?? ""}
                className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <FileUpload
              name="posterFile"
              accept="image/*"
              label="Poster produk"
              defaultUrl={product.posterImage}
            />

            <div className="flex items-start gap-2 rounded-sm bg-brand-50 px-3 py-2 text-[11px] text-brand-700">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Maksimal 3 produk aktif per partner usaha. Batas hanya diperiksa saat mengaktifkan
                produk yang sebelumnya nonaktif.
              </span>
            </div>
          </div>
        </Card>

        <div className="flex flex-wrap justify-end gap-2">
          <Button href="/admin/lapak" variant="outline" size="md">
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
