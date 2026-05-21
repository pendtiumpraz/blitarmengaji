"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Info,
  Lock,
  MessageCircleQuestion,
  Send,
  UserRound,
  VenetianMask,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { answerQuestion } from "@/lib/actions/tanya";
import type { QuestionListItem } from "@/lib/queries/tanya";

type Tab = "menunggu" | "terjawab";

const TABS: { value: Tab; label: string }[] = [
  { value: "menunggu", label: "Menunggu" },
  { value: "terjawab", label: "Terjawab" },
];

function waktuRelatif(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const menit = Math.floor(diff / 60000);
  if (menit < 1) return "baru saja";
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 30) return `${hari} hari lalu`;
  const bulan = Math.floor(hari / 30);
  if (bulan < 12) return `${bulan} bulan lalu`;
  return `${Math.floor(bulan / 12)} tahun lalu`;
}

function inisial(nama: string): string {
  return (
    nama
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U"
  );
}

function SubmitJawaban() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ml-auto inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-brand-600 px-5 text-sm font-bold tracking-[0.01em] text-white transition-colors hover:bg-brand-700 disabled:pointer-events-none disabled:opacity-50"
    >
      <Send className="h-4 w-4" /> {pending ? "Mengirim…" : "Kirim Jawaban"}
    </button>
  );
}

export function Moderasi({
  questions,
  ustadzName,
}: {
  questions: QuestionListItem[];
  ustadzName: string;
}) {
  const [tab, setTab] = useState<Tab>("menunggu");
  const menunggu = useMemo(() => questions.filter((q) => q.answers.length === 0), [questions]);
  const terjawab = useMemo(() => questions.filter((q) => q.answers.length > 0), [questions]);
  const daftar = tab === "menunggu" ? menunggu : terjawab;

  const [selectedId, setSelectedId] = useState<string | null>(daftar[0]?.id ?? null);
  const terpilih = useMemo(
    () => questions.find((q) => q.id === selectedId) ?? null,
    [questions, selectedId],
  );

  function pilihTab(t: Tab) {
    setTab(t);
    const list = t === "menunggu" ? menunggu : terjawab;
    setSelectedId(list[0]?.id ?? null);
  }

  const sudahDijawab = (terpilih?.answers.length ?? 0) > 0;

  return (
    <div>
      {/* Tab filter */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter status pertanyaan">
        {TABS.map((t) => {
          const active = tab === t.value;
          const count = t.value === "menunggu" ? menunggu.length : terjawab.length;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pilihTab(t.value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-xs font-bold transition-colors",
                active ? "bg-brand-600 text-white" : "border border-line bg-surface text-ink hover:bg-brand-50",
              )}
            >
              {t.label} ({count})
            </button>
          );
        })}
      </div>

      {questions.length === 0 ? (
        <Card className="grid place-items-center px-6 py-16 text-center">
          <MessageCircleQuestion className="h-10 w-10 text-brand-600/60" />
          <p className="mt-3 text-sm font-bold text-ink">Belum ada pertanyaan</p>
          <p className="mt-1 max-w-sm text-xs text-muted">
            Pertanyaan dari jamaah akan muncul di sini begitu mereka mengajukan lewat halaman Tanya Ustadz.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]">
          {/* DAFTAR pertanyaan */}
          <div className="space-y-3">
            {daftar.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted">
                {tab === "menunggu"
                  ? "Tidak ada pertanyaan yang menunggu jawaban. Alhamdulillah."
                  : "Belum ada pertanyaan yang terjawab."}
              </Card>
            ) : (
              daftar.map((p) => {
                const active = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="block w-full text-left"
                    aria-pressed={active}
                  >
                    <Card className={cn("p-4 transition-colors", active ? "border-brand-600 bg-brand-50/60" : "hover:bg-brand-50/40")}>
                      <div className="flex items-center justify-between gap-2">
                        {p.categoryName ? <Badge tone="brand">{p.categoryName}</Badge> : <Badge tone="muted">Umum</Badge>}
                        {p.answers.length > 0 ? (
                          <Badge tone="success">Terjawab</Badge>
                        ) : (
                          <Badge tone="warning">Menunggu</Badge>
                        )}
                      </div>
                      <p className="mt-2 font-bold leading-tight text-ink">{p.title}</p>
                      <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
                        {p.isAnonymous ? <VenetianMask className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
                        oleh {p.askerDisplay} · {waktuRelatif(p.createdAt)}
                      </p>
                    </Card>
                  </button>
                );
              })
            )}
          </div>

          {/* Panel JAWAB */}
          <div>
            {terpilih ? (
              <Card className="p-5 lg:p-6">
                {/* Pertanyaan */}
                <div className="rounded-sm border border-brand-100 bg-brand-50/60 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 text-muted">
                      {terpilih.isAnonymous ? <VenetianMask className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">
                        {terpilih.askerDisplay}
                        {terpilih.isAnonymous ? (
                          <span className="ml-1 text-[10px] font-normal text-muted">· identitas disembunyikan penanya</span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-muted">
                        {terpilih.categoryName ?? "Umum"} · diajukan {waktuRelatif(terpilih.createdAt)}
                      </p>
                    </div>
                    {terpilih.answers.length > 0 ? (
                      <Badge tone="success">Terjawab</Badge>
                    ) : (
                      <Badge tone="warning">Menunggu</Badge>
                    )}
                  </div>
                  <p className="text-base font-bold leading-snug text-ink">{terpilih.title}</p>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-ink/80">{terpilih.body}</p>
                </div>

                {/* Jawaban yang sudah ada */}
                {terpilih.answers.map((a) => (
                  <div key={a.id} className="mt-4 rounded-sm border-l-2 border-brand-500 bg-cream p-4">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink/85">{a.body}</p>
                    <p className="mt-2 text-[11px] font-bold text-brand-700">— {a.ustadzName}</p>
                  </div>
                ))}

                {/* Identitas ustadz (otomatis, TIDAK bisa anonim) */}
                <div className="mt-4 flex items-center gap-3 rounded-sm border border-line bg-cream/60 p-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold text-sm font-bold text-[#241f10]">
                    {inisial(ustadzName)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink">Dijawab oleh {ustadzName}</p>
                    <p className="text-[11px] text-muted">
                      Nama Anda tercantum otomatis pada jawaban — jawaban ustadz tidak bisa anonim.
                    </p>
                  </div>
                  <Lock className="h-4 w-4 shrink-0 text-muted" />
                </div>

                {/* Form jawaban -> server action */}
                <form action={answerQuestion} className="mt-4 space-y-3" key={terpilih.id}>
                  <input type="hidden" name="question_id" value={terpilih.id} />
                  <div className="space-y-1.5">
                    <label htmlFor="body" className="text-xs font-bold text-muted">
                      {sudahDijawab ? "Tambah jawaban / koreksi" : "Tulis jawaban"}
                    </label>
                    <textarea
                      id="body"
                      name="body"
                      rows={6}
                      required
                      minLength={10}
                      placeholder="Wa'alaikumussalam. Tulis jawaban Anda di sini…"
                      className="w-full rounded-sm border border-line bg-surface p-3 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                    />
                    <p className="text-[11px] text-muted">Jawaban tampil publik atas nama Anda.</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <p className="flex items-center gap-1 text-[11px] text-muted">
                      <Info className="h-3.5 w-3.5" />
                      Mengirim jawaban menandai pertanyaan sebagai &ldquo;Terjawab&rdquo;.
                    </p>
                    <SubmitJawaban />
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="grid place-items-center p-10 text-center text-sm text-muted">
                Pilih pertanyaan di sebelah kiri untuk menjawab.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
