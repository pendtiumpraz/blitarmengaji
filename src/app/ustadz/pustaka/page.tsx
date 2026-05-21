import { BookMarked, FileText, Download, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { createLibraryItem } from "@/lib/actions/library";
import { getUstadzProfile, listMyLibrary } from "@/lib/queries/ustadz";

export const dynamic = "force-dynamic";

const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

/** Format ukuran berkas (bytes) menjadi KB/MB ramah baca. */
function formatBytes(bytes: number | null): string {
  if (bytes == null || bytes <= 0) return "—";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default async function UstadzPustakaPage() {
  const session = await auth();
  const userId = session?.user?.id as string; // dijamin ada oleh layout guard
  const profile = await getUstadzProfile(userId);
  const rows = await listMyLibrary(profile?.id ?? null);

  return (
    <div>
      <AdminPageHeader
        title="Pustaka Saya"
        subtitle="Unggah materi PDF kajian agar bisa diunduh jamaah Blitar Raya. Penulis tercatat otomatis dari akun Anda."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* FORM */}
        <Card className="space-y-4 p-6 lg:col-span-1">
          <div>
            <h2 className="display text-lg text-ink">Unggah Materi PDF</h2>
            <p className="mt-1 text-xs text-muted">
              Penulis tercatat otomatis dari akun ustadz yang masuk.
            </p>
          </div>

          <form action={createLibraryItem} className="space-y-4">
            <Field label="Judul" htmlFor="title">
              <Input
                id="title"
                name="title"
                placeholder="Mis. Ringkasan Fiqih Puasa"
                required
              />
            </Field>

            <Field label="Deskripsi" htmlFor="description" hint="Opsional — ringkasan isi materi.">
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Ringkasan singkat materi…"
                className={textareaCls}
              />
            </Field>

            <FileUpload name="pdfFile" accept="application/pdf,.pdf" label="Berkas PDF" />
            <FileUpload name="coverFile" accept="image/*" label="Cover (opsional)" />

            <Button type="submit" variant="primary" className="w-full">
              <Save className="h-4 w-4" /> Unggah ke Perpustakaan
            </Button>
          </form>
        </Card>

        {/* DAFTAR */}
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
              <Table className="min-w-[520px]">
                <THead>
                  <TR>
                    <TH>Judul</TH>
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
                          <span className="font-bold text-ink">{r.title}</span>
                        </div>
                      </TD>
                      <TD className="text-right text-ink">{formatBytes(r.fileSize)}</TD>
                      <TD className="text-right text-ink">
                        <span className="inline-flex items-center gap-1">
                          <Download className="h-3.5 w-3.5 text-muted" />
                          {r.downloads}
                        </span>
                      </TD>
                      <TD>
                        <Badge tone={r.status === "published" ? "success" : "gold"}>
                          {r.status === "published" ? "Terbit" : "Menunggu"}
                        </Badge>
                      </TD>
                      <TD className="text-right">
                        <a
                          href={r.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Buka PDF ${r.title}`}
                          title="Buka PDF"
                          className="inline-flex text-muted hover:text-brand-600"
                        >
                          <FileText className="h-4 w-4" />
                        </a>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>

              <p className="mt-3 text-xs text-muted">
                Menampilkan {rows.length} materi milik Anda.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
