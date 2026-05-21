import { db, schema } from "@/lib/db";
import { and, eq, desc, isNull, sql } from "drizzle-orm";

/**
 * Query READ untuk domain Titik Dakwah.
 * Selalu filter `isNull(schema.titikDakwah.deletedAt)` (soft delete — lihat AGENTS.md §4).
 */

export type TitikListItem = {
  id: string;
  name: string;
  slug: string;
  kecamatan: string | null;
  kelurahan: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  gmapsUrl: string | null;
  coverImage: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  status: "active" | "pending" | "rejected";
  ownerUserId: string | null;
  ownerName: string | null;
  createdAt: Date;
};

/** Daftar semua titik dakwah aktif (terbaru dulu), beserta nama pengelola. */
export async function listTitik(): Promise<TitikListItem[]> {
  const rows = await db
    .select({
      id: schema.titikDakwah.id,
      name: schema.titikDakwah.name,
      slug: schema.titikDakwah.slug,
      kecamatan: schema.titikDakwah.kecamatan,
      kelurahan: schema.titikDakwah.kelurahan,
      address: schema.titikDakwah.address,
      latitude: schema.titikDakwah.latitude,
      longitude: schema.titikDakwah.longitude,
      gmapsUrl: schema.titikDakwah.gmapsUrl,
      coverImage: schema.titikDakwah.coverImage,
      logoUrl: schema.titikDakwah.logoUrl,
      contactPhone: schema.titikDakwah.contactPhone,
      contactEmail: schema.titikDakwah.contactEmail,
      status: schema.titikDakwah.status,
      ownerUserId: schema.titikDakwah.ownerUserId,
      ownerName: schema.users.name,
      createdAt: schema.titikDakwah.createdAt,
    })
    .from(schema.titikDakwah)
    .leftJoin(schema.users, eq(schema.users.id, schema.titikDakwah.ownerUserId))
    .where(isNull(schema.titikDakwah.deletedAt))
    .orderBy(desc(schema.titikDakwah.createdAt));

  return rows;
}

export type TitikDetail = TitikListItem & {
  description: string | null;
  verifiedAt: Date | null;
};

/** Detail satu titik dakwah by slug (hanya yang aktif). Return null bila tidak ada. */
export async function getTitikBySlug(slug: string): Promise<TitikDetail | null> {
  const rows = await db
    .select({
      id: schema.titikDakwah.id,
      name: schema.titikDakwah.name,
      slug: schema.titikDakwah.slug,
      description: schema.titikDakwah.description,
      kecamatan: schema.titikDakwah.kecamatan,
      kelurahan: schema.titikDakwah.kelurahan,
      address: schema.titikDakwah.address,
      latitude: schema.titikDakwah.latitude,
      longitude: schema.titikDakwah.longitude,
      gmapsUrl: schema.titikDakwah.gmapsUrl,
      coverImage: schema.titikDakwah.coverImage,
      logoUrl: schema.titikDakwah.logoUrl,
      contactPhone: schema.titikDakwah.contactPhone,
      contactEmail: schema.titikDakwah.contactEmail,
      status: schema.titikDakwah.status,
      ownerUserId: schema.titikDakwah.ownerUserId,
      ownerName: schema.users.name,
      verifiedAt: schema.titikDakwah.verifiedAt,
      createdAt: schema.titikDakwah.createdAt,
    })
    .from(schema.titikDakwah)
    .leftJoin(schema.users, eq(schema.users.id, schema.titikDakwah.ownerUserId))
    .where(and(eq(schema.titikDakwah.slug, slug), isNull(schema.titikDakwah.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/** Detail satu titik dakwah by id (semua kolom, hanya yang aktif). Untuk form EDIT. */
export async function getTitikById(id: string): Promise<TitikDetail | null> {
  const rows = await db
    .select({
      id: schema.titikDakwah.id,
      name: schema.titikDakwah.name,
      slug: schema.titikDakwah.slug,
      description: schema.titikDakwah.description,
      kecamatan: schema.titikDakwah.kecamatan,
      kelurahan: schema.titikDakwah.kelurahan,
      address: schema.titikDakwah.address,
      latitude: schema.titikDakwah.latitude,
      longitude: schema.titikDakwah.longitude,
      gmapsUrl: schema.titikDakwah.gmapsUrl,
      coverImage: schema.titikDakwah.coverImage,
      logoUrl: schema.titikDakwah.logoUrl,
      contactPhone: schema.titikDakwah.contactPhone,
      contactEmail: schema.titikDakwah.contactEmail,
      status: schema.titikDakwah.status,
      ownerUserId: schema.titikDakwah.ownerUserId,
      ownerName: schema.users.name,
      verifiedAt: schema.titikDakwah.verifiedAt,
      createdAt: schema.titikDakwah.createdAt,
    })
    .from(schema.titikDakwah)
    .leftJoin(schema.users, eq(schema.users.id, schema.titikDakwah.ownerUserId))
    .where(and(eq(schema.titikDakwah.id, id), isNull(schema.titikDakwah.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/** Hitung total titik dakwah aktif (untuk pagination). */
export async function countTitik(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.titikDakwah)
    .where(isNull(schema.titikDakwah.deletedAt));

  return rows[0]?.count ?? 0;
}

/** Daftar titik dakwah aktif per halaman (terbaru dulu) + total untuk pagination. */
export async function listTitikPaged(
  page: number,
  pageSize: number,
): Promise<{ rows: TitikListItem[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 10);

  const [rows, total] = await Promise.all([
    db
      .select({
        id: schema.titikDakwah.id,
        name: schema.titikDakwah.name,
        slug: schema.titikDakwah.slug,
        kecamatan: schema.titikDakwah.kecamatan,
        kelurahan: schema.titikDakwah.kelurahan,
        address: schema.titikDakwah.address,
        latitude: schema.titikDakwah.latitude,
        longitude: schema.titikDakwah.longitude,
        gmapsUrl: schema.titikDakwah.gmapsUrl,
        coverImage: schema.titikDakwah.coverImage,
        logoUrl: schema.titikDakwah.logoUrl,
        contactPhone: schema.titikDakwah.contactPhone,
        contactEmail: schema.titikDakwah.contactEmail,
        status: schema.titikDakwah.status,
        ownerUserId: schema.titikDakwah.ownerUserId,
        ownerName: schema.users.name,
        createdAt: schema.titikDakwah.createdAt,
      })
      .from(schema.titikDakwah)
      .leftJoin(schema.users, eq(schema.users.id, schema.titikDakwah.ownerUserId))
      .where(isNull(schema.titikDakwah.deletedAt))
      .orderBy(desc(schema.titikDakwah.createdAt))
      .limit(safeSize)
      .offset((safePage - 1) * safeSize),
    countTitik(),
  ]);

  return { rows, total };
}
