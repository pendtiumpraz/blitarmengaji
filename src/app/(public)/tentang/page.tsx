import type { Metadata } from "next";
import { BookOpen, HandCoins, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { OrnCard } from "@/components/ui/card";
import { OrnDivider } from "@/components/ui/orn-divider";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata: Metadata = {
  title: "Tentang — Blitar Mengaji",
  description:
    "Visi, misi, dan nilai Blitar Mengaji: satu pintu untuk menemukan majelis ilmu, belajar, bertanya, dan melihat transparansi keuangan dakwah se-Blitar Raya.",
};

// Ringkasan misi dari docs/BLITAR-MENGAJI-BRAINSTORM.md §1.
const misi = [
  "Memudahkan jamaah menemukan kajian terdekat lewat peta & jadwal real-time.",
  "Menjaga transparansi keuangan dakwah yang bisa diunduh siapa saja (PDF).",
  "Mengarsipkan ilmu: transcript kajian, catatan, perpustakaan, & rekaman.",
  "Menghubungkan jamaah dengan ustadz lewat Tanya Ustadz & Asisten AI.",
  "Memberdayakan partner usaha & media partner lokal.",
];

const nilai = [
  {
    title: "Ilmu",
    body: "Mengarsipkan dan menyebarkan ilmu — catatan kajian, perpustakaan, kelas, hingga asisten AI yang menjawab dari konten.",
    icon: <BookOpen className="h-7 w-7" />,
  },
  {
    title: "Amanah",
    body: "Keuangan dakwah terbuka & tertelusur. Laporan bisa diunduh PDF, donasi disertai progres dan laporan penggunaan dana.",
    icon: <HandCoins className="h-7 w-7" />,
  },
  {
    title: "Ukhuwah",
    body: "Mempertemukan jamaah, ustadz, titik dakwah, dan partner — tumbuh bersama dalam satu ruang yang gratis untuk semua.",
    icon: <Users className="h-7 w-7" />,
  },
];

export default function TentangPage() {
  return (
    <>
      {/* HERO KECIL */}
      <section className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <Container className="relative z-10 py-16 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-light/85">
            Tentang Kami
          </p>
          <h1 className="display mx-auto mt-3 max-w-[18ch] text-4xl leading-[1.08] text-[#FBF4E2] md:text-5xl">
            Khidmat Digital untuk{" "}
            <em className="italic text-gold-light">Dakwah Blitar Raya</em>
          </h1>
          <p className="mx-auto mt-5 max-w-[56ch] text-[16px] leading-relaxed text-cream/80">
            Blitar Mengaji bukan sekadar aplikasi, tapi ikhtiar merawat ilmu, amanah,
            dan ukhuwah umat dalam satu pintu yang terbuka untuk semua.
          </p>
        </Container>
      </section>

      <OrnDivider className="mt-16" />

      {/* VISI & MISI */}
      <Container className="pt-12">
        <div className="grid gap-6 md:grid-cols-2">
          <OrnCard className="p-8">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-dark">Visi</p>
            <p className="display mt-3 text-2xl leading-snug text-ink">
              Menjadi pusat informasi kajian &amp; dakwah digital terpadu se-Blitar.
            </p>
            <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
              Satu pintu untuk menemukan majelis ilmu, belajar, bertanya, dan melihat
              transparansi keuangan dakwah.
            </p>
          </OrnCard>

          <OrnCard className="p-8">
            <p className="text-xs font-bold uppercase tracking-[0.26em] text-gold-dark">Misi</p>
            <ul className="mt-4 space-y-3">
              {misi.map((m) => (
                <li key={m} className="flex gap-3 text-[14.5px] leading-relaxed text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 flex-none rotate-45 bg-gold" aria-hidden />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </OrnCard>
        </div>
      </Container>

      {/* NILAI / PILAR */}
      <Container className="pt-16">
        <SectionHeading
          eyebrow="Yang Kami Rawat"
          title="Tiga Pilar Khidmat"
          subtitle="Nilai yang menjaga ruh platform — bukan teknologi semata, tapi adab terhadap ilmu dan umat."
          className="mb-10"
        />
        <div className="grid gap-5 md:grid-cols-3">
          {nilai.map((n) => (
            <OrnCard key={n.title} className="p-8">
              <div className="mb-4 text-brand-600">{n.icon}</div>
              <h3 className="display text-xl text-ink">{n.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">{n.body}</p>
            </OrnCard>
          ))}
        </div>

        {/* AYAT */}
        <div className="relative mt-[72px] overflow-hidden rounded bg-brand-600 text-cream">
          <div className="pat-trellis-light absolute inset-0" />
          <div className="relative z-10 px-7 py-14 text-center">
            <p className="font-arabic text-4xl leading-[1.9] text-gold-light md:text-5xl" dir="rtl">
              إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ
            </p>
            <p className="display mx-auto mt-4 max-w-[48ch] text-xl italic text-cream/95">
              &ldquo;Sesungguhnya yang takut kepada Allah di antara hamba-hamba-Nya
              hanyalah para ulama.&rdquo;
            </p>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-gold-light/80">
              — QS. Fathir : 28
            </div>
          </div>
        </div>
      </Container>

      {/* CTA */}
      <Container className="py-16">
        <OrnCard className="p-10 text-center">
          <Heart className="mx-auto mb-3 h-8 w-8 text-gold" />
          <h2 className="display text-2xl text-ink sm:text-3xl">
            Mari Rawat Cahaya Ilmu Bersama
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] leading-relaxed text-muted">
            Temukan kajian terdekat, ikuti majelis ilmu, dan jadilah bagian dari
            ukhuwah dakwah Blitar Raya.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-4">
            <Button href="/peta" variant="gold" size="lg">
              Temukan Kajian Terdekat
            </Button>
            <Button href="/tanya-ai" variant="outline" size="lg">
              Tanya Asisten Kajian
            </Button>
          </div>
        </OrnCard>
      </Container>
    </>
  );
}
