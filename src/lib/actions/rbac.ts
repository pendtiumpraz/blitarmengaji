"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { notify } from "@/lib/notify";

/**
 * Server actions (MUTATION) untuk domain ADMIN USERS & RBAC.
 * Modul SENSITIF — tiap action WAJIB requirePermission (lihat AGENTS.md §4):
 *   - role.manage : createRole, saveRolePermissions
 *   - user.manage : verifyEntity, rejectEntity, softDeleteUser
 * Soft delete: set deletedAt + deletedBy, JANGAN DELETE fisik.
 */

const opt = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length ? s : undefined;
};

// ── createRole ────────────────────────────────────────────────────────────────

const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Nama role minimal 2 karakter."),
  slug: z
    .string()
    .trim()
    .min(2, "Slug minimal 2 karakter.")
    .regex(/^[a-z0-9-]+$/, "Slug hanya boleh huruf kecil, angka, dan tanda hubung."),
  description: z.string().trim().optional(),
});

/** Buat role baru (role kustom, is_system = false). */
export async function createRole(formData: FormData): Promise<void> {
  await requirePermission("role.manage");

  const parsed = createRoleSchema.safeParse({
    name: opt(formData.get("name")),
    slug: opt(formData.get("slug")),
    description: opt(formData.get("description")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const data = parsed.data;

  // Cegah slug bentrok dengan role aktif.
  const existing = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(and(eq(schema.roles.slug, data.slug), isNull(schema.roles.deletedAt)))
    .limit(1);
  if (existing.length > 0) {
    throw new Error(`Slug role '${data.slug}' sudah dipakai.`);
  }

  await db.insert(schema.roles).values({
    name: data.name,
    slug: data.slug,
    description: data.description ?? null,
    isSystem: false,
  });

  revalidatePath("/admin/rbac");
}

// ── saveRolePermissions ────────────────────────────────────────────────────────

const saveRolePermsSchema = z.object({
  roleId: z.string().uuid("ID role tidak valid."),
});

/**
 * Sinkronkan permission sebuah role: hapus semua rolePermissions lama lalu
 * insert hanya permission key yang tercentang (field form name="perm").
 */
export async function saveRolePermissions(formData: FormData): Promise<void> {
  await requirePermission("role.manage");

  const parsed = saveRolePermsSchema.safeParse({ roleId: opt(formData.get("roleId")) });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { roleId } = parsed.data;

  // Pastikan role ada & aktif (role sistem tetap boleh diatur permissionnya).
  const roleRow = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(and(eq(schema.roles.id, roleId), isNull(schema.roles.deletedAt)))
    .limit(1);
  if (roleRow.length === 0) throw new Error("Role tidak ditemukan.");

  // Daftar key tercentang dari form.
  const checkedKeys = formData
    .getAll("perm")
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);

  // Resolusi key → permissionId (abaikan key tak dikenal).
  let permissionIds: string[] = [];
  if (checkedKeys.length > 0) {
    const perms = await db
      .select({ id: schema.permissions.id, key: schema.permissions.key })
      .from(schema.permissions);
    const idByKey = new Map(perms.map((p) => [p.key, p.id]));
    permissionIds = checkedKeys
      .map((k) => idByKey.get(k))
      .filter((id): id is string => Boolean(id));
  }

  // Hapus mapping lama, lalu insert yang baru dipilih.
  await db.delete(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, roleId));
  if (permissionIds.length > 0) {
    await db
      .insert(schema.rolePermissions)
      .values(permissionIds.map((permissionId) => ({ roleId, permissionId })))
      .onConflictDoNothing();
  }

  revalidatePath("/admin/rbac");
}

// ── verifyEntity / rejectEntity ────────────────────────────────────────────────

const entitySchema = z.object({
  type: z.enum(["titik", "media", "usaha", "ustadz"], {
    message: "Jenis entitas tidak valid.",
  }),
  id: z.string().uuid("ID entitas tidak valid."),
});

type EntityStatus = "active" | "pending" | "rejected";

type EntityType = "titik" | "media" | "usaha" | "ustadz";

/**
 * Peta jenis entitas → slug role yang sesuai (lihat db/seed.ts).
 * Saat entitas diverifikasi, user pemiliknya otomatis mendapat role ini
 * agar bisa mengakses dashboard kelola masing-masing.
 */
const ROLE_SLUG_BY_TYPE: Record<EntityType, string> = {
  titik: "pengelola-titik",
  ustadz: "ustadz",
  media: "media-partner",
  usaha: "partner-usaha",
};

/**
 * Ambil ID user pemilik entitas (owner_user_id / user_id).
 * Return null bila entitas tak ditemukan atau belum punya pemilik.
 */
async function getEntityOwnerUserId(type: EntityType, id: string): Promise<string | null> {
  switch (type) {
    case "titik": {
      const [row] = await db
        .select({ ownerUserId: schema.titikDakwah.ownerUserId })
        .from(schema.titikDakwah)
        .where(and(eq(schema.titikDakwah.id, id), isNull(schema.titikDakwah.deletedAt)))
        .limit(1);
      return row?.ownerUserId ?? null;
    }
    case "media": {
      const [row] = await db
        .select({ ownerUserId: schema.mediaPartners.ownerUserId })
        .from(schema.mediaPartners)
        .where(and(eq(schema.mediaPartners.id, id), isNull(schema.mediaPartners.deletedAt)))
        .limit(1);
      return row?.ownerUserId ?? null;
    }
    case "usaha": {
      const [row] = await db
        .select({ ownerUserId: schema.businessPartners.ownerUserId })
        .from(schema.businessPartners)
        .where(and(eq(schema.businessPartners.id, id), isNull(schema.businessPartners.deletedAt)))
        .limit(1);
      return row?.ownerUserId ?? null;
    }
    case "ustadz": {
      const [row] = await db
        .select({ userId: schema.ustadzProfiles.userId })
        .from(schema.ustadzProfiles)
        .where(and(eq(schema.ustadzProfiles.id, id), isNull(schema.ustadzProfiles.deletedAt)))
        .limit(1);
      return row?.userId ?? null;
    }
  }
}

/**
 * GLUE verifikasi: pasang role yang sesuai ke user pemilik entitas (idempoten).
 * - Cari role aktif berdasarkan slug (ROLE_SLUG_BY_TYPE).
 * - Insert ke user_roles bila belum ada (cek duplikat via onConflictDoNothing —
 *   PK gabungan userId+roleId).
 * Tidak melempar error bila entitas belum punya pemilik atau role tak ditemukan
 * agar verifikasi status tetap berhasil.
 */
async function grantOwnerRole(type: EntityType, id: string): Promise<void> {
  const ownerUserId = await getEntityOwnerUserId(type, id);
  if (!ownerUserId) return;

  const [role] = await db
    .select({ id: schema.roles.id })
    .from(schema.roles)
    .where(and(eq(schema.roles.slug, ROLE_SLUG_BY_TYPE[type]), isNull(schema.roles.deletedAt)))
    .limit(1);
  if (!role) return;

  await db
    .insert(schema.userRoles)
    .values({ userId: ownerUserId, roleId: role.id })
    .onConflictDoNothing();
}

/**
 * Set status entitas (polymorphic). Hanya titik dakwah yang punya kolom
 * verified_at — diisi saat status 'active'. Setiap cabang memakai tabel konkret
 * agar typecheck Drizzle aman (tanpa union table).
 */
async function setEntityStatus(
  type: EntityType,
  id: string,
  status: EntityStatus,
): Promise<void> {
  const now = new Date();
  switch (type) {
    case "titik":
      await db
        .update(schema.titikDakwah)
        .set({ status, verifiedAt: status === "active" ? now : null, updatedAt: now })
        .where(and(eq(schema.titikDakwah.id, id), isNull(schema.titikDakwah.deletedAt)));
      return;
    case "media":
      await db
        .update(schema.mediaPartners)
        .set({ status, updatedAt: now })
        .where(and(eq(schema.mediaPartners.id, id), isNull(schema.mediaPartners.deletedAt)));
      return;
    case "usaha":
      await db
        .update(schema.businessPartners)
        .set({ status, updatedAt: now })
        .where(
          and(eq(schema.businessPartners.id, id), isNull(schema.businessPartners.deletedAt)),
        );
      return;
    case "ustadz":
      await db
        .update(schema.ustadzProfiles)
        .set({ status, updatedAt: now })
        .where(and(eq(schema.ustadzProfiles.id, id), isNull(schema.ustadzProfiles.deletedAt)));
      return;
  }
}

/** Verifikasi entitas: set status 'active' (+ verified_at untuk titik dakwah). */
export async function verifyEntity(formData: FormData): Promise<void> {
  await requirePermission("user.manage");

  const parsed = entitySchema.safeParse({
    type: opt(formData.get("type")),
    id: opt(formData.get("id")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  await setEntityStatus(parsed.data.type, parsed.data.id, "active");
  // GLUE: setelah aktif, beri role yang sesuai ke user pemilik entitas
  // agar bisa mengakses dashboard kelola masing-masing.
  await grantOwnerRole(parsed.data.type, parsed.data.id);

  // NOTIFIKASI in-app: beri tahu pemilik entitas bahwa pengajuannya disetujui.
  // Best-effort (notify dibungkus try/catch & skip bila owner null).
  const ownerUserId = await getEntityOwnerUserId(parsed.data.type, parsed.data.id);
  await notify(ownerUserId, "entity_verified", {
    title: "Lembaga disetujui",
    body: "Pengajuan Anda telah diverifikasi.",
    link: "/akun",
  });

  revalidatePath("/admin/users");
}

/** Tolak entitas: set status 'rejected'. */
export async function rejectEntity(formData: FormData): Promise<void> {
  await requirePermission("user.manage");

  const parsed = entitySchema.safeParse({
    type: opt(formData.get("type")),
    id: opt(formData.get("id")),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  await setEntityStatus(parsed.data.type, parsed.data.id, "rejected");
  revalidatePath("/admin/users");
}

// ── softDeleteUser ─────────────────────────────────────────────────────────────

const deleteUserSchema = z.object({
  id: z.string().uuid("ID pengguna tidak valid."),
});

/** Soft delete pengguna (set deletedAt + deletedBy). */
export async function softDeleteUser(formData: FormData): Promise<void> {
  await requirePermission("user.manage");

  const parsed = deleteUserSchema.safeParse({ id: opt(formData.get("id")) });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }

  const session = await auth();
  const actorId = session?.user?.id ?? null;
  if (actorId && actorId === parsed.data.id) {
    throw new Error("Tidak dapat menghapus akun sendiri.");
  }

  await db
    .update(schema.users)
    .set({ deletedAt: new Date(), deletedBy: actorId, updatedAt: new Date() })
    .where(and(eq(schema.users.id, parsed.data.id), isNull(schema.users.deletedAt)));

  revalidatePath("/admin/users");
}
