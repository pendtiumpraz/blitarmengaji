import { db, schema } from "@/lib/db";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ media (galeri foto & video) milik satu Titik Dakwah.
 * Polymorphic owner: media_assets/videos.ownerType = 'titik', ownerId = titik.id.
 * Selalu filter soft delete (isNull deletedAt) — lihat AGENTS.md §4.
 */

export type TitikGalleryItem = {
  id: string;
  url: string;
  caption: string | null;
  order: number;
};

export type TitikVideoItem = {
  id: string;
  platform: "youtube" | "facebook";
  sourceUrl: string;
  embedId: string | null;
  title: string | null;
  isLive: boolean;
};

/** Galeri foto (media_assets kind 'image') untuk satu titik. Urut order lalu terbaru. */
export async function galleryByTitik(titikId: string): Promise<TitikGalleryItem[]> {
  const rows = await db
    .select({
      id: schema.mediaAssets.id,
      url: schema.mediaAssets.url,
      caption: schema.mediaAssets.caption,
      order: schema.mediaAssets.order,
    })
    .from(schema.mediaAssets)
    .where(
      and(
        eq(schema.mediaAssets.ownerType, "titik"),
        eq(schema.mediaAssets.ownerId, titikId),
        eq(schema.mediaAssets.kind, "image"),
        isNull(schema.mediaAssets.deletedAt),
      ),
    )
    .orderBy(asc(schema.mediaAssets.order), desc(schema.mediaAssets.createdAt));

  return rows;
}

/** Daftar video embed (YouTube/Facebook) untuk satu titik. Yang LIVE didahulukan. */
export async function videosByTitik(titikId: string): Promise<TitikVideoItem[]> {
  const rows = await db
    .select({
      id: schema.videos.id,
      platform: schema.videos.platform,
      sourceUrl: schema.videos.sourceUrl,
      embedId: schema.videos.embedId,
      title: schema.videos.title,
      isLive: schema.videos.isLive,
    })
    .from(schema.videos)
    .where(
      and(
        eq(schema.videos.ownerType, "titik"),
        eq(schema.videos.ownerId, titikId),
        isNull(schema.videos.deletedAt),
      ),
    )
    .orderBy(desc(schema.videos.isLive), desc(schema.videos.createdAt));

  return rows;
}

export type TitikScheduleItem = {
  id: string;
  /** Judul sesi (override) bila ada; jika null pakai judul kajian. */
  title: string | null;
  startAt: Date;
  endAt: Date | null;
  isOnline: boolean;
  streamUrl: string | null;
  status: "scheduled" | "ongoing" | "done" | "cancelled";
  kajianTitle: string | null;
  kajianSlug: string | null;
  ustadzName: string | null;
};

/**
 * Daftar jadwal sesi (kajian_schedules) untuk satu titik dakwah.
 * Join ke kajian (judul/slug) & ustadz (nama). Soft-delete difilter.
 * Diurutkan menurut start_at (terdekat/terlama dahulu).
 */
export async function schedulesByTitik(titikId: string): Promise<TitikScheduleItem[]> {
  const rows = await db
    .select({
      id: schema.kajianSchedules.id,
      title: schema.kajianSchedules.title,
      startAt: schema.kajianSchedules.startAt,
      endAt: schema.kajianSchedules.endAt,
      isOnline: schema.kajianSchedules.isOnline,
      streamUrl: schema.kajianSchedules.streamUrl,
      status: schema.kajianSchedules.status,
      kajianTitle: schema.kajian.title,
      kajianSlug: schema.kajian.slug,
      ustadzName: schema.ustadzProfiles.name,
    })
    .from(schema.kajianSchedules)
    .leftJoin(schema.kajian, eq(schema.kajianSchedules.kajianId, schema.kajian.id))
    .leftJoin(schema.ustadzProfiles, eq(schema.kajian.ustadzId, schema.ustadzProfiles.id))
    .where(
      and(
        eq(schema.kajianSchedules.titikDakwahId, titikId),
        isNull(schema.kajianSchedules.deletedAt),
      ),
    )
    .orderBy(asc(schema.kajianSchedules.startAt));

  return rows;
}

export type TitikCampaignItem = {
  id: string;
  title: string;
  slug: string;
  posterImage: string | null;
  targetAmount: string | null;
  collectedAmount: string;
  status: "active" | "completed" | "closed";
  endAt: Date | null;
};

/**
 * Daftar kampanye donasi AKTIF milik satu titik dakwah (soft-delete difilter).
 * Diurutkan dari yang terbaru.
 */
export async function campaignsByTitik(titikId: string): Promise<TitikCampaignItem[]> {
  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      title: schema.donationCampaigns.title,
      slug: schema.donationCampaigns.slug,
      posterImage: schema.donationCampaigns.posterImage,
      targetAmount: schema.donationCampaigns.targetAmount,
      collectedAmount: schema.donationCampaigns.collectedAmount,
      status: schema.donationCampaigns.status,
      endAt: schema.donationCampaigns.endAt,
    })
    .from(schema.donationCampaigns)
    .where(
      and(
        eq(schema.donationCampaigns.titikDakwahId, titikId),
        eq(schema.donationCampaigns.status, "active"),
        isNull(schema.donationCampaigns.deletedAt),
      ),
    )
    .orderBy(desc(schema.donationCampaigns.createdAt));

  return rows;
}
