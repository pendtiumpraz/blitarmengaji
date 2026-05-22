import { count } from "drizzle-orm";
import { Users, ShieldCheck, KeyRound, Palette, FileDown } from "lucide-react";
import { db, schema } from "@/lib/db";
import { Card } from "@/components/ui/card";

const DOCS: { label: string; href: string; note: string }[] = [
  { label: "Panduan Pengguna", href: "/api/guide/user", note: "Untuk jamaah — cara pakai platform" },
  { label: "Panduan Admin", href: "/api/guide/admin", note: "Operasional panel admin" },
  { label: "Panduan Partner Usaha", href: "/api/guide/partner", note: "Daftar partner, lapak, promo" },
  { label: "Daftar Akun Ustadz", href: "/api/guide/akun-ustadz", note: "Kredensial login ustadz" },
  { label: "Daftar Akun Titik", href: "/api/guide/akun-titik", note: "Kredensial pengelola titik" },
];

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

      <Card className="mt-6 p-6">
        <h2 className="display flex items-center gap-2 text-lg text-ink">
          <FileDown className="h-5 w-5 text-brand-600" /> Panduan & Dokumen (PDF)
        </h2>
        <p className="mt-1 text-sm text-muted">
          Dokumen berdesain untuk diunduh/cetak. Daftar akun memuat kredensial — hanya admin.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOCS.map((d) => (
            <a
              key={d.href}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 rounded-sm border border-line bg-cream p-3 transition-colors hover:border-brand-600 hover:bg-brand-50"
            >
              <FileDown className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              <span>
                <span className="block text-sm font-bold text-ink">{d.label}</span>
                <span className="block text-xs text-muted">{d.note}</span>
              </span>
            </a>
          ))}
        </div>
      </Card>
    </div>
  );
}
