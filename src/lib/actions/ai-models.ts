"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";

/**
 * Server actions (MUTATION) untuk domain AI MODELS (katalog model per provider).
 * - RBAC: tiap action WAJIB requirePermission('settings.manage').
 * - Validasi: Zod (dipakai bersama FE & BE) — lihat AGENTS.md §2.
 * - Soft delete: set deletedAt + deletedBy, JANGAN DELETE fisik (AGENTS.md §4).
 * - revalidatePath('/admin/ai', '/admin/ai/models') setelah tiap mutasi.
 */

const PERM = "settings.manage";

const KIND_VALUES = ["chat", "reasoning", "embedding", "vision", "multimodal"] as const;

/** Helper: revalidasi dua rute admin AI yang terdampak. */
function revalidateAi() {
  revalidatePath("/admin/ai");
  revalidatePath("/admin/ai/models");
}

// ── Skema dasar (create) ─────────────────────────────────────────────────────
const baseSchema = z.object({
  providerId: z.string().uuid("Provider tidak valid."),
  modelId: z
    .string()
    .trim()
    .min(1, "ID model wajib diisi.")
    .max(160, "ID model maksimal 160 karakter."),
  label: z
    .string()
    .trim()
    .min(1, "Label wajib diisi.")
    .max(160, "Label maksimal 160 karakter."),
  kind: z.enum(KIND_VALUES, { message: "Jenis model tidak valid." }),
  contextWindow: z
    .union([z.literal(""), z.coerce.number().int().positive("Context window harus lebih dari 0.")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
});

// ── createModel ──────────────────────────────────────────────────────────────
export async function createModel(formData: FormData): Promise<void> {
  await requirePermission(PERM);

  const parsed = baseSchema.safeParse({
    providerId: formData.get("providerId") ?? "",
    modelId: formData.get("modelId") ?? "",
    label: formData.get("label") ?? "",
    kind: formData.get("kind") ?? "",
    contextWindow: formData.get("contextWindow") ?? "",
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data model tidak valid.";
    redirect("/admin/ai/models?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;

  await db.insert(schema.aiModels).values({
    providerId: data.providerId,
    modelId: data.modelId,
    label: data.label,
    kind: data.kind,
    contextWindow: data.contextWindow,
  });

  revalidateAi();
  redirect("/admin/ai/models?ok=" + encodeURIComponent("Tersimpan."));
}

// ── updateModel ──────────────────────────────────────────────────────────────
const updateSchema = baseSchema.extend({
  id: z.string().uuid("ID model tidak valid."),
});

export async function updateModel(formData: FormData): Promise<void> {
  await requirePermission(PERM);

  const parsed = updateSchema.safeParse({
    id: formData.get("id") ?? "",
    providerId: formData.get("providerId") ?? "",
    modelId: formData.get("modelId") ?? "",
    label: formData.get("label") ?? "",
    kind: formData.get("kind") ?? "",
    contextWindow: formData.get("contextWindow") ?? "",
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data model tidak valid.";
    redirect("/admin/ai/models?err=" + encodeURIComponent(msg));
  }

  const data = parsed.data;

  await db
    .update(schema.aiModels)
    .set({
      providerId: data.providerId,
      modelId: data.modelId,
      label: data.label,
      kind: data.kind,
      contextWindow: data.contextWindow,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.aiModels.id, data.id), isNull(schema.aiModels.deletedAt)));

  revalidateAi();
  redirect("/admin/ai/models?ok=" + encodeURIComponent("Tersimpan."));
}

// ── softDeleteModel ──────────────────────────────────────────────────────────
const idSchema = z.object({ id: z.string().uuid("ID model tidak valid.") });

export async function softDeleteModel(formData: FormData): Promise<void> {
  await requirePermission(PERM);

  const parsed = idSchema.safeParse({ id: formData.get("id") ?? "" });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "ID model tidak valid.";
    redirect("/admin/ai/models?err=" + encodeURIComponent(msg));
  }

  const session = await auth();

  await db
    .update(schema.aiModels)
    .set({ deletedAt: new Date(), deletedBy: session?.user?.id ?? null })
    .where(and(eq(schema.aiModels.id, parsed.data.id), isNull(schema.aiModels.deletedAt)));

  revalidateAi();
  redirect("/admin/ai/models?ok=" + encodeURIComponent("Berhasil."));
}

// ── toggleModelActive ────────────────────────────────────────────────────────
const toggleSchema = z.object({
  id: z.string().uuid("ID model tidak valid."),
  // Status saat ini (string "true"/"false"); action akan membalik nilainya.
  current: z
    .union([z.literal("true"), z.literal("false")])
    .transform((v) => v === "true"),
});

export async function toggleModelActive(formData: FormData): Promise<void> {
  await requirePermission(PERM);

  const parsed = toggleSchema.safeParse({
    id: formData.get("id") ?? "",
    current: formData.get("current") ?? "false",
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Data tidak valid.";
    redirect("/admin/ai/models?err=" + encodeURIComponent(msg));
  }

  await db
    .update(schema.aiModels)
    .set({ isActive: !parsed.data.current, updatedAt: new Date() })
    .where(and(eq(schema.aiModels.id, parsed.data.id), isNull(schema.aiModels.deletedAt)));

  revalidateAi();
  redirect("/admin/ai/models?ok=" + encodeURIComponent("Berhasil."));
}
