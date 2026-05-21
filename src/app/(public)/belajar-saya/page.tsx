import { redirect } from "next/navigation";
import { GraduationCap, PlayCircle, BookMarked, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { auth } from "@/lib/auth";
import { myEnrollments } from "@/lib/queries/belajar-saya";

// Halaman "Belajar Saya" — kelas yang diikuti user + progress. Wajib login.
export const dynamic = "force-dynamic";

// Ikon cover diputar berdasarkan urutan agar kartu tetap bervariasi (data dari DB).
const covers = [
  { tone: "bg-brand-600", icon: PlayCircle },
  { tone: "bg-gold", icon: GraduationCap },
  { tone: "bg-brand-700", icon: BookMarked },
  { tone: "bg-brand-600", icon: BookOpen },
] as const;

export default async function BelajarSayaPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/masuk?next=/belajar-saya");

  const kelasList = await myEnrollments(userId);

  return (
    <Container className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          align="left"
          eyebrow="Progress Belajarku"
          title="Belajar Saya"
          subtitle="Lanjutkan kelas yang sedang kamu ikuti. Pantau progress tiap kelas dan teruskan dari mana kamu berhenti."
        />
        <Button href="/kelas" variant="outline" size="sm">
          Jelajahi Kelas
        </Button>
      </div>

      {kelasList.length === 0 ? (
        <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <GraduationCap className="h-7 w-7" strokeWidth={1.5} />
          </span>
          <h3 className="display mt-4 text-xl text-ink">Belum ikut kelas</h3>
          <p className="mt-1.5 max-w-[44ch] text-sm text-muted">
            Kamu belum mengikuti kelas apa pun. Jelajahi kelas online dari para ustadz Blitar Raya
            dan mulai belajar — semuanya gratis.
          </p>
          <Button href="/kelas" variant="primary" size="sm" className="mt-5">
            Lihat Kelas
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {kelasList.map((k, i) => {
            const cover = covers[i % covers.length];
            const Icon = cover.icon;
            return (
              <div
                key={k.enrollmentId}
                className="flex flex-col overflow-hidden rounded-[3px] border border-line bg-surface transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl"
              >
                <div className={`relative grid h-32 place-items-center ${cover.tone}`}>
                  {k.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={k.coverImage} alt={k.title} className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-12 w-12 text-white/90" strokeWidth={1.4} />
                  )}
                  {k.progress >= 100 ? (
                    <Badge tone="success" className="absolute right-2 top-2 bg-surface">
                      Selesai
                    </Badge>
                  ) : (
                    <Badge tone="brand" className="absolute right-2 top-2 bg-surface text-brand-700">
                      {k.progress}%
                    </Badge>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[15px] font-bold leading-snug text-ink">{k.title}</h3>
                  {k.level ? (
                    <p className="mt-1 text-xs capitalize text-muted">{k.level}</p>
                  ) : null}

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>Progress</span>
                      <span className="font-bold text-brand-700">{k.progress}%</span>
                    </div>
                    <div
                      className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-brand-50"
                      role="progressbar"
                      aria-valuenow={k.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progress kelas ${k.title}`}
                    >
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{ width: `${k.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-4">
                    <Button
                      href={`/kelas/${k.slug}/belajar`}
                      variant="primary"
                      size="sm"
                      className="w-full"
                    >
                      Lanjut Belajar
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Container>
  );
}
