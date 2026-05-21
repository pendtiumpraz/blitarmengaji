import { db, schema } from "@/lib/db";
import { count, desc, eq } from "drizzle-orm";

/**
 * Query READ untuk AUDIT LOG (viewer admin).
 * Sumber: tabel audit_logs (+ left join users untuk nama pelaku bila ada).
 * audit_logs TIDAK ber-soft-delete — semua baris ditampilkan apa adanya.
 */

export type AuditLogItem = {
  id: string;
  userId: string | null;
  /** Nama pelaku (null bila userId null atau user terhapus). */
  actorName: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  metaJson: unknown;
  createdAt: Date;
};

/** Daftar audit log (terbaru dulu) dengan pagination. */
export async function listAuditLogs(page: number, pageSize: number): Promise<AuditLogItem[]> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);

  const rows = await db
    .select({
      id: schema.auditLogs.id,
      userId: schema.auditLogs.userId,
      actorName: schema.users.name,
      action: schema.auditLogs.action,
      entity: schema.auditLogs.entity,
      entityId: schema.auditLogs.entityId,
      metaJson: schema.auditLogs.metaJson,
      createdAt: schema.auditLogs.createdAt,
    })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.userId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);

  return rows;
}

/** Jumlah total baris audit log (untuk pagination). */
export async function countAuditLogs(): Promise<number> {
  const rows = await db.select({ total: count() }).from(schema.auditLogs);
  return Number(rows[0]?.total ?? 0);
}
