import { db, schema } from "@/lib/db";
import { and, count, eq, isNull } from "drizzle-orm";

/**
 * Query READ untuk PROGRESS belajar (pemutar kelas).
 * - courseProgress: pelajaran yang sudah diselesaikan user + total pelajaran aktif + persen.
 * - isEnrolled: apakah user sudah terdaftar (enroll) di kelas (baris aktif).
 * Catatan: total dihitung dari pelajaran aktif (soft delete) via modul -> lesson.
 */

export type CourseProgress = {
  completedLessonIds: string[];
  total: number;
  percent: number; // 0-100 (bulat)
};

/** Jumlah pelajaran AKTIF pada sebuah kursus (lewat modul aktif -> pelajaran aktif). */
async function countCourseLessons(courseId: string): Promise<number> {
  const rows = await db
    .select({ total: count(schema.courseLessons.id) })
    .from(schema.courseModules)
    .innerJoin(
      schema.courseLessons,
      and(
        eq(schema.courseLessons.moduleId, schema.courseModules.id),
        isNull(schema.courseLessons.deletedAt),
      ),
    )
    .where(
      and(eq(schema.courseModules.courseId, courseId), isNull(schema.courseModules.deletedAt)),
    );
  return Number(rows[0]?.total ?? 0);
}

/**
 * Progress user pada satu kursus: daftar id pelajaran yang sudah selesai,
 * total pelajaran aktif, dan persen (completed/total*100, dibulatkan).
 */
export async function courseProgress(
  userId: string,
  courseId: string,
): Promise<CourseProgress> {
  const total = await countCourseLessons(courseId);

  const completedRows = await db
    .select({ lessonId: schema.courseLessonProgress.lessonId })
    .from(schema.courseLessonProgress)
    .where(
      and(
        eq(schema.courseLessonProgress.userId, userId),
        eq(schema.courseLessonProgress.courseId, courseId),
      ),
    );

  const completedLessonIds = completedRows.map((r) => r.lessonId);
  const percent = total > 0 ? Math.round((completedLessonIds.length / total) * 100) : 0;

  return { completedLessonIds, total, percent };
}

/** True bila user sudah terdaftar (enroll) di kelas — hanya baris aktif (soft delete). */
export async function isEnrolled(userId: string, courseId: string): Promise<boolean> {
  const row = (
    await db
      .select({ id: schema.enrollments.id })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.userId, userId),
          eq(schema.enrollments.courseId, courseId),
          isNull(schema.enrollments.deletedAt),
        ),
      )
      .limit(1)
  )[0];
  return !!row;
}
