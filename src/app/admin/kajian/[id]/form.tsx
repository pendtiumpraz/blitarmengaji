import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { TitikField } from "@/components/map/titik-field";
import { updateKajian } from "@/lib/actions/kajian";
import type { KajianEditItem } from "@/lib/queries/kajian";

type Option = { id: string; name: string };

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export function KajianEditForm({
  kajian,
  ustadzOptions,
  titikOptions,
  categoryOptions,
}: {
  kajian: KajianEditItem;
  ustadzOptions: Option[];
  titikOptions: Option[];
  categoryOptions: Option[];
}) {
  return (
    <form action={updateKajian} className="grid gap-5 lg:grid-cols-3">
      <input type="hidden" name="id" value={kajian.id} />

      {/* Kolom utama */}
      <Card className="space-y-4 p-6 lg:col-span-2">
        <Field label="Judul Kajian" htmlFor="title">
          <Input
            id="title"
            name="title"
            placeholder="Mis. Tafsir Al-Baqarah"
            defaultValue={kajian.title}
            required
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          hint="Huruf kecil, angka, dan tanda hubung. Mis. tafsir-al-baqarah."
        >
          <Input id="slug" name="slug" placeholder="tafsir-al-baqarah" defaultValue={kajian.slug} required />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ustadz / Pemateri" htmlFor="ustadzId">
            {ustadzOptions.length > 0 ? (
              <select id="ustadzId" name="ustadzId" className={selectCls} defaultValue={kajian.ustadzId ?? ""}>
                <option value="">Tanpa ustadz / pilih nanti…</option>
                {ustadzOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-xs text-muted">
                Belum ada profil ustadz. Tambahkan dahulu, lalu tautkan ke kajian ini.
              </p>
            )}
          </Field>

          <TitikField
            name="titikDakwahId"
            options={titikOptions}
            defaultValue={kajian.titikDakwahId ?? ""}
            label="Titik Dakwah / Lokasi"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kategori" htmlFor="categoryId">
            {categoryOptions.length > 0 ? (
              <select id="categoryId" name="categoryId" className={selectCls} defaultValue={kajian.categoryId ?? ""}>
                <option value="">Tanpa kategori…</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-xs text-muted">
                Belum ada kategori kajian.
              </p>
            )}
          </Field>

          <Field label="Kitab / Rujukan" htmlFor="kitab" hint="Opsional — judul kitab yang dibahas.">
            <Input
              id="kitab"
              name="kitab"
              placeholder="Mis. Tafsir Ibnu Katsir"
              defaultValue={kajian.kitab ?? ""}
            />
          </Field>
        </div>

        <FileUpload name="coverFile" accept="image/*" label="Cover Kajian" defaultUrl={kajian.coverImage} />
      </Card>

      {/* Kolom samping */}
      <div className="space-y-5">
        <Card className="space-y-4 p-6">
          <Field label="Tipe Kajian" htmlFor="type">
            <select id="type" name="type" className={selectCls} defaultValue={kajian.type}>
              <option value="offline">Offline</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>

          <Field label="Status" htmlFor="status" hint="Draft belum tampil di publik; Published tampil untuk jamaah.">
            <select id="status" name="status" className={selectCls} defaultValue={kajian.status}>
              <option value="draft">Draft (belum tampil)</option>
              <option value="published">Published (tampil di publik)</option>
            </select>
          </Field>

          <p className="rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-[11px] text-muted">
            Jadwal sesi (tanggal &amp; jam) dikelola terpisah dari form ini.
          </p>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" className="flex-1">
            <Save className="h-4 w-4" /> Simpan Perubahan
          </Button>
          <Button href="/admin/kajian" variant="ghost">
            <X className="h-4 w-4" /> Batal
          </Button>
        </div>
      </div>
    </form>
  );
}
