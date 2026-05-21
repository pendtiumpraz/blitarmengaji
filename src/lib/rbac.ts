import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { userRoles, rolePermissions, permissions, roles } from "../../db/schema";
import { auth } from "@/lib/auth";

/** Semua permission key milik 1 user (gabungan dari semua role-nya). '*' = super admin. */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const roleRows = await db
    .select({ roleId: userRoles.roleId, slug: roles.slug })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(eq(userRoles.userId, userId));

  if (roleRows.length === 0) return [];

  // Super admin = akses penuh (wildcard), tak bergantung kelengkapan permission key.
  if (roleRows.some((r) => r.slug === "super-admin")) return ["*"];

  const roleIds = roleRows.map((r) => r.roleId);
  const permRows = await db
    .select({ key: permissions.key })
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(inArray(rolePermissions.roleId, roleIds));

  return Array.from(new Set(permRows.map((p) => p.key)));
}

/** Permission user yang sedang login (dari sesi NextAuth). */
export async function currentUserPermissions(): Promise<string[]> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return [];
  return getUserPermissions(uid);
}

/** Cek apakah user saat ini punya permission tertentu ('*' = super admin). */
export async function can(key: string): Promise<boolean> {
  const perms = await currentUserPermissions();
  return perms.includes("*") || perms.includes(key);
}

/** Lempar error bila user saat ini tidak punya permission. Pakai di server action/route. */
export async function requirePermission(key: string): Promise<void> {
  if (!(await can(key))) {
    throw new Error(`Akses ditolak: butuh permission '${key}'`);
  }
}
