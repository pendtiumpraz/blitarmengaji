import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query READ untuk DASHBOARD PENGELOLA ENTITAS (route /kelola).
 * Semua query DIBATASI pada data milik user (ownership) sesuai pola manage_own
 * (lihat AGENTS.md §4) dan SELALU memfilter soft delete (deleted_at IS NULL).
 */

const { titikDakwah, kajian, kajianSchedules } = schema;

export type MyTitikItem = {
  id: string;
  name: string;
  slug: string;
  kecamatan: string | null;
  address: string | null;
  status: "active" | "pending" | "rejected";
  verifiedAt: Date | null;
  createdAt: Date;
  scheduleCount: number;
};

/**
 * Daftar titik dakwah milik user (ownerUserId = userId), aktif saja,
 * lengkap dengan jumlah jadwal aktif tiap titik. Terbaru dulu.
 */
export async function myTitik(userId: string): Promise<MyTitikItem[]> {
  const rows = await db
    .select({
      id: titikDakwah.id,
      name: titikDakwah.name,
      slug: titikDakwah.slug,
      kecamatan: titikDakwah.kecamatan,
      address: titikDakwah.address,
      status: titikDakwah.status,
      verifiedAt: titikDakwah.verifiedAt,
      createdAt: titikDakwah.createdAt,
    })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)))
    .orderBy(desc(titikDakwah.createdAt));

  if (rows.length === 0) return [];

  const titikIds = rows.map((r) => r.id);
  const counts = await db
    .select({ titikDakwahId: kajianSchedules.titikDakwahId, total: count(kajianSchedules.id) })
    .from(kajianSchedules)
    .where(and(inArray(kajianSchedules.titikDakwahId, titikIds), isNull(kajianSchedules.deletedAt)))
    .groupBy(kajianSchedules.titikDakwahId);

  const countMap = new Map<string, number>();
  for (const c of counts) {
    if (c.titikDakwahId) countMap.set(c.titikDakwahId, Number(c.total));
  }

  return rows.map((r) => ({ ...r, scheduleCount: countMap.get(r.id) ?? 0 }));
}

export type MyScheduleItem = {
  id: string;
  title: string | null;
  startAt: Date;
  endAt: Date | null;
  isOnline: boolean;
  streamUrl: string | null;
  status: "scheduled" | "ongoing" | "done" | "cancelled";
  kajianTitle: string | null;
  titikName: string | null;
  titikDakwahId: string | null;
  kajianId: string | null;
};

/**
 * Daftar jadwal (kajian_schedules) untuk titik milik user. Join ke kajian
 * (judul kajian) & titik (nama). Aktif saja, diurutkan menurut start_at menaik.
 */
export async function mySchedules(userId: string): Promise<MyScheduleItem[]> {
  const myTitikIds = await myTitikIdList(userId);
  if (myTitikIds.length === 0) return [];

  return db
    .select({
      id: kajianSchedules.id,
      title: kajianSchedules.title,
      startAt: kajianSchedules.startAt,
      endAt: kajianSchedules.endAt,
      isOnline: kajianSchedules.isOnline,
      streamUrl: kajianSchedules.streamUrl,
      status: kajianSchedules.status,
      kajianTitle: kajian.title,
      titikName: titikDakwah.name,
      titikDakwahId: kajianSchedules.titikDakwahId,
      kajianId: kajianSchedules.kajianId,
    })
    .from(kajianSchedules)
    .leftJoin(kajian, eq(kajianSchedules.kajianId, kajian.id))
    .leftJoin(titikDakwah, eq(kajianSchedules.titikDakwahId, titikDakwah.id))
    .where(
      and(
        inArray(kajianSchedules.titikDakwahId, myTitikIds),
        isNull(kajianSchedules.deletedAt),
      ),
    )
    .orderBy(asc(kajianSchedules.startAt));
}

export type ScheduleDetail = {
  id: string;
  titikDakwahId: string | null;
  kajianId: string | null;
  title: string | null;
  startAt: Date;
  isOnline: boolean;
  streamUrl: string | null;
  status: "scheduled" | "ongoing" | "done" | "cancelled";
  ownerUserId: string | null;
};

/**
 * Ambil satu jadwal (aktif) beserta pemilik titiknya untuk keperluan prefill
 * form edit & cek ownership. Mengembalikan null bila tidak ditemukan / terhapus.
 */
export async function getScheduleById(id: string): Promise<ScheduleDetail | null> {
  const rows = await db
    .select({
      id: kajianSchedules.id,
      titikDakwahId: kajianSchedules.titikDakwahId,
      kajianId: kajianSchedules.kajianId,
      title: kajianSchedules.title,
      startAt: kajianSchedules.startAt,
      isOnline: kajianSchedules.isOnline,
      streamUrl: kajianSchedules.streamUrl,
      status: kajianSchedules.status,
      ownerUserId: titikDakwah.ownerUserId,
    })
    .from(kajianSchedules)
    .leftJoin(titikDakwah, eq(kajianSchedules.titikDakwahId, titikDakwah.id))
    .where(and(eq(kajianSchedules.id, id), isNull(kajianSchedules.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/** Daftar id titik dakwah milik user (aktif saja). Helper internal. */
export async function myTitikIdList(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: titikDakwah.id })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)));
  return rows.map((r) => r.id);
}

export type TitikOption = { id: string; name: string };

/** Opsi titik dakwah milik user untuk dropdown form (id + nama). */
export async function myTitikOptions(userId: string): Promise<TitikOption[]> {
  return db
    .select({ id: titikDakwah.id, name: titikDakwah.name })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)))
    .orderBy(asc(titikDakwah.name));
}

export type KajianOption = { id: string; title: string };

/** Opsi kajian (aktif) yang terikat pada titik milik user — untuk dropdown form. */
export async function myKajianOptions(userId: string): Promise<KajianOption[]> {
  const myTitikIds = await myTitikIdList(userId);
  if (myTitikIds.length === 0) return [];

  return db
    .select({ id: kajian.id, title: kajian.title })
    .from(kajian)
    .where(and(inArray(kajian.titikDakwahId, myTitikIds), isNull(kajian.deletedAt)))
    .orderBy(asc(kajian.title));
}

/** Ringkasan angka untuk kartu statistik dashboard pengelola. */
export async function mySummary(userId: string): Promise<{
  titikCount: number;
  scheduleCount: number;
  onlineCount: number;
  kajianCount: number;
}> {
  const myTitikIds = await myTitikIdList(userId);
  if (myTitikIds.length === 0) {
    return { titikCount: 0, scheduleCount: 0, onlineCount: 0, kajianCount: 0 };
  }

  const [schedRows, onlineRows, kajianRows] = await Promise.all([
    db
      .select({ total: count(kajianSchedules.id) })
      .from(kajianSchedules)
      .where(
        and(inArray(kajianSchedules.titikDakwahId, myTitikIds), isNull(kajianSchedules.deletedAt)),
      ),
    db
      .select({ total: count(kajianSchedules.id) })
      .from(kajianSchedules)
      .where(
        and(
          inArray(kajianSchedules.titikDakwahId, myTitikIds),
          eq(kajianSchedules.isOnline, true),
          isNull(kajianSchedules.deletedAt),
        ),
      ),
    db
      .select({ total: count(kajian.id) })
      .from(kajian)
      .where(and(inArray(kajian.titikDakwahId, myTitikIds), isNull(kajian.deletedAt))),
  ]);

  return {
    titikCount: myTitikIds.length,
    scheduleCount: Number(schedRows[0]?.total ?? 0),
    onlineCount: Number(onlineRows[0]?.total ?? 0),
    kajianCount: Number(kajianRows[0]?.total ?? 0),
  };
}
