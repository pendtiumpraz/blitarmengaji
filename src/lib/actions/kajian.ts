"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

const { kajian } = schema;

/** Ubah string kosong menjadi undefined (agar optional Zod & kolom nullable konsisten). */
function emptyToUndef(v: FormDataEntryValue | null): string | undefined {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 ? s : undefined;
}

const createSchema = z.object({
  title: z.string().min(3, "Judul kajian minimal 3 karakter."),
  slug: z
    .string()
    .min(3, "Slug minimal 3 karakter.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  ustadzId: z.string().uuid().optional(),
  titikDakwahId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  kitab: z.string().max(255).optional(),
  type: z.enum(["offline", "online", "hybrid"]),
  status: z.enum(["draft", "published"]),
});

/**
 * Buat kajian baru. Validasi Zod, cek RBAC (kajian.create), simpan ke tabel `kajian`,
 * revalidate halaman terkait, lalu redirect ke daftar admin.
 */
export async function createKajian(formData: FormData): Promise<void> {
  await requirePermission("kajian.create");

  const parsed = createSchema.parse({
    title: emptyToUndef(formData.get("title")),
    slug: emptyToUndef(formData.get("slug")),
    ustadzId: emptyToUndef(formData.get("ustadzId")),
    titikDakwahId: emptyToUndef(formData.get("titikDakwahId")),
    categoryId: emptyToUndef(formData.get("categoryId")),
    kitab: emptyToUndef(formData.get("kitab")),
    type: emptyToUndef(formData.get("type")) ?? "offline",
    status: emptyToUndef(formData.get("status")) ?? "draft",
  });

  const cover = await uploadToBlob(formData.get("coverFile") as File | null, "kajian/cover");

  await db.insert(kajian).values({
    title: parsed.title,
    slug: parsed.slug,
    ustadzId: parsed.ustadzId ?? null,
    titikDakwahId: parsed.titikDakwahId ?? null,
    categoryId: parsed.categoryId ?? null,
    kitab: parsed.kitab ?? null,
    type: parsed.type,
    status: parsed.status,
    coverImage: cover,
  });

  revalidatePath("/admin/kajian");
  revalidatePath("/kajian");
  redirect("/admin/kajian");
}

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID kajian tidak valid."),
});

/**
 * Ubah kajian. Validasi Zod, cek RBAC (kajian.update). Bila ada coverFile baru,
 * upload & ganti; bila kosong, pertahankan cover lama. Set updatedAt, revalidate,
 * lalu redirect ke daftar admin.
 */
export async function updateKajian(formData: FormData): Promise<void> {
  await requirePermission("kajian.update");

  const parsed = updateSchema.parse({
    id: emptyToUndef(formData.get("id")),
    title: emptyToUndef(formData.get("title")),
    slug: emptyToUndef(formData.get("slug")),
    ustadzId: emptyToUndef(formData.get("ustadzId")),
    titikDakwahId: emptyToUndef(formData.get("titikDakwahId")),
    categoryId: emptyToUndef(formData.get("categoryId")),
    kitab: emptyToUndef(formData.get("kitab")),
    type: emptyToUndef(formData.get("type")) ?? "offline",
    status: emptyToUndef(formData.get("status")) ?? "draft",
  });

  const newCover = await uploadToBlob(formData.get("coverFile") as File | null, "kajian/cover");

  await db
    .update(kajian)
    .set({
      title: parsed.title,
      slug: parsed.slug,
      ustadzId: parsed.ustadzId ?? null,
      titikDakwahId: parsed.titikDakwahId ?? null,
      categoryId: parsed.categoryId ?? null,
      kitab: parsed.kitab ?? null,
      type: parsed.type,
      status: parsed.status,
      // Pertahankan cover lama bila tidak ada berkas baru diunggah.
      ...(newCover ? { coverImage: newCover } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(kajian.id, parsed.id), isNull(kajian.deletedAt)));

  revalidatePath("/admin/kajian");
  revalidatePath("/kajian");
  redirect("/admin/kajian");
}

const deleteSchema = z.object({
  id: z.string().uuid("ID kajian tidak valid."),
});

/**
 * Soft delete kajian: set deleted_at = now() & deleted_by = user saat ini.
 * Cek RBAC (kajian.delete). Tidak menghapus baris secara fisik.
 */
export async function softDeleteKajian(formData: FormData): Promise<void> {
  await requirePermission("kajian.delete");

  const session = await auth();
  const { id } = deleteSchema.parse({ id: formData.get("id") });

  await db
    .update(kajian)
    .set({
      deletedAt: new Date(),
      deletedBy: session?.user?.id ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(kajian.id, id), isNull(kajian.deletedAt)));

  revalidatePath("/admin/kajian");
  revalidatePath("/kajian");
  redirect("/admin/kajian");
}
