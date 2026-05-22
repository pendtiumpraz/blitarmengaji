import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUserById, listRoleOptions } from "@/lib/queries/rbac";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "success" | "warning" | "danger" }> = {
  active: { label: "Aktif", tone: "success" },
  pending: { label: "Menunggu", tone: "warning" },
  banned: { label: "Diblokir", tone: "danger" },
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, roleOptions] = await Promise.all([getUserById(id), listRoleOptions()]);
  if (!user) notFound();

  const roleNames = user.roleIds
    .map((rid) => roleOptions.find((r) => r.id === rid)?.name)
    .filter(Boolean) as string[];
  const st = STATUS[user.status] ?? { label: user.status, tone: "warning" as const };

  return (
    <div>
      <AdminPageHeader
        title="Detail Pengguna"
        subtitle="Informasi akun pengguna."
        action={
          <div className="flex items-center gap-2">
            <Button href="/admin/users" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Button>
            <Button href={`/admin/users/${user.id}/edit`} size="sm">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </div>
        }
      />

      <Card className="p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-600 text-2xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() ?? <UserRound className="h-7 w-7" />}
          </span>
          <div className="min-w-0">
            <h2 className="display text-xl text-ink">{user.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone={st.tone}>{st.label}</Badge>
              {roleNames.length ? (
                roleNames.map((r) => (
                  <Badge key={r} tone="brand">
                    <ShieldCheck className="mr-1 inline h-3 w-3" />
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted">Tanpa role</span>
              )}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-sm border border-line bg-cream p-4">
            <dt className="flex items-center gap-2 text-xs font-bold text-muted">
              <Mail className="h-4 w-4" /> Email
            </dt>
            <dd className="mt-1 break-all text-sm text-ink">{user.email}</dd>
          </div>
          <div className="rounded-sm border border-line bg-cream p-4">
            <dt className="flex items-center gap-2 text-xs font-bold text-muted">
              <Phone className="h-4 w-4" /> Telepon
            </dt>
            <dd className="mt-1 text-sm text-ink">{user.phone || "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
