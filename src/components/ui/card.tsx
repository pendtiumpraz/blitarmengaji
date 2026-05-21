import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-[3px] border border-line bg-surface", className)}>{children}</div>;
}

/** Kartu dengan ornamen sudut arabesque (sentuhan craft). */
export function OrnCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[3px] border border-line bg-surface", className)}>
      <svg
        className="pointer-events-none absolute right-0 top-0 h-16 w-16 text-gold opacity-50"
        viewBox="0 0 64 64"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M64 6 C36 6 6 36 6 64 M64 20 C44 20 20 44 20 64 M64 34 C52 34 34 52 34 64" />
      </svg>
      {children}
    </div>
  );
}
