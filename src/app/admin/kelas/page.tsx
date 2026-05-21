import { GraduationCap, BookOpen, Trash2, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { listCoursesPaged, countCourses } from "@/lib/queries/belajar";
import { createCourse, softDeleteCourse } from "@/lib/actions/belajar";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function AdminKelasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [courses, total] = await Promise.all([
    listCoursesPaged(page, PAGE_SIZE),
    countCourses(),
  ]);

  return (
    <div>
      <AdminPageHeader
        title="Kelas Online"
        subtitle="Buat dan kelola kelas online dari para ustadz Blitar Raya. Unggah cover kelas, atur level, lalu publikasikan untuk jamaah."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        {/* ===== Form Buat Kelas ===== */}
        <Card className="p-5 lg:col-span-2">
          <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
            <GraduationCap className="h-5 w-5 text-brand-600" /> Buat Kelas Baru
          </h2>

          <form action={createCourse} className="space-y-4">
            <Field label="Judul kelas" htmlFor="title">
              <Input id="title" name="title" required placeholder="Mis. Tahsin Al-Qur'an Dasar" />
            </Field>

            <Field
              label="Slug (URL)"
              htmlFor="slug"
              hint="Huruf kecil, angka, dan tanda hubung. Mis. tahsin-quran-dasar"
            >
              <Input id="slug" name="slug" required placeholder="tahsin-quran-dasar" />
            </Field>

            <Field label="Level" htmlFor="level" hint="Opsional — tingkat kesulitan kelas.">
              <select id="level" name="level" className={selectCls} defaultValue="">
                <option value="">— Pilih level —</option>
                <option value="pemula">Pemula</option>
                <option value="menengah">Menengah</option>
                <option value="lanjut">Lanjut</option>
              </select>
            </Field>

            <Field label="Deskripsi" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={4}
                className={textareaCls}
                placeholder="Jelaskan apa yang akan dipelajari di kelas ini…"
              />
            </Field>

            <FileUpload name="coverFile" accept="image/*" label="Cover Kelas" />

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button type="submit" variant="gold">
                <Plus className="h-4 w-4" /> Simpan Kelas
              </Button>
            </div>
          </form>
        </Card>

        {/* ===== Daftar Kelas ===== */}
        <div className="lg:col-span-3">
          <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
            <BookOpen className="h-5 w-5 text-brand-600" /> Daftar Kelas
          </h2>

          {courses.length === 0 ? (
            <Card className="grid place-items-center px-6 py-14 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
                <GraduationCap className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <p className="display mt-3 text-lg text-ink">Belum ada kelas</p>
              <p className="mt-1 max-w-md text-sm text-muted">
                Buat kelas online pertama dari formulir di samping agar jamaah bisa belajar gratis.
              </p>
            </Card>
          ) : (
            <>
            <Table>
              <THead>
                <TR>
                  <TH>Kelas</TH>
                  <TH>Level</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Aksi</TH>
                </TR>
              </THead>
              <tbody>
                {courses.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        {c.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.coverImage}
                            alt={c.title}
                            className="h-10 w-14 shrink-0 rounded-sm object-cover"
                          />
                        ) : (
                          <span className="grid h-10 w-14 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
                            <GraduationCap className="h-5 w-5" strokeWidth={1.5} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-bold text-ink">{c.title}</p>
                          <p className="truncate text-[11px] text-muted">
                            /{c.slug}
                            {c.ustadzName ? ` · ${c.ustadzName}` : ""}
                          </p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className="capitalize text-muted">{c.level ?? "—"}</span>
                    </TD>
                    <TD>
                      {c.status === "published" ? (
                        <Badge tone="success">Terbit</Badge>
                      ) : (
                        <Badge tone="muted">Draf</Badge>
                      )}
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button href={`/kelas/${c.slug}`} variant="ghost" size="sm">
                          Lihat
                        </Button>
                        <Button href={`/admin/kelas/${c.id}`} variant="outline" size="sm">
                          Edit
                        </Button>
                        <form action={softDeleteCourse}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button
                            type="submit"
                            variant="danger"
                            size="sm"
                            className="bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Hapus
                          </Button>
                        </form>
                      </div>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              baseHref="/admin/kelas"
            />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
