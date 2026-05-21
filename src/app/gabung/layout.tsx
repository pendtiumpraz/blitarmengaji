import Link from "next/link";
import { redirect } from "next/navigation";
import { Crest } from "@/components/Crest";
import { Container } from "@/components/ui/container";
import { auth } from "@/lib/auth";

/**
 * Layout publik sederhana (craft) untuk hub PENDAFTARAN MANDIRI /gabung.
 * Guard ringan: WAJIB login (bukan requirePermission admin) — jamaah mana pun
 * boleh mengajukan diri jadi pengelola/ustadz/partner. Verifikasi oleh admin.
 */
export default async function GabungLayout({ children }: { children: React.ReactNode }) {
  const s = await auth();
  if (!s?.user?.id) redirect("/masuk");

  const nav = [
    { href: "/gabung/titik", label: "Titik Dakwah" },
    { href: "/gabung/ustadz", label: "Ustadz" },
    { href: "/gabung/media-partner", label: "Media Partner" },
    { href: "/gabung/partner-usaha", label: "Partner Usaha" },
  ];

  return (
    <div className="flex flex-1 flex-col bg-cream">
      {/* Header brand ber-ornamen */}
      <header className="relative overflow-hidden bg-brand-600 text-cream">
        <div className="pat-girih-light absolute inset-0" />
        <Container className="relative z-10 py-7">
          <Link href="/gabung" className="flex items-center gap-3">
            <Crest className="h-10 w-10" />
            <span className="display text-xl text-[#FBF4E2]">Gabung Blitar Mengaji</span>
          </Link>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-cream/80">
            Daftarkan diri sebagai bagian dari ekosistem dakwah Blitar Raya. Ajukan, lalu tim kami
            verifikasi sebelum akses dashboard dibuka.
          </p>

          {/* Nav ke sub-form (sub-halaman selain titik dibuat agent lain) */}
          <nav className="mt-5 flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-sm border border-cream/25 bg-cream/10 px-3.5 py-1.5 text-xs font-bold tracking-[0.01em] text-cream transition-colors hover:bg-cream/20"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </Container>
      </header>

      <main className="flex-1">
        <Container className="py-8 sm:py-10">{children}</Container>
      </main>

      <footer className="border-t border-line bg-surface">
        <Container className="flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-muted">
          <span>Blitar Mengaji · Majelis Ilmu Blitar Raya</span>
          <Link href="/akun" className="font-bold text-brand-700 hover:underline">
            Kembali ke Akun
          </Link>
        </Container>
      </footer>
    </div>
  );
}
