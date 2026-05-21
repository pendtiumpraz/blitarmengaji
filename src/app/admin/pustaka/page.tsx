import { BookMarked, Download, FileText, Pencil, Save, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import {
  listLibraryPaged,
  countLibrary,
  listLibraryCategoryOptions,
} from "@/lib/queries/library";
import { createLibraryItem, softDeleteLibrary } from "@/lib/actions/library";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

/** Format ukuran berkas (bytes) menjadi KB/MB ramah baca. */
function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function AdminPustakaPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total, categoryOptions] = await Promise.all([
    listLibraryPaged(page, PAGE_SIZE),
    countLibrary(),
    listLibraryCategoryOptions(),
  ]);

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
          {rows.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <BookMarked className="h-7 w-7" />
              </span>
              <h2 className="display mt-4 text-lg text-ink">Belum ada materi</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Unggah berkas PDF pertama melalui formulir di samping agar tersedia untuk jamaah.
              </p>
            </Card>
          ) : (
            <>
              <Table className="min-w-[640px]">
                <THead>
                  <TR>
                    <TH>Judul</TH>
                    <TH>Penulis</TH>
                    <TH className="text-right">Ukuran</TH>
                    <TH className="text-right">Unduhan</TH>
                    <TH>Status</TH>
                    <TH className="text-right">Aksi</TH>
                  </TR>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TR key={r.id} className="hover:bg-brand-50/50">
                      <TD>
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded bg-brand-50 text-brand-600">
                            <FileText className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="font-bold text-ink">{r.title}</div>
                            {r.categoryName ? (
                              <div className="text-xs text-muted">{r.categoryName}</div>
                            ) : null}
                          </div>
                        </div>
                      </TD>
                      <TD className="text-ink">
                        {r.author ?? r.ustadzName ?? <span className="text-muted">—</span>}
                      </TD>
                      <TD className="text-right text-ink">{formatBytes(r.fileSize)}</TD>
                      <TD className="text-right text-ink">
                        <span className="inline-flex items-center gap-1">
                          <Download className="h-3.5 w-3.5 text-muted" />
                          {r.downloads}
                        </span>
                      </TD>
                      <TD>
                        <Badge tone={r.status === "published" ? "success" : "muted"}>
                          {r.status === "published" ? "Published" : "Draft"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <span className="inline-flex items-center gap-3 text-muted">
                          <a
                            href={r.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Buka PDF ${r.title}`}
                            title="Buka PDF"
                            className="hover:text-brand-600"
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                          <a
                            href={`/admin/pustaka/${r.id}`}
                            aria-label={`Edit ${r.title}`}
                            title="Edit"
                            className="hover:text-brand-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </a>
                          <form action={softDeleteLibrary} className="inline-flex">
                            <input type="hidden" name="id" value={r.id} />
                            <button
                              type="submit"
                              aria-label={`Hapus ${r.title}`}
                              title="Hapus"
                              className="hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </span>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={total}
                baseHref="/admin/pustaka"
              />

              <p className="mt-3 text-xs text-muted">
                Tombol Hapus melakukan <em>soft delete</em> (data masuk recycle bin, bukan
                dihapus permanen).
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
