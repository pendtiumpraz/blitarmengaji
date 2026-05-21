import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "brand" | "gold" | "success" | "warning" | "danger" | "muted";

const tones: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  gold: "bg-gold/15 text-gold-dark",
  success: "bg-green-100 text-green-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-600",
  muted: "bg-black/5 text-muted",
};

export function Badge({
  tone = "brand",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold", tones[tone], className)}>
      {children}
    </span>
  );
}
