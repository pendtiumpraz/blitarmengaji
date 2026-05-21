import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  categories,
  courses,
  libraryItems,
  posts,
  questions,
  ustadzProfiles,
  users,
} from "../../../db/schema";

/**
 * Query layer (READ-ONLY) untuk DASHBOARD USTADZ (/ustadz).
 * Ruang khusus role Ustadz yang TIDAK punya 'dashboard.view' (tak bisa /admin).
 * Selalu memfilter soft-delete (deleted_at IS NULL) sesuai konvensi repo
 * (AGENTS.md §4). Tidak melakukan mutation — mutasi memakai server action domain.
 */

/* ============================================================
 * RESOLUSI PROFIL USTADZ (read-only, tanpa membuat baris baru)
 * ============================================================ */

export type UstadzProfileLite = {
  id: string;
  name: string;
  specialization: string | null;
};

/**
 * Profil ustadz aktif milik user login (null bila belum pernah dibuat).
 * Profil dibuat otomatis oleh server action saat ustadz menjawab/mengunggah,
 * jadi di sini kita HANYA membaca (tidak menulis).
 */
export async function getUstadzProfile(
  userId: string,
): Promise<UstadzProfileLite | null> {
  const rows = await db
    .select({
      id: ustadzProfiles.id,
      name: ustadzProfiles.name,
      specialization: ustadzProfiles.specialization,
    })
    .from(ustadzProfiles)
    .where(and(eq(ustadzProfiles.userId, userId), isNull(ustadzProfiles.deletedAt)))
    .limit(1);

  return rows[0] ?? null;
}

/* ============================================================
 * RINGKASAN (dashboard counts)
 * ============================================================ */

export type UstadzSummary = {
  pendingQuestions: number;
  myPosts: number;
  myPdfs: number;
  myCourses: number;
};

/** Hitung jumlah baris aktif sesuai kondisi. */
async function countRows(
  table: typeof posts | typeof libraryItems | typeof courses | typeof questions,
  whereExpr: ReturnType<typeof and>,
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(table)
    .where(whereExpr);
  return rows[0]?.count ?? 0;
}

/**
 * Ringkasan kontribusi ustadz untuk kartu statistik beranda /ustadz:
 *  - pendingQuestions: pertanyaan global berstatus 'pending' (antrian jawab)
 *  - myPosts: catatan ditulis user ini (posts.authorUserId)
 *  - myPdfs: PDF diunggah ustadz ini (library_items.ustadzId)
 *  - myCourses: kelas dibuat ustadz ini (courses.ustadzId)
 * ustadzId null (belum punya profil) ⇒ pdf/kelas = 0.
 */
export async function getUstadzSummary(
  userId: string,
  ustadzId: string | null,
): Promise<UstadzSummary> {
  const pendingQuestions = await countRows(
    questions,
    and(isNull(questions.deletedAt), eq(questions.status, "pending")),
  );

  const myPosts = await countRows(
    posts,
    and(isNull(posts.deletedAt), eq(posts.authorUserId, userId)),
  );

  const myPdfs = ustadzId
    ? await countRows(
        libraryItems,
        and(isNull(libraryItems.deletedAt), eq(libraryItems.ustadzId, ustadzId)),
      )
    : 0;

  const myCourses = ustadzId
    ? await countRows(
        courses,
        and(isNull(courses.deletedAt), eq(courses.ustadzId, ustadzId)),
      )
    : 0;

  return { pendingQuestions, myPosts, myPdfs, myCourses };
}

/* ============================================================
 * ANTRIAN JAWAB (questions pending)
 * ============================================================ */

export type PendingQuestion = {
  id: string;
  title: string;
  body: string;
  askerDisplay: string;
  categoryName: string | null;
  createdAt: Date;
};

/** Nama penanya siap-tampil: anonim ⇒ "Hamba Allah". */
function resolveAsker(
  isAnonymous: boolean,
  askerName: string | null,
  userName: string | null,
): string {
  if (isAnonymous) return "Hamba Allah";
  return askerName?.trim() || userName?.trim() || "Hamba Allah";
}

/** Daftar pertanyaan berstatus 'pending' (terbaru dulu) untuk dijawab ustadz. */
export async function listPendingQuestions(): Promise<PendingQuestion[]> {
  const rows = await db
    .select({
      id: questions.id,
      title: questions.title,
      body: questions.body,
      isAnonymous: questions.isAnonymous,
      askerName: questions.askerName,
      userName: users.name,
      categoryName: categories.name,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .leftJoin(categories, eq(questions.categoryId, categories.id))
    .where(and(isNull(questions.deletedAt), eq(questions.status, "pending")))
    .orderBy(desc(questions.createdAt));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    askerDisplay: resolveAsker(r.isAnonymous, r.askerName, r.userName),
    categoryName: r.categoryName,
    createdAt: r.createdAt,
  }));
}

/* ============================================================
 * MILIK SAYA — daftar catatan / PDF / kelas
 * ============================================================ */

export type MyPost = {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  status: "draft" | "published";
  publishedAt: Date | null;
  createdAt: Date;
};

/** Catatan yang ditulis user login (terbaru dulu). */
export async function listMyPosts(userId: string): Promise<MyPost[]> {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      coverImage: posts.coverImage,
      status: posts.status,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(and(isNull(posts.deletedAt), eq(posts.authorUserId, userId)))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

export type MyLibraryItem = {
  id: string;
  title: string;
  pdfUrl: string;
  fileSize: number | null;
  downloads: number;
  status: "draft" | "published";
  createdAt: Date;
};

/** PDF yang diunggah ustadz ini (terbaru dulu). [] bila belum punya profil. */
export async function listMyLibrary(
  ustadzId: string | null,
): Promise<MyLibraryItem[]> {
  if (!ustadzId) return [];
  return db
    .select({
      id: libraryItems.id,
      title: libraryItems.title,
      pdfUrl: libraryItems.pdfUrl,
      fileSize: libraryItems.fileSize,
      downloads: libraryItems.downloads,
      status: libraryItems.status,
      createdAt: libraryItems.createdAt,
    })
    .from(libraryItems)
    .where(and(isNull(libraryItems.deletedAt), eq(libraryItems.ustadzId, ustadzId)))
    .orderBy(desc(libraryItems.createdAt));
}

export type MyCourse = {
  id: string;
  title: string;
  slug: string;
  level: string | null;
  coverImage: string | null;
  status: "draft" | "published";
  createdAt: Date;
};

/** Kelas yang dibuat ustadz ini (terbaru dulu). [] bila belum punya profil. */
export async function listMyCourses(
  ustadzId: string | null,
): Promise<MyCourse[]> {
  if (!ustadzId) return [];
  return db
    .select({
      id: courses.id,
      title: courses.title,
      slug: courses.slug,
      level: courses.level,
      coverImage: courses.coverImage,
      status: courses.status,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .where(and(isNull(courses.deletedAt), eq(courses.ustadzId, ustadzId)))
    .orderBy(desc(courses.createdAt));
}
