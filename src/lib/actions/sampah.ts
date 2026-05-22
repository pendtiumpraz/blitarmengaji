"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { logAudit } from "@/lib/audit";
import { TYPES, isSampahType } from "@/lib/queries/sampah";

/**
 * Server actions (MUTATION) untuk RECYCLE BIN / Sampah.
 * - RBAC: requirePermission("trash.manage") — super admin ('*') otomatis lolos.
 * - restoreItem  : pulihkan baris (deletedAt/deletedBy = null, updatedAt diperbarui).
 * - hardDeleteItem: hapus FISIK permanen (db.delete).
 * Validasi `type` wajib termasuk daftar yang didukung (lihat queries/sampah.ts).
 */

function readType(formData: FormData): keyof typeof TYPES {
  const raw = formData.get("type");
  const type = typeof raw === "string" ? raw.trim() : "";
  if (!isSampahType(type)) {
    throw new Error("Tipe data tidak didukung Recycle Bin.");
  }
  return type;
}

function readId(formData: FormData): string {
  const raw = formData.get("id");
  const id = typeof raw === "string" ? raw.trim() : "";
  if (!id) {
    throw new Error("ID item tidak valid.");
  }
  return id;
}

/**
 * Pulihkan item ter-soft-delete: deletedAt=null, deletedBy=null.
 * `updatedAt` HANYA diset bila tabel terkait punya kolom tersebut
 * (sebagian tabel ber-soft-delete tidak punya updated_at).
 */
export async function restoreItem(formData: FormData): Promise<void> {
  try {
    await requirePermission("trash.manage");

    const type = readType(formData);
    const id = readId(formData);
    const meta = TYPES[type];

    const patch: Record<string, unknown> = { deletedAt: null, deletedBy: null };
    if (meta.table.updatedAt) {
      patch.updatedAt = new Date();
    }

    await db
      .update(meta.table)
      .set(patch)
      .where(eq(meta.table.id, id));

    await logAudit({ action: "restore", entity: type, entityId: id });

    revalidatePath("/admin/sampah");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "Gagal memulihkan data.";
    redirect("/admin/sampah?err=" + encodeURIComponent(msg));
  }

  redirect("/admin/sampah?ok=" + encodeURIComponent("Dipulihkan."));
}

/** Hapus PERMANEN (fisik) item dari Recycle Bin. Tindakan tidak bisa dibatalkan. */
export async function hardDeleteItem(formData: FormData): Promise<void> {
  try {
    await requirePermission("trash.manage");

    const type = readType(formData);
    const id = readId(formData);
    const meta = TYPES[type];

    await db.delete(meta.table).where(eq(meta.table.id, id));

    await logAudit({ action: "hard_delete", entity: type, entityId: id });

    revalidatePath("/admin/sampah");
  } catch (e) {
    if (isRedirectError(e)) throw e;
    const msg = e instanceof Error ? e.message : "Gagal menghapus permanen.";
    redirect("/admin/sampah?err=" + encodeURIComponent(msg));
  }

  redirect("/admin/sampah?ok=" + encodeURIComponent("Dihapus permanen."));
}
