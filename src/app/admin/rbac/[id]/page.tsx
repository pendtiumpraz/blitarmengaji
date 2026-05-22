import { notFound } from "next/navigation";
import { ArrowLeft, Lock, Save, X } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { getRoleById } from "@/lib/queries/rbac";
import { updateRole } from "@/lib/actions/rbac";

// Modul sensitif & data DB → render dinamis (jangan cache statis).
export const dynamic = "force-dynamic";

export default async function AdminRoleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const role = await getRoleById(id);
  if (!role) notFound();

  return (
    <div>
      <AdminPageHeader
        title="Edit Role"
        subtitle="Ubah nama & deskripsi role. Slug dan tipe sistem tidak dapat diubah."
        action={
          <Button href="/admin/rbac" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>
        }
      />

      <form action={updateRole} className="max-w-xl">
        <input type="hidden" name="id" value={role.id} />

        <Card className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-muted">Tipe:</span>
            {role.isSystem ? <Badge tone="gold">Sistem</Badge> : <Badge tone="muted">Kustom</Badge>}
          </div>

          <Field label="Nama Role" htmlFor="name">
            <Input id="name" name="name" placeholder="mis. Editor" defaultValue={role.name} required />
          </Field>

          <Field label="Deskripsi" htmlFor="description" hint="Keterangan singkat peran ini.">
            <Input
              id="description"
              name="description"
              placeholder="Keterangan singkat role"
              defaultValue={role.description ?? ""}
            />
          </Field>

          <div className="flex items-center gap-2 rounded-sm border border-dashed border-line bg-cream px-3 py-2.5 text-[11px] text-muted">
            <Lock className="h-3.5 w-3.5 shrink-0" />
            <span>
              Slug <code className="rounded bg-brand-50 px-1 py-0.5">{role.slug}</code> dan tipe
              sistem terkunci dan tidak dapat diubah.
            </span>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit" variant="primary" className="flex-1">
              <Save className="h-4 w-4" /> Simpan Perubahan
            </Button>
            <Button href="/admin/rbac" variant="ghost">
              <X className="h-4 w-4" /> Batal
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
