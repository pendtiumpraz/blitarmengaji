import { ArrowLeft, GraduationCap, Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { getCourseById } from "@/lib/queries/belajar";
import { updateCourse } from "@/lib/actions/belajar";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function EditKelasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);
  if (!course) notFound();

  return (
    <div>
      <Link
        href="/admin/kelas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Kelas
      </Link>

      <AdminPageHeader
        title="Edit Kelas"
        subtitle="Perbarui informasi kelas online. Kosongkan unggahan cover bila ingin mempertahankan yang lama."
      />

      <Card className="max-w-2xl p-5">
        <h2 className="display mb-4 flex items-center gap-2 text-base text-ink">
          <GraduationCap className="h-5 w-5 text-brand-600" /> Detail Kelas
        </h2>

        <form action={updateCourse} className="space-y-4">
          <input type="hidden" name="id" value={course.id} />

          <Field label="Judul kelas" htmlFor="title">
            <Input id="title" name="title" required defaultValue={course.title} />
          </Field>

          <Field
            label="Slug (URL)"
            htmlFor="slug"
            hint="Huruf kecil, angka, dan tanda hubung. Mis. tahsin-quran-dasar"
          >
            <Input id="slug" name="slug" required defaultValue={course.slug} />
          </Field>

          <Field label="Level" htmlFor="level" hint="Opsional — tingkat kesulitan kelas.">
            <select id="level" name="level" className={selectCls} defaultValue={course.level ?? ""}>
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
              defaultValue={course.description ?? ""}
              placeholder="Jelaskan apa yang akan dipelajari di kelas ini…"
            />
          </Field>

          <FileUpload
            name="coverFile"
            accept="image/*"
            label="Cover Kelas"
            defaultUrl={course.coverImage}
          />

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button href="/admin/kelas" variant="ghost">
              Batal
            </Button>
            <Button type="submit" variant="gold">
              <Save className="h-4 w-4" /> Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
