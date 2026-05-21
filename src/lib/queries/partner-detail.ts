import { db, schema } from "@/lib/db";
import { and, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ DETAIL satu partner berdasarkan slug.
 * Slug unik lintas media_partners & business_partners (lihat docs/DATABASE-PLAN.md).
 * Strategi: cari di media_partners dulu, lalu business_partners.
 *
 * Konvensi (AGENTS.md §4):
 *  - Selalu filter soft delete: `isNull(<tabel>.deletedAt)`.
 *  - Hanya tampilkan entitas berstatus aktif untuk publik.
 *  - media  → sertakan daftar video (videos ownerType 'media').
 *  - usaha  → sertakan daftar produk AKTIF (products businessPartnerId).
 */

export type PartnerVideoItem = {
  id: string;
  platform: "youtube" | "facebook";
  sourceUrl: string;
  embedId: string | null;
  title: string | null;
  isLive: boolean;
};

export type PartnerProductItem = {
  id: string;
  title: string;
  posterImage: string | null;
  description: string | null;
  price: string | null;
  contactLink: string | null;
};

export type MediaPartnerDetail = {
  kind: "media";
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  videos: PartnerVideoItem[];
};

export type BusinessPartnerDetail = {
  kind: "usaha";
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  category: string | null;
  contactWa: string | null;
  products: PartnerProductItem[];
};

export type PartnerDetail = MediaPartnerDetail | BusinessPartnerDetail;

/** Daftar video embed (YouTube/Facebook) milik satu media partner. LIVE didahulukan. */
async function videosByMediaPartner(partnerId: string): Promise<PartnerVideoItem[]> {
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
        eq(schema.videos.ownerType, "media"),
        eq(schema.videos.ownerId, partnerId),
        isNull(schema.videos.deletedAt),
      ),
    )
    .orderBy(desc(schema.videos.isLive), desc(schema.videos.createdAt));

  return rows;
}

/** Daftar produk AKTIF milik satu partner usaha (terbaru dulu). */
async function productsByBusinessPartner(partnerId: string): Promise<PartnerProductItem[]> {
  const rows = await db
    .select({
      id: schema.products.id,
      title: schema.products.title,
      posterImage: schema.products.posterImage,
      description: schema.products.description,
      price: schema.products.price,
      contactLink: schema.products.contactLink,
    })
    .from(schema.products)
    .where(
      and(
        eq(schema.products.businessPartnerId, partnerId),
        eq(schema.products.status, "active"),
        isNull(schema.products.deletedAt),
      ),
    )
    .orderBy(desc(schema.products.createdAt));

  return rows;
}

/**
 * Ambil detail partner berdasarkan slug (media partner ATAU partner usaha).
 * Mengembalikan null bila tidak ditemukan / tidak aktif / sudah dihapus.
 */
export async function getPartnerBySlug(slug: string): Promise<PartnerDetail | null> {
  if (!slug) return null;

  // 1) Coba media_partners (aktif, belum dihapus).
  const mediaRows = await db
    .select({
      id: schema.mediaPartners.id,
      name: schema.mediaPartners.name,
      slug: schema.mediaPartners.slug,
      logo: schema.mediaPartners.logo,
      description: schema.mediaPartners.description,
      website: schema.mediaPartners.website,
    })
    .from(schema.mediaPartners)
    .where(
      and(
        eq(schema.mediaPartners.slug, slug),
        eq(schema.mediaPartners.status, "active"),
        isNull(schema.mediaPartners.deletedAt),
      ),
    )
    .limit(1);

  const media = mediaRows[0];
  if (media) {
    const videos = await videosByMediaPartner(media.id);
    return { kind: "media", ...media, videos };
  }

  // 2) Coba business_partners (aktif, belum dihapus).
  const usahaRows = await db
    .select({
      id: schema.businessPartners.id,
      name: schema.businessPartners.name,
      slug: schema.businessPartners.slug,
      logo: schema.businessPartners.logo,
      description: schema.businessPartners.description,
      category: schema.businessPartners.category,
      contactWa: schema.businessPartners.contactWa,
    })
    .from(schema.businessPartners)
    .where(
      and(
        eq(schema.businessPartners.slug, slug),
        eq(schema.businessPartners.status, "active"),
        isNull(schema.businessPartners.deletedAt),
      ),
    )
    .limit(1);

  const usaha = usahaRows[0];
  if (usaha) {
    const products = await productsByBusinessPartner(usaha.id);
    return { kind: "usaha", ...usaha, products };
  }

  return null;
}
