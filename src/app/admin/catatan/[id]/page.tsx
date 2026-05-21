import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { FileUpload } from "@/components/ui/file-upload";
import { getPostById } from "@/lib/queries/konten";
import { updatePost } from "@/lib/actions/posts";

export const dynamic = "force-dynamic";

/**
 * Ubah dokumen Tiptap minimal (doc → paragraph → text) kembali menjadi teks polos
 * agar bisa diisikan ke <textarea>. Tiap paragraf menjadi satu baris.
 */
function tiptapDocToPlain(doc: unknown): string {
  if (!doc || typeof doc !== "object") return "";
  const content = (doc as { content?: unknown }).content;
  if (!Array.isArray(content)) return "";
  return content
    .map((node) => {
      const inner = (node as { content?: unknown }).content;
      if (!Array.isArray(inner)) return "";
      return inner
        .map((t) => (typeof (t as { text?: unknown }).text === "string" ? (t as { text: string }).text : ""))
        .join("");
    })
    .join("\n");
}

export default async function EditCatatanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const bodyText = tiptapDocToPlain(post.contentRich);

  return (
    <div>
      <Link
        href="/admin/catatan"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Catatan
      </Link>

      <AdminPageHeader
        title="Edit Catatan"
        subtitle="Perbarui isi catatan atau artikel. Kosongkan unggahan cover bila ingin mempertahankan yang lama."
      />

      <Card className="max-w-2xl p-5">
        <form action={updatePost} className="space-y-4">
          <input type="hidden" name="id" value={post.id} />

          <Field label="Judul" htmlFor="title">
            <Input id="title" name="title" required defaultValue={post.title} />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            hint="Huruf kecil, angka, dan tanda hubung. Contoh: adab-menuntut-ilmu"
          >
            <Input id="slug" name="slug" required defaultValue={post.slug} />
          </Field>

          <Field label="Ringkasan" htmlFor="excerpt" hint="Opsional, tampil di daftar & pembuka.">
            <textarea
              id="excerpt"
              name="excerpt"
              rows={2}
              defaultValue={post.excerpt ?? ""}
              placeholder="Ringkasan singkat catatan…"
              className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </Field>

          <FileUpload
            name="coverFile"
            accept="image/*"
            label="Cover"
            defaultUrl={post.coverImage}
          />

          <Field label="Isi Catatan" htmlFor="body" hint="Tiap baris kosong menjadi pemisah paragraf.">
            <textarea
              id="body"
              name="body"
              rows={8}
              required
              defaultValue={bodyText}
              placeholder="Tulis isi catatan di sini…"
              className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button href="/admin/catatan" variant="ghost">
              Batal
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4" /> Simpan Perubahan
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
