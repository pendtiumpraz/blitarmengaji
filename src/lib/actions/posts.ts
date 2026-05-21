"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server action untuk domain CATATAN (posts/blog).
 * Pola wajib (AGENTS.md §0 & §4): validasi Zod → cek RBAC → upload Blob NYATA
 * → tulis DB (soft delete via deletedAt/deletedBy) → revalidatePath + redirect.
 *
 * content_rich disimpan sebagai dokumen Tiptap minimal agar kompatibel dengan
 * renderer JSON di /catatan/[slug] (allow-list: doc → paragraph → text).
 */

const { posts } = schema;

/** Ambil id user yang sedang login (untuk authorUserId / deletedBy). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

/** Ubah string kosong menjadi undefined (konsisten dengan optional Zod & kolom nullable). */
function emptyToUndef(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : undefined;
}

type TiptapDoc = {
  type: "doc";
  content: Array<{
    type: "paragraph";
    content?: Array<{ type: "text"; text: string }>;
  }>;
};

/**
 * Bungkus teks polos (dari <textarea>) menjadi dokumen Tiptap minimal.
 * Tiap baris menjadi satu paragraf; baris kosong → paragraf kosong.
 * Aman dirender oleh renderer allow-list di halaman publik.
 */
function plainToTiptapDoc(body: string): TiptapDoc {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  return {
    type: "doc",
    content: lines.map((line) =>
      line.length > 0
        ? { type: "paragraph", content: [{ type: "text", text: line }] }
        : { type: "paragraph" },
    ),
  };
}

const createSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter.")
    .max(255)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  excerpt: z
    .string()
    .trim()
    .max(500, "Ringkasan maksimal 500 karakter.")
    .transform((v): string | null => (v === "" ? null : v))
    .optional(),
  body: z.string().trim().max(50000, "Isi catatan terlalu panjang."),
});

/**
 * Buat catatan baru. Upload `coverFile` NYATA ke Vercel Blob (catatan/cover),
 * simpan isi sebagai dokumen Tiptap, status published & publishedAt = now,
 * authorUserId dari sesi. Lalu revalidate + redirect ke daftar admin.
 */
export async function createPost(formData: FormData): Promise<void> {
  await requirePermission("blog.create");

  const userId = await currentUserId();

  const parsed = createSchema.safeParse({
    title: emptyToUndef(formData.get("title")) ?? "",
    slug: emptyToUndef(formData.get("slug")) ?? "",
    excerpt: typeof formData.get("excerpt") === "string" ? String(formData.get("excerpt")).trim() : "",
    body: typeof formData.get("body") === "string" ? String(formData.get("body")) : "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data catatan tidak valid.");
  }
  const data = parsed.data;

  // Upload cover NYATA ke Vercel Blob (null bila tidak ada berkas).
  const coverImage = await uploadToBlob(formData.get("coverFile") as File | null, "catatan/cover");

  await db.insert(posts).values({
    title: data.title,
    slug: data.slug,
    type: "catatan",
    authorUserId: userId,
    contentRich: plainToTiptapDoc(data.body),
    excerpt: data.excerpt ?? null,
    coverImage,
    status: "published",
    publishedAt: new Date(),
  });

  const ref = (await headers()).get("referer") ?? "";
  revalidatePath("/ustadz/catatan");
  revalidatePath("/admin/catatan");
  revalidatePath("/catatan");
  redirect(ref.includes("/ustadz") ? "/ustadz/catatan" : "/admin/catatan");
}

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID catatan tidak valid."),
});

/**
 * Perbarui catatan. Validasi Zod (+ id), upload cover BARU bila ada (pertahankan
 * cover lama bila kosong), update set updatedAt, lalu revalidate + redirect.
 * RBAC: blog.update.
 */
export async function updatePost(formData: FormData): Promise<void> {
  await requirePermission("blog.update");

  const parsed = updateSchema.safeParse({
    id: emptyToUndef(formData.get("id")) ?? "",
    title: emptyToUndef(formData.get("title")) ?? "",
    slug: emptyToUndef(formData.get("slug")) ?? "",
    excerpt: typeof formData.get("excerpt") === "string" ? String(formData.get("excerpt")).trim() : "",
    body: typeof formData.get("body") === "string" ? String(formData.get("body")) : "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data catatan tidak valid.");
  }
  const data = parsed.data;

  // Pastikan catatan ada & belum dihapus.
  const existing = (
    await db
      .select({ id: posts.id })
      .from(posts)
      .where(and(eq(posts.id, data.id), isNull(posts.deletedAt)))
      .limit(1)
  )[0];
  if (!existing) throw new Error("Catatan tidak ditemukan atau sudah dihapus.");

  // Upload cover BARU bila ada; pertahankan cover lama bila kosong.
  const newCover = await uploadToBlob(formData.get("coverFile") as File | null, "catatan/cover");

  await db
    .update(posts)
    .set({
      title: data.title,
      slug: data.slug,
      contentRich: plainToTiptapDoc(data.body),
      excerpt: data.excerpt ?? null,
      ...(newCover ? { coverImage: newCover } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(posts.id, data.id), isNull(posts.deletedAt)));

  revalidatePath("/admin/catatan");
  revalidatePath(`/admin/catatan/${data.id}`);
  revalidatePath("/catatan");
  redirect("/admin/catatan");
}

const deleteSchema = z.object({
  id: z.string().uuid("ID catatan tidak valid."),
});

/**
 * Soft delete catatan: set deleted_at = now() & deleted_by = user saat ini.
 * Cek RBAC (blog.delete). Tidak menghapus baris secara fisik (AGENTS.md §4).
 */
export async function softDeletePost(formData: FormData): Promise<void> {
  await requirePermission("blog.delete");

  const userId = await currentUserId();
  const { id } = deleteSchema.parse({ id: formData.get("id") });

  await db
    .update(posts)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(and(eq(posts.id, id), isNull(posts.deletedAt)));

  revalidatePath("/admin/catatan");
  revalidatePath("/catatan");
  redirect("/admin/catatan");
}
