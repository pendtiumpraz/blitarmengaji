import { GraduationCap, Eye, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { FileUpload } from "@/components/ui/file-upload";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { createCourse } from "@/lib/actions/belajar";
import { getUstadzProfile, listMyCourses } from "@/lib/queries/ustadz";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function UstadzKelasPage() {
  const session = await auth();
  const userId = session?.user?.id as string; // dijamin ada oleh layout guard
  const profile = await getUstadzProfile(userId);
  const rows = await listMyCourses(profile?.id ?? null);

  return (
    <div>
      <AdminPageHeader
        title="Kelas Saya"
        subtitle="Buat dan kelola kelas online untuk jamaah Blitar Raya. Kelas terhubung otomatis dengan profil ustadz Anda."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* FORM */}
        <Card className="space-y-4 p-6 lg:col-span-1">
          <div>
            <h2 className="display text-lg text-ink">Buat Kelas Baru</h2>
            <p className="mt-1 text-xs text-muted">
              Kelas langsung dipublikasikan setelah disimpan.
            </p>
          </div>

          <form action={createCourse} className="space-y-4">
            <Field label="Judul" htmlFor="title">
              <Input
                id="title"
                name="title"
                placeholder="Mis. Belajar Tajwid dari Nol"
                required
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="slug"
              hint="Huruf kecil, angka, dan tanda hubung. Contoh: belajar-tajwid"
            >
              <Input id="slug" name="slug" placeholder="belajar-tajwid" required />
            </Field>

            <Field label="Level" htmlFor="level" hint="Opsional.">
              <select id="level" name="level" className={selectCls} defaultValue="">
                <option value="">Pilih level…</option>
                <option value="pemula">Pemula</option>
                <option value="menengah">Menengah</option>
                <option value="lanjut">Lanjut</option>
              </select>
            </Field>

            <Field label="Deskripsi" htmlFor="description" hint="Opsional — gambaran isi kelas.">
              <textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Ringkasan singkat kelas…"
                className={textareaCls}
              />
            </Field>

            <FileUpload name="coverFile" accept="image/*" label="Cover (opsional)" />

            <Button type="submit" variant="primary" className="w-full">
              <Plus className="h-4 w-4" /> Buat Kelas
            </Button>
          </form>
        </Card>

        {/* DAFTAR */}
        <div className="lg:col-span-2">
          {rows.length === 0 ? (
            <Card className="px-6 py-16 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <GraduationCap className="h-7 w-7" />
              </span>
              <h2 className="display mt-4 text-lg text-ink">Belum ada kelas</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                Buat kelas online pertama lewat formulir di samping agar jamaah bisa belajar.
              </p>
            </Card>
          ) : (
            <>
              <Table className="min-w-[520px]">
                <THead>
                  <TR>
                    <TH>Judul</TH>
                    <TH>Level</TH>
                    <TH>Status</TH>
                    <TH>Dibuat</TH>
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
                              <GraduationCap className="h-4 w-4" />
                            </span>
                          )}
                          <span className="font-bold text-ink">{r.title}</span>
                        </div>
                      </TD>
                      <TD className="capitalize text-ink">
                        {r.level ?? <span className="text-muted">—</span>}
                      </TD>
                      <TD>
                        <Badge tone={r.status === "published" ? "success" : "muted"}>
                          {r.status === "published" ? "Terbit" : "Draft"}
                        </Badge>
                      </TD>
                      <TD className="text-muted">{dateFmt.format(r.createdAt)}</TD>
                      <TD className="text-right">
                        <a
                          href={`/kelas/${r.slug}`}
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
                Menampilkan {rows.length} kelas milik Anda.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
