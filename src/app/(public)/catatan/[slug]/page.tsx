import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { Share2, Bot, Calendar, Clock, BookOpen, Eye } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { getPostBySlug } from "@/lib/queries/konten";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = await getPostBySlug(slug);
  if (!note) return { title: "Tidak ditemukan" };

  const description =
    note.excerpt ??
    `${note.type === "artikel" ? "Artikel" : "Catatan kajian"} oleh ${
      note.authorName ?? "Tim Blitar Mengaji"
    }.`;

  return {
    title: note.title,
    description,
    openGraph: {
      title: note.title,
      description,
      type: "article",
      ...(note.coverImage ? { images: [note.coverImage] } : {}),
    },
  };
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/* ============================================================
 * Renderer Tiptap JSON (content_rich) — aman & terbatas (allow-list).
 * Mendukung: heading, paragraph, bulletList/orderedList, listItem,
 * blockquote, hardBreak, marks (bold/italic). Teks Arab (mark "arabic"
 * atau attrs.dir === "rtl") tampil dengan font-arabic + RTL (dukung ayat).
 * Node tak dikenal di-skip secara aman; tidak ada HTML mentah.
 * ============================================================ */

type TiptapMark = { type?: string; attrs?: Record<string, unknown> };
type TiptapNode = {
  type?: string;
  text?: string;
  marks?: TiptapMark[];
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
};

function isArabic(node: TiptapNode): boolean {
  const dir = node.attrs?.["dir"];
  if (typeof dir === "string" && dir.toLowerCase() === "rtl") return true;
  return Boolean(node.marks?.some((m) => m.type === "arabic" || m.type === "ayat"));
}

function renderText(node: TiptapNode, key: number): ReactNode {
  let el: ReactNode = node.text ?? "";
  const arabic = node.marks?.some((m) => m.type === "arabic" || m.type === "ayat");
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold" || mark.type === "strong") el = <strong>{el}</strong>;
    else if (mark.type === "italic" || mark.type === "em") el = <em>{el}</em>;
  }
  if (arabic) {
    el = (
      <span className="font-arabic text-2xl leading-loose text-brand-800" dir="rtl">
        {el}
      </span>
    );
  }
  return <Fragment key={key}>{el}</Fragment>;
}

function renderChildren(nodes: TiptapNode[] | undefined): ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => renderNode(n, i));
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "hardBreak":
      return <br key={key} />;
    case "heading": {
      const level = Number(node.attrs?.["level"] ?? 2);
      const cls = "display mt-7 text-ink " + (level <= 2 ? "text-2xl" : "text-xl");
      if (level <= 2)
        return (
          <h2 key={key} className={cls}>
            {renderChildren(node.content)}
          </h2>
        );
      return (
        <h3 key={key} className={cls}>
          {renderChildren(node.content)}
        </h3>
      );
    }
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="my-6 border-l-4 border-gold pl-5 text-xl font-semibold italic leading-relaxed text-ink"
        >
          {renderChildren(node.content)}
        </blockquote>
      );
    case "bulletList":
      return (
        <ul key={key} className="my-4 list-disc space-y-1.5 pl-6">
          {renderChildren(node.content)}
        </ul>
      );
    case "orderedList":
      return (
        <ol key={key} className="my-4 list-decimal space-y-1.5 pl-6">
          {renderChildren(node.content)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{renderChildren(node.content)}</li>;
    case "paragraph": {
      // Paragraf khusus ayat (RTL) → kotak highlight gaya "buku catatan".
      if (isArabic(node)) {
        return (
          <div key={key} className="my-6 rounded-[3px] border-r-4 border-gold bg-brand-50 p-5">
            <p className="font-arabic text-right text-2xl leading-loose text-brand-800" dir="rtl">
              {renderChildren(node.content)}
            </p>
          </div>
        );
      }
      return <p key={key}>{renderChildren(node.content)}</p>;
    }
    default:
      // Node bertipe lain: render anak-anaknya bila ada (mis. doc).
      return node.content ? <Fragment key={key}>{renderChildren(node.content)}</Fragment> : null;
  }
}

function RichContent({ content }: { content: unknown }) {
  const doc = content as TiptapNode | null;
  const children = doc && typeof doc === "object" ? doc.content : undefined;
  if (!children || children.length === 0) {
    return (
      <p className="italic text-muted">
        Isi catatan ini belum tersedia. Silakan kembali lagi nanti.
      </p>
    );
  }
  return <>{renderChildren(children)}</>;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = await getPostBySlug(slug);
  if (!note) notFound();

  const date = note.publishedAt ?? note.createdAt;

  return (
    <section className="bg-cream">
      <Container className="py-10 lg:py-14">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* ARTIKEL — lebar baca ~70ch terpusat, gaya "buku catatan" */}
          <article className="lg:col-span-8 lg:col-start-2">
            <div
              className="mx-auto max-w-2xl rounded-[3px] border border-line bg-surface p-6 shadow-card md:p-10"
              style={{
                backgroundImage:
                  "linear-gradient(var(--c-brand-50, rgba(0,0,0,.04)) 1px, transparent 1px)",
                backgroundSize: "100% 2rem",
              }}
            >
              <Badge>
                {note.type === "artikel" ? "Artikel" : "Catatan Kajian"}
              </Badge>

              <h1 className="display mt-3 text-3xl leading-tight text-ink md:text-4xl">
                {note.title}
              </h1>

              {/* BYLINE */}
              <div className="mt-5 flex items-center gap-3 border-b border-line pb-5">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-700 to-brand-500 text-cream">
                  <BookOpen className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <div>
                  <p className="font-bold text-ink">{note.authorName ?? "Tim Blitar Mengaji"}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {dateFmt.format(date)}
                    </span>
                    <span className="text-line">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {note.views} kali dibaca
                    </span>
                  </p>
                </div>
              </div>

              {/* BACAAN — dari content_rich (Tiptap JSON) */}
              <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-ink/80">
                {note.excerpt ? (
                  <p className="text-lg font-medium italic text-ink/70">{note.excerpt}</p>
                ) : null}
                <RichContent content={note.contentRich} />
              </div>

              {/* BARIS AKSI */}
              <div className="mt-8 flex flex-wrap items-center gap-5 border-t border-line pt-5 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> {dateFmt.format(date)}
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600"
                >
                  <Share2 className="h-4 w-4" /> Bagikan
                </button>
                <Link
                  href="/tanya-ai"
                  className="ml-auto inline-flex items-center gap-1.5 font-bold text-brand-600 transition-colors hover:text-brand-700"
                >
                  <Bot className="h-4 w-4" /> Tanya AI tentang ini
                </Link>
              </div>
            </div>

            <div className="mx-auto mt-6 max-w-2xl">
              <Link
                href="/catatan"
                className="text-sm font-bold text-brand-600 transition-colors hover:text-brand-700"
              >
                ← Kembali ke daftar catatan
              </Link>
            </div>
          </article>

          {/* SIDEBAR — Tanya AI (desktop) */}
          <aside className="space-y-5 lg:col-span-3">
            <div className="relative overflow-hidden rounded-[3px] bg-brand-700 p-4 text-cream">
              <div className="pat-trellis-light pointer-events-none absolute inset-0" />
              <div className="relative z-10">
                <div className="mb-1 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-gold-light" />
                  <p className="text-sm font-bold">Tanya AI tentang ini</p>
                </div>
                <p className="text-xs leading-relaxed text-cream/70">
                  Bingung dengan istilah di catatan ini? Tanyakan langsung ke asisten kajian.
                </p>
                <Link
                  href="/tanya-ai"
                  className="mt-3 flex h-10 w-full items-center justify-center rounded-full bg-gold text-sm font-bold text-[#241f10] transition-colors hover:bg-gold-light"
                >
                  Mulai Bertanya
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>
    </section>
  );
}
