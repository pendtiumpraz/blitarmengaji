import { count } from "drizzle-orm";
import { Users, ShieldCheck, KeyRound, Palette } from "lucide-react";
import { db, schema } from "@/lib/db";
import { Card } from "@/components/ui/card";

export default async function AdminDashboard() {
  // Baca data nyata dari Neon (membuktikan koneksi DB + RBAC seed).
  const [u, r, p, t] = await Promise.all([
    db.select({ c: count() }).from(schema.users),
    db.select({ c: count() }).from(schema.roles),
    db.select({ c: count() }).from(schema.permissions),
    db.select({ c: count() }).from(schema.uiThemes),
  ]);

  const stats: { label: string; value: number; icon: typeof Users; dark?: boolean }[] = [
    { label: "Pengguna", value: u[0].c, icon: Users },
    { label: "Role", value: r[0].c, icon: ShieldCheck },
    { label: "Permission", value: p[0].c, icon: KeyRound },
    { label: "Tema UI", value: t[0].c, icon: Palette, dark: true },
  ];

  return (
    <div>
      <h1 className="display text-2xl text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">Ringkasan aktivitas Blitar Mengaji — data langsung dari Neon.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={s.dark ? "bg-brand-700 p-4 text-white" : "p-4"}>
              <Icon className={s.dark ? "h-5 w-5 text-gold-light" : "h-5 w-5 text-brand-600"} />
              <p className="display mt-2 text-2xl">{s.value}</p>
              <p className={s.dark ? "text-xs text-white/70" : "text-xs text-muted"}>{s.label}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6 p-6">
        <h2 className="display text-lg text-ink">Database aktif ✓</h2>
        <p className="mt-1 text-sm text-muted">
          Skema sudah ter-migrasi & ter-seed di Neon. Modul-modul (Kajian, Keuangan, Donasi, RBAC, dst) tinggal disambung
          ke server action untuk CRUD nyata. Login & guard admin sudah berbasis sesi + permission.
        </p>
      </Card>
    </div>
  );
}
