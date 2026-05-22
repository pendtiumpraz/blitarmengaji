import { notFound } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { getUserById, listRoleOptions } from "@/lib/queries/rbac";
import { updateUser } from "@/lib/actions/rbac";

// Modul sensitif & data DB → render dinamis (jangan cache statis).
export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function AdminUserEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [user, roleOptions] = await Promise.all([getUserById(id), listRoleOptions()]);

  if (!user) notFound();

  // Role tunggal yang sedang dipilih (form ini menyetel satu role per user).
  const currentRoleId = user.roleIds[0] ?? "";

  return (
    <div>
      <AdminPageHeader
        title="Edit Pengguna"
        subtitle="Ubah data akun, status, dan role pengguna."
        action={
          <Button href={`/admin/users/${user.id}`} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form action={updateUser} className="grid gap-5 lg:grid-cols-3">
        <input type="hidden" name="id" value={user.id} />

        {/* Kolom utama */}
        <Card className="space-y-4 p-6 lg:col-span-2">
          <Field label="Nama" htmlFor="name">
            <Input id="name" name="name" placeholder="Nama lengkap" defaultValue={user.name} required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="nama@contoh.com"
                defaultValue={user.email}
                required
              />
            </Field>

            <Field label="Nomor Telepon" htmlFor="phone" hint="Opsional.">
              <Input id="phone" name="phone" placeholder="08xxxxxxxxxx" defaultValue={user.phone ?? ""} />
            </Field>
          </div>
        </Card>

        {/* Kolom samping */}
        <div className="space-y-5">
          <Card className="space-y-4 p-6">
            <Field
              label="Status"
              htmlFor="status"
              hint="Aktif dapat masuk; Menunggu belum disetujui; Diblokir tidak dapat masuk."
            >
              <select id="status" name="status" className={selectCls} defaultValue={user.status}>
                <option value="active">Aktif</option>
                <option value="pending">Menunggu</option>
                <option value="banned">Diblokir</option>
              </select>
            </Field>

            <Field label="Role" htmlFor="roleId" hint="Pilih satu role untuk pengguna ini.">
              <select id="roleId" name="roleId" className={selectCls} defaultValue={currentRoleId}>
                <option value="">Tanpa role</option>
                {roleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
          </Card>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" className="flex-1">
              <Save className="h-4 w-4" /> Simpan Perubahan
            </Button>
            <Button href={`/admin/users/${user.id}`} variant="ghost">
              <X className="h-4 w-4" /> Batal
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
