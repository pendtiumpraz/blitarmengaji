"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";

/**
 * Server action (MUTATION) untuk TASK BINDING AI.
 * - RBAC: requirePermission('settings.manage') (lihat AGENTS.md §4).
 * - Tiap task (chat/agent/doc/embedding/transcribe/summarize/vision) dipetakan ke
 *   satu model AI aktif. Bila binding aktif (deleted_at IS NULL) utk task sudah ada
 *   → UPDATE modelId; selain itu INSERT baris baru. (Soft-aware.)
 * - Pilihan API key/provider diisi di halaman /admin/ai/providers (bukan di sini).
 */

const taskValues = schema.aiTaskEnum.enumValues;

const bindingSchema = z.object({
  task: z.enum(taskValues),
  modelId: z.string().trim().uuid("Model tidak valid."),
});

/**
 * Set/ubah model untuk sebuah task AI.
 * Bila binding aktif utk task tsb sudah ada → update modelId, else insert baru.
 */
export async function setTaskBinding(formData: FormData): Promise<void> {
  await requirePermission("settings.manage");

  const parsed = bindingSchema.safeParse({
    task: typeof formData.get("task") === "string" ? (formData.get("task") as string) : "",
    modelId:
      typeof formData.get("modelId") === "string" ? (formData.get("modelId") as string) : "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const { task, modelId } = parsed.data;

  // Validasi model: harus ada, aktif, belum dihapus (soft delete) — cegah binding rusak.
  const model = await db
    .select({ id: schema.aiModels.id })
    .from(schema.aiModels)
    .where(
      and(
        eq(schema.aiModels.id, modelId),
        eq(schema.aiModels.isActive, true),
        isNull(schema.aiModels.deletedAt),
      ),
    )
    .limit(1);

  if (!model[0]) {
    throw new Error("Model tidak ditemukan atau tidak aktif.");
  }

  // Cari binding AKTIF (soft-aware) untuk task ini.
  const existing = await db
    .select({ id: schema.aiTaskBindings.id })
    .from(schema.aiTaskBindings)
    .where(and(eq(schema.aiTaskBindings.task, task), isNull(schema.aiTaskBindings.deletedAt)))
    .limit(1);

  if (existing[0]) {
    await db
      .update(schema.aiTaskBindings)
      .set({ modelId, isActive: true, updatedAt: new Date() })
      .where(eq(schema.aiTaskBindings.id, existing[0].id));
  } else {
    await db.insert(schema.aiTaskBindings).values({ task, modelId, isActive: true });
  }

  revalidatePath("/admin/ai");
}
