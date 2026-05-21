import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query READ untuk dashboard SELF-SERVICE Media Partner (manage_own).
 * Dipakai di /kelola/media-partner. Selalu memfilter milik user login
 * (media_partners.ownerUserId) + soft delete (isNull deletedAt — lihat AGENTS.md §4).
 *
 * Polymorphic owner video: videos.ownerType = 'media', ownerId = media_partners.id.
 * File ini HANYA membaca; mutasi via src/lib/actions/media-partner.ts.
 */

export type MyMediaPartner = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  status: "active" | "pending" | "rejected";
};

/** Daftar media partner yang DIMILIKI user (semua status, belum dihapus). Terbaru dulu. */
export async function myMediaPartners(userId: string): Promise<MyMediaPartner[]> {
  if (!userId) return [];

  const rows = await db
    .select({
      id: schema.mediaPartners.id,
      name: schema.mediaPartners.name,
      slug: schema.mediaPartners.slug,
      logo: schema.mediaPartners.logo,
      description: schema.mediaPartners.description,
      website: schema.mediaPartners.website,
      status: schema.mediaPartners.status,
    })
    .from(schema.mediaPartners)
    .where(
      and(eq(schema.mediaPartners.ownerUserId, userId), isNull(schema.mediaPartners.deletedAt)),
    )
    .orderBy(desc(schema.mediaPartners.createdAt));

  return rows;
}

export type MyMediaVideo = {
  id: string;
  ownerId: string;
  platform: "youtube" | "facebook";
  sourceUrl: string;
  embedId: string | null;
  title: string | null;
  isLive: boolean;
  createdAt: Date;
  mediaPartnerName: string | null;
};

/**
 * Daftar video/livestream (embed YouTube/Facebook) milik SEMUA media partner user.
 * videos.ownerType = 'media', ownerId IN (media partner milik user). LIVE didahulukan.
 */
export async function myMediaVideos(userId: string): Promise<MyMediaVideo[]> {
  if (!userId) return [];

  const partners = await myMediaPartners(userId);
  const partnerIds = partners.map((p) => p.id);
  if (partnerIds.length === 0) return [];

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
      mediaPartnerName: schema.mediaPartners.name,
    })
    .from(schema.videos)
    .leftJoin(schema.mediaPartners, eq(schema.mediaPartners.id, schema.videos.ownerId))
    .where(
      and(
        eq(schema.videos.ownerType, "media"),
        inArray(schema.videos.ownerId, partnerIds),
        isNull(schema.videos.deletedAt),
      ),
    )
    .orderBy(desc(schema.videos.isLive), desc(schema.videos.createdAt));

  return rows;
}
