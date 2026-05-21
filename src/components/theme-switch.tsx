"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Palette, Check } from "lucide-react";
import { setTheme } from "@/lib/actions/theme";
import { cn } from "@/lib/cn";

export type ThemeOption = { slug: string; name: string };

/**
 * Theme switcher (client) — dropdown daftar tema aktif.
 * - Sumber kebenaran SSR tetap cookie 'theme' (di-set oleh action setTheme).
 * - Untuk respons instan: set document.documentElement.dataset.theme dulu,
 *   lalu panggil server action + router.refresh() agar SSR sinkron.
 * - Craft & theme-aware: pakai token warna craft (surface, line, brand, ink).
 */
export function ThemeSwitch({
  themes,
  current,
}: {
  themes: ThemeOption[];
  current: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(current);
  const [, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  // Jaga selama prop current berubah dari server (mis. setelah refresh).
  useEffect(() => {
    setSelected(current);
  }, [current]);

  // Tutup saat klik di luar atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(slug: string) {
    setOpen(false);
    if (slug === selected) return;
    const prev = selected;
    setSelected(slug);
    // Instan (tanpa flash) — terapkan ke <html> dulu.
    document.documentElement.dataset.theme = slug;
    startTransition(async () => {
      try {
        await setTheme(slug);
        router.refresh();
      } catch {
        // Rollback bila gagal menyimpan.
        document.documentElement.dataset.theme = prev;
        setSelected(prev);
      }
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Ganti tema"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-sm text-muted transition-colors hover:bg-cream hover:text-ink"
      >
        <Palette className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-md border border-line bg-surface shadow-lg"
        >
          <div className="border-b border-line px-3 py-2 font-display text-xs font-semibold uppercase tracking-wide text-muted">
            Pilih Tema
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {themes.map((t) => {
              const active = t.slug === selected;
              return (
                <li key={t.slug}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => choose(t.slug)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-cream",
                      active ? "font-semibold text-brand-600" : "text-ink",
                    )}
                  >
                    <span>{t.name}</span>
                    {active && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
