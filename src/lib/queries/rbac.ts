import { and, asc, count, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/**
 * Query READ untuk domain ADMIN USERS & RBAC.
 * - Soft delete: selalu filter `isNull(deletedAt)` untuk users/roles/menu (lihat AGENTS.md §4).
 * - Modul sensitif: pemanggil page WAJIB cek RBAC (requirePermission) di server action;
 *   query di sini hanya membaca data.
 */

// ── Tipe entitas ──────────────────────────────────────────────────────────────

/** Jenis entitas yang bisa diverifikasi (cocok dengan value form action). */
export type PendingEntityType = "titik" | "media" | "usaha" | "ustadz";

export type UserListItem = {
  id: string;
  name: string;
  email: string;
  status: "active" | "pending" | "banned";
  createdAt: Date;
  /** Nama-nama role yang dimiliki user (gabungan multi-role). */
  roles: string[];
};

export type RoleListItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
};

/** Detail satu user untuk form edit admin (prefill). */
export type UserEditItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "pending" | "banned";
  image: string | null;
  /** ID role yang sedang dimiliki user (untuk pra-pilih di form). */
  roleIds: string[];
};

/** Opsi role aktif untuk dropdown form (id + nama). */
export type RoleOption = {
  id: string;
  name: string;
};

/** Detail satu role untuk form edit admin (prefill). */
export type RoleEditItem = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
};

export type PermissionItem = {
  id: string;
  key: string;
  label: string;
};

export type PermissionGroup = {
  group: string;
  permissions: PermissionItem[];
};

export type MenuItemRow = {
  id: string;
  parentId: string | null;
  label: string;
  icon: string | null;
  path: string | null;
  permissionKey: string | null;
  order: number;
  isActive: boolean;
};

export type PendingEntity = {
  id: string;
  type: PendingEntityType;
  name: string;
  detail: string | null;
  ownerName: string | null;
  createdAt: Date;
};

// ── Users ────────────────────────────────────────────────────────────────────

/** Daftar pengguna aktif (terbaru dulu) + role mereka via userRoles join roles. */
export async function listUsers(): Promise<UserListItem[]> {
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
      roleName: schema.roles.name,
    })
    .from(schema.users)
    .leftJoin(schema.userRoles, eq(schema.userRoles.userId, schema.users.id))
    .leftJoin(
      schema.roles,
      and(eq(schema.roles.id, schema.userRoles.roleId), isNull(schema.roles.deletedAt)),
    )
    .where(isNull(schema.users.deletedAt))
    .orderBy(sql`${schema.users.createdAt} desc`);

  // Gabungkan baris (1 user bisa punya banyak role → banyak baris).
  const byId = new Map<string, UserListItem>();
  for (const r of rows) {
    let u = byId.get(r.id);
    if (!u) {
      u = {
        id: r.id,
        name: r.name,
        email: r.email,
        status: r.status,
        createdAt: r.createdAt,
        roles: [],
      };
      byId.set(r.id, u);
    }
    if (r.roleName && !u.roles.includes(r.roleName)) u.roles.push(r.roleName);
  }
  return Array.from(byId.values());
}

/**
 * Daftar pengguna aktif BERHALAMAN (terbaru dulu) + role mereka.
 * Paging dilakukan di tingkat USER (bukan baris join) agar jumlah per halaman benar
 * walau satu user punya banyak role.
 */
export async function listUsersPaged(
  page: number,
  pageSize: number,
): Promise<UserListItem[]> {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const offset = (safePage - 1) * pageSize;

  // 1) Ambil id user untuk halaman ini (urut terbaru dulu).
  const pageUsers = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      status: schema.users.status,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(isNull(schema.users.deletedAt))
    .orderBy(desc(schema.users.createdAt))
    .limit(pageSize)
    .offset(offset);

  if (pageUsers.length === 0) return [];

  const ids = pageUsers.map((u) => u.id);

  // 2) Ambil role untuk user-user tersebut.
  const roleRows = await db
    .select({
      userId: schema.userRoles.userId,
      roleName: schema.roles.name,
    })
    .from(schema.userRoles)
    .innerJoin(
      schema.roles,
      and(eq(schema.roles.id, schema.userRoles.roleId), isNull(schema.roles.deletedAt)),
    )
    .where(inArray(schema.userRoles.userId, ids));

  const rolesByUser = new Map<string, string[]>();
  for (const r of roleRows) {
    if (!r.roleName) continue;
    const arr = rolesByUser.get(r.userId) ?? [];
    if (!arr.includes(r.roleName)) arr.push(r.roleName);
    rolesByUser.set(r.userId, arr);
  }

  return pageUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    status: u.status,
    createdAt: u.createdAt,
    roles: rolesByUser.get(u.id) ?? [],
  }));
}

/** Total pengguna aktif (belum dihapus) — untuk pagination. */
export async function countUsers(): Promise<number> {
  const rows = await db
    .select({ total: count(schema.users.id) })
    .from(schema.users)
    .where(isNull(schema.users.deletedAt));
  return Number(rows[0]?.total ?? 0);
}

/**
 * Detail satu pengguna aktif (deleted_at IS NULL) untuk form edit admin.
 * Menyertakan ID role yang dimiliki (untuk pra-pilih dropdown role).
 * Mengembalikan null bila tidak ditemukan agar caller bisa memanggil notFound().
 */
export async function getUserById(id: string): Promise<UserEditItem | null> {
  if (!id) return null;

  const [user] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      phone: schema.users.phone,
      status: schema.users.status,
      image: schema.users.image,
    })
    .from(schema.users)
    .where(and(eq(schema.users.id, id), isNull(schema.users.deletedAt)))
    .limit(1);

  if (!user) return null;

  // ID role aktif yang dimiliki user (untuk pra-pilih di form).
  const roleRows = await db
    .select({ roleId: schema.userRoles.roleId })
    .from(schema.userRoles)
    .innerJoin(
      schema.roles,
      and(eq(schema.roles.id, schema.userRoles.roleId), isNull(schema.roles.deletedAt)),
    )
    .where(eq(schema.userRoles.userId, id));

  return { ...user, roleIds: roleRows.map((r) => r.roleId) };
}

// ── Roles ────────────────────────────────────────────────────────────────────

/** Daftar role aktif + jumlah user & jumlah permission tiap role. */
export async function listRoles(): Promise<RoleListItem[]> {
  const roleRows = await db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      slug: schema.roles.slug,
      description: schema.roles.description,
      isSystem: schema.roles.isSystem,
    })
    .from(schema.roles)
    .where(isNull(schema.roles.deletedAt))
    .orderBy(asc(schema.roles.name));

  // Jumlah user per role (hanya user aktif).
  const userCounts = await db
    .select({ roleId: schema.userRoles.roleId, c: count() })
    .from(schema.userRoles)
    .innerJoin(
      schema.users,
      and(eq(schema.users.id, schema.userRoles.userId), isNull(schema.users.deletedAt)),
    )
    .groupBy(schema.userRoles.roleId);
  const userCountByRole = new Map(userCounts.map((u) => [u.roleId, u.c]));

  // Jumlah permission per role.
  const permCounts = await db
    .select({ roleId: schema.rolePermissions.roleId, c: count() })
    .from(schema.rolePermissions)
    .groupBy(schema.rolePermissions.roleId);
  const permCountByRole = new Map(permCounts.map((p) => [p.roleId, p.c]));

  return roleRows.map((r) => ({
    ...r,
    userCount: userCountByRole.get(r.id) ?? 0,
    permissionCount: permCountByRole.get(r.id) ?? 0,
  }));
}

/** Opsi role aktif untuk dropdown form (id + nama), urut nama. */
export async function listRoleOptions(): Promise<RoleOption[]> {
  return db
    .select({ id: schema.roles.id, name: schema.roles.name })
    .from(schema.roles)
    .where(isNull(schema.roles.deletedAt))
    .orderBy(asc(schema.roles.name));
}

/**
 * Detail satu role aktif (deleted_at IS NULL) untuk form edit admin.
 * Mengembalikan null bila tidak ditemukan agar caller bisa memanggil notFound().
 */
export async function getRoleById(id: string): Promise<RoleEditItem | null> {
  if (!id) return null;
  const [row] = await db
    .select({
      id: schema.roles.id,
      name: schema.roles.name,
      slug: schema.roles.slug,
      description: schema.roles.description,
      isSystem: schema.roles.isSystem,
    })
    .from(schema.roles)
    .where(and(eq(schema.roles.id, id), isNull(schema.roles.deletedAt)))
    .limit(1);
  return row ?? null;
}

// ── Permissions ──────────────────────────────────────────────────────────────

/** Semua permission dikelompokkan per grup (urut grup, lalu key). */
export async function listPermissionsGrouped(): Promise<PermissionGroup[]> {
  const rows = await db
    .select({
      id: schema.permissions.id,
      key: schema.permissions.key,
      label: schema.permissions.label,
      group: schema.permissions.group,
    })
    .from(schema.permissions)
    .orderBy(asc(schema.permissions.group), asc(schema.permissions.key));

  const byGroup = new Map<string, PermissionGroup>();
  for (const r of rows) {
    let g = byGroup.get(r.group);
    if (!g) {
      g = { group: r.group, permissions: [] };
      byGroup.set(r.group, g);
    }
    g.permissions.push({ id: r.id, key: r.key, label: r.label });
  }
  return Array.from(byGroup.values());
}

/** Daftar permission key yang dimiliki sebuah role (untuk pra-centang matriks). */
export async function getRolePermissionKeys(roleId: string): Promise<string[]> {
  if (!roleId) return [];
  const rows = await db
    .select({ key: schema.permissions.key })
    .from(schema.rolePermissions)
    .innerJoin(
      schema.permissions,
      eq(schema.permissions.id, schema.rolePermissions.permissionId),
    )
    .where(eq(schema.rolePermissions.roleId, roleId));
  return rows.map((r) => r.key);
}

// ── Menu items ───────────────────────────────────────────────────────────────

/** Daftar item menu admin aktif (urut order) — untuk builder menu (read). */
export async function listMenuItems(): Promise<MenuItemRow[]> {
  const rows = await db
    .select({
      id: schema.menuItems.id,
      parentId: schema.menuItems.parentId,
      label: schema.menuItems.label,
      icon: schema.menuItems.icon,
      path: schema.menuItems.path,
      permissionKey: schema.menuItems.permissionKey,
      order: schema.menuItems.order,
      isActive: schema.menuItems.isActive,
    })
    .from(schema.menuItems)
    .where(isNull(schema.menuItems.deletedAt))
    .orderBy(asc(schema.menuItems.order), asc(schema.menuItems.label));
  return rows;
}

// ── Entitas menunggu verifikasi ──────────────────────────────────────────────

/**
 * Semua entitas berstatus 'pending' (titik dakwah, media partner, partner usaha,
 * ustadz) untuk panel "Verifikasi Akun Entitas".
 */
export async function listPendingEntities(): Promise<PendingEntity[]> {
  const [titik, media, usaha, ustadz] = await Promise.all([
    db
      .select({
        id: schema.titikDakwah.id,
        name: schema.titikDakwah.name,
        kecamatan: schema.titikDakwah.kecamatan,
        kelurahan: schema.titikDakwah.kelurahan,
        ownerName: schema.users.name,
        createdAt: schema.titikDakwah.createdAt,
      })
      .from(schema.titikDakwah)
      .leftJoin(schema.users, eq(schema.users.id, schema.titikDakwah.ownerUserId))
      .where(and(eq(schema.titikDakwah.status, "pending"), isNull(schema.titikDakwah.deletedAt))),
    db
      .select({
        id: schema.mediaPartners.id,
        name: schema.mediaPartners.name,
        description: schema.mediaPartners.description,
        ownerName: schema.users.name,
        createdAt: schema.mediaPartners.createdAt,
      })
      .from(schema.mediaPartners)
      .leftJoin(schema.users, eq(schema.users.id, schema.mediaPartners.ownerUserId))
      .where(
        and(eq(schema.mediaPartners.status, "pending"), isNull(schema.mediaPartners.deletedAt)),
      ),
    db
      .select({
        id: schema.businessPartners.id,
        name: schema.businessPartners.name,
        category: schema.businessPartners.category,
        ownerName: schema.users.name,
        createdAt: schema.businessPartners.createdAt,
      })
      .from(schema.businessPartners)
      .leftJoin(schema.users, eq(schema.users.id, schema.businessPartners.ownerUserId))
      .where(
        and(
          eq(schema.businessPartners.status, "pending"),
          isNull(schema.businessPartners.deletedAt),
        ),
      ),
    db
      .select({
        id: schema.ustadzProfiles.id,
        name: schema.ustadzProfiles.name,
        specialization: schema.ustadzProfiles.specialization,
        ownerName: schema.users.name,
        createdAt: schema.ustadzProfiles.createdAt,
      })
      .from(schema.ustadzProfiles)
      .leftJoin(schema.users, eq(schema.users.id, schema.ustadzProfiles.userId))
      .where(
        and(eq(schema.ustadzProfiles.status, "pending"), isNull(schema.ustadzProfiles.deletedAt)),
      ),
  ]);

  const out: PendingEntity[] = [
    ...titik.map((t) => ({
      id: t.id,
      type: "titik" as const,
      name: t.name,
      detail: [t.kelurahan, t.kecamatan].filter(Boolean).join(", ") || null,
      ownerName: t.ownerName,
      createdAt: t.createdAt,
    })),
    ...media.map((m) => ({
      id: m.id,
      type: "media" as const,
      name: m.name,
      detail: m.description,
      ownerName: m.ownerName,
      createdAt: m.createdAt,
    })),
    ...usaha.map((b) => ({
      id: b.id,
      type: "usaha" as const,
      name: b.name,
      detail: b.category,
      ownerName: b.ownerName,
      createdAt: b.createdAt,
    })),
    ...ustadz.map((u) => ({
      id: u.id,
      type: "ustadz" as const,
      name: u.name,
      detail: u.specialization,
      ownerName: u.ownerName,
      createdAt: u.createdAt,
    })),
  ];

  // Terbaru dulu.
  out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return out;
}
