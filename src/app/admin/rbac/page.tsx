import { ListTree, Plus, ShieldCheck, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/input";
import {
  getRolePermissionKeys,
  listMenuItems,
  listPermissionsGrouped,
  listRoles,
} from "@/lib/queries/rbac";
import { createRole } from "@/lib/actions/rbac";
import { MenuBuilder } from "./menu-builder";
import { PermissionMatrix } from "./permission-matrix";

// Modul sensitif & data DB → render dinamis (jangan cache statis).
export const dynamic = "force-dynamic";

const roleColumns: Column[] = [
  { key: "name", label: "Role", sortable: true },
  { key: "userCount", label: "Jumlah User", sortable: true },
  { key: "permissionCount", label: "Permission", sortable: true },
  { key: "type", label: "Tipe", type: "badge", sortable: true, filter: true },
];

export default async function AdminRbacPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleSlugParam } = await searchParams;

  const [roles, groups, menuItems] = await Promise.all([
    listRoles(),
    listPermissionsGrouped(),
    listMenuItems(),
  ]);

  // Role terpilih: dari query ?role=slug, default role pertama.
  const selectedRole = roles.find((r) => r.slug === roleSlugParam) ?? roles[0] ?? null;
  const checkedKeys = selectedRole ? await getRolePermissionKeys(selectedRole.id) : [];

  // Baris DataTable. Role sistem (is_system) hanya boleh diatur permission-nya,
  // tidak boleh di-rename → sembunyikan tombol edit (editBase) untuk baris itu.
  const roleRows = roles.map((r) => ({
    id: r.id,
    name: r.name,
    userCount: r.userCount,
    permissionCount: r.permissionCount,
    type: r.isSystem ? "Sistem" : "Kustom",
  }));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="RBAC & Role"
        subtitle="Inti sistem: role dibuat bebas, tiap role diberi matriks permission per grup. Permission user menentukan menu & aksi yang muncul."
      />

      {/* ===================================================================== */}
      {/* BAGIAN A — DAFTAR ROLE                                                 */}
      {/* ===================================================================== */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Daftar Role</h2>
          <Badge tone="muted">{roles.length} role</Badge>
        </div>

        {/* Form tambah role */}
        <form
          action={createRole}
          className="mb-4 grid gap-3 rounded-[3px] border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_1.4fr_auto] sm:items-end"
        >
          <Field label="Nama role" htmlFor="role-name">
            <Input id="role-name" name="name" placeholder="mis. Editor" required />
          </Field>
          <Field label="Slug" htmlFor="role-slug" hint="huruf kecil, angka, tanda hubung">
            <Input id="role-slug" name="slug" placeholder="mis. editor" required />
          </Field>
          <Field label="Deskripsi" htmlFor="role-desc">
            <Input id="role-desc" name="description" placeholder="Keterangan singkat role" />
          </Field>
          <Button type="submit" size="md">
            <Plus className="h-4 w-4" /> Tambah Role
          </Button>
        </form>

        <DataTable
          columns={roleColumns}
          rows={roleRows}
          editBase="/admin/rbac"
          emptyText="Belum ada role — tambahkan role pertama lewat form di atas."
        />

        <p className="mt-2 text-[11px] text-muted">
          Role <Badge tone="gold">Sistem</Badge> (
          <code className="rounded bg-brand-50 px-1 py-0.5">is_system</code>) tak bisa dihapus;
          proteksi di-enforce pada service layer. Tombol edit mengubah nama/deskripsi role.
        </p>
      </section>

      {/* ===================================================================== */}
      {/* BAGIAN B — MATRIKS PERMISSION                                          */}
      {/* ===================================================================== */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Matriks Permission</h2>
        </div>
        <p className="mb-3 text-sm text-muted">
          Untuk role terpilih: centang permission per grup modul. Centang di sini menentukan menu
          &amp; aksi yang dirender per role.
        </p>

        {/* Pemilih role untuk matriks (mempertahankan ?role=slug). */}
        {roles.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {roles.map((r) => {
              const active = selectedRole?.id === r.id;
              return (
                <Link
                  key={r.id}
                  href={`/admin/rbac?role=${r.slug}`}
                  className={
                    active
                      ? "rounded-sm border border-brand-600 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700"
                      : "rounded-sm border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted hover:bg-brand-50"
                  }
                >
                  {r.name}
                </Link>
              );
            })}
          </div>
        ) : null}

        {selectedRole ? (
          <PermissionMatrix
            roleId={selectedRole.id}
            roleName={selectedRole.name}
            affectedUsers={selectedRole.userCount}
            groups={groups}
            checkedKeys={checkedKeys}
          />
        ) : (
          <div className="rounded-[3px] border border-dashed border-line bg-surface px-5 py-12 text-center text-sm text-muted">
            Tambahkan role terlebih dahulu untuk mengatur permission.
          </div>
        )}
      </section>

      {/* ===================================================================== */}
      {/* BAGIAN C — BUILDER MENU                                                */}
      {/* ===================================================================== */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <ListTree className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Builder Menu</h2>
        </div>
        <p className="mb-3 text-sm text-muted">
          Item di sini menentukan apa yang muncul di sidebar tiap role: hanya item dengan permission
          yang dimiliki user yang tampil. Reorder &amp; aktif/nonaktif menyusul.
        </p>
        <MenuBuilder items={menuItems} />
      </section>
    </div>
  );
}
