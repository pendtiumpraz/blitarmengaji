"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { can, requirePermission } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";

/**
 * Server actions (MUTATION) untuk domain ACARA (events).
 * Pola: cek RBAC → upload berkas NYATA ke Vercel Blob → validasi Zod → tulis DB
 * → revalidatePath + redirect. Soft delete via deletedAt/deletedBy (lihat AGENTS.md §0 & §4).
 * Catatan: file ini TERPISAH dari src/lib/actions/belajar.ts (domain kelas).
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

const createSchema = z.object({
  title: z.string().trim().min(3, "Judul acara minimal 3 karakter.").max(255),
  slug: z
    .string()
    .trim()
    .min(3, "Slug minimal 3 karakter.")
    .max(255)
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  kind: z.enum(["webinar", "offline", "hybrid"], {
    message: "Jenis acara harus webinar, offline, atau hybrid.",
  }),
  startAt: z.coerce.date({ message: "Tanggal mulai tidak valid." }),
  description: z.string().trim().optional(),
  endAt: z.coerce.date().optional(),
  location: z.string().trim().optional(),
  onlineUrl: z.string().trim().url("Link daring tidak valid.").optional(),
  capacity: z.coerce.number().int().min(0, "Kapasitas tidak valid.").optional(),
  needsRegistration: z.coerce.boolean().optional(),
  // organizerId opsional: bila diisi (mis. dari /kelola/event) → acara atas nama
  // partner usaha (organizerType 'partner'); bila kosong (admin) → internal.
  organizerId: z.string().uuid("Usaha penyelenggara tidak valid.").optional(),
  titikDakwahId: z.string().uuid("Titik dakwah tidak valid.").optional(),
});

/** Buat acara baru. status default 'published'; upload coverFile → coverImage. */
export async function createEvent(formData: FormData): Promise<void> {
  await requirePermission("event.create");

  const parsed = createSchema.safeParse({
    title: opt(formData.get("title")),
    slug: opt(formData.get("slug")),
    kind: opt(formData.get("kind")),
    startAt: opt(formData.get("startAt")),
    description: opt(formData.get("description")),
    endAt: opt(formData.get("endAt")),
    location: opt(formData.get("location")),
    onlineUrl: opt(formData.get("onlineUrl")),
    capacity: opt(formData.get("capacity")),
    needsRegistration: formData.get("needsRegistration") != null,
    organizerId: opt(formData.get("organizerId")),
    titikDakwahId: opt(formData.get("titikDakwahId")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data acara tidak valid.";
    redirect("/admin/event?err=" + encodeURIComponent(msg));
  }
  const data = parsed.data;

  // Bila ada organizerId → acara atas nama partner usaha. Validasi partner ada,
  // belum dihapus, dan (kecuali pengelola penuh event.manage) milik user login.
  let organizerType: "partner" | "internal" = "internal";
  let organizerId: string | null = null;
  if (data.organizerId) {
    const partner = (
      await db
        .select({
          id: schema.businessPartners.id,
          ownerUserId: schema.businessPartners.ownerUserId,
        })
        .from(schema.businessPartners)
        .where(
          and(
            eq(schema.businessPartners.id, data.organizerId),
            isNull(schema.businessPartners.deletedAt),
          ),
        )
        .limit(1)
    )[0];
    if (!partner) {
      redirect(
        "/admin/event?err=" + encodeURIComponent("Usaha penyelenggara tidak ditemukan."),
      );
    }
    const allowedAll = await can("event.manage");
    if (!allowedAll) {
      const userId = (await auth())?.user?.id ?? null;
      if (!userId || partner.ownerUserId !== userId) {
        redirect(
          "/admin/event?err=" +
            encodeURIComponent(
              "Akses ditolak: Anda hanya bisa membuat acara untuk usaha sendiri.",
            ),
        );
      }
    }
    organizerType = "partner";
    organizerId = partner.id;
  }

  // Upload sampul ASLI ke Vercel Blob (token global env).
  const coverImage = await uploadToBlob(
    formData.get("coverFile") as File | null,
    "event/cover",
  );

  await db.insert(schema.events).values({
    title: data.title,
    slug: data.slug,
    kind: data.kind,
    organizerType,
    organizerId,
    description: data.description ?? null,
    coverImage,
    startAt: data.startAt,
    endAt: data.endAt ?? null,
    location: data.location ?? null,
    onlineUrl: data.onlineUrl ?? null,
    capacity: data.capacity ?? null,
    needsRegistration: data.needsRegistration ?? false,
    titikDakwahId: data.titikDakwahId ?? null,
    status: "published",
  });

  // Acara partner kembali ke dashboard self-service; acara internal ke admin.
  revalidatePath("/admin/event");
  revalidatePath("/kelola/event");
  revalidatePath("/event");
  // Jalur /kelola/event dipertahankan; jalur admin diberi ?ok untuk toast.
  redirect(
    organizerType === "partner"
      ? "/kelola/event"
      : "/admin/event?ok=" + encodeURIComponent("Tersimpan."),
  );
}

const updateSchema = createSchema.extend({
  id: z.string().uuid("ID acara tidak valid."),
});

/**
 * Perbarui acara. RBAC: event.manage.
 * Upload coverFile baru bila ada; jika tidak, pertahankan sampul lama.
 * Set updatedAt, lalu revalidate + redirect ke daftar.
 */
export async function updateEvent(formData: FormData): Promise<void> {
  await requirePermission("event.manage");

  const parsed = updateSchema.safeParse({
    id: opt(formData.get("id")),
    title: opt(formData.get("title")),
    slug: opt(formData.get("slug")),
    kind: opt(formData.get("kind")),
    startAt: opt(formData.get("startAt")),
    description: opt(formData.get("description")),
    endAt: opt(formData.get("endAt")),
    location: opt(formData.get("location")),
    onlineUrl: opt(formData.get("onlineUrl")),
    capacity: opt(formData.get("capacity")),
    needsRegistration: formData.get("needsRegistration") != null,
    titikDakwahId: opt(formData.get("titikDakwahId")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data acara tidak valid.";
    redirect("/admin/event?err=" + encodeURIComponent(msg));
  }
  const { id, ...data } = parsed.data;

  // Pastikan acara ada & belum dihapus.
  const existing = (
    await db
      .select({ coverImage: schema.events.coverImage })
      .from(schema.events)
      .where(and(eq(schema.events.id, id), isNull(schema.events.deletedAt)))
      .limit(1)
  )[0];
  if (!existing) {
    redirect("/admin/event?err=" + encodeURIComponent("Acara tidak ditemukan."));
  }

  // Upload sampul baru bila ada; jika tidak, pertahankan yang lama.
  const newCover = await uploadToBlob(
    formData.get("coverFile") as File | null,
    "event/cover",
  );
  const coverImage = newCover ?? existing.coverImage;

  await db
    .update(schema.events)
    .set({
      title: data.title,
      slug: data.slug,
      kind: data.kind,
      description: data.description ?? null,
      coverImage,
      startAt: data.startAt,
      endAt: data.endAt ?? null,
      location: data.location ?? null,
      onlineUrl: data.onlineUrl ?? null,
      capacity: data.capacity ?? null,
      needsRegistration: data.needsRegistration ?? false,
      titikDakwahId: data.titikDakwahId ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.events.id, id), isNull(schema.events.deletedAt)));

  revalidatePath("/admin/event");
  revalidatePath("/event");
  redirect("/admin/event?ok=" + encodeURIComponent("Tersimpan."));
}

const deleteSchema = z.object({
  id: z.string().uuid("ID acara tidak valid."),
});

/** Soft delete acara (set deletedAt + deletedBy). RBAC: event.manage. */
export async function softDeleteEvent(formData: FormData): Promise<void> {
  await requirePermission("event.manage");

  const parsed = deleteSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/event?err=" + encodeURIComponent(msg));
  }

  const deletedBy = (await auth())?.user?.id ?? null;

  await db
    .update(schema.events)
    .set({ deletedAt: new Date(), deletedBy, updatedAt: new Date() })
    .where(and(eq(schema.events.id, parsed.data.id), isNull(schema.events.deletedAt)));

  revalidatePath("/admin/event");
  revalidatePath("/event");
  redirect("/admin/event?ok=" + encodeURIComponent("Dihapus."));
}
