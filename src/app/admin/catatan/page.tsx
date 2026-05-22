import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listPostsPaged, countPosts } from "@/lib/queries/konten";
import { createPost, softDeletePost } from "@/lib/actions/posts";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
};

const columns: Column[] = [
  { key: "title", label: "Judul", sortable: true },
  { key: "authorName", label: "Penulis", sortable: true, filter: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
  { key: "publishedAt", label: "Terbit", type: "date", sortable: true },
];

export default async function AdminCatatanPage() {
  // Ambil SEMUA catatan aktif (termasuk draft) dalam satu halaman; DataTable
  // menangani pencarian, filter, sortir, & pagination di sisi klien.
  const total = await countPosts();
  const all = await listPostsPaged(1, Math.max(1, total));

  const rows = all.map((r) => ({
    id: r.id,
    title: r.title,
    authorName: r.authorName ?? "—",
    status: STATUS_LABEL[r.status] ?? r.status,
    publishedAt: r.publishedAt ?? r.createdAt,
  }));

  return (
    <div>
      <AdminPageHeader
        title="Catatan & Artikel"
        subtitle="Tulis catatan kajian atau artikel dakwah beserta cover, lalu publikasikan untuk jamaah Blitar Raya."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* FORM CREATE */}
        <Card className="p-5 lg:col-span-5">
          <h2 className="display text-lg text-ink">Tulis Catatan Baru</h2>
          <p className="mt-1 text-sm text-muted">
            Catatan langsung dipublikasikan setelah disimpan.
          </p>

          <form action={createPost} className="mt-5 space-y-4">
            <Field label="Judul" htmlFor="title">
              <Input id="title" name="title" required placeholder="Misal: Adab Menuntut Ilmu" />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Huruf kecil, angka, dan tanda hubung. Contoh: adab-menuntut-ilmu"
            >
              <Input id="slug" name="slug" required placeholder="adab-menuntut-ilmu" />
            </Field>

            <Field label="Ringkasan" htmlFor="excerpt" hint="Opsional, tampil di daftar & pembuka.">
              <textarea
                id="excerpt"
                name="excerpt"
                rows={2}
                placeholder="Ringkasan singkat catatan…"
                className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <FileUpload name="coverFile" accept="image/*" label="Cover" />

            <Field label="Isi Catatan" htmlFor="body" hint="Tiap baris kosong menjadi pemisah paragraf.">
              <textarea
                id="body"
                name="body"
                rows={8}
                required
                placeholder="Tulis isi catatan di sini…"
                className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </Field>

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Publikasikan Catatan
            </Button>
          </form>
        </Card>

        {/* DAFTAR CATATAN */}
        <div className="lg:col-span-7">
          <DataTable
            columns={columns}
            rows={rows}
            editBase="/admin/catatan"
            deleteAction={softDeletePost}
            deleteConfirmText="Catatan akan dipindah ke Recycle Bin (bisa dipulihkan)."
            emptyText="Belum ada catatan."
          />
        </div>
      </div>
    </div>
  );
}
