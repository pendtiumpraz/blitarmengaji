"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Crest } from "@/components/Crest";
import { adminMenu } from "@/lib/admin-menu";
import { cn } from "@/lib/cn";

/** Hamburger + drawer menu admin untuk layar kecil (sidebar desktop disembunyikan < md). */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Tutup otomatis saat pindah halaman.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Kunci scroll body saat drawer terbuka.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const sections = Array.from(new Set(adminMenu.map((m) => m.section ?? "Menu")));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className="grid h-9 w-9 place-items-center rounded-sm text-ink hover:bg-cream md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="pat-girih-light absolute left-0 top-0 h-full w-72 max-w-[82vw] overflow-y-auto bg-brand-900 text-white shadow-2xl">
            <div className="relative z-10 p-4">
              <div className="mb-6 flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-2.5">
                  <Crest className="h-9 w-9" />
                  <span className="leading-none">
                    <p className="font-kufi text-sm">Blitar Mengaji</p>
                    <p className="text-[10px] text-white/50">Admin Panel</p>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Tutup menu"
                  className="grid h-8 w-8 place-items-center rounded-sm text-white/70 hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {sections.map((section) => (
                <div key={section} className="mb-3">
                  <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-white/30">{section}</p>
                  <nav className="space-y-1 text-sm">
                    {adminMenu
                      .filter((m) => (m.section ?? "Menu") === section)
                      .map((m) => {
                        const active = m.href === "/admin" ? pathname === "/admin" : pathname.startsWith(m.href);
                        const Icon = m.icon;
                        return (
                          <Link
                            key={m.href}
                            href={m.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                              active ? "bg-brand-600 font-semibold text-white" : "text-white/70 hover:bg-white/5",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {m.label}
                          </Link>
                        );
                      })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
