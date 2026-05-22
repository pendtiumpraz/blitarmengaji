"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";

/**
 * Bungkus error menjadi redirect `?err=` agar Toaster global menampilkannya.
 * `redirect()` melempar NEXT_REDIRECT secara internal — itu HARUS diteruskan.
 */
function toErrRedirect(path: string, err: unknown): never {
  if (isRedirectError(err)) throw err;
  const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
  redirect(path + "?err=" + encodeURIComponent(msg));
}

/**
 * Server actions (MUTATION) untuk JADWAL KAJIAN milik pengelola titik (route /kelola).
 * Pola: cek RBAC/ownership → validasi Zod → tulis DB → revalidatePath + redirect.
 * Soft delete via deletedAt/deletedBy (JANGAN DELETE fisik — lihat AGENTS.md §4).
 *
 * Otorisasi:
 *  - 'jadwal.manage' (atau super admin '*') → boleh kelola jadwal titik manapun.
 *  - selain itu, butuh 'titik.manage_own' DAN titik tujuan harus milik user.
 */

const { kajianSchedules, titikDakwah, kajian } = schema;

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

/** Pastikan titik (id) milik user login & aktif. Lempar error bila tidak. */
async function assertOwnsTitik(titikDakwahId: string, userId: string | null): Promise<void> {
  if (!userId) throw new Error("Sesi tidak valid.");
  const rows = await db
    .select({ ownerUserId: titikDakwah.ownerUserId })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.id, titikDakwahId), isNull(titikDakwah.deletedAt)))
    .limit(1);
  if (!rows[0] || rows[0].ownerUserId !== userId) {
    throw new Error("Akses ditolak: Anda hanya bisa mengelola jadwal titik milik sendiri.");
  }
}

const createSchema = z.object({
  titikDakwahId: z.string().uuid("Titik dakwah wajib dipilih."),
  kajianId: z.string().uuid("ID kajian tidak valid.").optional(),
  title: z.string().trim().min(3, "Judul jadwal minimal 3 karakter.").max(255),
  startAt: z.coerce.date({ message: "Tanggal & jam mulai tidak valid." }),
  isOnline: z.boolean(),
  streamUrl: z.string().trim().url("Link streaming tidak valid.").optional(),
});

/**
 * Buat jadwal kajian baru untuk titik milik user. Bila isOnline true, streamUrl
 * sebaiknya diisi. Cek RBAC (jadwal.manage) atau ownership (titik.manage_own).
 */
export async function createSchedule(formData: FormData): Promise<void> {
  try {
    const allowedAll = await can("jadwal.manage");
    const userId = (await auth())?.user?.id ?? null;

    // Bila bukan pengelola penuh, butuh permission titik.manage_own.
    if (!allowedAll && !(await can("titik.manage_own"))) {
      throw new Error("Akses ditolak: butuh permission 'jadwal.manage' atau 'titik.manage_own'.");
    }

    const parsed = createSchema.safeParse({
      titikDakwahId: opt(formData.get("titikDakwahId")),
      kajianId: opt(formData.get("kajianId")),
      title: opt(formData.get("title")),
      startAt: opt(formData.get("startAt")),
      isOnline: formData.get("isOnline") === "on" || formData.get("isOnline") === "true",
      streamUrl: opt(formData.get("streamUrl")),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data jadwal tidak valid.");
    }
    const data = parsed.data;

    // Ownership: titik tujuan harus milik user (kecuali pengelola penuh).
    if (!allowedAll) {
      await assertOwnsTitik(data.titikDakwahId, userId);
    }

    // Bila kajian dipilih, pastikan kajian aktif & terikat ke titik yang sama.
    if (data.kajianId) {
      const krows = await db
        .select({ titikDakwahId: kajian.titikDakwahId })
        .from(kajian)
        .where(and(eq(kajian.id, data.kajianId), isNull(kajian.deletedAt)))
        .limit(1);
      if (!krows[0]) throw new Error("Kajian tidak ditemukan.");
      if (krows[0].titikDakwahId && krows[0].titikDakwahId !== data.titikDakwahId) {
        throw new Error("Kajian yang dipilih bukan milik titik tersebut.");
      }
    }

    await db.insert(kajianSchedules).values({
      titikDakwahId: data.titikDakwahId,
      kajianId: data.kajianId ?? null,
      title: data.title,
      startAt: data.startAt,
      isOnline: data.isOnline,
      streamUrl: data.isOnline ? data.streamUrl ?? null : null,
      status: "scheduled",
    });

    revalidatePath("/kelola/jadwal");
    revalidatePath("/kelola");
    revalidatePath("/jadwal");
  } catch (err) {
    toErrRedirect("/kelola/jadwal", err);
  }
  redirect("/kelola/jadwal?ok=" + encodeURIComponent("Tersimpan."));
}

const updateSchema = z.object({
  id: z.string().uuid("ID jadwal tidak valid."),
  titikDakwahId: z.string().uuid("Titik dakwah wajib dipilih."),
  kajianId: z.string().uuid("ID kajian tidak valid.").optional(),
  title: z.string().trim().min(3, "Judul jadwal minimal 3 karakter.").max(255),
  startAt: z.coerce.date({ message: "Tanggal & jam mulai tidak valid." }),
  isOnline: z.boolean(),
  streamUrl: z.string().trim().url("Link streaming tidak valid.").optional(),
  status: z.enum(["scheduled", "ongoing", "done", "cancelled"], {
    message: "Status jadwal tidak valid.",
  }),
});

/**
 * Ubah jadwal kajian yang sudah ada. Cek RBAC (jadwal.manage) atau ownership
 * (titik.manage_own): jadwal lama DAN titik tujuan harus milik user.
 */
export async function updateSchedule(formData: FormData): Promise<void> {
  try {
    const allowedAll = await can("jadwal.manage");
    const userId = (await auth())?.user?.id ?? null;

    // Bila bukan pengelola penuh, butuh permission titik.manage_own.
    if (!allowedAll && !(await can("titik.manage_own"))) {
      throw new Error("Akses ditolak: butuh permission 'jadwal.manage' atau 'titik.manage_own'.");
    }

    const parsed = updateSchema.safeParse({
      id: opt(formData.get("id")),
      titikDakwahId: opt(formData.get("titikDakwahId")),
      kajianId: opt(formData.get("kajianId")),
      title: opt(formData.get("title")),
      startAt: opt(formData.get("startAt")),
      isOnline: formData.get("isOnline") === "on" || formData.get("isOnline") === "true",
      streamUrl: opt(formData.get("streamUrl")),
      status: opt(formData.get("status")),
    });

    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data jadwal tidak valid.");
    }
    const data = parsed.data;

    // Ownership (kecuali pengelola penuh): jadwal lama harus terikat ke titik milik
    // user, DAN titik tujuan (yang baru) juga harus milik user.
    if (!allowedAll) {
      const rows = await db
        .select({ ownerUserId: titikDakwah.ownerUserId })
        .from(kajianSchedules)
        .leftJoin(titikDakwah, eq(kajianSchedules.titikDakwahId, titikDakwah.id))
        .where(and(eq(kajianSchedules.id, data.id), isNull(kajianSchedules.deletedAt)))
        .limit(1);
      if (!rows[0] || !userId || rows[0].ownerUserId !== userId) {
        throw new Error("Akses ditolak: Anda hanya bisa mengubah jadwal titik milik sendiri.");
      }
      await assertOwnsTitik(data.titikDakwahId, userId);
    }

    // Bila kajian dipilih, pastikan kajian aktif & terikat ke titik yang sama.
    if (data.kajianId) {
      const krows = await db
        .select({ titikDakwahId: kajian.titikDakwahId })
        .from(kajian)
        .where(and(eq(kajian.id, data.kajianId), isNull(kajian.deletedAt)))
        .limit(1);
      if (!krows[0]) throw new Error("Kajian tidak ditemukan.");
      if (krows[0].titikDakwahId && krows[0].titikDakwahId !== data.titikDakwahId) {
        throw new Error("Kajian yang dipilih bukan milik titik tersebut.");
      }
    }

    await db
      .update(kajianSchedules)
      .set({
        titikDakwahId: data.titikDakwahId,
        kajianId: data.kajianId ?? null,
        title: data.title,
        startAt: data.startAt,
        isOnline: data.isOnline,
        streamUrl: data.isOnline ? data.streamUrl ?? null : null,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(and(eq(kajianSchedules.id, data.id), isNull(kajianSchedules.deletedAt)));

    revalidatePath("/kelola/jadwal");
    revalidatePath("/kelola");
    revalidatePath("/jadwal");
  } catch (err) {
    toErrRedirect("/kelola/jadwal", err);
  }
  redirect("/kelola/jadwal?ok=" + encodeURIComponent("Tersimpan."));
}

const deleteSchema = z.object({
  id: z.string().uuid("ID jadwal tidak valid."),
});

/**
 * Soft delete jadwal kajian (set deletedAt + deletedBy). Cek RBAC/ownership:
 * pengelola penuh (jadwal.manage) atau pemilik titik (titik.manage_own).
 */
export async function deleteSchedule(formData: FormData): Promise<void> {
  try {
    const allowedAll = await can("jadwal.manage");
    const userId = (await auth())?.user?.id ?? null;

    if (!allowedAll && !(await can("titik.manage_own"))) {
      throw new Error("Akses ditolak: butuh permission 'jadwal.manage' atau 'titik.manage_own'.");
    }

    const parsed = deleteSchema.safeParse({ id: opt(formData.get("id")) });
    if (!parsed.success) {
      throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
    }

    // Ownership: jadwal harus terikat ke titik milik user (kecuali pengelola penuh).
    if (!allowedAll) {
      const rows = await db
        .select({ ownerUserId: titikDakwah.ownerUserId })
        .from(kajianSchedules)
        .leftJoin(titikDakwah, eq(kajianSchedules.titikDakwahId, titikDakwah.id))
        .where(and(eq(kajianSchedules.id, parsed.data.id), isNull(kajianSchedules.deletedAt)))
        .limit(1);
      if (!rows[0] || !userId || rows[0].ownerUserId !== userId) {
        throw new Error("Akses ditolak: Anda hanya bisa menghapus jadwal titik milik sendiri.");
      }
    }

    await db
      .update(kajianSchedules)
      .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
      .where(and(eq(kajianSchedules.id, parsed.data.id), isNull(kajianSchedules.deletedAt)));

    revalidatePath("/kelola/jadwal");
    revalidatePath("/kelola");
    revalidatePath("/jadwal");
  } catch (err) {
    toErrRedirect("/kelola/jadwal", err);
  }
  redirect("/kelola/jadwal?ok=" + encodeURIComponent("Dihapus."));
}
