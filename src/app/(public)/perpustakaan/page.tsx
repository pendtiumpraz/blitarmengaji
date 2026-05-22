import Link from "next/link";
import { Download, FileText, Library, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import { listLibrary } from "@/lib/queries/konten";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Perpustakaan · Blitar Mengaji",
  description: "PDF & materi kajian dari para ustadz Blitar Raya — gratis diunduh.",
};

// Format ukuran file (bytes) → "PDF · 2,4 MB". Null = "PDF".
function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "PDF";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `PDF · ${mb.toLocaleString("id-ID", { maximumFractionDigits: 1 })} MB`;
  const kb = Math.max(1, Math.round(bytes / 1024));
  return `PDF · ${kb.toLocaleString("id-ID")} KB`;
}

// Format jumlah unduhan → "1,2rb".
function formatDownloads(n: number): string {
  if (n >= 1000) return `${(n / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })}rb`;
  return n.toLocaleString("id-ID");
}

// Util warna cover placeholder (deterministik dari id) — tanpa URL eksternal.
const COVERS = ["bg-brand-600", "bg-gold", "bg-brand-700", "bg-brand-900"] as const;
function coverFor(id: string): string {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return COVERS[sum % COVERS.length];
}

export default async function PerpustakaanPage() {
  const docs = await listLibrary();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <Container className="relative z-10 py-12">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-light/85">Materi & Bacaan</p>
          <h1 className="display mt-3 text-4xl leading-[1.05] text-[#FBF4E2] md:text-5xl">Perpustakaan</h1>
          <p className="mt-3 max-w-[56ch] text-[15px] leading-relaxed text-cream/80">
            PDF & materi dari para ustadz Blitar Raya — gratis untuk diunduh, dibaca, dan dibagikan demi tersebarnya ilmu.
          </p>
        </Container>
      </section>

      <Container className="py-10">
        {docs.length === 0 ? (
          /* EMPTY STATE ramah */
          <div className="mx-auto max-w-md rounded-[3px] border border-dashed border-line bg-surface px-6 py-14 text-center shadow-card">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50">
              <Library className="h-7 w-7 text-brand-600" strokeWidth={1.5} />
            </div>
            <h3 className="display mt-4 text-xl text-ink">Perpustakaan masih kosong</h3>
            <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-relaxed text-muted">
              Materi & PDF dari para ustadz akan tersedia di sini untuk diunduh secara gratis.
              Nantikan koleksi bacaan dari majelis di Blitar Raya.
            </p>
          </div>
        ) : (
          /* GRID KARTU PDF */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => {
              const author = doc.author ?? doc.ustadzName;
              return (
                <Card key={doc.id} className="flex gap-4 p-4 transition hover:border-gold/50 hover:shadow-lg">
                  {/* cover (pakai coverImage bila ada, jika tidak placeholder warna) */}
                  {doc.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.coverImage}
                      alt={doc.title}
                      className="h-24 w-16 shrink-0 rounded-[3px] object-cover"
                    />
                  ) : (
                    <div className={cn("grid h-24 w-16 shrink-0 place-items-center rounded-[3px]", coverFor(doc.id))}>
                      <FileText className="h-7 w-7 text-white/90" />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Badge tone="brand" className="self-start">
                      Materi
                    </Badge>
                    <h3 className="mt-1.5 text-[15px] font-bold leading-tight text-ink">{doc.title}</h3>
                    {author ? <p className="mt-0.5 text-xs text-muted">{author}</p> : null}
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-muted">
                      <span>{formatSize(doc.fileSize)}</span>
                      <span className="flex items-center gap-1">
                        <Download className="h-3 w-3" /> {formatDownloads(doc.downloads)}
                      </span>
                    </div>
                    {/* Baca (viewer in-app) + Unduh */}
                    <div className="mt-3 flex items-center gap-2">
                      <Link
                        href={`/baca?url=${encodeURIComponent(doc.pdfUrl)}&judul=${encodeURIComponent(doc.title)}&back=/perpustakaan`}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-600 px-4 text-xs font-bold tracking-[0.01em] text-white transition-colors hover:bg-brand-700"
                      >
                        <BookOpen className="h-3.5 w-3.5" /> Baca
                      </Link>
                      <a
                        href={doc.pdfUrl}
                        download
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand-50 px-4 text-xs font-bold tracking-[0.01em] text-brand-700 transition-colors hover:bg-brand-100"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
