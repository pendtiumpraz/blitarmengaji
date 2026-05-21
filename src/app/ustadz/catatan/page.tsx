import { FileText, Eye, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { auth } from "@/lib/auth";
import { createPost } from "@/lib/actions/posts";
import { listMyPosts } from "@/lib/queries/ustadz";
import { Summarize } from "./summarize";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function UstadzCatatanPage() {
  const session = await auth();
  const userId = session?.user?.id as string; // dijamin ada oleh layout guard
  const rows = await listMyPosts(userId);

  return (
    <div>
      <AdminPageHeader
        title="Catatan Saya"
        subtitle="Tulis catatan kajian atau artikel dakwah beserta cover, lalu publikasikan untuk jamaah Blitar Raya."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        {/* AI: RINGKAS TRANSKRIP → CATATAN */}
        <div className="lg:col-span-5">
          <Summarize />
        </div>

        {/* FORM */}
        <Card className="p-5 lg:col-span-5 lg:col-start-1">
          <h2 className="display text-lg text-ink">Tulis Catatan Baru</h2>
          <p className="mt-1 text-sm text-muted">
            Catatan langsung dipublikasikan setelah disimpan, atas nama Anda.
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
                className={textareaCls}
              />
            </Field>

            <FileUpload name="coverFile" accept="image/*" label="Cover" />

            <Field
              label="Isi Catatan"
              htmlFor="body"
              hint="Tiap baris kosong menjadi pemisah paragraf."
            >
              <textarea
                id="body"
                name="body"
                rows={8}
                required
                placeholder="Tulis isi catatan di sini…"
                className={textareaCls}
              />
            </Field>

            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Publikasikan Catatan
            </Button>
          </form>
        </Card>

        {/* DAFTAR */}
        <div className="lg:col-span-7">
          {rows.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <FileText className="h-7 w-7" />
              </span>
              <h2 className="display mt-4 text-lg text-ink">Belum ada catatan</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Tulis catatan kajian atau artikel pertama lewat formulir di samping agar tampil
                untuk jamaah.
              </p>
            </Card>
          ) : (
            <>
              <Table className="min-w-[480px]">
                <THead>
                  <TR>
                    <TH>Judul</TH>
                    <TH>Status</TH>
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
                          <span className="font-bold text-ink">{r.title}</span>
                        </div>
                      </TD>
                      <TD>
                        <Badge tone={r.status === "published" ? "success" : "muted"}>
                          {r.status === "published" ? "Terbit" : "Draft"}
                        </Badge>
                      </TD>
                      <TD className="text-muted">
                        {r.publishedAt
                          ? dateFmt.format(r.publishedAt)
                          : dateFmt.format(r.createdAt)}
                      </TD>
                      <TD className="text-right">
                        <a
                          href={`/catatan/${r.slug}`}
                          aria-label={`Lihat ${r.title}`}
                          title="Lihat"
                          className="inline-flex text-muted hover:text-brand-600"
                        >
                          <Eye className="h-4 w-4" />
                        </a>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <p className="mt-3 text-xs text-muted">
                Menampilkan {rows.length} catatan milik Anda.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
