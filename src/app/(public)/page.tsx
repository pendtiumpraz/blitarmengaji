import { and, count, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { OrnCard } from "@/components/ui/card";
import { OrnDivider } from "@/components/ui/orn-divider";
import { SectionHeading } from "@/components/ui/section-heading";

export const dynamic = "force-dynamic";

const pillars = [
  {
    title: "Majelis & Kajian",
    body: "Jadwal kajian rutin tiap titik dakwah, peta lokasi, rekaman & live streaming — temukan ilmu paling dekat denganmu.",
    icon: <path d="M8 14 C8 11 11 9 24 9 C37 9 40 11 40 14 L40 38 C40 35 37 33 24 33 C11 33 8 35 8 38 Z M24 9 L24 33" />,
  },
  {
    title: "Amanah & Transparan",
    body: "Laporan keuangan tiap masjid bisa diunduh PDF, donasi dengan progres & laporan penggunaan dana — setiap rupiah tertelusur.",
    icon: <path d="M24 6 L40 13 L24 20 L8 13 Z M12 16 L12 30 C12 33 17 36 24 36 C31 36 36 33 36 30 L36 16 M42 14 L42 26" />,
  },
  {
    title: "Tanya & Ukhuwah",
    body: "Tanya ustadz (boleh sebagai Hamba Allah), belajar di kelas online, dukung UMKM jamaah lewat lapak — tumbuh bersama.",
    icon: <path d="M24 40 C24 40 8 30 8 18 C8 12 12 8 17 8 C20 8 23 10 24 13 C25 10 28 8 31 8 C36 8 40 12 40 18 C40 30 24 40 24 40 Z" />,
  },
];

export default async function Home() {
  // Statistik NYATA dari DB (bukan dummy).
  const [titikC, kajianC, jamaahC] = await Promise.all([
    db.select({ c: count() }).from(schema.titikDakwah).where(and(eq(schema.titikDakwah.status, "active"), isNull(schema.titikDakwah.deletedAt))),
    db.select({ c: count() }).from(schema.kajian).where(and(eq(schema.kajian.status, "published"), isNull(schema.kajian.deletedAt))),
    db.select({ c: count() }).from(schema.users).where(isNull(schema.users.deletedAt)),
  ]);
  const stats: [string, string][] = [
    [String(titikC[0].c), "Titik Dakwah"],
    [String(kajianC[0].c), "Kajian Aktif"],
    [String(jamaahC[0].c), "Jamaah"],
  ];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <svg
          className="pointer-events-none absolute left-1/2 top-12 h-[560px] w-[560px] -translate-x-1/2 opacity-50"
          viewBox="0 0 480 560"
          fill="none"
          preserveAspectRatio="xMidYMin meet"
        >
          <path d="M40 560 L40 210 C40 96 150 44 240 32 C330 44 440 96 440 210 L440 560" stroke="#E6CC8A" strokeWidth="1.4" strokeOpacity=".7" />
          <path d="M70 560 L70 214 C70 116 162 72 240 62 C318 72 410 116 410 214 L410 560" stroke="#E6CC8A" strokeWidth="1" strokeOpacity=".4" />
        </svg>

        <Container className="relative z-10 pt-16 text-center">
          <p className="font-arabic mb-4 text-3xl text-gold-light" dir="rtl">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold-light/85">Assalamu&apos;alaikum · Kota Blitar</p>
          <h1 className="display mx-auto mt-4 max-w-[14ch] text-5xl leading-[1.05] text-[#FBF4E2] md:text-6xl">
            Menyalakan <em className="italic text-gold-light">Cahaya Ilmu</em> di Blitar Raya
          </h1>
          <p className="mx-auto mt-6 max-w-[54ch] text-[17px] leading-relaxed text-cream/80">
            Satu pintu untuk menemukan majelis ilmu terdekat, mengikuti kajian, membaca catatan, dan melihat amanah keuangan
            umat — terbuka & transparan untuk semua.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Button href="/peta" variant="gold" size="lg">
              Temukan Kajian Terdekat
            </Button>
            <Button
              href="/peta"
              size="lg"
              className="bg-transparent text-cream shadow-[inset_0_0_0_1.5px_rgba(230,204,138,.6)] hover:bg-gold-light/10"
            >
              Lihat Peta Dakwah
            </Button>
          </div>
          <div className="mt-12 flex justify-center gap-10 pb-5">
            {stats.map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="display text-3xl text-white">{n}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-gold-light/80">{l}</div>
              </div>
            ))}
          </div>
        </Container>

        <svg className="relative z-10 block h-20 w-full text-brand-900" viewBox="0 0 1200 84" preserveAspectRatio="none" fill="currentColor">
          <rect x="0" y="64" width="1200" height="20" />
          <rect x="150" y="20" width="12" height="46" /><circle cx="156" cy="18" r="9" />
          <rect x="250" y="40" width="120" height="26" /><path d="M250 40 Q310 4 370 40 Z" />
          <rect x="540" y="30" width="160" height="36" /><path d="M540 30 Q620 -28 700 30 Z" /><rect x="616" y="-6" width="7" height="16" /><circle cx="619.5" cy="-9" r="5" />
          <rect x="860" y="44" width="110" height="22" /><path d="M860 44 Q915 8 970 44 Z" />
          <rect x="1040" y="22" width="12" height="44" /><circle cx="1046" cy="20" r="9" />
        </svg>
      </section>

      <OrnDivider className="mt-16" />

      {/* PILLARS */}
      <Container className="pt-12">
        <SectionHeading
          eyebrow="Yang Kami Rawat"
          title="Ilmu, Amanah, & Ukhuwah"
          subtitle="Tiga pilar yang menjaga ruh platform ini — bukan sekadar aplikasi, tapi khidmat untuk umat."
          className="mb-10"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <OrnCard key={p.title} className="p-8 transition hover:-translate-y-1 hover:border-gold/50 hover:shadow-xl">
              <svg className="mb-4 h-12 w-12 text-brand-600" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {p.icon}
              </svg>
              <h3 className="display text-xl text-ink">{p.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{p.body}</p>
            </OrnCard>
          ))}
        </div>

        {/* CTA — Gabung & daftarkan lembaga */}
        <OrnCard className="mt-[72px] p-9 sm:p-12">
          <div className="grid items-center gap-8 md:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-dark">Untuk Pengelola &amp; Mitra</p>
              <h3 className="display mt-2.5 max-w-[22ch] text-3xl leading-tight text-brand-600 sm:text-4xl">
                Punya masjid, lembaga, atau usaha? Gabung &amp; daftarkan.
              </h3>
              <p className="mt-3.5 max-w-[52ch] text-[15px] leading-relaxed text-muted">
                Daftarkan titik dakwah, ajukan diri sebagai ustadz pengisi kajian, atau jadi partner & lapak UMKM jamaah —
                kelola jadwal, donasi, dan laporan keuangan dari satu pintu. Gratis untuk semua.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <Button href="/gabung" variant="gold" size="lg" className="w-full">
                Daftarkan Lembaga
              </Button>
              <Button href="/gabung" variant="outline" size="lg" className="w-full">
                Jadi Ustadz / Partner
              </Button>
            </div>
          </div>
        </OrnCard>

        {/* AYAT — original touch */}
        <div className="relative mt-[72px] mb-4 overflow-hidden rounded bg-brand-600 text-cream">
          <div className="pat-trellis-light absolute inset-0" />
          <div className="relative z-10 px-7 py-16 text-center">
            <svg className="mx-auto mb-4 h-16 w-28 text-gold-light" viewBox="0 0 120 64" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 64 L6 34 C6 14 38 6 60 4 C82 6 114 14 114 34 L114 64" />
            </svg>
            <p className="font-arabic text-4xl leading-[1.9] text-gold-light md:text-5xl" dir="rtl">
              وَقُل رَّبِّ زِدْنِي عِلْمًا
            </p>
            <p className="display mx-auto mt-4 max-w-[46ch] text-xl italic text-cream/95">
              &ldquo;Dan katakanlah: Ya Rabb-ku, tambahkanlah kepadaku ilmu.&rdquo;
            </p>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-gold-light/80">— QS. Thaha : 114</div>
          </div>
        </div>
      </Container>
    </>
  );
}
