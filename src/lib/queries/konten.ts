import { db, schema } from "@/lib/db";
import { and, count, eq, desc, isNull } from "drizzle-orm";

/**
 * Query READ untuk domain KONTEN (Catatan/Blog & Perpustakaan).
 * Aturan:
 *  - Selalu filter `isNull(...deletedAt)` (soft delete — AGENTS.md §4).
 *  - Publik hanya melihat status 'published'.
 *  - Mutation (admin create) menyusul; file ini fokus read nyata dari Neon.
 */

/* ============================================================
 * CATATAN (posts)
 * ============================================================ */

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  type: "catatan" | "artikel";
  excerpt: string | null;
  coverImage: string | null;
  views: number;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
};

/** Daftar catatan/artikel yang sudah dipublikasikan (terbaru dulu). */
export async function listPosts(): Promise<PostListItem[]> {
  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      type: schema.posts.type,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      views: schema.posts.views,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      authorName: schema.users.name,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.id, schema.posts.authorUserId))
    .where(and(isNull(schema.posts.deletedAt), eq(schema.posts.status, "published")))
    .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt));

  return rows;
}

/* ------------------------------------------------------------
 * ADMIN: daftar SEMUA catatan aktif (termasuk draft) + pagination.
 * Berbeda dari listPosts (publik, hanya 'published').
 * ------------------------------------------------------------ */

export type PostAdminListItem = {
  id: string;
  title: string;
  slug: string;
  type: "catatan" | "artikel";
  coverImage: string | null;
  status: "draft" | "published";
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
};

/** Daftar catatan untuk panel admin (terbaru dulu) dengan pagination. */
export async function listPostsPaged(
  page: number,
  pageSize: number,
): Promise<PostAdminListItem[]> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);

  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      type: schema.posts.type,
      coverImage: schema.posts.coverImage,
      status: schema.posts.status,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      authorName: schema.users.name,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.id, schema.posts.authorUserId))
    .where(isNull(schema.posts.deletedAt))
    .orderBy(desc(schema.posts.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);

  return rows;
}

/** Jumlah total catatan aktif (untuk pagination admin). */
export async function countPosts(): Promise<number> {
  const rows = await db
    .select({ total: count() })
    .from(schema.posts)
    .where(isNull(schema.posts.deletedAt));
  return Number(rows[0]?.total ?? 0);
}

export type PostEditItem = {
  id: string;
  title: string;
  slug: string;
  type: "catatan" | "artikel";
  excerpt: string | null;
  coverImage: string | null;
  contentRich: unknown;
  status: "draft" | "published";
};

/** Ambil satu catatan by id (aktif) untuk form edit admin. Null bila tidak ada. */
export async function getPostById(id: string): Promise<PostEditItem | null> {
  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      type: schema.posts.type,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      contentRich: schema.posts.contentRich,
      status: schema.posts.status,
    })
    .from(schema.posts)
    .where(and(eq(schema.posts.id, id), isNull(schema.posts.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

export type PostDetail = PostListItem & {
  contentRich: unknown;
};

/** Detail satu catatan by slug (hanya yang published & aktif). Return null bila tidak ada. */
export async function getPostBySlug(slug: string): Promise<PostDetail | null> {
  const rows = await db
    .select({
      id: schema.posts.id,
      title: schema.posts.title,
      slug: schema.posts.slug,
      type: schema.posts.type,
      excerpt: schema.posts.excerpt,
      coverImage: schema.posts.coverImage,
      views: schema.posts.views,
      publishedAt: schema.posts.publishedAt,
      createdAt: schema.posts.createdAt,
      authorName: schema.users.name,
      contentRich: schema.posts.contentRich,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.id, schema.posts.authorUserId))
    .where(
      and(
        eq(schema.posts.slug, slug),
        isNull(schema.posts.deletedAt),
        eq(schema.posts.status, "published"),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

/* ============================================================
 * PERPUSTAKAAN (library_items)
 * ============================================================ */

export type LibraryListItem = {
  id: string;
  title: string;
  description: string | null;
  author: string | null;
  pdfUrl: string;
  coverImage: string | null;
  fileSize: number | null; // bytes
  downloads: number;
  createdAt: Date;
  ustadzName: string | null;
};

/** Daftar materi PDF perpustakaan yang sudah dipublikasikan (terbaru dulu). */
export async function listLibrary(): Promise<LibraryListItem[]> {
  const rows = await db
    .select({
      id: schema.libraryItems.id,
      title: schema.libraryItems.title,
      description: schema.libraryItems.description,
      author: schema.libraryItems.author,
      pdfUrl: schema.libraryItems.pdfUrl,
      coverImage: schema.libraryItems.coverImage,
      fileSize: schema.libraryItems.fileSize,
      downloads: schema.libraryItems.downloads,
      createdAt: schema.libraryItems.createdAt,
      ustadzName: schema.ustadzProfiles.name,
    })
    .from(schema.libraryItems)
    .leftJoin(
      schema.ustadzProfiles,
      eq(schema.ustadzProfiles.id, schema.libraryItems.ustadzId),
    )
    .where(
      and(isNull(schema.libraryItems.deletedAt), eq(schema.libraryItems.status, "published")),
    )
    .orderBy(desc(schema.libraryItems.createdAt));

  return rows;
}
