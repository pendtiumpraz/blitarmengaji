import { and, asc, eq, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Daftar provider (TANPA mengekspos key; hanya flag hasKey). */
export async function listAiProviders() {
  return db
    .select({
      id: schema.aiProviders.id,
      name: schema.aiProviders.name,
      slug: schema.aiProviders.slug,
      baseUrl: schema.aiProviders.baseUrl,
      docsUrl: schema.aiProviders.docsUrl,
      isActive: schema.aiProviders.isActive,
      hasKey: sql<boolean>`${schema.aiProviders.apiKeyCiphertext} is not null`,
    })
    .from(schema.aiProviders)
    .where(isNull(schema.aiProviders.deletedAt))
    .orderBy(asc(schema.aiProviders.name));
}

export async function getProviderById(id: string) {
  const r = await db
    .select()
    .from(schema.aiProviders)
    .where(and(eq(schema.aiProviders.id, id), isNull(schema.aiProviders.deletedAt)))
    .limit(1);
  return r[0] ?? null;
}

export async function listAiModels() {
  return db
    .select({
      id: schema.aiModels.id,
      modelId: schema.aiModels.modelId,
      label: schema.aiModels.label,
      kind: schema.aiModels.kind,
      contextWindow: schema.aiModels.contextWindow,
      isActive: schema.aiModels.isActive,
      providerId: schema.aiModels.providerId,
      providerName: schema.aiProviders.name,
    })
    .from(schema.aiModels)
    .innerJoin(schema.aiProviders, eq(schema.aiProviders.id, schema.aiModels.providerId))
    .where(and(isNull(schema.aiModels.deletedAt), isNull(schema.aiProviders.deletedAt)))
    .orderBy(asc(schema.aiProviders.name), asc(schema.aiModels.label));
}

export async function getModelById(id: string) {
  const r = await db
    .select()
    .from(schema.aiModels)
    .where(and(eq(schema.aiModels.id, id), isNull(schema.aiModels.deletedAt)))
    .limit(1);
  return r[0] ?? null;
}

export async function listProviderOptions() {
  return db
    .select({ id: schema.aiProviders.id, name: schema.aiProviders.name })
    .from(schema.aiProviders)
    .where(isNull(schema.aiProviders.deletedAt))
    .orderBy(asc(schema.aiProviders.name));
}

/** Model aktif (untuk dropdown binding). */
export async function listActiveModelOptions() {
  return db
    .select({
      id: schema.aiModels.id,
      label: schema.aiModels.label,
      providerName: schema.aiProviders.name,
    })
    .from(schema.aiModels)
    .innerJoin(schema.aiProviders, eq(schema.aiProviders.id, schema.aiModels.providerId))
    .where(
      and(
        eq(schema.aiModels.isActive, true),
        isNull(schema.aiModels.deletedAt),
        isNull(schema.aiProviders.deletedAt),
      ),
    )
    .orderBy(asc(schema.aiProviders.name), asc(schema.aiModels.label));
}

export async function listAiBindings() {
  return db
    .select({
      id: schema.aiTaskBindings.id,
      task: schema.aiTaskBindings.task,
      isActive: schema.aiTaskBindings.isActive,
      modelDbId: schema.aiModels.id,
      modelLabel: schema.aiModels.label,
      providerName: schema.aiProviders.name,
    })
    .from(schema.aiTaskBindings)
    .innerJoin(schema.aiModels, eq(schema.aiModels.id, schema.aiTaskBindings.modelId))
    .innerJoin(schema.aiProviders, eq(schema.aiProviders.id, schema.aiModels.providerId))
    .where(isNull(schema.aiTaskBindings.deletedAt))
    .orderBy(asc(schema.aiTaskBindings.task));
}
