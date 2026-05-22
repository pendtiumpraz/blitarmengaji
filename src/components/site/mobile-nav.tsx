"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Crest } from "@/components/Crest";
import { cn } from "@/lib/cn";

/** Hamburger + drawer navigasi untuk layar < lg (menu utama disembunyikan di mobile). */
export function SiteMobileNav({ nav }: { nav: [string, string][] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu"
        className="grid h-10 w-10 place-items-center rounded-sm text-ink hover:bg-brand-50 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && typeof document !== "undefined" ? createPortal(
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute right-0 top-0 h-full w-72 max-w-[82vw] overflow-y-auto bg-cream shadow-2xl">
            <div className="flex items-center justify-between border-b border-line p-4">
              <span className="flex items-center gap-2">
                <Crest className="h-8 w-8" />
                <b className="font-kufi text-brand-600">Blitar Mengaji</b>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="grid h-9 w-9 place-items-center rounded-sm text-muted hover:bg-brand-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col p-2 text-sm font-semibold">
              {nav.map(([label, href]) => {
                const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "rounded-sm px-4 py-3 transition-colors",
                      active ? "bg-brand-50 text-brand-700" : "text-ink/80 hover:bg-brand-50",
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link href="/masuk" className="mt-2 rounded-sm bg-brand-600 px-4 py-3 text-center text-white">
                Masuk
              </Link>
            </nav>
          </aside>
        </div>,
          document.body,
        )
        : null}
    </>
  );
}
