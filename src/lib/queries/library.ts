import { and, asc, count, desc, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";

const { libraryItems, ustadzProfiles, categories } = schema;

/**
 * Query READ admin untuk PERPUSTAKAAN (library_items).
 * Berbeda dari konten.listLibrary (publik, hanya 'published'): di sini SEMUA
 * materi AKTIF (deleted_at IS NULL) ditampilkan termasuk draft, untuk dikelola.
 */
export async function listLibraryAdmin() {
  return db
    .select({
      id: libraryItems.id,
      title: libraryItems.title,
      description: libraryItems.description,
      author: libraryItems.author,
      pdfUrl: libraryItems.pdfUrl,
      coverImage: libraryItems.coverImage,
      fileSize: libraryItems.fileSize,
      downloads: libraryItems.downloads,
      status: libraryItems.status,
      createdAt: libraryItems.createdAt,
      ustadzName: ustadzProfiles.name,
      categoryName: categories.name,
    })
    .from(libraryItems)
    .leftJoin(ustadzProfiles, eq(libraryItems.ustadzId, ustadzProfiles.id))
    .leftJoin(categories, eq(libraryItems.categoryId, categories.id))
    .where(isNull(libraryItems.deletedAt))
    .orderBy(desc(libraryItems.createdAt));
}

export type LibraryAdminItem = Awaited<ReturnType<typeof listLibraryAdmin>>[number];

/**
 * Daftar materi perpustakaan AKTIF (termasuk draft) untuk admin, dengan pagination.
 * Terbaru dulu.
 */
export async function listLibraryPaged(page: number, pageSize: number) {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);

  return db
    .select({
      id: libraryItems.id,
      title: libraryItems.title,
      description: libraryItems.description,
      author: libraryItems.author,
      pdfUrl: libraryItems.pdfUrl,
      coverImage: libraryItems.coverImage,
      fileSize: libraryItems.fileSize,
      downloads: libraryItems.downloads,
      status: libraryItems.status,
      createdAt: libraryItems.createdAt,
      ustadzName: ustadzProfiles.name,
      categoryName: categories.name,
    })
    .from(libraryItems)
    .leftJoin(ustadzProfiles, eq(libraryItems.ustadzId, ustadzProfiles.id))
    .leftJoin(categories, eq(libraryItems.categoryId, categories.id))
    .where(isNull(libraryItems.deletedAt))
    .orderBy(desc(libraryItems.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);
}

export type LibraryPagedItem = Awaited<ReturnType<typeof listLibraryPaged>>[number];

/** Jumlah total materi perpustakaan aktif (untuk pagination admin). */
export async function countLibrary(): Promise<number> {
  const rows = await db
    .select({ total: count() })
    .from(libraryItems)
    .where(isNull(libraryItems.deletedAt));
  return Number(rows[0]?.total ?? 0);
}

export type LibraryEditItem = {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  pdfUrl: string;
  coverImage: string | null;
  status: "draft" | "published";
};

/** Ambil satu materi by id (aktif) untuk form edit admin. Null bila tidak ada. */
export async function getLibraryById(id: string): Promise<LibraryEditItem | null> {
  const rows = await db
    .select({
      id: libraryItems.id,
      title: libraryItems.title,
      description: libraryItems.description,
      categoryId: libraryItems.categoryId,
      pdfUrl: libraryItems.pdfUrl,
      coverImage: libraryItems.coverImage,
      status: libraryItems.status,
    })
    .from(libraryItems)
    .where(and(eq(libraryItems.id, id), isNull(libraryItems.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/** Opsi kategori bertipe 'library' untuk dropdown form upload. */
export async function listLibraryCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.type, "library"), isNull(categories.deletedAt)))
    .orderBy(asc(categories.name));
}
