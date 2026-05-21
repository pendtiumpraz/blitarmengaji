"use client";

import { useActionState } from "react";
import { Sparkles, Wand2, ArrowDown, Info } from "lucide-react";
import { summarizeTranscript } from "@/lib/actions/ai-summarize";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

/**
 * Kartu bantu AI: RINGKAS TRANSKRIP → CATATAN (1 klik).
 * - Textarea transkrip + tombol "Ringkas dengan AI" (useActionState).
 * - Saat hasil ada → tampilkan judul & isi + tombol "Pakai ke Form".
 * - "Pakai ke Form" mengisi field form catatan via DOM
 *   (input[name="title"] & textarea[name="body"]) tanpa merusak form yang ada.
 */
export function Summarize() {
  const [state, formAction, pending] = useActionState(summarizeTranscript, undefined);

  function applyToForm() {
    if (!state?.ok) return;
    const titleEl = document.querySelector<HTMLInputElement>('input[name="title"]');
    const bodyEl = document.querySelector<HTMLTextAreaElement>('textarea[name="body"]');

    if (titleEl && typeof state.title === "string") {
      titleEl.value = state.title;
      titleEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (bodyEl && typeof state.body === "string") {
      bodyEl.value = state.body;
      bodyEl.dispatchEvent(new Event("input", { bubbles: true }));
      bodyEl.scrollIntoView({ behavior: "smooth", block: "center" });
      bodyEl.focus();
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="display text-lg text-ink">Bantu AI: Ringkas Transkrip</h2>
          <p className="mt-1 text-sm text-muted">
            Tempel transkrip kajian, lalu biarkan AI merapikannya menjadi catatan: judul singkat,
            poin penting, dan kutipan dalil bila ada.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-5 space-y-3">
        <textarea
          name="transcript"
          rows={5}
          required
          placeholder="Tempel transkrip kajian di sini…"
          className={textareaCls}
        />
        <Button type="submit" variant="gold" className="w-full" disabled={pending}>
          <Wand2 className="h-4 w-4" /> {pending ? "Meringkas…" : "Ringkas dengan AI"}
        </Button>
      </form>

      {/* Pesan error */}
      {state?.error ? (
        <p className="mt-3 flex items-start gap-1.5 rounded-sm bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{state.error}</span>
        </p>
      ) : null}

      {/* Hasil ringkasan */}
      {state?.ok ? (
        <div className="mt-4 space-y-3 rounded-sm border border-line bg-cream/60 p-4">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Judul</p>
            <p className="font-bold text-ink">{state.title}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted">Isi Catatan</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{state.body}</p>
          </div>
          <Button type="button" onClick={applyToForm} className="w-full">
            <ArrowDown className="h-4 w-4" /> Pakai ke Form
          </Button>
          <p className="text-[11px] leading-relaxed text-muted">
            Periksa kembali hasil AI sebelum dipublikasikan. Anda tetap bisa menyuntingnya pada
            formulir di bawah.
          </p>
        </div>
      ) : null}
    </Card>
  );
}
