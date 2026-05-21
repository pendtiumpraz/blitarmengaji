import type { MetadataRoute } from "next";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Rute statis publik yang selalu ada di sitemap. */
const STATIC_PATHS = [
  "/",
  "/peta",
  "/jadwal",
  "/kajian",
  "/donasi",
  "/keuangan",
  "/catatan",
  "/perpustakaan",
  "/kelas",
  "/event",
  "/lapak",
  "/partner",
  "/tanya-ustadz",
  "/tanya-ai",
  "/tentang",
  "/gabung",
] as const;

/** Bentuk satu entri rute dinamis: slug + updatedAt untuk lastModified. */
type SlugRow = { slug: string; updatedAt: Date };

/** Susun entri sitemap dari prefix + daftar slug aktif. */
function toEntries(prefix: string, rows: SlugRow[]): MetadataRoute.Sitemap {
  return rows.map((r) => ({
    url: `${SITE_URL}${prefix}/${r.slug}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Rute statis.
  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  // Rute dinamis dari DB — hanya entitas aktif (deleted_at IS NULL) & status terbit.
  const [
    kajianRows,
    titikRows,
    campaignRows,
    postRows,
    courseRows,
    eventRows,
    mediaRows,
    usahaRows,
  ] = await Promise.all([
    db
      .select({ slug: schema.kajian.slug, updatedAt: schema.kajian.updatedAt })
      .from(schema.kajian)
      .where(and(isNull(schema.kajian.deletedAt), eq(schema.kajian.status, "published"))),
    db
      .select({ slug: schema.titikDakwah.slug, updatedAt: schema.titikDakwah.updatedAt })
      .from(schema.titikDakwah)
      .where(and(isNull(schema.titikDakwah.deletedAt), eq(schema.titikDakwah.status, "active"))),
    db
      .select({ slug: schema.donationCampaigns.slug, updatedAt: schema.donationCampaigns.updatedAt })
      .from(schema.donationCampaigns)
      .where(isNull(schema.donationCampaigns.deletedAt)),
    db
      .select({ slug: schema.posts.slug, updatedAt: schema.posts.updatedAt })
      .from(schema.posts)
      .where(and(isNull(schema.posts.deletedAt), eq(schema.posts.status, "published"))),
    db
      .select({ slug: schema.courses.slug, updatedAt: schema.courses.updatedAt })
      .from(schema.courses)
      .where(and(isNull(schema.courses.deletedAt), eq(schema.courses.status, "published"))),
    db
      .select({ slug: schema.events.slug, updatedAt: schema.events.updatedAt })
      .from(schema.events)
      .where(and(isNull(schema.events.deletedAt), eq(schema.events.status, "published"))),
    db
      .select({ slug: schema.mediaPartners.slug, updatedAt: schema.mediaPartners.updatedAt })
      .from(schema.mediaPartners)
      .where(and(isNull(schema.mediaPartners.deletedAt), eq(schema.mediaPartners.status, "active"))),
    db
      .select({ slug: schema.businessPartners.slug, updatedAt: schema.businessPartners.updatedAt })
      .from(schema.businessPartners)
      .where(
        and(isNull(schema.businessPartners.deletedAt), eq(schema.businessPartners.status, "active")),
      ),
  ]);

  const dynamicEntries: MetadataRoute.Sitemap = [
    ...toEntries("/kajian", kajianRows),
    ...toEntries("/titik", titikRows),
    ...toEntries("/donasi", campaignRows),
    ...toEntries("/catatan", postRows),
    ...toEntries("/kelas", courseRows),
    ...toEntries("/event", eventRows),
    // Partner media & usaha berbagi prefix /partner (slug unik lintas keduanya).
    ...toEntries("/partner", mediaRows),
    ...toEntries("/partner", usahaRows),
  ];

  return [...staticEntries, ...dynamicEntries];
}
