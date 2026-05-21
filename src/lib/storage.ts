import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type StorageOwner = "global" | "user" | "titik" | "media" | "partner" | "ustadz";

/** Kunci 32-byte dari STORAGE_ENC_KEY (hex 64 char). */
function key(): Buffer {
  const hex = (process.env.STORAGE_ENC_KEY ?? "").padEnd(64, "0").slice(0, 64);
  return Buffer.from(hex, "hex");
}

/** Enkripsi token storage (AES-256-GCM). Simpan ciphertext/iv/tag (base64). */
export function encryptToken(plain: string): { ciphertext: string; iv: string; tag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return {
    ciphertext: ct.toString("base64"),
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptToken(ciphertext: string, iv: string, tag: string): string {
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
}

/**
 * Token Blob untuk owner (entitas) bila punya storage_config aktif & default;
 * jika tidak ada, kembalikan undefined → pakai token global (env).
 */
export async function resolveUploadToken(ownerType: StorageOwner, ownerId?: string | null): Promise<string | undefined> {
  if (!ownerId) return undefined;
  const rows = await db
    .select()
    .from(schema.storageConfigs)
    .where(
      and(
        eq(schema.storageConfigs.ownerType, ownerType),
        eq(schema.storageConfigs.ownerId, ownerId),
        eq(schema.storageConfigs.isDefault, true),
        eq(schema.storageConfigs.status, "active"),
        isNull(schema.storageConfigs.deletedAt),
      ),
    )
    .limit(1);
  const cfg = rows[0];
  if (!cfg?.tokenCiphertext || !cfg.tokenIv || !cfg.tokenTag) return undefined;
  try {
    return decryptToken(cfg.tokenCiphertext, cfg.tokenIv, cfg.tokenTag);
  } catch {
    return undefined;
  }
}
