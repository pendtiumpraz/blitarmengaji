import { db, schema } from "@/lib/db";
import { and, asc, count, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk domain LAPAK & PARTNER/MEDIA.
 * Konvensi (lihat AGENTS.md §4):
 *  - Selalu filter soft delete: `isNull(<tabel>.deletedAt)`.
 *  - Hanya tampilkan data status aktif untuk publik.
 *  - Lapak: maksimal 3 produk aktif per partner (dibatasi di query ini).
 */

/* ============================================================
 * LAPAK — Produk UMKM jamaah (products + business_partners)
 * ============================================================ */

export type ProductListItem = {
  id: string;
  title: string;
  posterImage: string | null;
  description: string | null;
  price: string | null;
  contactLink: string | null;
  partnerId: string;
  partnerName: string;
  partnerCategory: string | null;
  partnerWa: string | null;
};

/**
 * Daftar produk lapak yang AKTIF dari partner usaha yang AKTIF.
 * Membatasi maksimal 3 produk aktif per partner (kebijakan lapak).
 */
export async function listProducts(): Promise<ProductListItem[]> {
  const rows = await db
    .select({
      id: schema.products.id,
      title: schema.products.title,
      posterImage: schema.products.posterImage,
      description: schema.products.description,
      price: schema.products.price,
      contactLink: schema.products.contactLink,
      partnerId: schema.businessPartners.id,
      partnerName: schema.businessPartners.name,
      partnerCategory: schema.businessPartners.category,
      partnerWa: schema.businessPartners.contactWa,
      createdAt: schema.products.createdAt,
    })
    .from(schema.products)
    .innerJoin(
      schema.businessPartners,
      eq(schema.businessPartners.id, schema.products.businessPartnerId),
    )
    .where(
      and(
        eq(schema.products.status, "active"),
        isNull(schema.products.deletedAt),
        eq(schema.businessPartners.status, "active"),
        isNull(schema.businessPartners.deletedAt),
      ),
    )
    .orderBy(asc(schema.businessPartners.name), desc(schema.products.createdAt));

  // Batasi maksimal 3 produk aktif per partner (kebijakan lapak).
  const perPartnerCount = new Map<string, number>();
  const limited: ProductListItem[] = [];
  for (const r of rows) {
    const n = perPartnerCount.get(r.partnerId) ?? 0;
    if (n >= 3) continue;
    perPartnerCount.set(r.partnerId, n + 1);
    limited.push({
      id: r.id,
      title: r.title,
      posterImage: r.posterImage,
      description: r.description,
      price: r.price,
      contactLink: r.contactLink,
      partnerId: r.partnerId,
      partnerName: r.partnerName,
      partnerCategory: r.partnerCategory,
      partnerWa: r.partnerWa,
    });
  }

  return limited;
}

export type AdminProductListItem = {
  id: string;
  title: string;
  posterImage: string | null;
  price: string | null;
  status: "active" | "inactive";
  partnerName: string;
  partnerCategory: string | null;
};

/**
 * Daftar produk lapak untuk panel ADMIN (semua status, terbaru dulu). Berhalaman.
 * Tidak membatasi 3/partner — itu kebijakan tampilan publik & saat mengaktifkan.
 */
export async function listProductsPaged(
  page: number,
  pageSize: number,
): Promise<AdminProductListItem[]> {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const offset = (safePage - 1) * pageSize;

  const rows = await db
    .select({
      id: schema.products.id,
      title: schema.products.title,
      posterImage: schema.products.posterImage,
      price: schema.products.price,
      status: schema.products.status,
      partnerName: schema.businessPartners.name,
      partnerCategory: schema.businessPartners.category,
    })
    .from(schema.products)
    .innerJoin(
      schema.businessPartners,
      eq(schema.businessPartners.id, schema.products.businessPartnerId),
    )
    .where(isNull(schema.products.deletedAt))
    .orderBy(desc(schema.products.createdAt))
    .limit(pageSize)
    .offset(offset);

  return rows;
}

/** Total produk aktif (belum dihapus) — untuk pagination admin. */
export async function countProducts(): Promise<number> {
  const rows = await db
    .select({ total: count(schema.products.id) })
    .from(schema.products)
    .where(isNull(schema.products.deletedAt));
  return Number(rows[0]?.total ?? 0);
}

export type ProductDetail = {
  id: string;
  businessPartnerId: string;
  title: string;
  posterImage: string | null;
  description: string | null;
  price: string | null;
  contactLink: string | null;
  status: "active" | "inactive";
};

/** Ambil satu produk berdasarkan id (belum dihapus). Null bila tidak ada. */
export async function getProductById(id: string): Promise<ProductDetail | null> {
  if (!id) return null;
  const rows = await db
    .select({
      id: schema.products.id,
      businessPartnerId: schema.products.businessPartnerId,
      title: schema.products.title,
      posterImage: schema.products.posterImage,
      description: schema.products.description,
      price: schema.products.price,
      contactLink: schema.products.contactLink,
      status: schema.products.status,
    })
    .from(schema.products)
    .where(and(eq(schema.products.id, id), isNull(schema.products.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/* ============================================================
 * PARTNER USAHA — business_partners
 * ============================================================ */

export type BusinessPartnerListItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  category: string | null;
  contactWa: string | null;
};

/** Daftar partner usaha yang AKTIF (terbaru dulu). */
export async function listBusinessPartners(): Promise<BusinessPartnerListItem[]> {
  const rows = await db
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
        eq(schema.businessPartners.status, "active"),
        isNull(schema.businessPartners.deletedAt),
      ),
    )
    .orderBy(desc(schema.businessPartners.createdAt));

  return rows;
}

/* ============================================================
 * MEDIA PARTNER — media_partners
 * ============================================================ */

export type MediaPartnerListItem = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  website: string | null;
};

/** Daftar media partner yang AKTIF (terbaru dulu). */
export async function listMediaPartners(): Promise<MediaPartnerListItem[]> {
  const rows = await db
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
        eq(schema.mediaPartners.status, "active"),
        isNull(schema.mediaPartners.deletedAt),
      ),
    )
    .orderBy(desc(schema.mediaPartners.createdAt));

  return rows;
}
