import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { kajian, kajianSchedules, categories, ustadzProfiles, titikDakwah } = schema;

/**
 * Daftar kajian aktif (deleted_at IS NULL) beserta nama ustadz, titik dakwah,
 * dan kategori — di-LEFT JOIN agar kajian tanpa relasi tetap muncul.
 * Diurutkan dari yang terbaru.
 */
export async function listKajian() {
  return db
    .select({
      id: kajian.id,
      title: kajian.title,
      slug: kajian.slug,
      description: kajian.description,
      kitab: kajian.kitab,
      type: kajian.type,
      status: kajian.status,
      coverImage: kajian.coverImage,
      createdAt: kajian.createdAt,
      ustadzName: ustadzProfiles.name,
      titikName: titikDakwah.name,
      kecamatan: titikDakwah.kecamatan,
      categoryName: categories.name,
    })
    .from(kajian)
    .leftJoin(ustadzProfiles, eq(kajian.ustadzId, ustadzProfiles.id))
    .leftJoin(titikDakwah, eq(kajian.titikDakwahId, titikDakwah.id))
    .leftJoin(categories, eq(kajian.categoryId, categories.id))
    .where(isNull(kajian.deletedAt))
    .orderBy(desc(kajian.createdAt));
}

export type KajianListItem = Awaited<ReturnType<typeof listKajian>>[number];

/**
 * Daftar kajian aktif dengan pagination (LIMIT/OFFSET). Sama seperti listKajian
 * namun dibatasi per halaman; dipakai bersama countKajian() untuk navigasi halaman.
 */
export async function listKajianPaged(page: number, pageSize: number) {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);
  return db
    .select({
      id: kajian.id,
      title: kajian.title,
      slug: kajian.slug,
      description: kajian.description,
      kitab: kajian.kitab,
      type: kajian.type,
      status: kajian.status,
      coverImage: kajian.coverImage,
      createdAt: kajian.createdAt,
      ustadzName: ustadzProfiles.name,
      titikName: titikDakwah.name,
      kecamatan: titikDakwah.kecamatan,
      categoryName: categories.name,
    })
    .from(kajian)
    .leftJoin(ustadzProfiles, eq(kajian.ustadzId, ustadzProfiles.id))
    .leftJoin(titikDakwah, eq(kajian.titikDakwahId, titikDakwah.id))
    .leftJoin(categories, eq(kajian.categoryId, categories.id))
    .where(isNull(kajian.deletedAt))
    .orderBy(desc(kajian.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);
}

/** Total kajian aktif (deleted_at IS NULL) untuk perhitungan jumlah halaman. */
export async function countKajian(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(kajian)
    .where(isNull(kajian.deletedAt));
  return rows[0]?.count ?? 0;
}

/**
 * Detail satu kajian berdasarkan id (aktif saja) untuk form edit admin.
 * Mengembalikan kolom mentah (termasuk relasi id) agar bisa di-prefill ke form.
 * Mengembalikan null bila tidak ditemukan agar caller bisa memanggil notFound().
 */
export async function getKajianById(id: string) {
  const rows = await db
    .select({
      id: kajian.id,
      title: kajian.title,
      slug: kajian.slug,
      description: kajian.description,
      ustadzId: kajian.ustadzId,
      titikDakwahId: kajian.titikDakwahId,
      categoryId: kajian.categoryId,
      kitab: kajian.kitab,
      type: kajian.type,
      status: kajian.status,
      coverImage: kajian.coverImage,
      createdAt: kajian.createdAt,
      updatedAt: kajian.updatedAt,
    })
    .from(kajian)
    .where(and(eq(kajian.id, id), isNull(kajian.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export type KajianEditItem = NonNullable<Awaited<ReturnType<typeof getKajianById>>>;

/**
 * Detail satu kajian berdasarkan slug (aktif saja). Mengembalikan null bila
 * tidak ditemukan agar caller bisa memanggil notFound().
 */
export async function getKajianBySlug(slug: string) {
  const rows = await db
    .select({
      id: kajian.id,
      title: kajian.title,
      slug: kajian.slug,
      description: kajian.description,
      kitab: kajian.kitab,
      type: kajian.type,
      status: kajian.status,
      coverImage: kajian.coverImage,
      createdAt: kajian.createdAt,
      ustadzName: ustadzProfiles.name,
      ustadzSpecialization: ustadzProfiles.specialization,
      titikName: titikDakwah.name,
      kecamatan: titikDakwah.kecamatan,
      gmapsUrl: titikDakwah.gmapsUrl,
      categoryName: categories.name,
    })
    .from(kajian)
    .leftJoin(ustadzProfiles, eq(kajian.ustadzId, ustadzProfiles.id))
    .leftJoin(titikDakwah, eq(kajian.titikDakwahId, titikDakwah.id))
    .leftJoin(categories, eq(kajian.categoryId, categories.id))
    .where(and(eq(kajian.slug, slug), isNull(kajian.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export type KajianDetail = NonNullable<Awaited<ReturnType<typeof getKajianBySlug>>>;

/**
 * Daftar jadwal (kajian_schedules) aktif, join ke kajian untuk judul/tipe,
 * dan titik dakwah untuk lokasi. Diurutkan menurut start_at (terdekat dahulu).
 */
export async function listJadwal() {
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
      kajianSlug: kajian.slug,
      kajianType: kajian.type,
      ustadzName: ustadzProfiles.name,
      titikName: titikDakwah.name,
      kecamatan: titikDakwah.kecamatan,
    })
    .from(kajianSchedules)
    .leftJoin(kajian, eq(kajianSchedules.kajianId, kajian.id))
    .leftJoin(ustadzProfiles, eq(kajian.ustadzId, ustadzProfiles.id))
    .leftJoin(titikDakwah, eq(kajianSchedules.titikDakwahId, titikDakwah.id))
    .where(isNull(kajianSchedules.deletedAt))
    .orderBy(asc(kajianSchedules.startAt));
}

export type JadwalItem = Awaited<ReturnType<typeof listJadwal>>[number];

/** Opsi ustadz aktif untuk dropdown form (id + nama). */
export async function listUstadzOptions() {
  return db
    .select({ id: ustadzProfiles.id, name: ustadzProfiles.name })
    .from(ustadzProfiles)
    .where(isNull(ustadzProfiles.deletedAt))
    .orderBy(asc(ustadzProfiles.name));
}

/** Opsi titik dakwah aktif untuk dropdown form (id + nama + kecamatan). */
export async function listTitikOptions() {
  return db
    .select({
      id: titikDakwah.id,
      name: titikDakwah.name,
      kecamatan: titikDakwah.kecamatan,
    })
    .from(titikDakwah)
    .where(isNull(titikDakwah.deletedAt))
    .orderBy(asc(titikDakwah.name));
}

/** Opsi kategori bertipe 'kajian' untuk dropdown form. */
export async function listKajianCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.type, "kajian"), isNull(categories.deletedAt)))
    .orderBy(asc(categories.name));
}
