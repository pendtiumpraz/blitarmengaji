import { ListTree, Lock, Plus, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
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

function fmtUsers(n: number) {
  return new Intl.NumberFormat("id-ID").format(n);
}

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

        {roles.length === 0 ? (
          <div className="rounded-[3px] border border-dashed border-line bg-surface px-5 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-brand-50">
              <ShieldCheck className="h-6 w-6 text-brand-600" />
            </span>
            <p className="mt-3 font-bold text-ink">Belum ada role</p>
            <p className="mt-1 text-sm text-muted">Tambahkan role pertama lewat form di atas.</p>
          </div>
        ) : (
          <Table className="min-w-[680px]">
            <THead>
              <TR>
                <TH>Role</TH>
                <TH>Deskripsi</TH>
                <TH className="text-center">Jumlah User</TH>
                <TH className="text-center">Permission</TH>
                <TH className="text-center">Tipe</TH>
                <TH className="text-right">Aksi</TH>
              </TR>
            </THead>
            <tbody>
              {roles.map((r) => (
                <TR key={r.id} className="hover:bg-brand-50/60">
                  <TD>
                    <span className="font-bold text-ink">{r.name}</span>
                    {selectedRole && r.id === selectedRole.id ? (
                      <span className="ml-2 text-[10px] font-bold text-brand-600">
                        ← sedang diedit
                      </span>
                    ) : null}
                  </TD>
                  <TD className="text-muted">{r.description ?? "—"}</TD>
                  <TD className="text-center font-bold text-ink">{fmtUsers(r.userCount)}</TD>
                  <TD className="text-center font-bold text-ink">{r.permissionCount}</TD>
                  <TD className="text-center">
                    {r.isSystem ? (
                      <Badge tone="gold">Sistem</Badge>
                    ) : (
                      <Badge tone="muted">Kustom</Badge>
                    )}
                  </TD>
                  <TD className="text-right">
                    {r.slug === "super-admin" ? (
                      <span
                        className="inline-flex justify-end text-muted"
                        title="Role sistem terkunci"
                      >
                        <Lock className="h-4 w-4" aria-label="Terkunci" />
                      </span>
                    ) : (
                      <Button
                        href={`/admin/rbac?role=${r.slug}`}
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                      >
                        Edit permission
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        )}
        <p className="mt-2 text-[11px] text-muted">
          Role <Badge tone="gold">Sistem</Badge> (
          <code className="rounded bg-brand-50 px-1 py-0.5">is_system</code>) tak bisa dihapus;
          proteksi di-enforce pada service layer.
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
