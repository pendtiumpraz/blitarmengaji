import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Images,
  Video,
  Store,
  CalendarPlus,
  Radio,
  Wallet,
  HandHeart,
  Bell,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserPermissions } from "@/lib/rbac";
import { logoutAction } from "@/lib/actions/auth";
import { Crest } from "@/components/Crest";

/**
 * LAYOUT Dashboard Pengelola Entitas (route /kelola).
 * Persona self-service (manage_own): pengelola titik, media partner, partner usaha.
 * Guard: harus login + minimal salah satu permission pengelola entitas.
 * Halaman galeri/video/lapak/event dibuat agent lain — di sini hanya tautan.
 */

type NavItem = { label: string; href: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/kelola", icon: LayoutDashboard },
  { label: "Jadwal Kajian", href: "/kelola/jadwal", icon: CalendarDays },
  { label: "Galeri", href: "/kelola/galeri", icon: Images },
  { label: "Video / Livestream", href: "/kelola/video", icon: Video },
  { label: "Lapak", href: "/kelola/lapak", icon: Store },
  { label: "Event", href: "/kelola/event", icon: CalendarPlus },
  { label: "Keuangan", href: "/kelola/keuangan", icon: Wallet },
  { label: "Donasi", href: "/kelola/donasi", icon: HandHeart },
  { label: "Media Partner", href: "/kelola/media-partner", icon: Radio },
];

export default async function KelolaLayout({ children }: { children: React.ReactNode }) {
  const s = await auth();
  if (!s?.user?.id) redirect("/masuk");

  const perms = await getUserPermissions(s.user.id);
  if (
    !perms.includes("*") &&
    !perms.includes("titik.manage_own") &&
    !perms.includes("media.manage_own") &&
    !perms.includes("partner.manage_own") &&
    !perms.includes("lapak.manage_own") &&
    !perms.includes("jadwal.manage")
  ) {
    redirect("/");
  }

  const userName = s.user.name ?? "Pengelola";
  const initial = userName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar konteks entitas (menu manage_own) */}
      <aside className="relative hidden w-60 shrink-0 overflow-hidden bg-brand-900 text-white md:block">
        <div className="pat-girih-light absolute inset-0" />
        <div className="relative z-10 p-4">
          <Link href="/kelola" className="mb-6 flex items-center gap-2.5">
            <Crest className="h-9 w-9" />
            <span className="leading-none">
              <p className="font-kufi text-sm">Blitar Mengaji</p>
              <p className="text-[10px] text-white/50">Panel Pengelola</p>
            </span>
          </Link>

          <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/30">
            Kelola Milik Saya
          </p>
          <nav className="space-y-1 text-sm">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Area utama */}
      <div className="flex min-w-0 flex-1 flex-col bg-cream">
        {/* Topbar */}
        <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
          {/* Navigasi ringkas untuk layar kecil (sidebar tersembunyi di mobile) */}
          <nav className="flex items-center gap-1 overflow-x-auto md:hidden">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-sm text-muted hover:bg-brand-50 hover:text-brand-700"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              );
            })}
          </nav>
          <p className="hidden font-kufi text-sm text-ink md:block">Dashboard Pengelola Entitas</p>

          <div className="flex items-center gap-4">
            <span aria-hidden className="relative text-muted">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold" />
            </span>
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">
                {initial}
              </div>
              <span className="hidden text-sm font-semibold text-ink sm:inline">{userName}</span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                title="Keluar"
                className="flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm font-semibold text-muted hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
