"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageCircleQuestion,
  NotebookPen,
  FileText,
  GraduationCap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Crest } from "@/components/Crest";
import { cn } from "@/lib/cn";

type NavItem = { href: string; label: string; icon: LucideIcon };

const items: NavItem[] = [
  { href: "/ustadz", label: "Dashboard", icon: LayoutDashboard },
  { href: "/ustadz/jawab", label: "Jawab Tanya", icon: MessageCircleQuestion },
  { href: "/ustadz/catatan", label: "Catatan", icon: NotebookPen },
  { href: "/ustadz/pustaka", label: "Pustaka", icon: FileText },
  { href: "/ustadz/kelas", label: "Kelas", icon: GraduationCap },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/ustadz" ? pathname === "/ustadz" : pathname.startsWith(href);
}

/** Sidebar navigasi dashboard ustadz (desktop). */
export function UstadzSidebar() {
  const pathname = usePathname();
  return (
    <aside className="relative hidden w-60 shrink-0 overflow-hidden bg-brand-900 text-white md:block">
      <div className="pat-girih-light absolute inset-0" />
      <div className="relative z-10 p-4">
        <Link href="/ustadz" className="mb-6 flex items-center gap-2.5">
          <Crest className="h-9 w-9" />
          <span className="leading-none">
            <p className="font-kufi text-sm">Blitar Mengaji</p>
            <p className="text-[10px] text-white/50">Ruang Ustadz</p>
          </span>
        </Link>

        <nav className="space-y-1 text-sm">
          {items.map((m) => {
            const active = isActive(pathname, m.href);
            const Icon = m.icon;
            return (
              <Link
                key={m.href}
                href={m.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                  active
                    ? "bg-brand-600 font-semibold text-white"
                    : "text-white/70 hover:bg-white/5",
                )}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

/** Navigasi ringkas untuk layar kecil (mobile topbar). */
export function UstadzMobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-line bg-surface px-3 py-2 md:hidden">
      {items.map((m) => {
        const active = isActive(pathname, m.href);
        const Icon = m.icon;
        return (
          <Link
            key={m.href}
            href={m.href}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
              active ? "bg-brand-600 text-white" : "text-muted hover:bg-brand-50",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {m.label}
          </Link>
        );
      })}
    </nav>
  );
}
