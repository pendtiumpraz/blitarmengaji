import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query READ untuk KELOLA DONASI per-titik (route /kelola/donasi).
 * Dibatasi pada campaign yang berada di titik dakwah MILIK user (ownership,
 * pola manage_own — lihat AGENTS.md §4) dan SELALU memfilter soft delete
 * (deleted_at IS NULL).
 */

const { titikDakwah, donationCampaigns } = schema;

export type TitikOption = { id: string; name: string };

/** Opsi titik dakwah milik user (aktif saja) untuk dropdown form donasi. */
export async function myTitikOptions(userId: string): Promise<TitikOption[]> {
  return db
    .select({ id: titikDakwah.id, name: titikDakwah.name })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)))
    .orderBy(asc(titikDakwah.name));
}

export type MyCampaignItem = {
  id: string;
  title: string;
  slug: string;
  status: "active" | "completed" | "closed";
  posterImage: string | null;
  targetAmount: number;
  collectedAmount: number;
  progress: number; // 0–100, dibulatkan
  titikName: string | null;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
};

/**
 * Daftar campaign donasi pada titik milik user (ownerUserId = userId),
 * aktif saja (deleted_at IS NULL), terbaru dulu, lengkap dengan progress
 * (collected/target dalam persen).
 */
export async function myCampaigns(userId: string): Promise<MyCampaignItem[]> {
  const myTitikRows = await db
    .select({ id: titikDakwah.id })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)));

  const myTitikIds = myTitikRows.map((r) => r.id);
  if (myTitikIds.length === 0) return [];

  const rows = await db
    .select({
      id: donationCampaigns.id,
      title: donationCampaigns.title,
      slug: donationCampaigns.slug,
      status: donationCampaigns.status,
      posterImage: donationCampaigns.posterImage,
      targetAmount: donationCampaigns.targetAmount,
      collectedAmount: donationCampaigns.collectedAmount,
      startAt: donationCampaigns.startAt,
      endAt: donationCampaigns.endAt,
      createdAt: donationCampaigns.createdAt,
      titikName: titikDakwah.name,
    })
    .from(donationCampaigns)
    .leftJoin(titikDakwah, eq(donationCampaigns.titikDakwahId, titikDakwah.id))
    .where(
      and(
        inArray(donationCampaigns.titikDakwahId, myTitikIds),
        isNull(donationCampaigns.deletedAt),
      ),
    )
    .orderBy(desc(donationCampaigns.createdAt));

  return rows.map((r) => {
    const target = Number(r.targetAmount ?? 0);
    const collected = Number(r.collectedAmount ?? 0);
    const progress = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      posterImage: r.posterImage,
      targetAmount: target,
      collectedAmount: collected,
      progress,
      titikName: r.titikName,
      startAt: r.startAt,
      endAt: r.endAt,
      createdAt: r.createdAt,
    };
  });
}
