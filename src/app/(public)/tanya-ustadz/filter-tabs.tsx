"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

const TABS = [
  { value: "all", label: "Semua" },
  { value: "pending", label: "Belum dijawab" },
  { value: "answered", label: "Terjawab" },
] as const;

/** Tab filter kecil (client) — navigasi via query string ?filter=. */
export function FilterTabs({ active }: { active: string }) {
  return (
    <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
      {TABS.map((t) => {
        const isActive = active === t.value || (t.value === "all" && active === "");
        const href = t.value === "all" ? "/tanya-ustadz" : `/tanya-ustadz?filter=${t.value}`;
        return (
          <Link
            key={t.value}
            href={href}
            scroll={false}
            className={cn(
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
              isActive
                ? "bg-brand-600 text-white"
                : "border border-line bg-surface text-ink hover:bg-brand-50",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
