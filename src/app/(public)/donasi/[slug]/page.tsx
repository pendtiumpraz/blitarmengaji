import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  HandHeart,
  MapPin,
  Clock,
  ChevronLeft,
  ReceiptText,
  Paperclip,
  ShieldCheck,
  FileDown,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { OrnCard } from "@/components/ui/card";
import { getCampaignBySlug, listUpdates } from "@/lib/queries/donasi";
import { DonateReveal } from "./payment-box";
import { KonfirmasiForm } from "@/components/donasi/konfirmasi-form";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Tidak ditemukan" };

  const description =
    campaign.description ??
    `Dukung campaign donasi "${campaign.title}" untuk umat Blitar Raya.`;

  return {
    title: campaign.title,
    description,
    openGraph: {
      title: campaign.title,
      description,
      ...(campaign.posterImage ? { images: [campaign.posterImage] } : {}),
    },
  };
}

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const tanggal = (d: Date) =>
  d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ konfirmasi?: string }>;
}) {
  const { slug } = await params;
  const { konfirmasi } = await searchParams;
  const confirmed = konfirmasi === "ok";
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const updates = await listUpdates(campaign.id);

  const collected = Number(campaign.collectedAmount ?? 0);
  const target = Number(campaign.targetAmount ?? 0);
  const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
  const done = campaign.status === "completed" || campaign.status === "closed";
  const lokasi = [campaign.titikName, campaign.kecamatan].filter(Boolean).join(" · ");
  const paragraphs = (campaign.description ?? "").split(/\n{2,}|\n/).filter((p) => p.trim() !== "");

  return (
    <Container className="py-8 sm:py-10">
      {/* breadcrumb / back */}
      <Link
        href="/donasi"
        className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-600"
      >
        <ChevronLeft className="h-4 w-4" /> Kembali ke Donasi
      </Link>

      <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* KIRI: poster + progress + deskripsi */}
        <div className="space-y-6">
          {/* poster */}
          <div className="relative grid h-56 place-items-center overflow-hidden rounded-[3px] border border-line bg-brand-700 sm:h-72">
            <div className="pat-girih-light absolute inset-0" />
            {campaign.posterImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={campaign.posterImage}
                alt={campaign.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <HandHeart className="relative z-10 h-16 w-16 text-gold-light" />
            )}
            <div className="absolute left-4 top-4 z-10">
              <Badge tone={done ? "success" : "warning"} className="bg-white/90">
                <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-green-600" : "bg-amber-500"}`} />
                {done ? "Selesai" : "Aktif"}
              </Badge>
            </div>
          </div>

          {/* judul + lokasi */}
          <div>
            <p className="flex items-center gap-1 text-sm text-muted">
              <MapPin className="h-3.5 w-3.5" /> {lokasi || "Titik dakwah"}
            </p>
            <h1 className="display mt-1.5 text-3xl leading-tight text-ink sm:text-4xl">{campaign.title}</h1>
          </div>

          {/* progress besar */}
          <div className="rounded-[3px] border border-line bg-surface p-5">
            <div className="flex items-end justify-between">
              <div>
                <p className="display text-2xl text-brand-700 sm:text-3xl">{rupiah(collected)}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {target > 0 ? `terkumpul dari ${rupiah(target)}` : "terkumpul (tanpa target nominal)"}
                </p>
              </div>
              <span className="display text-2xl text-gold-dark">{pct}%</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-brand-50">
              <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />{" "}
                {done ? "Telah selesai" : campaign.endAt ? `Sampai ${tanggal(campaign.endAt)}` : "Donasi terbuka"}
              </span>
            </div>
          </div>

          {/* deskripsi */}
          <div className="space-y-3">
            <h2 className="display text-xl text-brand-600">Tentang Campaign Ini</h2>
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-muted">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-[15px] leading-relaxed text-muted">
                Belum ada deskripsi untuk campaign ini.
              </p>
            )}
          </div>
        </div>

        {/* KANAN: aksi donasi + pembayaran */}
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          {confirmed && (
            <div className="flex items-start gap-3 rounded-[3px] border border-green-200 bg-green-50 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="text-sm font-bold text-green-800">Konfirmasi terkirim. Jazakumullah khairan!</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-green-900">
                  Donasi Anda kami catat dan akan diverifikasi pengelola. Semoga menjadi amal jariyah.
                </p>
              </div>
            </div>
          )}

          <OrnCard className="p-5">
            <h2 className="display text-xl text-ink">Dukung Sekarang</h2>
            <p className="mt-1 text-sm text-muted">
              Pilih nominal, bayar via QRIS, lalu konfirmasi lewat WhatsApp.
            </p>
            <div className="mt-4">
              <DonateReveal
                campaignTitle={campaign.title}
                titik={campaign.titikName ?? "Titik dakwah"}
                qrisImage={campaign.qrisImage}
                contactLink={campaign.contactLink ?? campaign.titikContactPhone}
              />
            </div>
          </OrnCard>

          <KonfirmasiForm campaignId={campaign.id} />
        </aside>
      </div>

      {/* LAPORAN PENGGUNAAN DANA */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <ReceiptText className="h-5 w-5 text-brand-600" />
          <h2 className="display text-2xl text-brand-600">Laporan Penggunaan Dana</h2>
        </div>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <ShieldCheck className="h-4 w-4 text-brand-600" /> Setiap rupiah tertelusur dan dilaporkan secara terbuka.
        </p>

        <a
          href={`/api/laporan/donasi/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-gold px-5 text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light"
        >
          <FileDown className="h-4 w-4" /> Unduh Laporan PDF
        </a>

        {updates.length === 0 ? (
          <OrnCard className="mt-6 px-6 py-10 text-center">
            <p className="text-sm text-muted">
              Belum ada laporan penggunaan dana. Laporan akan tampil di sini begitu pengelola mencatatnya.
            </p>
          </OrnCard>
        ) : (
          <div className="mt-6 space-y-3">
            {updates.map((r, i) => {
              const last = i === updates.length - 1;
              return (
                <div key={r.id} className="flex gap-3">
                  {/* timeline rail */}
                  <div className="flex flex-col items-center pt-1.5">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
                    {!last && <span className="my-1 w-px flex-1 bg-line" />}
                  </div>
                  <OrnCard className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-ink">{r.title}</p>
                      {r.amountUsed ? (
                        <span className="shrink-0 text-sm font-extrabold text-red-500">
                          - {rupiah(Number(r.amountUsed))}
                        </span>
                      ) : null}
                    </div>
                    {r.body ? <p className="mt-1 text-[13px] leading-relaxed text-muted">{r.body}</p> : null}
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                      {tanggal(r.createdAt)}
                      {r.attachmentUrl && (
                        <a
                          href={r.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-600"
                        >
                          · <Paperclip className="h-3 w-3" /> nota terlampir
                        </a>
                      )}
                    </p>
                  </OrnCard>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </Container>
  );
}
