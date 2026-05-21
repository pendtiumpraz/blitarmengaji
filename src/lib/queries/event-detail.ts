import { db, schema } from "@/lib/db";
import { and, count, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk HALAMAN DETAIL EVENT (/event/[slug]).
 * Selalu filter `isNull(...deletedAt)` (soft delete — lihat AGENTS.md §4).
 * Hanya event ber-status 'published' yang ditampilkan ke publik.
 */

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
  organizerName: string | null;
};

/**
 * Detail satu event by slug (published & aktif) + nama penyelenggara.
 * organizerType 'internal' → "Blitar Mengaji"; selain itu ambil nama partner
 * via organizerId (left join business_partners). Null bila tidak ada.
 */
export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
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
      organizerType: schema.events.organizerType,
      partnerName: schema.businessPartners.name,
    })
    .from(schema.events)
    .leftJoin(
      schema.businessPartners,
      eq(schema.businessPartners.id, schema.events.organizerId),
    )
    .where(
      and(
        eq(schema.events.slug, slug),
        eq(schema.events.status, "published"),
        isNull(schema.events.deletedAt),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    kind: row.kind,
    coverImage: row.coverImage,
    startAt: row.startAt,
    endAt: row.endAt,
    location: row.location,
    onlineUrl: row.onlineUrl,
    capacity: row.capacity,
    needsRegistration: row.needsRegistration,
    organizerName: row.organizerType === "internal" ? "Blitar Mengaji" : row.partnerName,
  };
}

/** Jumlah pendaftar aktif (belum dibatalkan/soft delete) untuk sebuah event. */
export async function countRegistrations(eventId: string): Promise<number> {
  const rows = await db
    .select({ total: count(schema.eventRegistrations.id) })
    .from(schema.eventRegistrations)
    .where(
      and(
        eq(schema.eventRegistrations.eventId, eventId),
        isNull(schema.eventRegistrations.deletedAt),
      ),
    );
  return Number(rows[0]?.total ?? 0);
}
