import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  CalendarCheck,
  Radio,
  BookOpenText,
  CalendarDays,
  Plus,
  BadgeCheck,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { myTitik, mySummary, type MyTitikItem } from "@/lib/queries/kelola";

export const dynamic = "force-dynamic";

const STATUS: Record<MyTitikItem["status"], { label: string; tone: "success" | "warning" | "danger"; Icon: typeof BadgeCheck }> = {
  active: { label: "Terverifikasi", tone: "success", Icon: BadgeCheck },
  pending: { label: "Menunggu verifikasi", tone: "warning", Icon: Clock },
  rejected: { label: "Ditolak", tone: "danger", Icon: Clock },
};

export default async function KelolaDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk");

  const [titik, summary] = await Promise.all([myTitik(userId), mySummary(userId)]);

  const stats: { label: string; value: string | number; icon: typeof MapPin; tone?: "gold" }[] = [
    { label: "Titik dakwah", value: summary.titikCount, icon: MapPin },
    { label: "Jadwal kajian", value: summary.scheduleCount, icon: CalendarCheck },
    { label: "Jadwal online", value: summary.onlineCount, icon: Radio },
    { label: "Kajian terdaftar", value: summary.kajianCount, icon: BookOpenText, tone: "gold" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Ringkasan Pengelola"
        subtitle="Kelola data milik Anda di Blitar Raya. Statistik dihitung hanya dari titik dakwah yang Anda kelola."
        action={
          <Button href="/kelola/jadwal">
            <CalendarDays className="h-4 w-4" /> Kelola Jadwal
          </Button>
        }
      />

      {/* Kartu statistik */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          const gold = s.tone === "gold";
          return (
            <Card key={s.label} className="p-4">
              <span
                className={
                  gold
                    ? "grid h-9 w-9 place-items-center rounded-sm bg-gold/15 text-gold-dark"
                    : "grid h-9 w-9 place-items-center rounded-sm bg-brand-50 text-brand-600"
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <p className="display mt-2 text-2xl text-ink">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Daftar titik dakwah milik */}
      <div className="mt-8 mb-3 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-lg text-ink">Titik Dakwah Saya</h2>
        <span className="text-xs text-muted">{titik.length} titik dikelola</span>
      </div>

      {titik.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <MapPin className="h-7 w-7" />
          </span>
          <h3 className="display mt-4 text-lg text-ink">Belum ada titik dakwah</h3>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Anda belum mengelola titik dakwah apa pun. Ajukan titik dakwah (masjid, mushola, atau majelis) ke admin agar
            bisa mulai mengelola jadwal kajian, galeri, dan donasi titik.
          </p>
          <div className="mt-5">
            <Button href="/titik" variant="outline">
              <MapPin className="h-4 w-4" /> Lihat Titik Dakwah
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {titik.map((t) => {
            const st = STATUS[t.status];
            const StIcon = st.Icon;
            return (
              <Card key={t.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
                    <MapPin className="h-5 w-5" />
                  </span>
                  <Badge tone={st.tone}>
                    <StIcon className="h-3.5 w-3.5" /> {st.label}
                  </Badge>
                </div>
                <h3 className="mt-3 font-bold text-ink">{t.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {t.kecamatan ?? t.address ?? "Lokasi belum dilengkapi"}
                </p>
                <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-muted">
                  <CalendarCheck className="h-3.5 w-3.5 text-brand-600" />
                  <span className="font-semibold text-ink">{t.scheduleCount}</span> jadwal aktif
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button href="/kelola/jadwal" size="sm" variant="outline" className="flex-1">
                    <CalendarDays className="h-4 w-4" /> Jadwal
                  </Button>
                  <Link
                    href={`/titik/${t.slug}`}
                    className="text-xs font-bold text-brand-700 hover:underline"
                  >
                    Lihat publik
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Catatan / info */}
      <div className="mt-6 flex items-start gap-3 rounded-sm border border-green-200 bg-green-50 px-4 py-3 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <p className="text-green-800">
          Anda hanya melihat &amp; mengubah data milik sendiri (<code>manage_own</code>). Konten dari titik dakwah yang
          telah terverifikasi akan langsung tampil untuk jamaah tanpa moderasi ulang.
        </p>
      </div>

      <div className="mt-4 text-right">
        <Button href="/kelola/jadwal" variant="ghost" size="sm">
          <Plus className="h-4 w-4" /> Tambah Jadwal Kajian
        </Button>
      </div>
    </div>
  );
}
