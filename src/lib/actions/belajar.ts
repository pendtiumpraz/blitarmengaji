"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server actions (MUTATION) untuk domain Belajar & Acara.
 * - WAJIB login: ambil user.id dari sesi, lempar error bila null.
 * - Validasi Zod, revalidatePath setelah insert.
 * - Platform gratis: tanpa pembayaran (lihat AGENTS.md §5).
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const enrollSchema = z.object({
  courseId: z.string().uuid("ID kelas tidak valid."),
});

/** Daftar (enroll) user login ke sebuah kelas. Idempoten bila sudah terdaftar. */
export async function enrollCourse(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Anda harus masuk terlebih dahulu untuk mendaftar kelas.");
  }

  const parsed = enrollSchema.safeParse({ courseId: opt(formData.get("courseId")) });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { courseId } = parsed.data;

  // Pastikan kelas ada, published, & belum dihapus.
  const course = (
    await db
      .select({ id: schema.courses.id, slug: schema.courses.slug })
      .from(schema.courses)
      .where(
        and(
          eq(schema.courses.id, courseId),
          eq(schema.courses.status, "published"),
          isNull(schema.courses.deletedAt),
        ),
      )
      .limit(1)
  )[0];
  if (!course) {
    throw new Error("Kelas tidak ditemukan.");
  }

  // Cegah duplikasi (partial unique courseId+userId aktif).
  const existing = (
    await db
      .select({ id: schema.enrollments.id })
      .from(schema.enrollments)
      .where(
        and(
          eq(schema.enrollments.courseId, courseId),
          eq(schema.enrollments.userId, userId),
          isNull(schema.enrollments.deletedAt),
        ),
      )
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(schema.enrollments).values({ courseId, userId });
  }

  revalidatePath("/kelas");
  revalidatePath(`/kelas/${course.slug}`);
}

const registerSchema = z.object({
  eventId: z.string().uuid("ID acara tidak valid."),
});

/** Daftar (register) user login ke sebuah event/webinar. Idempoten bila sudah terdaftar. */
export async function registerEvent(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Anda harus masuk terlebih dahulu untuk mendaftar acara.");
  }

  const parsed = registerSchema.safeParse({ eventId: opt(formData.get("eventId")) });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { eventId } = parsed.data;

  // Pastikan event ada, published, & belum dihapus.
  const event = (
    await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(
        and(
          eq(schema.events.id, eventId),
          eq(schema.events.status, "published"),
          isNull(schema.events.deletedAt),
        ),
      )
      .limit(1)
  )[0];
  if (!event) {
    throw new Error("Acara tidak ditemukan.");
  }

  // Ambil nama & email peserta dari profil user (kolom name wajib di event_registrations).
  const user = (
    await db
      .select({ name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1)
  )[0];
  if (!user) {
    throw new Error("Akun tidak ditemukan.");
  }

  // Cegah duplikasi pendaftaran aktif oleh user yang sama.
  const existing = (
    await db
      .select({ id: schema.eventRegistrations.id })
      .from(schema.eventRegistrations)
      .where(
        and(
          eq(schema.eventRegistrations.eventId, eventId),
          eq(schema.eventRegistrations.userId, userId),
          isNull(schema.eventRegistrations.deletedAt),
        ),
      )
      .limit(1)
  )[0];

  if (!existing) {
    await db.insert(schema.eventRegistrations).values({
      eventId,
      userId,
      name: user.name,
      email: user.email,
    });
  }

  revalidatePath("/event");
}

/* ===========================================================================
 * ADMIN KELAS — buat & hapus kursus (RBAC: course.create / course.manage).
 * Pola: validasi Zod → cek RBAC → upload cover NYATA ke Vercel Blob →
 * tulis DB (soft delete via deletedAt) → revalidatePath + redirect.
 * =========================================================================== */

/** Ambil id user yang sedang login (untuk audit deletedBy / resolusi ustadz). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

/** Cari profil ustadz aktif milik user login (opsional — null bila tidak punya). */
async function resolveUstadzId(userId: string): Promise<string | null> {
  const row = (
    await db
      .select({ id: schema.ustadzProfiles.id })
      .from(schema.ustadzProfiles)
      .where(and(eq(schema.ustadzProfiles.userId, userId), isNull(schema.ustadzProfiles.deletedAt)))
      .limit(1)
  )[0];
  return row?.id ?? null;
}

const optionalText = z
  .string()
  .trim()
  .transform((v): string | null => (v === "" ? null : v));

const createCourseSchema = z.object({
  title: z.string().trim().min(3, "Judul minimal 3 karakter").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung"),
  level: optionalText,
  description: optionalText,
  // opt() sudah mengubah string kosong → undefined sebelum divalidasi.
  ustadzId: z.string().uuid("Ustadz tidak valid").optional(),
});

/** Buat kursus baru + upload cover NYATA ke Vercel Blob (kelas/cover). Status langsung published. */
export async function createCourse(formData: FormData): Promise<void> {
  await requirePermission("course.create");
  const userId = await currentUserId();

  const parsed = createCourseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    level: formData.get("level") ?? "",
    description: formData.get("description") ?? "",
    ustadzId: opt(formData.get("ustadzId")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data kelas tidak valid.");
  }
  const data = parsed.data;

  // ustadzId dari input (opsional) → fallback ke profil ustadz milik user login.
  const ustadzId = data.ustadzId ?? (await resolveUstadzId(userId));

  // Upload cover NYATA ke Vercel Blob.
  const coverImage = await uploadToBlob(formData.get("coverFile") as File | null, "kelas/cover");

  await db.insert(schema.courses).values({
    title: data.title,
    slug: data.slug,
    description: data.description,
    level: data.level,
    coverImage,
    ustadzId,
    status: "published",
  });

  const ref = (await headers()).get("referer") ?? "";
  revalidatePath("/ustadz/kelas");
  revalidatePath("/admin/kelas");
  revalidatePath("/kelas");
  redirect(ref.includes("/ustadz") ? "/ustadz/kelas" : "/admin/kelas");
}

const updateCourseSchema = createCourseSchema.extend({
  id: z.string().uuid("Kelas tidak valid"),
});

/**
 * Perbarui kelas (RBAC: course.manage). Validasi Zod (+ id), upload cover BARU
 * bila ada (pertahankan lama bila kosong), update set updatedAt, lalu
 * revalidatePath + redirect.
 */
export async function updateCourse(formData: FormData): Promise<void> {
  await requirePermission("course.manage");

  const parsed = updateCourseSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    level: formData.get("level") ?? "",
    description: formData.get("description") ?? "",
    ustadzId: opt(formData.get("ustadzId")),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data kelas tidak valid.");
  }
  const data = parsed.data;

  // Pastikan kelas ada & belum dihapus.
  const existing = (
    await db
      .select({ id: schema.courses.id })
      .from(schema.courses)
      .where(and(eq(schema.courses.id, data.id), isNull(schema.courses.deletedAt)))
      .limit(1)
  )[0];
  if (!existing) throw new Error("Kelas tidak ditemukan atau sudah dihapus.");

  // Upload cover BARU bila ada (pertahankan lama bila kosong).
  const newCover = await uploadToBlob(formData.get("coverFile") as File | null, "kelas/cover");

  await db
    .update(schema.courses)
    .set({
      title: data.title,
      slug: data.slug,
      description: data.description,
      level: data.level,
      ...(data.ustadzId ? { ustadzId: data.ustadzId } : {}),
      ...(newCover ? { coverImage: newCover } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.courses.id, data.id), isNull(schema.courses.deletedAt)));

  revalidatePath("/admin/kelas");
  revalidatePath(`/admin/kelas/${data.id}`);
  revalidatePath("/kelas");
  redirect("/admin/kelas");
}

const softDeleteCourseSchema = z.object({
  id: z.string().uuid("Kelas tidak valid"),
});

/** Soft delete sebuah kursus (RBAC: course.manage). Set deletedAt/deletedBy, tidak hapus fisik. */
export async function softDeleteCourse(formData: FormData): Promise<void> {
  await requirePermission("course.manage");
  const userId = await currentUserId();

  const parsed = softDeleteCourseSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Kelas tidak valid.");
  }

  // Pastikan kelas ada & belum dihapus.
  const course = (
    await db
      .select({ id: schema.courses.id })
      .from(schema.courses)
      .where(and(eq(schema.courses.id, parsed.data.id), isNull(schema.courses.deletedAt)))
      .limit(1)
  )[0];
  if (!course) throw new Error("Kelas tidak ditemukan atau sudah dihapus.");

  await db
    .update(schema.courses)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(eq(schema.courses.id, parsed.data.id));

  revalidatePath("/admin/kelas");
  revalidatePath("/kelas");
  redirect("/admin/kelas");
}
