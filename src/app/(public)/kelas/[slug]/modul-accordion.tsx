"use client";

import { useState } from "react";
import { ChevronDown, CheckCircle2, PlayCircle, Lock, Play } from "lucide-react";
import { cn } from "@/lib/cn";

export type Pelajaran = {
  judul: string;
  durasi: string;
  status: "selesai" | "kini" | "terkunci";
};

export type Modul = {
  judul: string;
  pelajaran: Pelajaran[];
  terkunci?: boolean;
};

export function ModulAccordion({ modul }: { modul: Modul[] }) {
  // Buka modul yang punya pelajaran "kini" secara default; selain itu modul pertama.
  const defaultOpen = (() => {
    const i = modul.findIndex((m) => m.pelajaran.some((p) => p.status === "kini"));
    return i >= 0 ? i : 0;
  })();
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="space-y-2">
      {modul.map((m, i) => {
        const isOpen = open === i && !m.terkunci;
        const selesai = m.pelajaran.filter((p) => p.status === "selesai").length;
        return (
          <div key={m.judul} className="overflow-hidden rounded-[3px] border border-line bg-surface">
            <button
              type="button"
              disabled={m.terkunci}
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-4 py-3 text-left",
                isOpen ? "bg-brand-50" : "bg-surface",
                m.terkunci && "cursor-not-allowed",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">{m.judul}</p>
                {!m.terkunci ? (
                  <p className="text-[11px] text-muted">
                    {selesai}/{m.pelajaran.length} pelajaran selesai
                  </p>
                ) : (
                  <p className="text-[11px] text-muted">Terkunci · selesaikan modul sebelumnya</p>
                )}
              </div>
              {m.terkunci ? (
                <Lock className="h-4 w-4 shrink-0 text-muted" />
              ) : (
                <ChevronDown
                  className={cn("h-4 w-4 shrink-0 text-brand-700 transition-transform", isOpen && "rotate-180")}
                />
              )}
            </button>

            {isOpen ? (
              <ul className="divide-y divide-line border-t border-line">
                {m.pelajaran.map((p, j) => (
                  <li
                    key={p.judul}
                    className={cn(
                      "flex items-center gap-2.5 px-4 py-3",
                      p.status === "kini" && "bg-brand-50/60",
                    )}
                  >
                    {p.status === "selesai" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    ) : p.status === "kini" ? (
                      <PlayCircle className="h-4 w-4 shrink-0 text-brand-600" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 shrink-0 text-muted" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-[13px]",
                        p.status === "kini" ? "font-bold text-brand-700" : "text-ink",
                        p.status === "terkunci" && "text-muted",
                      )}
                    >
                      {j + 1}. {p.judul}
                    </span>
                    {p.status === "kini" ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-brand-600">
                        <Play className="h-3 w-3" /> kini
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted">{p.durasi}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
