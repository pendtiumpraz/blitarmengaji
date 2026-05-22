"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { encryptToken } from "@/lib/storage";

/**
 * Server actions (MUTATION) untuk PROVIDER AI (endpoint OpenAI-compatible).
 * - RBAC: tiap action WAJIB requirePermission('settings.manage') (lihat AGENTS.md §4).
 * - KEAMANAN: API key plaintext diambil dari form, langsung dienkripsi AES-256-GCM
 *   (encryptToken) — HANYA ciphertext/iv/tag yang disimpan. API key plaintext
 *   TIDAK PERNAH di-select / di-return ke client maupun ditampilkan kembali.
 * - Soft delete: set deletedAt + deletedBy, JANGAN DELETE fisik.
 */

/** Ambil string ter-trim dari FormData; undefined bila kosong. */
const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

function revalidate() {
  revalidatePath("/admin/ai");
  revalidatePath("/admin/ai/providers");
}

// ── createProvider ──────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().trim().min(2, "Nama provider minimal 2 karakter."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug minimal 2 karakter.")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung."),
  baseUrl: z.string().trim().url("Base URL tidak valid (mis. https://api.deepseek.com)."),
  docsUrl: z.string().trim().url("Docs URL tidak valid.").optional(),
  apiKey: z.string().trim().min(8, "API key terlalu pendek.").optional(),
});

/**
 * Buat provider baru. Bila API key diisi → dienkripsi (AES-256-GCM) sebelum
 * disimpan; bila kosong, provider tersimpan tanpa key (isi belakangan via edit).
 */
export async function createProvider(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  const parsed = createSchema.safeParse({
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    baseUrl: opt(formData.get("baseUrl")),
    docsUrl: opt(formData.get("docsUrl")),
    apiKey: opt(formData.get("apiKey")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/ai/providers?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;

  // Enkripsi API key SEKARANG (bila ada) — plaintext tidak pernah masuk DB.
  const enc = data.apiKey ? encryptToken(data.apiKey) : null;

  await db.insert(schema.aiProviders).values({
    name: data.name,
    slug: data.slug,
    baseUrl: data.baseUrl,
    docsUrl: data.docsUrl ?? null,
    apiKeyCiphertext: enc?.ciphertext ?? null,
    apiKeyIv: enc?.iv ?? null,
    apiKeyTag: enc?.tag ?? null,
    isActive: true,
  });

  revalidate();
  redirect("/admin/ai/providers?ok=" + encodeURIComponent("Tersimpan."));
}

// ── updateProvider ──────────────────────────────────────────────────────────

const updateSchema = z.object({
  id: z.string().uuid("ID provider tidak valid."),
  name: z.string().trim().min(2, "Nama provider minimal 2 karakter."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug minimal 2 karakter.")
    .regex(/^[a-z0-9-]+$/, "Slug hanya huruf kecil, angka, dan tanda hubung."),
  baseUrl: z.string().trim().url("Base URL tidak valid (mis. https://api.deepseek.com)."),
  docsUrl: z.string().trim().url("Docs URL tidak valid.").optional(),
  apiKey: z.string().trim().min(8, "API key terlalu pendek.").optional(),
});

/**
 * Ubah provider. Bila field apiKey diisi (non-kosong) → re-encrypt & ganti key
 * lama. Bila apiKey KOSONG → key lama dibiarkan (tidak diubah).
 */
export async function updateProvider(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  const parsed = updateSchema.safeParse({
    id: opt(formData.get("id")),
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    baseUrl: opt(formData.get("baseUrl")),
    docsUrl: opt(formData.get("docsUrl")),
    apiKey: opt(formData.get("apiKey")),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/ai/providers?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;

  // Selalu update field non-rahasia.
  const set: Partial<typeof schema.aiProviders.$inferInsert> = {
    name: data.name,
    slug: data.slug,
    baseUrl: data.baseUrl,
    docsUrl: data.docsUrl ?? null,
    updatedAt: new Date(),
  };

  // Hanya re-encrypt & ganti key bila apiKey diisi; kosong = biarkan key lama.
  if (data.apiKey) {
    const { ciphertext, iv, tag } = encryptToken(data.apiKey);
    set.apiKeyCiphertext = ciphertext;
    set.apiKeyIv = iv;
    set.apiKeyTag = tag;
  }

  await db
    .update(schema.aiProviders)
    .set(set)
    .where(and(eq(schema.aiProviders.id, data.id), isNull(schema.aiProviders.deletedAt)));

  revalidate();
  redirect("/admin/ai/providers?ok=" + encodeURIComponent("Tersimpan."));
}

// ── softDeleteProvider ──────────────────────────────────────────────────────

const idSchema = z.object({ id: z.string().uuid("ID provider tidak valid.") });

/** Soft delete provider (set deletedAt + deletedBy). */
export async function softDeleteProvider(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  const parsed = idSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/ai/providers?err=" + encodeURIComponent(msg));
  }

  const deletedBy = (await auth())?.user?.id ?? null;

  await db
    .update(schema.aiProviders)
    .set({ deletedAt: new Date(), deletedBy, isActive: false, updatedAt: new Date() })
    .where(and(eq(schema.aiProviders.id, parsed.data.id), isNull(schema.aiProviders.deletedAt)));

  revalidate();
  redirect("/admin/ai/providers?ok=" + encodeURIComponent("Berhasil."));
}

// ── toggleProviderActive ────────────────────────────────────────────────────

/** Aktif/nonaktifkan provider (membalik nilai isActive). */
export async function toggleProviderActive(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  const parsed = idSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/ai/providers?err=" + encodeURIComponent(msg));
  }

  const rows = await db
    .select({ isActive: schema.aiProviders.isActive })
    .from(schema.aiProviders)
    .where(and(eq(schema.aiProviders.id, parsed.data.id), isNull(schema.aiProviders.deletedAt)))
    .limit(1);

  const current = rows[0];
  if (!current) {
    redirect("/admin/ai/providers?err=" + encodeURIComponent("Provider tidak ditemukan."));
  }

  await db
    .update(schema.aiProviders)
    .set({ isActive: !current.isActive, updatedAt: new Date() })
    .where(and(eq(schema.aiProviders.id, parsed.data.id), isNull(schema.aiProviders.deletedAt)));

  revalidate();
  redirect("/admin/ai/providers?ok=" + encodeURIComponent("Berhasil."));
}
