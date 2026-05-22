import { Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listLibraryAdmin, listLibraryCategoryOptions } from "@/lib/queries/library";
import { createLibraryItem, softDeleteLibrary } from "@/lib/actions/library";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
};

const columns: Column[] = [
  { key: "title", label: "Judul", sortable: true },
  { key: "author", label: "Penulis", sortable: true, filter: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
  { key: "downloads", label: "Unduhan", sortable: true, className: "text-right" },
  { key: "fileSize", label: "Ukuran", className: "text-right" },
];

/** Format ukuran berkas (bytes) menjadi KB/MB ramah baca. */
function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function AdminPustakaPage() {
  // Ambil SEMUA materi aktif (termasuk draft); DataTable menangani pencarian,
  // filter, sortir, & pagination di sisi klien.
  const [all, categoryOptions] = await Promise.all([
    listLibraryAdmin(),
    listLibraryCategoryOptions(),
  ]);

  const rows = all.map((r) => ({
    id: r.id,
    title: r.title,
    author: r.author ?? r.ustadzName ?? "—",
    status: STATUS_LABEL[r.status] ?? r.status,
    downloads: r.downloads,
    fileSize: formatBytes(r.fileSize),
  }));

  return (
    <div>
      <AdminPageHeader
        title="Perpustakaan"
        subtitle="Unggah dan kelola materi PDF kajian agar bisa diunduh jamaah Blitar Raya."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Form unggah PDF */}
        <Card className="space-y-4 p-6 lg:col-span-1">
          <div>
            <h2 className="display text-lg text-ink">Unggah Materi PDF</h2>
            <p className="mt-1 text-xs text-muted">
              Penulis tercatat otomatis dari akun ustadz yang masuk.
            </p>
          </div>

          <form action={createLibraryItem} className="space-y-4">
            <Field label="Judul" htmlFor="title">
              <Input id="title" name="title" placeholder="Mis. Ringkasan Tafsir Al-Baqarah" required />
            </Field>

            <Field label="Deskripsi" htmlFor="description" hint="Opsional — ringkasan isi materi.">
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Ringkasan singkat materi…"
                className={`${selectCls} h-auto resize-y py-2.5`}
              />
            </Field>

            <Field label="Kategori" htmlFor="categoryId">
              {categoryOptions.length > 0 ? (
                <select id="categoryId" name="categoryId" className={selectCls} defaultValue="">
                  <option value="">Tanpa kategori…</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-xs text-muted">
                  Belum ada kategori perpustakaan.
                </p>
              )}
            </Field>

            <FileUpload name="pdfFile" accept="application/pdf,.pdf" label="Berkas PDF" />
            <FileUpload name="coverFile" accept="image/*" label="Cover (opsional)" />

            <Button type="submit" variant="primary" className="w-full">
              <Save className="h-4 w-4" /> Unggah
            </Button>
          </form>
        </Card>

        {/* Daftar materi */}
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            rows={rows}
            editBase="/admin/pustaka"
            deleteAction={softDeleteLibrary}
            deleteConfirmText="Materi akan dipindah ke Recycle Bin (bisa dipulihkan)."
            emptyText="Belum ada materi."
          />
        </div>
      </div>
    </div>
  );
}
