import Link from "next/link";
import { cookies } from "next/headers";
import { Crest } from "@/components/Crest";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ThemeSwitch } from "@/components/theme-switch";
import { NotifBell } from "@/components/site/notif-bell";
import { SiteMobileNav } from "@/components/site/mobile-nav";
import { listActiveThemes } from "@/lib/queries/themes";

const nav: [string, string][] = [
  ["Beranda", "/"],
  ["Kajian", "/kajian"],
  ["Peta", "/peta"],
  ["Catatan", "/catatan"],
  ["Donasi", "/donasi"],
  ["Pustaka", "/perpustakaan"],
  ["Gabung", "/gabung"],
];

export async function PublicHeader() {
  // Tema aktif dari DB (NYATA) + pilihan saat ini dari cookie 'theme' (fallback 'teduh').
  const themes = await listActiveThemes();
  const cookieStore = await cookies();
  const current = cookieStore.get("theme")?.value ?? "teduh";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-cream/85 backdrop-blur">
      <Container className="flex h-[72px] items-center gap-6">
        <Link href="/" className="flex items-center gap-3">
          <Crest className="h-10 w-10" />
          <span className="leading-none">
            <b className="font-kufi block text-[18px] tracking-wide text-brand-600">Blitar Mengaji</b>
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Majelis Ilmu Blitar Raya</span>
          </span>
        </Link>
        <nav aria-label="Navigasi utama" className="ml-auto hidden gap-7 text-[13px] font-semibold uppercase tracking-wide text-ink/70 lg:flex">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="py-1 transition-colors hover:text-brand-600">
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <NotifBell />
          <ThemeSwitch themes={themes} current={current} />
          <Button href="/masuk" size="sm" className="hidden sm:inline-flex">
            Masuk
          </Button>
          <SiteMobileNav nav={nav} />
        </div>
      </Container>
    </header>
  );
}
