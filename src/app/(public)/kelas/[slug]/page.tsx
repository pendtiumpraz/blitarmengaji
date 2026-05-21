import type { Metadata } from "next";
import { Play, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getCourseBySlug, type CourseLesson } from "@/lib/queries/belajar";
import { courseProgress, isEnrolled } from "@/lib/queries/progress";
import { enrollCourse } from "@/lib/actions/belajar";
import { ModulAccordion, type Modul } from "./modul-accordion";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const kelas = await getCourseBySlug(slug);
  if (!kelas) return { title: "Tidak ditemukan" };

  const description =
    kelas.description ??
    `Kelas online ${kelas.title}${
      kelas.ustadzName ? ` bersama ${kelas.ustadzName}` : ""
    } di Blitar Mengaji.`;

  return {
    title: kelas.title,
    description,
    openGraph: {
      title: kelas.title,
      description,
      ...(kelas.coverImage ? { images: [kelas.coverImage] } : {}),
    },
  };
}

// Format durasi (detik) -> "8m" / "1j 20m" untuk tampilan craft.
function formatDurasi(totalDetik: number): string {
  if (totalDetik <= 0) return "—";
  const menit = Math.round(totalDetik / 60);
  const jam = Math.floor(menit / 60);
  const sisa = menit % 60;
  if (jam > 0) return sisa > 0 ? `${jam}j ${sisa}m` : `${jam}j`;
  return `${menit}m`;
}

function lessonDurasi(l: CourseLesson): string {
  return l.duration ? formatDurasi(l.duration) : "—";
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kelas = await getCourseBySlug(slug);
  if (!kelas) notFound();

  // Status enrollment + progress user login (untuk tombol Lanjut Belajar / Daftar).
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const enrolled = userId ? await isEnrolled(userId, kelas.id) : false;
  const progress = enrolled && userId ? await courseProgress(userId, kelas.id) : null;

  // Map data DB -> bentuk yang dipakai accordion (client). Semua "kini" agar publik bisa menjelajah.
  const modul: Modul[] = kelas.modules.map((m, mi) => ({
    judul: `Modul ${mi + 1} · ${m.title}`,
    pelajaran: m.lessons.map((l) => ({
      judul: l.title,
      durasi: lessonDurasi(l),
      status: "kini" as const,
    })),
  }));

  const semuaPelajaran = kelas.modules.flatMap((m) => m.lessons);
  const total = semuaPelajaran.length;
  const totalDetik = semuaPelajaran.reduce((acc, l) => acc + (l.duration ?? 0), 0);
  const durasiTotal = formatDurasi(totalDetik);

  return (
    <Container className="py-6 lg:py-10">
      <Link
        href="/kelas"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Kembali ke Kelas
      </Link>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Kiri: cover + judul + info */}
        <div className="lg:col-span-2">
          <div className="relative grid aspect-video place-items-center overflow-hidden rounded-[3px] bg-brand-600">
            {kelas.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kelas.coverImage} alt={kelas.title} className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/40">
                <Play className="h-8 w-8 fill-white text-white" />
              </span>
            )}
          </div>

          <div className="mt-4">
            <h1 className="display text-2xl text-ink sm:text-3xl">{kelas.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {kelas.ustadzName ?? "Tim Pengajar"} · {total} pelajaran · {durasiTotal}
              {kelas.level ? <span className="capitalize"> · {kelas.level}</span> : null}
            </p>

            {kelas.description ? (
              <p className="mt-3 leading-relaxed text-ink/80">{kelas.description}</p>
            ) : null}

            {enrolled ? (
              <div className="mt-5">
                {progress ? (
                  <>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-[0.16em] text-gold-dark">
                        Progres Belajar
                      </span>
                      <span className="font-bold text-brand-700">
                        {progress.completedLessonIds.length}/{progress.total} · {progress.percent}%
                      </span>
                    </div>
                    <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-brand-50 ring-1 ring-line">
                      <div
                        className="h-full rounded-full bg-brand-600 transition-all"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                  </>
                ) : null}
                <Button href={`/kelas/${slug}/belajar`} size="md">
                  Lanjut Belajar
                </Button>
              </div>
            ) : (
              <form action={enrollCourse} className="mt-5">
                <input type="hidden" name="courseId" value={kelas.id} />
                <Button type="submit" size="md">
                  Daftar Kelas
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Kanan (desktop) / bawah (mobile): daftar modul */}
        <aside className="lg:col-span-1">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-gold-dark">
            Daftar Modul
          </h2>
          {modul.length > 0 ? (
            <ModulAccordion modul={modul} />
          ) : (
            <div className="rounded-[3px] border border-dashed border-line bg-surface px-4 py-8 text-center text-sm text-muted">
              Materi kelas sedang disusun. Nantikan modul & pelajarannya, insya Allah segera hadir.
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
