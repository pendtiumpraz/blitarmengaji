"use server";

import { and, count, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Server actions (MUTATION) untuk PROGRESS belajar (pemutar kelas).
 * Syarat tiap aksi: WAJIB login + WAJIB sudah enroll (cek enrollments aktif).
 * - markLessonComplete: insert course_lesson_progress (idempoten via onConflictDoNothing).
 * - markLessonIncomplete: hapus baris progress.
 * Setelah tiap aksi: hitung ulang persen (selesai/total*100) → update enrollments.progress,
 * lalu revalidatePath halaman belajar + detail kelas.
 */

const schemaInput = z.object({
  lessonId: z.string().uuid("Pelajaran tidak valid."),
  courseId: z.string().uuid("Kelas tidak valid."),
});

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

type Guarded = {
  userId: string;
  lessonId: string;
  courseId: string;
  slug: string;
};

/**
 * Validasi bersama untuk kedua aksi:
 *  - sesi login,
 *  - input Zod,
 *  - user benar-benar enroll (baris aktif),
 *  - pelajaran benar milik kelas tsb (lewat modul) & masih aktif.
 * Mengembalikan slug kelas (untuk revalidatePath detail).
 */
async function guard(formData: FormData): Promise<Guarded> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Anda harus masuk terlebih dahulu.");
  }

  const parsed = schemaInput.safeParse({
    lessonId: opt(formData.get("lessonId")),
    courseId: opt(formData.get("courseId")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { lessonId, courseId } = parsed.data;

  // Harus sudah terdaftar (enroll) di kelas — baris aktif + ambil slug kelas sekalian.
  const enroll = (
    await db
      .select({ id: schema.enrollments.id, slug: schema.courses.slug })
      .from(schema.enrollments)
      .innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId))
      .where(
        and(
          eq(schema.enrollments.userId, userId),
          eq(schema.enrollments.courseId, courseId),
          isNull(schema.enrollments.deletedAt),
          isNull(schema.courses.deletedAt),
        ),
      )
      .limit(1)
  )[0];
  if (!enroll) {
    throw new Error("Anda belum terdaftar di kelas ini.");
  }

  // Pastikan pelajaran milik kelas ini (lewat modul) & masih aktif.
  const lesson = (
    await db
      .select({ id: schema.courseLessons.id })
      .from(schema.courseLessons)
      .innerJoin(schema.courseModules, eq(schema.courseModules.id, schema.courseLessons.moduleId))
      .where(
        and(
          eq(schema.courseLessons.id, lessonId),
          eq(schema.courseModules.courseId, courseId),
          isNull(schema.courseLessons.deletedAt),
          isNull(schema.courseModules.deletedAt),
        ),
      )
      .limit(1)
  )[0];
  if (!lesson) {
    throw new Error("Pelajaran tidak ditemukan di kelas ini.");
  }

  return { userId, lessonId, courseId, slug: enroll.slug };
}

/** Hitung ulang persen (selesai/total*100) lalu update enrollments.progress untuk user+kelas. */
async function recomputeProgress(userId: string, courseId: string): Promise<void> {
  const totalRows = await db
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
  const total = Number(totalRows[0]?.total ?? 0);

  const doneRows = await db
    .select({ done: count(schema.courseLessonProgress.id) })
    .from(schema.courseLessonProgress)
    .where(
      and(
        eq(schema.courseLessonProgress.userId, userId),
        eq(schema.courseLessonProgress.courseId, courseId),
      ),
    );
  const done = Number(doneRows[0]?.done ?? 0);

  const percent = total > 0 ? Math.round((done / total) * 100) : 0;

  await db
    .update(schema.enrollments)
    .set({ progress: percent })
    .where(
      and(
        eq(schema.enrollments.userId, userId),
        eq(schema.enrollments.courseId, courseId),
        isNull(schema.enrollments.deletedAt),
      ),
    );
}

function revalidate(slug: string): void {
  revalidatePath(`/kelas/${slug}/belajar`);
  revalidatePath(`/kelas/${slug}`);
}

/** Tandai pelajaran SELESAI (idempoten). Wajib login + enrolled. */
export async function markLessonComplete(formData: FormData): Promise<void> {
  const { userId, lessonId, courseId, slug } = await guard(formData);

  await db
    .insert(schema.courseLessonProgress)
    .values({ userId, lessonId, courseId })
    .onConflictDoNothing({
      target: [schema.courseLessonProgress.userId, schema.courseLessonProgress.lessonId],
    });

  await recomputeProgress(userId, courseId);
  revalidate(slug);
}

/** Batalkan tanda selesai pada sebuah pelajaran. Wajib login + enrolled. */
export async function markLessonIncomplete(formData: FormData): Promise<void> {
  const { userId, lessonId, courseId, slug } = await guard(formData);

  await db
    .delete(schema.courseLessonProgress)
    .where(
      and(
        eq(schema.courseLessonProgress.userId, userId),
        eq(schema.courseLessonProgress.lessonId, lessonId),
      ),
    );

  await recomputeProgress(userId, courseId);
  revalidate(slug);
}
