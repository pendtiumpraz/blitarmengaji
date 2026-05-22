"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server actions modul PERPUSTAKAAN (library_items).
 * Pola wajib (AGENTS.md §0 & §4): validasi Zod → cek RBAC → upload Blob NYATA →
 * tulis DB (soft delete via deletedAt/deletedBy) → revalidatePath + redirect.
 *
 * createLibraryItem: ustadz unggah PDF (perm 'library.upload').
 * softDeleteLibrary: kelola/hapus materi (perm 'library.manage').
 */

const { libraryItems, ustadzProfiles, users } = schema;

/** Buat slug aman dari nama (untuk profil ustadz otomatis bila belum ada). */
function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200) || "ustadz"
  );
}

/** Ambil id user yang sedang login (untuk deletedBy & resolusi ustadz). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

/**
 * Resolusi profil ustadz milik user yang login. Bila belum ada, buat otomatis
 * memakai NAMA dari sesi (uploader PDF wajib tercatat). Kembalikan { id, name }.
 */
async function resolveUstadz(userId: string): Promise<{ id: string; name: string }> {
  const profileRows = await db
    .select({ id: ustadzProfiles.id, name: ustadzProfiles.name })
    .from(ustadzProfiles)
    .where(and(eq(ustadzProfiles.userId, userId), isNull(ustadzProfiles.deletedAt)))
    .limit(1);

  if (profileRows[0]) return profileRows[0];

  // Belum punya profil → ambil nama dari tabel users, lalu buat profil baru.
  const userRows = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const name = userRows[0]?.name ?? "Ustadz";
  const slug = `${slugifyName(name)}-${userId.slice(0, 8)}`;

  const inserted = await db
    .insert(ustadzProfiles)
    .values({ userId, name, slug, status: "active" })
    .returning({ id: ustadzProfiles.id, name: ustadzProfiles.name });

  return inserted[0];
}

const optionalText = z
  .string()
  .trim()
  .transform((v): string | null => (v === "" ? null : v));

const createSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter.").max(255, "Judul terlalu panjang."),
  description: optionalText,
  categoryId: z
    .string()
    .trim()
    .transform((v): string | null => (v === "" ? null : v))
    .pipe(z.string().uuid("Kategori tidak valid.").nullable()),
});

/**
 * Buat materi PDF perpustakaan. Upload `pdfFile`→pdfUrl ('pustaka/pdf') &
 * `coverFile`→coverImage ('pustaka/cover'); fileSize diambil dari File.size PDF.
 * author + ustadzId dari sesi (uploader), status langsung 'published'.
 */
export async function createLibraryItem(formData: FormData): Promise<void> {
  await requirePermission("library.upload");

  const userId = await currentUserId();

  const parsed = createSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") ?? "",
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data materi tidak valid.";
    redirect("/admin/pustaka?err=" + encodeURIComponent(msg));
  }
  const data = parsed.data;

  // Berkas PDF WAJIB ada (pdf_url NOT NULL di skema).
  const pdfFile = formData.get("pdfFile");
  if (!(pdfFile instanceof File) || pdfFile.size === 0) {
    redirect("/admin/pustaka?err=" + encodeURIComponent("Berkas PDF wajib diunggah."));
  }

  const ustadz = await resolveUstadz(userId);

  // Upload berkas NYATA ke Vercel Blob.
  const pdfUrl = await uploadToBlob(pdfFile, "pustaka/pdf");
  if (!pdfUrl) {
    redirect("/admin/pustaka?err=" + encodeURIComponent("Gagal mengunggah berkas PDF."));
  }
  const coverImage = await uploadToBlob(formData.get("coverFile") as File | null, "pustaka/cover");

  await db.insert(libraryItems).values({
    title: data.title,
    description: data.description,
    author: ustadz.name,
    ustadzId: ustadz.id,
    categoryId: data.categoryId,
    pdfUrl,
    coverImage,
    fileSize: pdfFile.size,
    status: "published",
  });

  const ref = (await headers()).get("referer") ?? "";
  revalidatePath("/ustadz/pustaka");
  revalidatePath("/admin/pustaka");
  revalidatePath("/perpustakaan");
  const base = ref.includes("/ustadz") ? "/ustadz/pustaka" : "/admin/pustaka";
  redirect(base + "?ok=" + encodeURIComponent("Tersimpan."));
}

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID materi tidak valid."),
});

/**
 * Perbarui materi perpustakaan. Validasi Zod (+ id), upload PDF/cover BARU bila
 * ada (pertahankan lama bila kosong), fileSize ikut PDF baru, update updatedAt,
 * lalu revalidate + redirect. RBAC: library.manage.
 */
export async function updateLibraryItem(formData: FormData): Promise<void> {
  await requirePermission("library.manage");

  const parsed = updateSchema.safeParse({
    id: formData.get("id") ?? "",
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId") ?? "",
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data materi tidak valid.";
    redirect("/admin/pustaka?err=" + encodeURIComponent(msg));
  }
  const data = parsed.data;

  // Pastikan materi ada & belum dihapus.
  const existing = (
    await db
      .select({ id: libraryItems.id })
      .from(libraryItems)
      .where(and(eq(libraryItems.id, data.id), isNull(libraryItems.deletedAt)))
      .limit(1)
  )[0];
  if (!existing) {
    redirect(
      "/admin/pustaka?err=" + encodeURIComponent("Materi tidak ditemukan atau sudah dihapus."),
    );
  }

  // Upload PDF BARU bila ada (pertahankan lama bila kosong).
  const pdfFile = formData.get("pdfFile");
  const newPdfUrl =
    pdfFile instanceof File && pdfFile.size > 0
      ? await uploadToBlob(pdfFile, "pustaka/pdf")
      : null;
  // Upload cover BARU bila ada (pertahankan lama bila kosong).
  const newCover = await uploadToBlob(formData.get("coverFile") as File | null, "pustaka/cover");

  await db
    .update(libraryItems)
    .set({
      title: data.title,
      description: data.description,
      categoryId: data.categoryId,
      ...(newPdfUrl ? { pdfUrl: newPdfUrl, fileSize: (pdfFile as File).size } : {}),
      ...(newCover ? { coverImage: newCover } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(libraryItems.id, data.id), isNull(libraryItems.deletedAt)));

  revalidatePath("/admin/pustaka");
  revalidatePath(`/admin/pustaka/${data.id}`);
  revalidatePath("/perpustakaan");
  redirect("/admin/pustaka?ok=" + encodeURIComponent("Tersimpan."));
}

const softDeleteSchema = z.object({
  id: z.string().uuid("ID materi tidak valid."),
});

/**
 * Soft delete materi perpustakaan: set deleted_at = now() & deleted_by = user saat ini.
 * Cek RBAC (library.manage). Tidak menghapus baris secara fisik.
 */
export async function softDeleteLibrary(formData: FormData): Promise<void> {
  await requirePermission("library.manage");

  const userId = await currentUserId();
  const parsed = softDeleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Materi tidak valid.";
    redirect("/admin/pustaka?err=" + encodeURIComponent(msg));
  }

  await db
    .update(libraryItems)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(and(eq(libraryItems.id, parsed.data.id), isNull(libraryItems.deletedAt)));

  revalidatePath("/admin/pustaka");
  revalidatePath("/perpustakaan");
  redirect("/admin/pustaka?ok=" + encodeURIComponent("Dihapus."));
}
