"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Crest } from "@/components/Crest";
import { adminMenu } from "@/lib/admin-menu";
import { cn } from "@/lib/cn";

export function AdminSidebar() {
  const pathname = usePathname();
  const sections = Array.from(new Set(adminMenu.map((m) => m.section ?? "Menu")));

  return (
    <aside className="relative hidden w-60 shrink-0 overflow-hidden bg-brand-900 text-white md:block">
      <div className="pat-girih-light absolute inset-0" />
      <div className="relative z-10 p-4">
        <Link href="/admin" className="mb-6 flex items-center gap-2.5">
          <Crest className="h-9 w-9" />
          <span className="leading-none">
            <p className="font-kufi text-sm">Blitar Mengaji</p>
            <p className="text-[10px] text-white/50">Admin Panel</p>
          </span>
        </Link>

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
  );
}
