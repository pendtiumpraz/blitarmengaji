import { db, schema } from "@/lib/db";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

/**
 * Query READ untuk dashboard SELF-SERVICE Partner Usaha (manage_own).
 * Dipakai di /kelola/lapak & /kelola/event. Selalu memfilter milik user login
 * (business_partners.ownerUserId) dan soft delete (lihat AGENTS.md §4).
 *
 * Catatan: hanya MEMBACA. Mutasi memakai server action yang sudah ada
 * (createProduct/softDeleteProduct, createEvent/softDeleteEvent).
 */

const MAX_ACTIVE_PRODUCTS = 3;

/* ============================================================
 * PARTNER USAHA milik user (business_partners.ownerUserId)
 * ============================================================ */

export type MyBusinessPartner = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  category: string | null;
  contactWa: string | null;
  status: "active" | "pending" | "rejected";
};

/** Daftar partner usaha yang DIMILIKI user (semua status, belum dihapus). */
export async function myBusinessPartners(userId: string): Promise<MyBusinessPartner[]> {
  if (!userId) return [];

  const rows = await db
    .select({
      id: schema.businessPartners.id,
      name: schema.businessPartners.name,
      slug: schema.businessPartners.slug,
      logo: schema.businessPartners.logo,
      category: schema.businessPartners.category,
      contactWa: schema.businessPartners.contactWa,
      status: schema.businessPartners.status,
    })
    .from(schema.businessPartners)
    .where(
      and(
        eq(schema.businessPartners.ownerUserId, userId),
        isNull(schema.businessPartners.deletedAt),
      ),
    )
    .orderBy(desc(schema.businessPartners.createdAt));

  return rows;
}

/* ============================================================
 * PRODUK milik partner user (products via business_partners)
 * ============================================================ */

export type MyProduct = {
  id: string;
  title: string;
  posterImage: string | null;
  description: string | null;
  price: string | null;
  contactLink: string | null;
  status: "active" | "inactive";
  partnerId: string;
  partnerName: string;
  partnerCategory: string | null;
};

export type MyProductsResult = {
  products: MyProduct[];
  /** Jumlah produk AKTIF (untuk indikator "X/3"). */
  activeCount: number;
  /** Batas maksimal produk aktif per partner usaha. */
  maxActive: number;
  /** Sisa slot produk aktif yang masih tersedia. */
  remaining: number;
};

/**
 * Produk milik SELURUH partner usaha user + hitung produk aktif
 * (indikator kuota maks 3 produk aktif per partner — lihat AGENTS.md §4).
 */
export async function myProducts(userId: string): Promise<MyProductsResult> {
  const empty: MyProductsResult = {
    products: [],
    activeCount: 0,
    maxActive: MAX_ACTIVE_PRODUCTS,
    remaining: MAX_ACTIVE_PRODUCTS,
  };
  if (!userId) return empty;

  const rows = await db
    .select({
      id: schema.products.id,
      title: schema.products.title,
      posterImage: schema.products.posterImage,
      description: schema.products.description,
      price: schema.products.price,
      contactLink: schema.products.contactLink,
      status: schema.products.status,
      partnerId: schema.businessPartners.id,
      partnerName: schema.businessPartners.name,
      partnerCategory: schema.businessPartners.category,
    })
    .from(schema.products)
    .innerJoin(
      schema.businessPartners,
      eq(schema.businessPartners.id, schema.products.businessPartnerId),
    )
    .where(
      and(
        eq(schema.businessPartners.ownerUserId, userId),
        isNull(schema.businessPartners.deletedAt),
        isNull(schema.products.deletedAt),
      ),
    )
    .orderBy(desc(schema.products.createdAt));

  const products: MyProduct[] = rows;
  const activeCount = products.filter((p) => p.status === "active").length;
  const remaining = Math.max(0, MAX_ACTIVE_PRODUCTS - activeCount);

  return { products, activeCount, maxActive: MAX_ACTIVE_PRODUCTS, remaining };
}

/* ============================================================
 * EVENT milik partner user (events organizerType 'partner')
 * ============================================================ */

export type MyEvent = {
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
  organizerId: string | null;
  organizerName: string | null;
};

/**
 * Daftar event yang diselenggarakan partner usaha milik user
 * (organizerType = 'partner' & organizerId ∈ partner milik user).
 * Semua status (draft/published), terbaru/terdekat dulu.
 */
export async function myEvents(userId: string): Promise<MyEvent[]> {
  if (!userId) return [];

  const partners = await myBusinessPartners(userId);
  const partnerIds = partners.map((p) => p.id);
  if (partnerIds.length === 0) return [];

  const nameById = new Map(partners.map((p) => [p.id, p.name]));

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
      organizerId: schema.events.organizerId,
    })
    .from(schema.events)
    .where(
      and(
        eq(schema.events.organizerType, "partner"),
        inArray(schema.events.organizerId, partnerIds),
        isNull(schema.events.deletedAt),
      ),
    )
    .orderBy(desc(schema.events.startAt));

  return rows.map((r) => ({
    ...r,
    organizerName: r.organizerId ? nameById.get(r.organizerId) ?? null : null,
  }));
}
