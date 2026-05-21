"use client";

import { useState } from "react";
import { VenetianMask } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Toggle "Kirim sebagai Hamba Allah (anonim)" untuk form Tanya Ustadz.
 * - Mengirim hidden input `is_anonymous` (1/0).
 * - Bila TIDAK anonim & pengunjung belum login (isGuest), tampilkan input nama
 *   (`asker_name`) yang wajib diisi.
 */
export function AnonToggle({ isGuest = true }: { isGuest?: boolean }) {
  const [anonim, setAnonim] = useState(true);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-[3px] border border-line bg-brand-50 p-3">
        <VenetianMask className="h-6 w-6 shrink-0 text-brand-700" />
        <div className="flex-1">
          <p className="text-sm font-bold text-ink">Kirim sebagai &ldquo;Hamba Allah&rdquo;</p>
          <p className="text-[11px] text-muted">Identitasmu disembunyikan dari publik.</p>
        </div>
        {/* input tersembunyi agar nilai ikut terkirim bersama form */}
        <input type="hidden" name="is_anonymous" value={anonim ? "1" : "0"} />
        <button
          type="button"
          role="switch"
          aria-checked={anonim}
          aria-label="Kirim sebagai Hamba Allah (anonim)"
          onClick={() => setAnonim((v) => !v)}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            anonim ? "bg-brand-600" : "bg-black/15",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-surface shadow transition-all",
              anonim ? "right-0.5" : "left-0.5",
            )}
          />
        </button>
      </div>

      {/* Nama wajib bila pengunjung guest & memilih tidak anonim. */}
      {isGuest && !anonim ? (
        <div className="space-y-1.5">
          <label htmlFor="asker_name" className="text-xs font-bold text-muted">
            Nama Anda
          </label>
          <input
            id="asker_name"
            name="asker_name"
            required
            placeholder="Tulis nama yang ingin ditampilkan…"
            className="h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </div>
      ) : null}
    </div>
  );
}
