import Link from "next/link";
import {
  MessageCircleQuestion,
  NotebookPen,
  FileText,
  GraduationCap,
  ChevronRight,
  Plus,
  BadgeCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import {
  getUstadzProfile,
  getUstadzSummary,
} from "@/lib/queries/ustadz";

export const dynamic = "force-dynamic";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
};

export default async function UstadzDashboardPage() {
  const session = await auth();
  const userId = session?.user?.id as string; // dijamin ada oleh layout guard
  const userName = session?.user?.name?.trim() || "Ustadz";

  const profile = await getUstadzProfile(userId);
  const summary = await getUstadzSummary(userId, profile?.id ?? null);

  const stats: Stat[] = [
    {
      label: "Pertanyaan menunggu",
      value: summary.pendingQuestions,
      icon: MessageCircleQuestion,
      href: "/ustadz/jawab",
    },
    {
      label: "Catatan ditulis",
      value: summary.myPosts,
      icon: NotebookPen,
      href: "/ustadz/catatan",
    },
    {
      label: "PDF diunggah",
      value: summary.myPdfs,
      icon: FileText,
      href: "/ustadz/pustaka",
    },
    {
      label: "Kelas dibuat",
      value: summary.myCourses,
      icon: GraduationCap,
      href: "/ustadz/kelas",
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard Ustadz"
        subtitle="Ringkasan kontribusi Anda: jawab Tanya Ustadz, tulis catatan, unggah materi PDF, dan kelola kelas."
        action={
          <Button href="/ustadz/catatan">
            <Plus className="h-4 w-4" /> Buat Konten
          </Button>
        }
      />

      {/* Kartu profil */}
      <Card className="mb-5 flex items-center gap-3 p-5">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-600 text-xl font-bold text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="display flex items-center gap-1.5 text-lg text-ink">
            {profile?.name ?? userName}
            <BadgeCheck className="h-4 w-4 text-gold-dark" />
          </p>
          <p className="text-sm text-muted">
            {profile?.specialization ?? "Kontributor Blitar Mengaji"}
          </p>
        </div>
        {profile ? (
          <Badge tone="success">Profil aktif</Badge>
        ) : (
          <Badge tone="muted">Profil belum dibuat</Badge>
        )}
      </Card>

      {/* Statistik kontribusi */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="flex h-full items-center gap-3 p-4 transition-colors hover:border-brand-300">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-extrabold leading-none text-ink">{s.value}</p>
                  <p className="mt-1 text-[11px] text-muted">{s.label}</p>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Perlu tindakan */}
      <div className="mt-6">
        <h2 className="display mb-3 text-lg text-ink">Perlu tindakan</h2>
        <div className="space-y-2.5">
          <Link href="/ustadz/jawab">
            <Card className="flex items-center gap-3 p-4 transition-colors hover:border-brand-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold-dark">
                <MessageCircleQuestion className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">
                  {summary.pendingQuestions > 0
                    ? `${summary.pendingQuestions} pertanyaan menunggu jawaban`
                    : "Tidak ada pertanyaan menunggu"}
                </p>
                <p className="text-[11px] text-muted">
                  Jawaban ustadz selalu tercantum nama (tidak anonim).
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Card>
          </Link>

          <Link href="/ustadz/pustaka">
            <Card className="flex items-center gap-3 p-4 transition-colors hover:border-brand-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <FileText className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Unggah materi PDF</p>
                <p className="text-[11px] text-muted">
                  Tambah materi ke perpustakaan untuk jamaah Blitar Raya.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Card>
          </Link>

          <Link href="/ustadz/kelas">
            <Card className="flex items-center gap-3 p-4 transition-colors hover:border-brand-300">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink">Kelola kelas online</p>
                <p className="text-[11px] text-muted">
                  Buat kelas baru dan publikasikan untuk jamaah.
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
