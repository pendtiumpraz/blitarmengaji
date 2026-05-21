import { db, schema } from "@/lib/db";
import { and, desc, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk halaman "Belajar Saya" — kelas yang DIIKUTI user + progress.
 * Selalu filter `isNull(...deletedAt)` baik di enrollment maupun course
 * (soft delete — lihat AGENTS.md §4). Hanya untuk user yang sedang login.
 */

export type MyEnrollmentItem = {
  enrollmentId: string;
  courseId: string;
  title: string;
  slug: string;
  level: string | null;
  coverImage: string | null;
  progress: number; // 0-100 (dari enrollments.progress)
  enrolledAt: Date;
};

/**
 * Daftar kelas yang di-enroll user (terbaru dulu) + progress & cover/level kelas.
 * Join ke courses; kelas yang sudah dihapus (soft delete) tidak ikut tampil.
 */
export async function myEnrollments(userId: string): Promise<MyEnrollmentItem[]> {
  const rows = await db
    .select({
      enrollmentId: schema.enrollments.id,
      courseId: schema.courses.id,
      title: schema.courses.title,
      slug: schema.courses.slug,
      level: schema.courses.level,
      coverImage: schema.courses.coverImage,
      progress: schema.enrollments.progress,
      enrolledAt: schema.enrollments.enrolledAt,
    })
    .from(schema.enrollments)
    .innerJoin(
      schema.courses,
      and(eq(schema.courses.id, schema.enrollments.courseId), isNull(schema.courses.deletedAt)),
    )
    .where(and(eq(schema.enrollments.userId, userId), isNull(schema.enrollments.deletedAt)))
    .orderBy(desc(schema.enrollments.enrolledAt));

  // Jaga-jaga: pastikan progress berada di rentang 0-100.
  return rows.map((r) => ({
    ...r,
    progress: Math.min(100, Math.max(0, r.progress ?? 0)),
  }));
}
