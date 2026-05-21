import { cn } from "@/lib/cn";

/** Pemisah ornamen: garis emas + medali bintang-8 (khatam). */
export function OrnDivider({ className }: { className?: string }) {
  return (
    <div className={cn("mx-auto flex max-w-lg items-center gap-4 text-gold", className)}>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/60" />
      <svg viewBox="0 0 28 28" className="h-7 w-7 flex-none" fill="none" stroke="currentColor" strokeWidth="1.4">
        <rect x="6" y="6" width="16" height="16" />
        <rect x="6" y="6" width="16" height="16" transform="rotate(45 14 14)" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/60" />
    </div>
  );
}
