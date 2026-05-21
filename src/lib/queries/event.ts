import { db, schema } from "@/lib/db";
import { and, count, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk domain ACARA (events) pada panel ADMIN.
 * Konvensi (lihat AGENTS.md §4): selalu filter soft delete `isNull(deletedAt)`.
 * Berbeda dari listEvents() publik (queries/belajar.ts) yang hanya menampilkan
 * acara berstatus 'published'; di sini admin melihat SEMUA status yang belum dihapus.
 */

export type AdminEventListItem = {
  id: string;
  title: string;
  slug: string;
  kind: "webinar" | "offline" | "hybrid";
  coverImage: string | null;
  startAt: Date | null;
  location: string | null;
  status: "draft" | "published";
  registeredCount: number;
};

/** Daftar SEMUA acara (semua status) untuk panel admin — terdekat dulu. Berhalaman. */
export async function listEventsPaged(
  page: number,
  pageSize: number,
): Promise<AdminEventListItem[]> {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      slug: schema.events.slug,
      kind: schema.events.kind,
      coverImage: schema.events.coverImage,
      startAt: schema.events.startAt,
      location: schema.events.location,
      status: schema.events.status,
    })
    .from(schema.events)
    .where(isNull(schema.events.deletedAt))
    .orderBy(desc(schema.events.startAt))
    .limit(pageSize)
    .offset(offset);

  if (rows.length === 0) return [];

  // Hitung pendaftar aktif per acara di halaman ini.
  const regCounts = await db
    .select({
      eventId: schema.eventRegistrations.eventId,
      total: count(schema.eventRegistrations.id),
    })
    .from(schema.eventRegistrations)
    .where(isNull(schema.eventRegistrations.deletedAt))
    .groupBy(schema.eventRegistrations.eventId);

  const countMap = new Map(regCounts.map((r) => [r.eventId, Number(r.total)]));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    kind: r.kind,
    coverImage: r.coverImage,
    startAt: r.startAt,
    location: r.location,
    status: r.status,
    registeredCount: countMap.get(r.id) ?? 0,
  }));
}

/** Total acara aktif (belum dihapus) — untuk pagination. */
export async function countEvents(): Promise<number> {
  const rows = await db
    .select({ total: count(schema.events.id) })
    .from(schema.events)
    .where(isNull(schema.events.deletedAt));
  return Number(rows[0]?.total ?? 0);
}

export type EventDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  kind: "webinar" | "offline" | "hybrid";
  coverImage: string | null;
  startAt: Date | null;
  endAt: Date | null;
  location: string | null;
  onlineUrl: string | null;
  capacity: number | null;
  needsRegistration: boolean;
  status: "draft" | "published";
};

/** Ambil satu acara berdasarkan id (belum dihapus). Null bila tidak ada. */
export async function getEventById(id: string): Promise<EventDetail | null> {
  if (!id) return null;
  const rows = await db
    .select({
      id: schema.events.id,
      title: schema.events.title,
      slug: schema.events.slug,
      description: schema.events.description,
      kind: schema.events.kind,
      coverImage: schema.events.coverImage,
      startAt: schema.events.startAt,
      endAt: schema.events.endAt,
      location: schema.events.location,
      onlineUrl: schema.events.onlineUrl,
      capacity: schema.events.capacity,
      needsRegistration: schema.events.needsRegistration,
      status: schema.events.status,
    })
    .from(schema.events)
    .where(and(eq(schema.events.id, id), isNull(schema.events.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}
