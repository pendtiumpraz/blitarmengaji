import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query READ untuk domain Galeri (media_assets) & Video (videos) milik
 * pengelola titik dakwah (panel /kelola).
 * Selalu filter `isNull(deletedAt)` (soft delete — lihat AGENTS.md §4) dan
 * dibatasi pada titik milik user (ownership) — lihat docs/ui/09-entity-dash.html.
 */

export type TitikOption = {
  id: string;
  name: string;
  kecamatan: string | null;
};

/** Titik dakwah aktif yang DIMILIKI user (ownerUserId), untuk dropdown pemilihan titik. */
export async function myTitikOptions(userId: string): Promise<TitikOption[]> {
  if (!userId) return [];
  const rows = await db
    .select({
      id: schema.titikDakwah.id,
      name: schema.titikDakwah.name,
      kecamatan: schema.titikDakwah.kecamatan,
    })
    .from(schema.titikDakwah)
    .where(and(eq(schema.titikDakwah.ownerUserId, userId), isNull(schema.titikDakwah.deletedAt)))
    .orderBy(desc(schema.titikDakwah.createdAt));

  return rows;
}

export type GalleryItem = {
  id: string;
  ownerId: string;
  url: string;
  caption: string | null;
  createdAt: Date;
  titikName: string | null;
};

/** Daftar foto galeri (image) untuk kumpulan titik (terbaru dulu). */
export async function listGallery(titikIds: string[]): Promise<GalleryItem[]> {
  if (titikIds.length === 0) return [];
  const rows = await db
    .select({
      id: schema.mediaAssets.id,
      ownerId: schema.mediaAssets.ownerId,
      url: schema.mediaAssets.url,
      caption: schema.mediaAssets.caption,
      createdAt: schema.mediaAssets.createdAt,
      titikName: schema.titikDakwah.name,
    })
    .from(schema.mediaAssets)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.mediaAssets.ownerId))
    .where(
      and(
        eq(schema.mediaAssets.ownerType, "titik"),
        eq(schema.mediaAssets.kind, "image"),
        inArray(schema.mediaAssets.ownerId, titikIds),
        isNull(schema.mediaAssets.deletedAt),
      ),
    )
    .orderBy(desc(schema.mediaAssets.createdAt));

  return rows;
}

export type VideoItem = {
  id: string;
  ownerId: string;
  platform: "youtube" | "facebook";
  sourceUrl: string;
  embedId: string | null;
  title: string | null;
  isLive: boolean;
  createdAt: Date;
  titikName: string | null;
};

/** Daftar video (embed YouTube/Facebook) untuk kumpulan titik (terbaru dulu). */
export async function listVideos(titikIds: string[]): Promise<VideoItem[]> {
  if (titikIds.length === 0) return [];
  const rows = await db
    .select({
      id: schema.videos.id,
      ownerId: schema.videos.ownerId,
      platform: schema.videos.platform,
      sourceUrl: schema.videos.sourceUrl,
      embedId: schema.videos.embedId,
      title: schema.videos.title,
      isLive: schema.videos.isLive,
      createdAt: schema.videos.createdAt,
      titikName: schema.titikDakwah.name,
    })
    .from(schema.videos)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.videos.ownerId))
    .where(
      and(
        eq(schema.videos.ownerType, "titik"),
        inArray(schema.videos.ownerId, titikIds),
        isNull(schema.videos.deletedAt),
      ),
    )
    .orderBy(desc(schema.videos.createdAt));

  return rows;
}
