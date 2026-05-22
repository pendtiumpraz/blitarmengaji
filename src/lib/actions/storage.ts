"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/storage?err=" + encodeURIComponent(msg));
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
  redirect("/admin/storage?ok=" + encodeURIComponent("Tersimpan."));
}

// ── updateStorageConfig ─────────────────────────────────────────────────────────

const updateSchema = z.object({
  id: z.string().uuid("ID konfigurasi storage tidak valid."),
  label: z.string().trim().min(2, "Label minimal 2 karakter."),
  baseUrl: z.string().trim().url("Base URL tidak valid.").optional(),
  ownerType: ownerTypeEnum,
  ownerId: z.string().uuid("ID pemilik tidak valid.").optional(),
  isDefault: z.boolean(),
  status: z.enum(["active", "disabled"], { message: "Status storage tidak valid." }),
  token: z.string().trim().min(8, "Token Blob terlalu pendek.").optional(),
});

/**
 * Ubah konfigurasi storage. Field non-rahasia selalu di-update. Bila field
 * `token` diisi (non-kosong) → re-encrypt (AES-256-GCM) & ganti key lama. Bila
 * `token` KOSONG → key lama dibiarkan (tidak diubah).
 */
export async function updateStorageConfig(formData: FormData): Promise<void> {
  await requirePermission("storage.manage");

  const parsed = updateSchema.safeParse({
    id: opt(formData.get("id")),
    label: opt(formData.get("label")),
    baseUrl: opt(formData.get("baseUrl")),
    ownerType: opt(formData.get("ownerType")) ?? "global",
    ownerId: opt(formData.get("ownerId")),
    isDefault: formData.get("isDefault") != null,
    status: opt(formData.get("status")) ?? "active",
    token: opt(formData.get("token")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/storage?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;

  // Selalu update field non-rahasia.
  const set: Partial<typeof schema.storageConfigs.$inferInsert> = {
    label: data.label,
    baseUrl: data.baseUrl ?? null,
    ownerType: data.ownerType,
    ownerId: data.ownerType === "global" ? null : (data.ownerId ?? null),
    isDefault: data.isDefault,
    status: data.status,
    updatedAt: new Date(),
  };

  // Hanya re-encrypt & ganti key bila token diisi; kosong = biarkan key lama.
  if (data.token) {
    const { ciphertext, iv, tag } = encryptToken(data.token);
    set.tokenCiphertext = ciphertext;
    set.tokenIv = iv;
    set.tokenTag = tag;
  }

  await db
    .update(schema.storageConfigs)
    .set(set)
    .where(
      and(
        eq(schema.storageConfigs.id, data.id),
        isNull(schema.storageConfigs.deletedAt),
      ),
    );

  revalidatePath("/admin/storage");
  redirect("/admin/storage?ok=" + encodeURIComponent("Tersimpan."));
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
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/storage?err=" + encodeURIComponent(msg));
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
  redirect("/admin/storage?ok=" + encodeURIComponent("Berhasil."));
}
