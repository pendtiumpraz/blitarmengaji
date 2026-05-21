"use server";

import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";

/**
 * Server actions (MUTATION) untuk dashboard Media Partner (panel /kelola/media-partner).
 * Pola (lihat AGENTS.md §0 & §4):
 *   validasi Zod → cek RBAC (media.manage_own / '*') + ownership → tulis DB
 *   (soft delete via deletedAt/deletedBy) → revalidatePath + redirect.
 *
 * Video media partner: videos.ownerType = 'media', ownerId = media_partners.id.
 * Ownership: aksi hanya menyentuh media partner yang DIMILIKI user (ownerUserId),
 * kecuali super admin ('*').
 */

const MANAGE_PERMS = ["*", "media.manage_own"];

/** Ambil id user yang sedang login (untuk deletedBy / pengecekan ownership). */
async function currentUserId(): Promise<string> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.");
  return uid;
}

/** Pastikan user punya permission kelola media (media.manage_own atau '*'). */
async function assertCanManage(userId: string): Promise<boolean> {
  const perms = await getUserPermissions(userId);
  if (!perms.some((p) => MANAGE_PERMS.includes(p))) {
    throw new Error("Akses ditolak: butuh permission 'media.manage_own'.");
  }
  return perms.includes("*");
}

/**
 * Pastikan media partner benar-benar milik user (atau super admin '*').
 * Lempar error bila bukan miliknya. Kembalikan id media partner bila valid.
 */
async function assertOwnMediaPartner(
  mediaPartnerId: string,
  userId: string,
  isSuper: boolean,
): Promise<string> {
  const rows = await db
    .select({
      id: schema.mediaPartners.id,
      ownerUserId: schema.mediaPartners.ownerUserId,
    })
    .from(schema.mediaPartners)
    .where(and(eq(schema.mediaPartners.id, mediaPartnerId), isNull(schema.mediaPartners.deletedAt)))
    .limit(1);
  const partner = rows[0];
  if (!partner) throw new Error("Media partner tidak ditemukan.");
  if (!isSuper && partner.ownerUserId !== userId) {
    throw new Error("Akses ditolak: Anda hanya bisa mengelola media partner milik sendiri.");
  }
  return partner.id;
}

const optionalText = z
  .string()
  .trim()
  .transform((v): string | null => (v === "" ? null : v));

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

  // Facebook: facebook.com/.../videos/<id>, fb.watch/<code>, /watch/?v=<id>, /reel/<id>
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

const addMediaVideoSchema = z.object({
  mediaPartnerId: z.string().uuid("Media partner wajib dipilih."),
  title: optionalText,
  sourceUrl: z.string().trim().url("Tautan video tidak valid."),
  isLive: z.boolean(),
});

/**
 * Tambah video/livestream embed (YouTube/Facebook) milik media partner user.
 * Parse URL → platform + embedId, lalu insert videos (ownerType 'media').
 */
export async function addMediaVideo(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const isSuper = await assertCanManage(userId);

  const parsed = addMediaVideoSchema.safeParse({
    mediaPartnerId: formData.get("mediaPartnerId"),
    title: formData.get("title") ?? "",
    sourceUrl: formData.get("sourceUrl"),
    isLive: formData.get("isLive") === "on" || formData.get("isLive") === "true",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data video tidak valid.");
  }
  const data = parsed.data;

  const ownerId = await assertOwnMediaPartner(data.mediaPartnerId, userId, isSuper);

  const parsedUrl = parseVideoUrl(data.sourceUrl);
  if (!parsedUrl) {
    throw new Error("Hanya tautan YouTube atau Facebook yang didukung.");
  }

  await db.insert(schema.videos).values({
    ownerType: "media",
    ownerId,
    platform: parsedUrl.platform,
    sourceUrl: data.sourceUrl,
    embedId: parsedUrl.embedId,
    title: data.title,
    isLive: data.isLive,
  });

  revalidatePath("/kelola/media-partner");
  redirect("/kelola/media-partner");
}

const deleteMediaVideoSchema = z.object({
  id: z.string().uuid("Video tidak valid."),
});

/** Soft delete satu video media partner (set deletedAt + deletedBy) setelah cek ownership. */
export async function deleteMediaVideo(formData: FormData): Promise<void> {
  const userId = await currentUserId();
  const isSuper = await assertCanManage(userId);

  const parsed = deleteMediaVideoSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Video tidak valid.");
  }

  const rows = await db
    .select({ id: schema.videos.id, ownerId: schema.videos.ownerId })
    .from(schema.videos)
    .where(
      and(
        eq(schema.videos.id, parsed.data.id),
        eq(schema.videos.ownerType, "media"),
        isNull(schema.videos.deletedAt),
      ),
    )
    .limit(1);
  const video = rows[0];
  if (!video) throw new Error("Video tidak ditemukan atau sudah dihapus.");

  await assertOwnMediaPartner(video.ownerId, userId, isSuper);

  await db
    .update(schema.videos)
    .set({ deletedAt: new Date(), deletedBy: userId, updatedAt: new Date() })
    .where(eq(schema.videos.id, parsed.data.id));

  revalidatePath("/kelola/media-partner");
  redirect("/kelola/media-partner");
}
