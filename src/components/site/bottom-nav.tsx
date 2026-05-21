"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, CalendarDays, MessageCircle, User, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const items: { href: string; label: string; Icon: LucideIcon }[] = [
  { href: "/", label: "Beranda", Icon: Home },
  { href: "/peta", label: "Peta", Icon: Map },
  { href: "/jadwal", label: "Jadwal", Icon: CalendarDays },
  { href: "/tanya-ustadz", label: "Tanya", Icon: MessageCircle },
  { href: "/akun", label: "Akun", Icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden">
      <div className="mx-auto flex max-w-md justify-around py-2">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 text-[10px] font-semibold transition-colors",
                active ? "text-brand-600" : "text-muted",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
