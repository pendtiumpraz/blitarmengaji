import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";

/**
 * Helper pencatat AUDIT LOG (aksi sensitif: keuangan, RBAC, hapus data, dll).
 * Lihat AGENTS.md §0 (audit untuk aksi sensitif) & db/schema.ts (audit_logs).
 *
 * KONTRAK PENTING:
 *  - userId diambil otomatis dari sesi NextAuth (boleh null bila tak ada sesi
 *    atau aksi dipicu oleh sistem).
 *  - Fungsi ini TIDAK PERNAH melempar error. Kegagalan pencatatan audit tidak
 *    boleh mengganggu aksi utama (panggil setelah operasi DB inti berhasil).
 */

export type LogAuditInput = {
  /** Kode aksi, mis. 'restore', 'hard_delete', 'payment_verify'. (wajib) */
  action: string;
  /** Tipe entitas terkait, mis. 'kajian', 'paymentConfirmations'. (opsional) */
  entity?: string;
  /** ID entitas terkait (disimpan sebagai teks). (opsional) */
  entityId?: string;
  /** Metadata tambahan (disimpan sebagai JSON). (opsional) */
  meta?: Record<string, unknown> | null;
};

/**
 * Catat satu baris audit. Pelaku (userId) diambil dari auth() bila ada.
 * Dibungkus try/catch — error apa pun ditelan (di-log ke console) agar aksi
 * utama tetap berjalan.
 */
export async function logAudit({ action, entity, entityId, meta }: LogAuditInput): Promise<void> {
  try {
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch {
      // Sesi tak terbaca (mis. konteks tanpa request) — tetap catat tanpa pelaku.
      userId = null;
    }

    await db.insert(schema.auditLogs).values({
      userId,
      action,
      entity: entity ?? null,
      entityId: entityId ?? null,
      metaJson: meta ?? null,
    });
  } catch (err) {
    // Jangan pernah ganggu aksi utama karena gagal mencatat audit.
    console.error("[audit] gagal mencatat audit log:", err);
  }
}
