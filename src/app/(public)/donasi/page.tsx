import Link from "next/link";
import { HandHeart, MapPin, ArrowRight, HeartHandshake, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { OrnCard } from "@/components/ui/card";
import { OrnDivider } from "@/components/ui/orn-divider";
import { SectionHeading } from "@/components/ui/section-heading";
import { listCampaigns } from "@/lib/queries/donasi";

export const dynamic = "force-dynamic";

export const metadata = { title: "Donasi" };

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default async function DonasiPage() {
  const campaigns = await listCampaigns();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <Container className="relative z-10 py-14 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-gold-light">
            <HandHeart className="h-3.5 w-3.5" /> Sedekah Jariyah
          </p>
          <h1 className="display mx-auto mt-4 max-w-[16ch] text-4xl leading-[1.08] text-[#FBF4E2] md:text-5xl">
            Salurkan <em className="italic text-gold-light">Kebaikan</em> untuk Umat Blitar Raya
          </h1>
          <p className="mx-auto mt-5 max-w-[54ch] text-[16px] leading-relaxed text-cream/80">
            Setiap rupiah tertelusur — lihat progres campaign dan laporan penggunaan dana yang terbuka. Pilih amanah
            yang ingin Anda dukung.
          </p>
        </Container>
      </section>

      <OrnDivider className="mt-14" />

      {/* DAFTAR CAMPAIGN */}
      <Container className="pb-20 pt-12">
        <SectionHeading
          eyebrow="Campaign Donasi"
          title="Amanah yang Membutuhkan Dukungan"
          subtitle="Donasi Anda dikelola tiap titik dakwah secara transparan, lengkap dengan laporan penggunaan dana."
          className="mb-10"
        />

        {campaigns.length === 0 ? (
          <OrnCard className="mx-auto max-w-xl px-8 py-14 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
              <HandHeart className="h-8 w-8" />
            </div>
            <h3 className="display mt-4 text-xl text-ink">Belum Ada Campaign Aktif</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Saat ini belum ada penggalangan dana yang dibuka. Pantau kembali halaman ini — insyaAllah amanah baru
              akan hadir dari titik dakwah di Blitar Raya.
            </p>
          </OrnCard>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((c) => {
              const collected = Number(c.collectedAmount ?? 0);
              const target = Number(c.targetAmount ?? 0);
              const pct = target > 0 ? Math.min(100, Math.round((collected / target) * 100)) : 0;
              const done = c.status === "completed" || c.status === "closed";
              return (
                <OrnCard key={c.id} className="flex flex-col overflow-hidden">
                  {/* poster */}
                  <div className="relative grid h-40 place-items-center overflow-hidden bg-brand-700">
                    <div className="pat-girih-light absolute inset-0" />
                    {c.posterImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.posterImage} alt={c.title} className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <HandHeart className="relative z-10 h-12 w-12 text-gold-light" />
                    )}
                    <div className="absolute left-3 top-3 z-10">
                      <Badge tone={done ? "success" : "warning"} className="bg-white/90">
                        <span className={`h-1.5 w-1.5 rounded-full ${done ? "bg-green-600" : "bg-amber-500"}`} />
                        {done ? "Selesai" : "Aktif"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      <MapPin className="h-3 w-3" /> {c.titikName ?? "Titik dakwah"}
                      {c.kecamatan ? ` · ${c.kecamatan}` : ""}
                    </p>
                    <h3 className="display mt-1.5 text-lg leading-tight text-ink">{c.title}</h3>

                    {/* progress */}
                    <div className="mt-4">
                      <div className="h-2.5 overflow-hidden rounded-full bg-brand-50">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="mt-1.5 flex items-baseline justify-between text-xs">
                        <span className="font-bold text-brand-700">{rupiah(collected)}</span>
                        <span className="font-bold text-gold-dark">{pct}%</span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        {target > 0 ? `dari ${rupiah(target)} target` : "tanpa target nominal"}
                      </p>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {done
                          ? "Telah selesai"
                          : c.endAt
                            ? `Sampai ${c.endAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                            : "Donasi terbuka"}
                      </span>
                    </div>

                    <Link
                      href={`/donasi/${c.slug}`}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-gold px-5 text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light"
                    >
                      {done ? "Lihat Laporan" : "Donasi"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </OrnCard>
              );
            })}
          </div>
        )}

        {/* AJAKAN */}
        <div className="relative mt-14 overflow-hidden rounded-[3px] bg-brand-600 text-cream">
          <div className="pat-trellis-light absolute inset-0" />
          <div className="relative z-10 flex flex-col items-center gap-3 px-7 py-12 text-center">
            <HeartHandshake className="h-10 w-10 text-gold-light" />
            <p className="font-arabic text-3xl leading-relaxed text-gold-light" dir="rtl">
              مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا
            </p>
            <p className="display max-w-[46ch] text-lg italic text-cream/95">
              &ldquo;Siapakah yang mau memberi pinjaman kepada Allah, pinjaman yang baik?&rdquo;
            </p>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-light/80">— QS. Al-Baqarah : 245</p>
          </div>
        </div>
      </Container>
    </>
  );
}
