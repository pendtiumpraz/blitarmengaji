import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query layer STORAGE (Vercel Blob per-entitas) — sumber data NYATA dari Neon.
 * KEAMANAN: kolom token (ciphertext/iv/tag) TIDAK PERNAH di-select / dikirim ke
 * client. Token tersimpan terenkripsi AES-256-GCM (lihat src/lib/storage.ts) dan
 * hanya didekripsi di server saat upload (resolveUploadToken).
 * Soft delete: default WHERE deleted_at IS NULL (lihat AGENTS.md §4).
 */

export type StorageConfigRow = {
  id: string;
  label: string | null;
  provider: "vercel_blob" | "s3" | "r2" | "other";
  ownerType: "global" | "user" | "titik" | "media" | "partner" | "ustadz";
  isDefault: boolean;
  status: "active" | "disabled";
  bytesUsed: number;
};

/**
 * Daftar konfigurasi storage aktif (default global dulu, lalu terbaru).
 * CATATAN: token (ciphertext/iv/tag) SENGAJA tidak di-select — tidak pernah ke client.
 */
export async function listStorageConfigs(): Promise<StorageConfigRow[]> {
  const rows = await db
    .select({
      id: schema.storageConfigs.id,
      label: schema.storageConfigs.label,
      provider: schema.storageConfigs.provider,
      ownerType: schema.storageConfigs.ownerType,
      isDefault: schema.storageConfigs.isDefault,
      status: schema.storageConfigs.status,
      bytesUsed: schema.storageConfigs.bytesUsed,
    })
    .from(schema.storageConfigs)
    .where(isNull(schema.storageConfigs.deletedAt))
    .orderBy(desc(schema.storageConfigs.isDefault), desc(schema.storageConfigs.createdAt));

  return rows;
}

export type StorageConfigDetail = {
  id: string;
  label: string | null;
  provider: "vercel_blob" | "s3" | "r2" | "other";
  ownerType: "global" | "user" | "titik" | "media" | "partner" | "ustadz";
  ownerId: string | null;
  baseUrl: string | null;
  isDefault: boolean;
  status: "active" | "disabled";
  hasKey: boolean;
};

/**
 * Detail satu konfigurasi storage (untuk halaman edit).
 * KEAMANAN: token plaintext maupun ciphertext/iv/tag TIDAK di-return — hanya
 * field non-rahasia + flag `hasKey` (apakah token sudah tersimpan).
 */
export async function getStorageConfigById(id: string): Promise<StorageConfigDetail | null> {
  const rows = await db
    .select({
      id: schema.storageConfigs.id,
      label: schema.storageConfigs.label,
      provider: schema.storageConfigs.provider,
      ownerType: schema.storageConfigs.ownerType,
      ownerId: schema.storageConfigs.ownerId,
      baseUrl: schema.storageConfigs.baseUrl,
      isDefault: schema.storageConfigs.isDefault,
      status: schema.storageConfigs.status,
      hasKey: sql<boolean>`${schema.storageConfigs.tokenCiphertext} is not null`,
    })
    .from(schema.storageConfigs)
    .where(and(eq(schema.storageConfigs.id, id), isNull(schema.storageConfigs.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}
