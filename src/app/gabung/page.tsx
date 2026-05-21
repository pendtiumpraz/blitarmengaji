import Link from "next/link";
import { MapPin, BookOpen, Radio, Store, ArrowRight, ClipboardCheck, ShieldCheck, LayoutDashboard } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";

// Hub pilihan peran. force-dynamic karena di belakang guard sesi (auth).
export const dynamic = "force-dynamic";

type Role = {
  href: string;
  title: string;
  desc: string;
  icon: typeof MapPin;
};

const roles: Role[] = [
  {
    href: "/gabung/titik",
    title: "Pengelola Titik",
    desc: "Daftarkan masjid, mushola, atau majelis taklim agar tampil di peta & jadwal kajian.",
    icon: MapPin,
  },
  {
    href: "/gabung/ustadz",
    title: "Ustadz",
    desc: "Bagikan profil, jawab pertanyaan jamaah, isi perpustakaan, dan ajar kelas online.",
    icon: BookOpen,
  },
  {
    href: "/gabung/media-partner",
    title: "Media Partner",
    desc: "Tampilkan profil media dakwah, embed video kajian, dan livestream majelis.",
    icon: Radio,
  },
  {
    href: "/gabung/partner-usaha",
    title: "Partner Usaha",
    desc: "Promosikan usaha di lapak komunitas dan dukung kegiatan dakwah Blitar Raya.",
    icon: Store,
  },
];

const steps = [
  { icon: ClipboardCheck, title: "Ajukan", desc: "Isi formulir sesuai peran yang dipilih." },
  { icon: ShieldCheck, title: "Verifikasi admin", desc: "Tim kami meninjau & memverifikasi data Anda." },
  { icon: LayoutDashboard, title: "Akses dashboard", desc: "Setelah disetujui, kelola dari dashboard." },
];

export default function GabungPage() {
  return (
    <div className="space-y-10">
      <SectionHeading
        align="left"
        eyebrow="Pendaftaran Mandiri"
        title="Pilih peran Anda"
        subtitle="Setiap pengajuan ditinjau admin sebelum aktif. Pilih salah satu peran di bawah untuk memulai."
      />

      {/* Kartu pilihan peran */}
      <div className="grid gap-4 sm:grid-cols-2">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Link key={role.href} href={role.href} className="group">
              <Card className="flex h-full items-start gap-4 p-5 transition-colors hover:border-brand-600">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
                  <Icon className="h-6 w-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="display text-lg text-ink">{role.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{role.desc}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 group-hover:gap-2.5">
                    Mulai daftar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Alur singkat: ajukan -> verifikasi admin -> akses dashboard */}
      <section>
        <h2 className="display text-xl text-brand-600">Bagaimana alurnya?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-gold/20 text-gold-dark">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-gold-dark">
                    Langkah {i + 1}
                  </span>
                </div>
                <h3 className="display mt-3 text-base text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
