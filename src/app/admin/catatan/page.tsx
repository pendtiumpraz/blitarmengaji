import { FileText, Eye, Pencil, Trash2, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { Pagination } from "@/components/ui/pagination";
import { listPostsPaged, countPosts } from "@/lib/queries/konten";
import { createPost, softDeletePost } from "@/lib/actions/posts";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminCatatanPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [rows, total] = await Promise.all([
    listPostsPaged(page, PAGE_SIZE),
    countPosts(),
  ]);

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
          {rows.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <FileText className="h-7 w-7" />
              </span>
              <h2 className="display mt-4 text-lg text-ink">Belum ada catatan</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Tulis catatan kajian atau artikel pertama lewat formulir di samping agar tampil untuk jamaah.
              </p>
            </Card>
          ) : (
            <>
              <Table className="min-w-[560px]">
                <THead>
                  <TR>
                    <TH>Judul</TH>
                    <TH>Penulis</TH>
                    <TH>Terbit</TH>
                    <TH className="text-right">Aksi</TH>
                  </TR>
                </THead>
                <tbody>
                  {rows.map((r) => (
                    <TR key={r.id} className="hover:bg-brand-50/50">
                      <TD>
                        <div className="flex items-center gap-3">
                          {r.coverImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={r.coverImage}
                              alt=""
                              className="h-10 w-10 shrink-0 rounded object-cover"
                            />
                          ) : (
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded bg-brand-50 text-brand-600">
                              <FileText className="h-4 w-4" />
                            </span>
                          )}
                          <div>
                            <div className="font-bold text-ink">{r.title}</div>
                            <Badge tone="muted">
                              {r.type === "artikel" ? "Artikel" : "Catatan"}
                            </Badge>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-ink">
                        {r.authorName ?? <span className="text-muted">—</span>}
                      </TD>
                      <TD className="text-muted">
                        {r.publishedAt ? dateFmt.format(r.publishedAt) : dateFmt.format(r.createdAt)}
                      </TD>
                      <TD className="text-right">
                        <span className="inline-flex items-center gap-3 text-muted">
                          <a
                            href={`/catatan/${r.slug}`}
                            aria-label={`Lihat ${r.title}`}
                            title="Lihat"
                            className="hover:text-brand-600"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                          <a
                            href={`/admin/catatan/${r.id}`}
                            aria-label={`Edit ${r.title}`}
                            title="Edit"
                            className="hover:text-brand-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </a>
                          <form action={softDeletePost} className="inline-flex">
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
                baseHref="/admin/catatan"
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
