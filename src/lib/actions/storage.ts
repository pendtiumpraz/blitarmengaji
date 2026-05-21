"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { encryptToken } from "@/lib/storage";

/**
 * Server actions (MUTATION) untuk domain STORAGE (Vercel Blob per-entitas).
 * - RBAC: tiap action WAJIB requirePermission('storage.manage') (lihat AGENTS.md §4).
 * - KEAMANAN: token plaintext diambil dari form, langsung dienkripsi AES-256-GCM
 *   (encryptToken) dan HANYA ciphertext/iv/tag yang disimpan. Token plaintext
 *   TIDAK PERNAH di-select / di-return ke client.
 * - Soft delete: set deletedAt + deletedBy, JANGAN DELETE fisik.
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const ownerTypeEnum = z.enum(["global", "user", "titik", "media", "partner", "ustadz"], {
  message: "Jenis pemilik storage tidak valid.",
});

// ── createStorageConfig ─────────────────────────────────────────────────────────

const createSchema = z.object({
  label: z.string().trim().min(2, "Label minimal 2 karakter."),
  token: z.string().trim().min(8, "Token Blob terlalu pendek."),
  ownerType: ownerTypeEnum,
  ownerId: z.string().uuid("ID pemilik tidak valid.").optional(),
  isDefault: z.boolean(),
});

/**
 * Buat konfigurasi storage baru. Token plaintext dienkripsi (AES-256-GCM) sebelum
 * disimpan; provider tetap 'vercel_blob', status default 'active'.
 */
export async function createStorageConfig(formData: FormData): Promise<void> {
  await requirePermission("storage.manage");

  const parsed = createSchema.safeParse({
    label: opt(formData.get("label")),
    token: opt(formData.get("token")),
    ownerType: opt(formData.get("ownerType")) ?? "global",
    ownerId: opt(formData.get("ownerId")),
    isDefault: formData.get("isDefault") != null,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;

  // Enkripsi token storage SEKARANG — plaintext tidak pernah masuk DB.
  const { ciphertext, iv, tag } = encryptToken(data.token);

  await db.insert(schema.storageConfigs).values({
    label: data.label,
    provider: "vercel_blob",
    ownerType: data.ownerType,
    ownerId: data.ownerType === "global" ? null : (data.ownerId ?? null),
    tokenCiphertext: ciphertext,
    tokenIv: iv,
    tokenTag: tag,
    isDefault: data.isDefault,
    status: "active",
  });

  revalidatePath("/admin/storage");
}

// ── softDeleteStorageConfig ─────────────────────────────────────────────────────

const deleteSchema = z.object({
  id: z.string().uuid("ID konfigurasi storage tidak valid."),
});

/** Soft delete konfigurasi storage (set deletedAt + deletedBy). */
export async function softDeleteStorageConfig(formData: FormData): Promise<void> {
  await requirePermission("storage.manage");

  const parsed = deleteSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const deletedBy = (await auth())?.user?.id ?? null;

  await db
    .update(schema.storageConfigs)
    .set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() })
    .where(
      and(
        eq(schema.storageConfigs.id, parsed.data.id),
        isNull(schema.storageConfigs.deletedAt),
      ),
    );

  revalidatePath("/admin/storage");
}
