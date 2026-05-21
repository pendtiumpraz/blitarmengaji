"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { uploadToBlob } from "@/lib/blob";
import { resolveUploadToken } from "@/lib/storage";

/**
 * Server actions (MUTATION) untuk domain Galeri (media_assets) & Video (videos)
 * pada panel pengelola titik (/kelola). Pola (lihat AGENTS.md §0 & §4):
 *   validasi Zod → cek RBAC/ownership → tulis DB (soft delete via deletedAt/deletedBy)
 *   → revalidatePath + redirect.
 *
 * Ownership: aksi hanya boleh menyentuh titik yang DIMILIKI user (ownerUserId),
 * kecuali user super admin / punya permission gallery.manage (atau '*').
 */

/** Ambil id user yang sedang login (untuk uploadedBy/deletedBy). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

/**
 * Pastikan titik benar-benar milik user (atau user super admin '*').
 * Lempar error bila bukan miliknya. Kembalikan id titik bila valid.
 * Catatan: pengelola titik memegang gallery.manage/video.manage TAPI hanya untuk
 * titik MILIKNYA (manage_own) — maka bypass penuh hanya untuk '*'. Lihat AGENTS.md §4.
 */
async function assertOwnTitik(titikId: string, userId: string): Promise<string> {
  const perms = await getUserPermissions(userId);
  const isSuper = perms.includes("*");
  const rows = await db
    .select({ id: schema.titikDakwah.id, ownerUserId: schema.titikDakwah.ownerUserId })
    .from(schema.titikDakwah)
    .where(and(eq(schema.titikDakwah.id, titikId), isNull(schema.titikDakwah.deletedAt)))
    .limit(1);
  const titik = rows[0];
  if (!titik) throw new Error("Titik dakwah tidak ditemukan.");
  if (!isSuper && titik.ownerUserId !== userId) {
    throw new Error("Akses ditolak: Anda hanya bisa mengelola titik dakwah milik sendiri.");
  }
  return titik.id;
}

const optionalText = z
  .string()
  .trim()
  .transform((v): string | null => (v === "" ? null : v));

/* ============================================================
 * GALERI (media_assets, kind=image, ownerType=titik)
 * ============================================================ */

const addGalleryImageSchema = z.object({
  titikId: z.string().uuid("Titik dakwah wajib dipilih."),
  caption: optionalText,
});

/** Upload foto galeri ke Vercel Blob lalu simpan ke media_assets milik titik. */
export async function addGalleryImage(formData: FormData): Promise<void> {
  const userId = await currentUserId();

  const parsed = addGalleryImageSchema.safeParse({
    titikId: formData.get("titikId"),
    caption: formData.get("caption") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data foto tidak valid.");
  }
  const data = parsed.data;

  const titikId = await assertOwnTitik(data.titikId, userId);

  const imageFile = formData.get("imageFile") as File | null;
  if (!imageFile || typeof imageFile === "string" || imageFile.size === 0) {
    throw new Error("Berkas foto wajib diunggah.");
  }

  // Token storage milik titik bila ada, jika tidak fallback ke token global (env).
  const token = await resolveUploadToken("titik", titikId);
  const url = await uploadToBlob(imageFile, "galeri", token);
  if (!url) throw new Error("Gagal mengunggah foto. Coba lagi.");

  await db.insert(schema.mediaAssets).values({
    ownerType: "titik",
    ownerId: titikId,
    kind: "image",
    url,
    caption: data.caption,
    size: imageFile.size,
    mime: imageFile.type || null,
    uploadedBy: userId,
  });

  revalidatePath("/kelola/galeri");
  redirect("/kelola/galeri");
}

const deleteMediaSchema = z.object({
  id: z.string().uuid("Foto tidak valid."),
});

/** Soft delete satu foto galeri (set deletedAt + deletedBy). */
export async function deleteMedia(formData: FormData): Promise<void> {
  const userId = await currentUserId();

  const parsed = deleteMediaSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Foto tidak valid.");
  }

  const rows = await db
    .select({ id: schema.mediaAssets.id, ownerId: schema.mediaAssets.ownerId })
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.id, parsed.data.id), isNull(schema.mediaAssets.deletedAt)))
    .limit(1);
  const media = rows[0];
  if (!media) throw new Error("Foto tidak ditemukan atau sudah dihapus.");

  // Verifikasi kepemilikan titik pemilik foto.
  await assertOwnTitik(media.ownerId, userId);

  await db
    .update(schema.mediaAssets)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(eq(schema.mediaAssets.id, parsed.data.id));

  revalidatePath("/kelola/galeri");
  redirect("/kelola/galeri");
}

/* ============================================================
 * VIDEO (videos, ownerType=titik)
 * ============================================================ */

/**
 * Parse URL YouTube/Facebook → { platform, embedId }.
 * Mengembalikan null bila bukan URL platform yang didukung.
 */
function parseVideoUrl(
  raw: string,
): { platform: "youtube" | "facebook"; embedId: string | null } | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  // YouTube: youtu.be/<id>, youtube.com/watch?v=<id>, /embed/<id>, /live/<id>, /shorts/<id>
  if (host === "youtu.be") {
    const id = u.pathname.split("/").filter(Boolean)[0] ?? null;
    return { platform: "youtube", embedId: id };
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = u.searchParams.get("v");
    if (v) return { platform: "youtube", embedId: v };
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "embed" || p === "live" || p === "shorts" || p === "v");
    const id = idx >= 0 ? parts[idx + 1] ?? null : null;
    return { platform: "youtube", embedId: id };
  }

  // Facebook: facebook.com/.../videos/<id>, fb.watch/<code>, /watch/?v=<id>
  if (host === "facebook.com" || host === "m.facebook.com" || host === "web.facebook.com") {
    const v = u.searchParams.get("v");
    if (v) return { platform: "facebook", embedId: v };
    const parts = u.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "videos" || p === "reel");
    const id = idx >= 0 ? parts[idx + 1] ?? null : parts[parts.length - 1] ?? null;
    return { platform: "facebook", embedId: id };
  }
  if (host === "fb.watch") {
    const code = u.pathname.split("/").filter(Boolean)[0] ?? null;
    return { platform: "facebook", embedId: code };
  }

  return null;
}

const addVideoSchema = z.object({
  titikId: z.string().uuid("Titik dakwah wajib dipilih."),
  title: optionalText,
  sourceUrl: z.string().trim().url("Tautan video tidak valid."),
  isLive: z.boolean(),
});

/** Tambah video embed (YouTube/Facebook) milik titik. Parse URL → platform + embedId. */
export async function addVideo(formData: FormData): Promise<void> {
  const userId = await currentUserId();

  const parsed = addVideoSchema.safeParse({
    titikId: formData.get("titikId"),
    title: formData.get("title") ?? "",
    sourceUrl: formData.get("sourceUrl"),
    isLive: formData.get("isLive") === "on" || formData.get("isLive") === "true",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data video tidak valid.");
  }
  const data = parsed.data;

  const titikId = await assertOwnTitik(data.titikId, userId);

  const parsedUrl = parseVideoUrl(data.sourceUrl);
  if (!parsedUrl) {
    throw new Error("Hanya tautan YouTube atau Facebook yang didukung.");
  }

  await db.insert(schema.videos).values({
    ownerType: "titik",
    ownerId: titikId,
    platform: parsedUrl.platform,
    sourceUrl: data.sourceUrl,
    embedId: parsedUrl.embedId,
    title: data.title,
    isLive: data.isLive,
  });

  revalidatePath("/kelola/video");
  redirect("/kelola/video");
}

const deleteVideoSchema = z.object({
  id: z.string().uuid("Video tidak valid."),
});

/** Soft delete satu video (set deletedAt + deletedBy). */
export async function deleteVideo(formData: FormData): Promise<void> {
  const userId = await currentUserId();

  const parsed = deleteVideoSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Video tidak valid.");
  }

  const rows = await db
    .select({ id: schema.videos.id, ownerId: schema.videos.ownerId })
    .from(schema.videos)
    .where(and(eq(schema.videos.id, parsed.data.id), isNull(schema.videos.deletedAt)))
    .limit(1);
  const video = rows[0];
  if (!video) throw new Error("Video tidak ditemukan atau sudah dihapus.");

  await assertOwnTitik(video.ownerId, userId);

  await db
    .update(schema.videos)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(eq(schema.videos.id, parsed.data.id));

  revalidatePath("/kelola/video");
  redirect("/kelola/video");
}

/* ============================================================
 * EDIT galeri & video
 * ============================================================ */

const updateGallerySchema = z.object({
  id: z.string().uuid("Foto tidak valid."),
  caption: optionalText,
});

/** Ubah caption foto galeri. */
export async function updateGalleryImage(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const parsed = updateGallerySchema.safeParse({
    id: formData.get("id"),
    caption: formData.get("caption") ?? "",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");

  const rows = await db
    .select({ ownerId: schema.mediaAssets.ownerId })
    .from(schema.mediaAssets)
    .where(and(eq(schema.mediaAssets.id, parsed.data.id), isNull(schema.mediaAssets.deletedAt)))
    .limit(1);
  if (!rows[0]) throw new Error("Foto tidak ditemukan.");
  await assertOwnTitik(rows[0].ownerId, userId);

  await db
    .update(schema.mediaAssets)
    .set({ caption: parsed.data.caption, updatedAt: new Date() })
    .where(eq(schema.mediaAssets.id, parsed.data.id));

  revalidatePath("/kelola/galeri");
  redirect("/kelola/galeri");
}

const updateVideoSchema = z.object({
  id: z.string().uuid("Video tidak valid."),
  title: optionalText,
  sourceUrl: z.string().trim().url("Tautan video tidak valid."),
  isLive: z.boolean(),
});

/** Ubah judul/URL/status LIVE video (re-parse platform & embedId). */
export async function updateVideo(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const parsed = updateVideoSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title") ?? "",
    sourceUrl: formData.get("sourceUrl"),
    isLive: formData.get("isLive") === "on" || formData.get("isLive") === "true",
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Data video tidak valid.");

  const rows = await db
    .select({ ownerId: schema.videos.ownerId })
    .from(schema.videos)
    .where(and(eq(schema.videos.id, parsed.data.id), isNull(schema.videos.deletedAt)))
    .limit(1);
  if (!rows[0]) throw new Error("Video tidak ditemukan.");
  await assertOwnTitik(rows[0].ownerId, userId);

  const pu = parseVideoUrl(parsed.data.sourceUrl);
  if (!pu) throw new Error("Hanya tautan YouTube atau Facebook yang didukung.");

  await db
    .update(schema.videos)
    .set({
      title: parsed.data.title,
      sourceUrl: parsed.data.sourceUrl,
      platform: pu.platform,
      embedId: pu.embedId,
      isLive: parsed.data.isLive,
      updatedAt: new Date(),
    })
    .where(eq(schema.videos.id, parsed.data.id));

  revalidatePath("/kelola/video");
  redirect("/kelola/video");
}
