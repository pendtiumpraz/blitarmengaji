import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Table({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-[3px] border border-line bg-surface">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-brand-50 text-left text-[11px] uppercase tracking-wide text-muted">{children}</thead>;
}

export function TH({ className, children }: { className?: string; children?: ReactNode }) {
  return <th className={cn("px-4 py-3 font-bold", className)}>{children}</th>;
}

export function TR({ className, children }: { className?: string; children: ReactNode }) {
  return <tr className={cn("border-t border-line", className)}>{children}</tr>;
}

export function TD({ className, children }: { className?: string; children?: ReactNode }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
