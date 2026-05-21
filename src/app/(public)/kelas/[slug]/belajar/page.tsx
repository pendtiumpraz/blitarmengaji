import { CheckCircle2, Circle, ArrowLeft, FileText, Play, Download } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getCourseBySlug, type CourseLesson } from "@/lib/queries/belajar";
import { courseProgress, isEnrolled } from "@/lib/queries/progress";
import { markLessonComplete, markLessonIncomplete } from "@/lib/actions/progress";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

/** URL embed iframe untuk YouTube / Facebook dari videoUrl pelajaran. Null = tampilkan tautan. */
function embedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  // YouTube
  if (host === "youtu.be") {
    return parts[0] ? `https://www.youtube.com/embed/${parts[0]}` : null;
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    const v = url.searchParams.get("v");
    if (v) return `https://www.youtube.com/embed/${v}`;
    const idx = parts.findIndex((p) => p === "embed" || p === "live" || p === "shorts" || p === "v");
    const id = idx >= 0 ? parts[idx + 1] : undefined;
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  // Facebook: plugin video.php dengan href ter-encode.
  if (host === "facebook.com" || host === "fb.watch" || host === "fb.com") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}`;
  }

  return null;
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { slug } = await params;
  const { lesson: lessonParam } = await searchParams;

  // WAJIB login.
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect(`/masuk?next=/kelas/${slug}/belajar`);

  const kelas = await getCourseBySlug(slug);
  if (!kelas) notFound();

  // WAJIB enrolled — bila belum, arahkan ke halaman detail kelas (tombol Daftar di sana).
  const enrolled = await isEnrolled(userId, kelas.id);
  if (!enrolled) redirect(`/kelas/${slug}`);

  const { completedLessonIds, total, percent } = await courseProgress(userId, kelas.id);
  const completed = new Set(completedLessonIds);

  // Semua pelajaran berurutan (untuk menentukan pelajaran aktif & navigasi).
  const semuaPelajaran = kelas.modules.flatMap((m) => m.lessons);
  if (semuaPelajaran.length === 0) {
    return (
      <Container className="py-10">
        <Link
          href={`/kelas/${slug}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke detail kelas
        </Link>
        <div className="rounded-[3px] border border-dashed border-line bg-surface px-4 py-12 text-center text-sm text-muted">
          Materi kelas sedang disusun. Nantikan pelajarannya, insya Allah segera hadir.
        </div>
      </Container>
    );
  }

  // Pelajaran aktif: dari ?lesson=<id>, fallback ke pelajaran pertama.
  const active: CourseLesson =
    semuaPelajaran.find((l) => l.id === lessonParam) ?? semuaPelajaran[0];
  const isDone = completed.has(active.id);

  return (
    <Container className="py-6 lg:py-10">
      <Link
        href={`/kelas/${slug}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> {kelas.title}
      </Link>

      {/* Progress bar % di atas */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-bold uppercase tracking-[0.16em] text-gold-dark">Progres Belajar</span>
          <span className="font-bold text-brand-700">
            {completed.size}/{total} · {percent}%
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-brand-50 ring-1 ring-line">
          <div
            className="h-full rounded-full bg-brand-600 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* Area konten pelajaran aktif */}
        <div className="lg:col-span-2">
          <LessonContent lesson={active} />

          <div className="mt-4">
            <h1 className="display text-xl text-ink sm:text-2xl">{active.title}</h1>
            <p className="mt-1 text-sm capitalize text-muted">
              {active.kind === "video" ? "Video" : active.kind === "pdf" ? "Dokumen PDF" : "Materi teks"}
            </p>

            {/* Tombol Tandai Selesai / Batalkan */}
            <form
              action={isDone ? markLessonIncomplete : markLessonComplete}
              className="mt-4"
            >
              <input type="hidden" name="lessonId" value={active.id} />
              <input type="hidden" name="courseId" value={kelas.id} />
              <Button type="submit" variant={isDone ? "outline" : "primary"} size="md">
                {isDone ? (
                  <>
                    <Circle className="h-4 w-4" /> Batalkan Tanda Selesai
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Tandai Selesai
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar daftar modul + pelajaran */}
        <aside className="lg:col-span-1 lg:sticky lg:top-20">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-gold-dark">
            Daftar Materi
          </h2>
          <div className="space-y-3">
            {kelas.modules.map((m, mi) => (
              <div
                key={m.id}
                className="overflow-hidden rounded-[3px] border border-line bg-surface"
              >
                <div className="border-b border-line bg-brand-50 px-4 py-2.5">
                  <p className="text-sm font-bold text-ink">
                    Modul {mi + 1} · {m.title}
                  </p>
                </div>
                <ul className="divide-y divide-line">
                  {m.lessons.map((l, li) => {
                    const done = completed.has(l.id);
                    const isActive = l.id === active.id;
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/kelas/${slug}/belajar?lesson=${l.id}`}
                          className={cn(
                            "flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-brand-50/60",
                            isActive && "bg-brand-50",
                          )}
                          aria-current={isActive ? "true" : undefined}
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-muted" />
                          )}
                          <span
                            className={cn(
                              "flex-1 text-[13px]",
                              isActive ? "font-bold text-brand-700" : "text-ink",
                            )}
                          >
                            {li + 1}. {l.title}
                          </span>
                          <LessonKindIcon kind={l.kind} />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </Container>
  );
}

/** Ikon kecil per jenis pelajaran di daftar materi. */
function LessonKindIcon({ kind }: { kind: CourseLesson["kind"] }) {
  if (kind === "video") return <Play className="h-3.5 w-3.5 shrink-0 text-muted" />;
  if (kind === "pdf") return <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />;
  return <FileText className="h-3.5 w-3.5 shrink-0 text-muted" />;
}

/** Render konten pelajaran aktif sesuai jenis: video (embed), teks, atau pdf. */
function LessonContent({ lesson }: { lesson: CourseLesson }) {
  if (lesson.kind === "video") {
    const src = lesson.videoUrl ? embedUrl(lesson.videoUrl) : null;
    return (
      <div className="relative aspect-video overflow-hidden rounded-[3px] bg-brand-700">
        {src ? (
          <iframe
            src={src}
            title={lesson.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        ) : lesson.videoUrl ? (
          <a
            href={lesson.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 grid place-items-center gap-2 text-sm font-bold text-cream"
          >
            <Play className="h-8 w-8" /> Buka video
          </a>
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-cream/80">
            Video belum tersedia.
          </div>
        )}
      </div>
    );
  }

  if (lesson.kind === "pdf") {
    // Untuk PDF, sumber bisa di content atau videoUrl (url file). Utamakan content.
    const pdfUrl = lesson.content ?? lesson.videoUrl ?? null;
    return (
      <div className="overflow-hidden rounded-[3px] border border-line bg-surface">
        {pdfUrl ? (
          <>
            <iframe
              src={pdfUrl}
              title={lesson.title}
              className="h-[60vh] w-full bg-cream"
            />
            <div className="border-t border-line px-4 py-3">
              <Button href={pdfUrl} variant="outline" size="sm">
                <Download className="h-4 w-4" /> Unduh / Buka PDF
              </Button>
            </div>
          </>
        ) : (
          <div className="grid place-items-center px-4 py-16 text-sm text-muted">
            Dokumen belum tersedia.
          </div>
        )}
      </div>
    );
  }

  // Teks / markdown sederhana — pertahankan baris (whitespace-pre-line).
  return (
    <div className="rounded-[3px] border border-line bg-surface px-5 py-6">
      {lesson.content ? (
        <div className="whitespace-pre-line leading-relaxed text-ink/90">{lesson.content}</div>
      ) : (
        <p className="text-sm text-muted">Materi teks belum tersedia.</p>
      )}
    </div>
  );
}
