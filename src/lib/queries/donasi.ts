import { db, schema } from "@/lib/db";
import { and, eq, desc, isNull, count } from "drizzle-orm";

/**
 * Query READ untuk domain Donasi.
 * Selalu filter `isNull(deletedAt)` (soft delete — lihat AGENTS.md §4).
 * Sumber: tabel donation_campaigns, donation_updates (+ join titik_dakwah).
 */

export type CampaignListItem = {
  id: string;
  title: string;
  slug: string;
  posterImage: string | null;
  description: string | null;
  targetAmount: string | null;
  collectedAmount: string;
  status: "active" | "completed" | "closed";
  startAt: Date | null;
  endAt: Date | null;
  qrisImage: string | null;
  contactLink: string | null;
  titikDakwahId: string;
  titikName: string | null;
  kecamatan: string | null;
  createdAt: Date;
};

/** Daftar semua kampanye donasi aktif (terbaru dulu), beserta nama titik dakwah. */
export async function listCampaigns(): Promise<CampaignListItem[]> {
  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      title: schema.donationCampaigns.title,
      slug: schema.donationCampaigns.slug,
      posterImage: schema.donationCampaigns.posterImage,
      description: schema.donationCampaigns.description,
      targetAmount: schema.donationCampaigns.targetAmount,
      collectedAmount: schema.donationCampaigns.collectedAmount,
      status: schema.donationCampaigns.status,
      startAt: schema.donationCampaigns.startAt,
      endAt: schema.donationCampaigns.endAt,
      qrisImage: schema.donationCampaigns.qrisImage,
      contactLink: schema.donationCampaigns.contactLink,
      titikDakwahId: schema.donationCampaigns.titikDakwahId,
      titikName: schema.titikDakwah.name,
      kecamatan: schema.titikDakwah.kecamatan,
      createdAt: schema.donationCampaigns.createdAt,
    })
    .from(schema.donationCampaigns)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.donationCampaigns.titikDakwahId))
    .where(isNull(schema.donationCampaigns.deletedAt))
    .orderBy(desc(schema.donationCampaigns.createdAt));

  return rows;
}

/** Daftar kampanye donasi aktif dengan pagination (terbaru dulu). */
export async function listCampaignsPaged(
  page: number,
  pageSize: number,
): Promise<CampaignListItem[]> {
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const safeSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 10;

  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      title: schema.donationCampaigns.title,
      slug: schema.donationCampaigns.slug,
      posterImage: schema.donationCampaigns.posterImage,
      description: schema.donationCampaigns.description,
      targetAmount: schema.donationCampaigns.targetAmount,
      collectedAmount: schema.donationCampaigns.collectedAmount,
      status: schema.donationCampaigns.status,
      startAt: schema.donationCampaigns.startAt,
      endAt: schema.donationCampaigns.endAt,
      qrisImage: schema.donationCampaigns.qrisImage,
      contactLink: schema.donationCampaigns.contactLink,
      titikDakwahId: schema.donationCampaigns.titikDakwahId,
      titikName: schema.titikDakwah.name,
      kecamatan: schema.titikDakwah.kecamatan,
      createdAt: schema.donationCampaigns.createdAt,
    })
    .from(schema.donationCampaigns)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.donationCampaigns.titikDakwahId))
    .where(isNull(schema.donationCampaigns.deletedAt))
    .orderBy(desc(schema.donationCampaigns.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);

  return rows;
}

/** Total kampanye donasi aktif (untuk hitung jumlah halaman). */
export async function countCampaigns(): Promise<number> {
  const rows = await db
    .select({ value: count() })
    .from(schema.donationCampaigns)
    .where(isNull(schema.donationCampaigns.deletedAt));

  return rows[0]?.value ?? 0;
}

export type CampaignDetail = CampaignListItem & {
  kelurahan: string | null;
  address: string | null;
  titikContactPhone: string | null;
};

/** Detail satu kampanye by slug (hanya yang aktif). Return null bila tidak ada. */
export async function getCampaignBySlug(slug: string): Promise<CampaignDetail | null> {
  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      title: schema.donationCampaigns.title,
      slug: schema.donationCampaigns.slug,
      posterImage: schema.donationCampaigns.posterImage,
      description: schema.donationCampaigns.description,
      targetAmount: schema.donationCampaigns.targetAmount,
      collectedAmount: schema.donationCampaigns.collectedAmount,
      status: schema.donationCampaigns.status,
      startAt: schema.donationCampaigns.startAt,
      endAt: schema.donationCampaigns.endAt,
      qrisImage: schema.donationCampaigns.qrisImage,
      contactLink: schema.donationCampaigns.contactLink,
      titikDakwahId: schema.donationCampaigns.titikDakwahId,
      titikName: schema.titikDakwah.name,
      kecamatan: schema.titikDakwah.kecamatan,
      kelurahan: schema.titikDakwah.kelurahan,
      address: schema.titikDakwah.address,
      titikContactPhone: schema.titikDakwah.contactPhone,
      createdAt: schema.donationCampaigns.createdAt,
    })
    .from(schema.donationCampaigns)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.donationCampaigns.titikDakwahId))
    .where(and(eq(schema.donationCampaigns.slug, slug), isNull(schema.donationCampaigns.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/** Detail satu kampanye by id (hanya yang aktif), untuk prefill form edit. Return null bila tidak ada. */
export async function getCampaignById(id: string): Promise<CampaignDetail | null> {
  const rows = await db
    .select({
      id: schema.donationCampaigns.id,
      title: schema.donationCampaigns.title,
      slug: schema.donationCampaigns.slug,
      posterImage: schema.donationCampaigns.posterImage,
      description: schema.donationCampaigns.description,
      targetAmount: schema.donationCampaigns.targetAmount,
      collectedAmount: schema.donationCampaigns.collectedAmount,
      status: schema.donationCampaigns.status,
      startAt: schema.donationCampaigns.startAt,
      endAt: schema.donationCampaigns.endAt,
      qrisImage: schema.donationCampaigns.qrisImage,
      contactLink: schema.donationCampaigns.contactLink,
      titikDakwahId: schema.donationCampaigns.titikDakwahId,
      titikName: schema.titikDakwah.name,
      kecamatan: schema.titikDakwah.kecamatan,
      kelurahan: schema.titikDakwah.kelurahan,
      address: schema.titikDakwah.address,
      titikContactPhone: schema.titikDakwah.contactPhone,
      createdAt: schema.donationCampaigns.createdAt,
    })
    .from(schema.donationCampaigns)
    .leftJoin(schema.titikDakwah, eq(schema.titikDakwah.id, schema.donationCampaigns.titikDakwahId))
    .where(and(eq(schema.donationCampaigns.id, id), isNull(schema.donationCampaigns.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export type DonationUpdateItem = {
  id: string;
  title: string;
  body: string | null;
  amountUsed: string | null;
  attachmentUrl: string | null;
  createdAt: Date;
};

/** Laporan penggunaan dana satu kampanye (terbaru dulu). */
export async function listUpdates(campaignId: string): Promise<DonationUpdateItem[]> {
  const rows = await db
    .select({
      id: schema.donationUpdates.id,
      title: schema.donationUpdates.title,
      body: schema.donationUpdates.body,
      amountUsed: schema.donationUpdates.amountUsed,
      attachmentUrl: schema.donationUpdates.attachmentUrl,
      createdAt: schema.donationUpdates.createdAt,
    })
    .from(schema.donationUpdates)
    .where(and(eq(schema.donationUpdates.campaignId, campaignId), isNull(schema.donationUpdates.deletedAt)))
    .orderBy(desc(schema.donationUpdates.createdAt));

  return rows;
}

/** Opsi titik dakwah aktif untuk select form (id + label). */
export async function listTitikOptions(): Promise<{ id: string; name: string; kecamatan: string | null }[]> {
  const rows = await db
    .select({
      id: schema.titikDakwah.id,
      name: schema.titikDakwah.name,
      kecamatan: schema.titikDakwah.kecamatan,
    })
    .from(schema.titikDakwah)
    .where(isNull(schema.titikDakwah.deletedAt))
    .orderBy(desc(schema.titikDakwah.createdAt));

  return rows;
}
