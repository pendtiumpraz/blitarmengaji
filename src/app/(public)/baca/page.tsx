import Link from "next/link";
import { ArrowLeft, Download, ExternalLink } from "lucide-react";
import { Container } from "@/components/ui/container";

export const metadata = { title: "Baca Dokumen" };
export const dynamic = "force-dynamic";

/** Izinkan PDF dari Vercel Blob ATAU endpoint PDF milik sendiri (laporan/panduan). */
function isAllowed(url: string): boolean {
  if (url.startsWith("/api/laporan/") || url.startsWith("/api/guide/")) return true;
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith("blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export default async function BacaPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; judul?: string; back?: string }>;
}) {
  const { url, judul, back } = await searchParams;
  const ok = !!url && isAllowed(url);
  const backHref = back && back.startsWith("/") ? back : "/";

  return (
    <Container className="py-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>
        <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">{judul ?? "Dokumen"}</span>
        {ok ? (
          <>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line px-3 text-xs font-bold text-ink hover:bg-brand-50"
            >
              <ExternalLink className="h-4 w-4" /> Tab baru
            </a>
            <a
              href={url}
              download
              className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-brand-600 px-3 text-xs font-bold text-white hover:bg-brand-700"
            >
              <Download className="h-4 w-4" /> Unduh
            </a>
          </>
        ) : null}
      </div>

      {ok ? (
        <iframe
          src={`${url}#view=FitH`}
          title={judul ?? "Dokumen PDF"}
          className="h-[82vh] w-full rounded-sm border border-line bg-white"
        />
      ) : (
        <div className="rounded-sm border border-dashed border-line bg-surface p-10 text-center text-sm text-muted">
          Dokumen tidak valid atau tidak tersedia.
        </div>
      )}

      <p className="mt-2 text-[11px] text-muted">
        Jika PDF tidak tampil di perangkatmu, ketuk <b>Tab baru</b> atau <b>Unduh</b>.
      </p>
    </Container>
  );
}
