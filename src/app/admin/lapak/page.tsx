import { Info, Save, Store } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listProductsPaged, listBusinessPartners } from "@/lib/queries/lapak";
import { createProduct, softDeleteProduct } from "@/lib/actions/lapak";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Aktif",
  inactive: "Nonaktif",
};

const columns: Column[] = [
  { key: "title", label: "Produk", sortable: true },
  { key: "partnerName", label: "Partner", sortable: true, filter: true },
  { key: "price", label: "Harga", type: "money", sortable: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

export default async function AdminLapakPage() {
  // Ambil SEMUA produk (semua status, belum dihapus) + daftar partner aktif untuk form.
  const [products, partners] = await Promise.all([
    listProductsPaged(1, 100000),
    listBusinessPartners(),
  ]);

  const rows = products.map((p) => ({
    id: p.id,
    title: p.title,
    partnerName: p.partnerName,
    price: p.price ?? "",
    status: STATUS_LABEL[p.status] ?? p.status,
  }));

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
          <h2 className="display mb-4 flex items-center gap-2 text-lg text-ink">
            <Store className="h-5 w-5 text-brand-600" /> Produk Lapak
          </h2>

          <DataTable
            columns={columns}
            rows={rows}
            editBase="/admin/lapak"
            deleteAction={softDeleteProduct}
            deleteConfirmText="Produk akan dipindah ke Recycle Bin (bisa dipulihkan)."
            emptyText="Belum ada produk."
          />

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
            <Info className="h-3.5 w-3.5" /> Kebijakan lapak: maksimal 3 produk aktif per partner usaha.
          </p>
        </section>
      </div>
    </div>
  );
}
