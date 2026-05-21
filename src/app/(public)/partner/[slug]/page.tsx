import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Globe,
  ImageIcon,
  MessageCircle,
  Radio,
  Store,
  Video as VideoIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import {
  getPartnerBySlug,
  type BusinessPartnerDetail,
  type MediaPartnerDetail,
  type PartnerProductItem,
  type PartnerVideoItem,
} from "@/lib/queries/partner-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);
  if (!partner) return { title: "Tidak ditemukan" };

  const jenis = partner.kind === "media" ? "Media partner" : "Partner usaha";
  const description = partner.description ?? `${jenis} ${partner.name} di Blitar Mengaji.`;

  return {
    title: partner.name,
    description,
    openGraph: {
      title: partner.name,
      description,
      ...(partner.logo ? { images: [partner.logo] } : {}),
    },
  };
}

function rupiah(price: string | null): string {
  if (price === null) return "Hubungi penjual";
  const n = Number(price);
  if (!Number.isFinite(n)) return "Hubungi penjual";
  return "Rp " + n.toLocaleString("id-ID");
}

/** URL embed iframe untuk YouTube / Facebook dari data video. Null = pakai tautan. */
function embedUrl(v: PartnerVideoItem): string | null {
  if (v.platform === "youtube") {
    return v.embedId ? `https://www.youtube.com/embed/${v.embedId}` : null;
  }
  // Facebook: plugin video.php dengan href = sourceUrl ter-encode.
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(v.sourceUrl)}`;
}

/**
 * Bangun URL WhatsApp untuk satu produk partner usaha.
 * Prioritas: contactLink produk -> nomor WA partner. Null bila tidak ada kontak.
 */
function productWaHref(
  product: PartnerProductItem,
  partnerName: string,
  partnerWa: string | null,
): string | null {
  const pesan = encodeURIComponent(
    `Assalamu'alaikum, saya tertarik dengan produk "${product.title}" (${rupiah(
      product.price,
    )}) dari ${partnerName} di Blitar Mengaji.`,
  );

  const link = product.contactLink?.trim();
  if (link) {
    if (/^https?:\/\//i.test(link) || link.startsWith("tel:")) return link;
    const digits = link.replace(/[^0-9]/g, "");
    if (digits) return `https://wa.me/${digits}?text=${pesan}`;
  }

  const wa = partnerWa?.replace(/[^0-9]/g, "");
  if (wa) return `https://wa.me/${wa}?text=${pesan}`;

  return null;
}

/** Header bersama: cover ornamen + logo + nama + badge jenis. */
function PartnerHeader({
  partner,
}: {
  partner: MediaPartnerDetail | BusinessPartnerDetail;
}) {
  const isMedia = partner.kind === "media";
  return (
    <section className="relative overflow-hidden bg-brand-600 text-cream">
      <div className="pat-girih-light absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
      <Container className="relative z-10 py-10 md:py-12">
        <nav className="flex items-center gap-1.5 text-xs text-cream/80" aria-label="Breadcrumb">
          <Link href="/partner" className="hover:text-cream">
            Partner &amp; Media
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-[#FBF4E2]">{partner.name}</span>
        </nav>

        <div className="mt-5 flex items-center gap-4">
          {partner.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={partner.logo}
              alt={partner.name}
              className="h-20 w-20 shrink-0 rounded-[3px] border border-white/40 bg-white/10 object-cover"
            />
          ) : (
            <div className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[3px] border border-white/40 bg-white/10">
              <div className="pat-girih-light absolute inset-0 opacity-60" />
              {isMedia ? (
                <Radio className="relative z-10 h-8 w-8 text-cream" />
              ) : (
                <Store className="relative z-10 h-8 w-8 text-cream" />
              )}
            </div>
          )}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-cream">
              {isMedia ? (
                <>
                  <Radio className="h-3.5 w-3.5 text-gold-light" /> Media Partner
                </>
              ) : (
                <>
                  <Store className="h-3.5 w-3.5 text-gold-light" /> Partner Usaha
                </>
              )}
            </span>
            <h1 className="display mt-2 text-3xl leading-tight text-[#FBF4E2] md:text-4xl">
              {partner.name}
            </h1>
            {!isMedia && partner.category ? (
              <p className="mt-1 text-sm text-cream/85">{partner.category}</p>
            ) : null}
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Bagian "Tentang" partner. */
function AboutSection({ description }: { description: string | null }) {
  return (
    <div className="rounded-[3px] border border-line bg-surface p-5 shadow-[0_2px_10px_rgba(15,23,42,.06)]">
      <h2 className="mb-2 text-sm font-bold text-ink">Tentang</h2>
      {description ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{description}</p>
      ) : (
        <p className="text-sm italic text-muted">Deskripsi belum ditambahkan.</p>
      )}
    </div>
  );
}

function MediaPartnerView({ partner }: { partner: MediaPartnerDetail }) {
  return (
    <Container className="py-10">
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* KIRI — video */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <VideoIcon className="h-5 w-5 text-brand-600" /> Video &amp; Siaran
          </h2>
          {partner.videos.length === 0 ? (
            <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-cream py-12 text-center">
              <VideoIcon className="h-7 w-7 text-brand-600/50" />
              <p className="mt-2 text-sm font-semibold text-ink">Belum ada video</p>
              <p className="text-xs text-muted">Video & siaran media partner ini masih kosong.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {partner.videos.map((v) => {
                const src = embedUrl(v);
                return (
                  <div key={v.id} className="overflow-hidden rounded-[3px] border border-line">
                    <div className="relative aspect-video bg-brand-700">
                      {src ? (
                        <iframe
                          src={src}
                          title={v.title ?? "Video"}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      ) : (
                        <a
                          href={v.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 grid place-items-center text-xs font-bold text-cream"
                        >
                          Buka video
                        </a>
                      )}
                      {v.isLive ? (
                        <span className="absolute left-2 top-2 z-10 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
                          ● LIVE
                        </span>
                      ) : null}
                    </div>
                    {v.title ? (
                      <div className="p-3">
                        <p className="text-sm font-semibold text-ink">{v.title}</p>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KANAN — tentang + tautan */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <AboutSection description={partner.description} />
          {partner.website ? (
            <div className="rounded-[3px] border border-line bg-surface p-5 shadow-[0_2px_10px_rgba(15,23,42,.06)]">
              <h2 className="mb-3 text-sm font-bold text-ink">Tautan</h2>
              <a
                href={partner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-700 hover:text-brand-600"
              >
                <Globe className="h-4 w-4" /> Kunjungi Website
              </a>
            </div>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}

function BusinessPartnerView({ partner }: { partner: BusinessPartnerDetail }) {
  const wa = partner.contactWa?.replace(/[^0-9]/g, "");
  const partnerWaHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        `Assalamu'alaikum, saya ingin bertanya tentang ${partner.name} di Blitar Mengaji.`,
      )}`
    : null;

  return (
    <Container className="py-10">
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* KIRI — produk */}
        <div className="space-y-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Store className="h-5 w-5 text-brand-600" /> Produk &amp; Lapak
          </h2>
          {partner.products.length === 0 ? (
            <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-cream py-12 text-center">
              <Store className="h-7 w-7 text-brand-600/50" />
              <p className="mt-2 text-sm font-semibold text-ink">Belum ada produk</p>
              <p className="text-xs text-muted">Partner usaha ini belum menampilkan produk.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {partner.products.map((product) => {
                const href = productWaHref(product, partner.name, partner.contactWa);
                return (
                  <div
                    key={product.id}
                    className="overflow-hidden rounded-[3px] border border-line bg-surface"
                  >
                    {product.posterImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.posterImage}
                        alt={product.title}
                        className="h-28 w-full object-cover"
                      />
                    ) : (
                      <div className="relative grid h-28 place-items-center overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500">
                        <div className="pat-girih-light absolute inset-0" />
                        <ImageIcon className="relative z-10 h-8 w-8 text-white/80" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <p className="line-clamp-2 text-xs font-bold leading-tight text-ink">
                        {product.title}
                      </p>
                      <p className="mt-0.5 text-sm font-extrabold text-brand-700">
                        {rupiah(product.price)}
                      </p>
                      {product.description ? (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted">
                          {product.description}
                        </p>
                      ) : null}
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 flex h-8 w-full items-center justify-center gap-1 rounded-full bg-green-600 text-[11px] font-bold text-white transition-colors hover:bg-green-700"
                        >
                          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                        </a>
                      ) : (
                        <span className="mt-2 flex h-8 w-full items-center justify-center rounded-full bg-black/5 text-[11px] font-bold text-muted">
                          Kontak belum tersedia
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* KANAN — tentang + kontak */}
        <aside className="space-y-5 lg:sticky lg:top-24">
          <AboutSection description={partner.description} />

          <div className="rounded-[3px] border border-line bg-surface p-5 shadow-[0_2px_10px_rgba(15,23,42,.06)]">
            <h2 className="mb-3 text-sm font-bold text-ink">Hubungi Usaha</h2>
            {partner.category ? (
              <div className="mb-3">
                <Badge tone="gold">{partner.category}</Badge>
              </div>
            ) : null}
            {partnerWaHref ? (
              <a
                href={partnerWaHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-green-600 text-sm font-bold text-white transition-colors hover:bg-green-700"
              >
                <MessageCircle className="h-4 w-4" /> Chat via WhatsApp
              </a>
            ) : (
              <p className="text-sm italic text-muted">Kontak WhatsApp belum tersedia.</p>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);
  if (!partner) notFound();

  return (
    <>
      <PartnerHeader partner={partner} />
      {partner.kind === "media" ? (
        <MediaPartnerView partner={partner} />
      ) : (
        <BusinessPartnerView partner={partner} />
      )}
    </>
  );
}
