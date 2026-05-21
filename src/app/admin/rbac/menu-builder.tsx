"use client";

import {
  BookOpen,
  BookOpenText,
  CalendarDays,
  CircleDot,
  CornerDownRight,
  GripVertical,
  HandHeart,
  HeartHandshake,
  Info,
  LayoutDashboard,
  ListTree,
  MapPin,
  MessageCircleQuestion,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { MenuItemRow } from "@/lib/queries/rbac";

/** Pemetaan nama ikon (string dari DB) → komponen Lucide. Fallback CircleDot. */
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  BookOpen,
  BookOpenText,
  CalendarDays,
  MapPin,
  Wallet,
  HandHeart,
  HeartHandshake,
  MessageCircleQuestion,
  ShieldCheck,
  Users,
  Settings,
  ListTree,
};

/** Render ikon menu berdasarkan nama dari DB (fallback CircleDot). */
function MenuIcon({ name, className }: { name: string | null; className?: string }) {
  const Glyph: LucideIcon = (name && ICONS[name]) || CircleDot;
  return <Glyph className={className} />;
}

/** Switch tampilan-saja (reorder/aktif = placeholder, belum disimpan). */
function Switch({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      aria-label={label}
      title="Aktif/nonaktif (segera hadir)"
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full",
        on ? "bg-brand-600" : "bg-black/15",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          on ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </span>
  );
}

function MenuRow({ node, isChild }: { node: MenuItemRow; isChild?: boolean }) {
  return (
    <div
      className={cn(
        "grid grid-cols-[28px_1fr] items-center gap-3 rounded-sm px-3 py-2.5 md:grid-cols-[28px_1fr_1.3fr_1.5fr_70px]",
        isChild ? "ml-8 border-l-2 border-brand-200 bg-surface" : "bg-brand-50/50",
        !node.isActive && "opacity-60",
      )}
    >
      {/* Drag handle (placeholder reorder) */}
      <span
        className="cursor-grab text-muted/60"
        title="Seret untuk mengurutkan (segera hadir)"
        aria-label="Seret untuk mengurutkan"
      >
        <GripVertical className="h-5 w-5" />
      </span>

      {/* Label + icon */}
      <span className={cn("flex items-center gap-2", isChild ? "text-sm" : "font-bold text-ink")}>
        {isChild ? <CornerDownRight className="h-4 w-4 text-muted/50" /> : null}
        <span
          className={cn(
            "grid place-items-center rounded-sm",
            isChild ? "h-7 w-7 bg-black/5" : "h-8 w-8 bg-brand-50",
          )}
        >
          <MenuIcon
            name={node.icon}
            className={cn(isChild ? "h-3.5 w-3.5 text-muted" : "h-4 w-4 text-brand-600")}
          />
        </span>
        {node.label}
        {!node.isActive ? <Badge tone="muted">nonaktif</Badge> : null}
      </span>

      {/* Path */}
      <span className="hidden font-mono text-xs text-muted md:block">{node.path ?? "—"}</span>

      {/* Permission key (read-only) */}
      <span className="hidden md:block">
        {node.permissionKey ? (
          <code className="inline-block rounded-sm border border-line bg-surface px-2 py-1 text-xs text-ink">
            {node.permissionKey}
          </code>
        ) : (
          <span className="text-xs text-muted">selalu tampil</span>
        )}
      </span>

      {/* Toggle aktif (placeholder) */}
      <span className="hidden place-items-center md:grid">
        <Switch on={node.isActive} label={`Status menu ${node.label}`} />
      </span>
    </div>
  );
}

export function MenuBuilder({ items }: { items: MenuItemRow[] }) {
  // Susun nested: parent → children via parentId.
  const roots = items.filter((i) => !i.parentId);
  const childrenOf = (id: string) => items.filter((i) => i.parentId === id);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Info className="h-4 w-4 text-brand-600" />
        Sidebar admin dirender dari tabel{" "}
        <code className="rounded bg-brand-50 px-1.5 py-0.5">menu_items</code> + permission user. Item
        tanpa permission cocok disembunyikan otomatis per role.
      </div>

      {items.length === 0 ? (
        <div className="rounded-[3px] border border-dashed border-line bg-surface px-5 py-12 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-sm bg-brand-50">
            <ListTree className="h-6 w-6 text-brand-600" />
          </span>
          <p className="mt-3 font-bold text-ink">Belum ada item menu</p>
          <p className="mt-1 text-sm text-muted">
            Seed <code className="rounded bg-brand-50 px-1 py-0.5">menu_items</code> belum terisi.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header kolom (desktop) */}
          <div className="hidden grid-cols-[28px_1fr_1.3fr_1.5fr_70px] gap-3 px-3 text-[11px] font-bold uppercase tracking-wide text-muted md:grid">
            <span />
            <span>Label &amp; Icon</span>
            <span>Path</span>
            <span>Permission dibutuhkan</span>
            <span className="text-center">Aktif</span>
          </div>

          {roots.map((node) => (
            <div key={node.id} className="space-y-2">
              <MenuRow node={node} />
              {childrenOf(node.id).map((child) => (
                <MenuRow key={child.id} node={child} isChild />
              ))}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] text-muted">
        Reorder (seret <GripVertical className="inline h-3 w-3" />) &amp; toggle aktif/nonaktif akan
        terhubung ke <code className="rounded bg-brand-50 px-1 py-0.5">menu_items</code> pada iterasi
        berikutnya. Item inilah yang menentukan sidebar tiap role.
      </p>
    </Card>
  );
}
