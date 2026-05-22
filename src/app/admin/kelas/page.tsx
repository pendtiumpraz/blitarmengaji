import { GraduationCap, BookOpen, Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { DataTable, type Column } from "@/components/ui/data-table";
import { listCoursesAdmin } from "@/lib/queries/belajar";
import { createCourse, softDeleteCourse } from "@/lib/actions/belajar";

export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";
const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

const STATUS_LABEL: Record<string, string> = {
  published: "Terbit",
  draft: "Draf",
};

const columns: Column[] = [
  { key: "title", label: "Kelas", sortable: true, filter: false },
  { key: "level", label: "Level", sortable: true, filter: true },
  { key: "status", label: "Status", type: "badge", sortable: true, filter: true },
];

export default async function AdminKelasPage() {
  const courses = await listCoursesAdmin();
  const rows = courses.map((c) => ({
    id: c.id,
    title: c.title,
    level: c.level ?? "—",
    status: STATUS_LABEL[c.status] ?? c.status,
  }));

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

          <DataTable
            columns={columns}
            rows={rows}
            editBase="/admin/kelas"
            deleteAction={softDeleteCourse}
            deleteConfirmText="Kelas akan dipindah ke Recycle Bin (bisa dipulihkan)."
            emptyText="Belum ada kelas."
          />
        </div>
      </div>
    </div>
  );
}
