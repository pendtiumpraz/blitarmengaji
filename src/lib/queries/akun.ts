import { db, schema } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk halaman /akun.
 * Selalu filter `isNull(...deletedAt)` (soft delete — lihat AGENTS.md §4).
 */

/** Jenis entitas yang bisa diajukan user (selaras dgn verifyEntity di rbac.ts). */
export type MyEntityType = "titik" | "ustadz" | "media" | "usaha";

export type MyEntity = {
  type: MyEntityType;
  name: string;
  status: "active" | "pending" | "rejected";
};

/**
 * Daftar pengajuan lembaga milik 1 user: titik dakwah, profil ustadz,
 * media partner, dan partner usaha. Dipakai untuk menampilkan STATUS
 * PENGAJUAN di /akun (badge pending/active/rejected).
 *
 * Kepemilikan: titik/media/usaha via owner_user_id, ustadz via user_id.
 */
export async function myEntities(userId: string): Promise<MyEntity[]> {
  const [titik, ustadz, media, usaha] = await Promise.all([
    db
      .select({ name: schema.titikDakwah.name, status: schema.titikDakwah.status })
      .from(schema.titikDakwah)
      .where(
        and(eq(schema.titikDakwah.ownerUserId, userId), isNull(schema.titikDakwah.deletedAt)),
      ),
    db
      .select({ name: schema.ustadzProfiles.name, status: schema.ustadzProfiles.status })
      .from(schema.ustadzProfiles)
      .where(
        and(eq(schema.ustadzProfiles.userId, userId), isNull(schema.ustadzProfiles.deletedAt)),
      ),
    db
      .select({ name: schema.mediaPartners.name, status: schema.mediaPartners.status })
      .from(schema.mediaPartners)
      .where(
        and(eq(schema.mediaPartners.ownerUserId, userId), isNull(schema.mediaPartners.deletedAt)),
      ),
    db
      .select({ name: schema.businessPartners.name, status: schema.businessPartners.status })
      .from(schema.businessPartners)
      .where(
        and(
          eq(schema.businessPartners.ownerUserId, userId),
          isNull(schema.businessPartners.deletedAt),
        ),
      ),
  ]);

  return [
    ...titik.map((t) => ({ type: "titik" as const, name: t.name, status: t.status })),
    ...ustadz.map((u) => ({ type: "ustadz" as const, name: u.name, status: u.status })),
    ...media.map((m) => ({ type: "media" as const, name: m.name, status: m.status })),
    ...usaha.map((b) => ({ type: "usaha" as const, name: b.name, status: b.status })),
  ];
}
