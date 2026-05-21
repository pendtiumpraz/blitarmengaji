import { ArrowLeft, FileText, Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { getLibraryById, listLibraryCategoryOptions } from "@/lib/queries/library";
import { updateLibraryItem } from "@/lib/actions/library";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function EditPustakaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, categoryOptions] = await Promise.all([
    getLibraryById(id),
    listLibraryCategoryOptions(),
  ]);
  if (!item) notFound();

  return (
    <div>
      <Link
        href="/admin/pustaka"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Perpustakaan
      </Link>

      <AdminPageHeader
        title="Edit Materi"
        subtitle="Perbarui materi PDF. Kosongkan unggahan PDF/cover bila ingin mempertahankan yang lama."
      />

      <Card className="max-w-2xl p-6">
        <form action={updateLibraryItem} className="space-y-4">
          <input type="hidden" name="id" value={item.id} />

          <Field label="Judul" htmlFor="title">
            <Input id="title" name="title" required defaultValue={item.title} />
          </Field>

          <Field label="Deskripsi" htmlFor="description" hint="Opsional — ringkasan isi materi.">
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={item.description ?? ""}
              placeholder="Ringkasan singkat materi…"
              className={`${selectCls} h-auto resize-y py-2.5`}
            />
          </Field>

          <Field label="Kategori" htmlFor="categoryId">
            {categoryOptions.length > 0 ? (
              <select
                id="categoryId"
                name="categoryId"
                className={selectCls}
                defaultValue={item.categoryId ?? ""}
              >
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

          <div className="rounded-sm border border-line bg-cream px-3 py-2.5 text-xs text-muted">
            <a
              href={item.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-brand-700 hover:text-brand-600"
            >
              <FileText className="h-3.5 w-3.5" /> Lihat PDF saat ini
            </a>
          </div>

          <FileUpload
            name="pdfFile"
            accept="application/pdf,.pdf"
            label="Ganti Berkas PDF (opsional)"
          />
          <FileUpload
            name="coverFile"
            accept="image/*"
            label="Cover (opsional)"
            defaultUrl={item.coverImage}
          />

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button href="/admin/pustaka" variant="ghost">
              Batal
            </Button>
            <Button type="submit" variant="primary">
              <Save className="h-4 w-4" /> Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
