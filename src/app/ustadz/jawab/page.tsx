import {
  MessageCircleQuestion,
  VenetianMask,
  Send,
  Lock,
  CircleDot,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { auth } from "@/lib/auth";
import { answerQuestion } from "@/lib/actions/tanya";
import { listPendingQuestions } from "@/lib/queries/ustadz";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const textareaCls =
  "w-full rounded-sm border border-line bg-surface px-3 py-2.5 text-sm leading-relaxed text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

export default async function UstadzJawabPage() {
  const session = await auth();
  const ustadzName = session?.user?.name?.trim() || "Ustadz";
  const list = await listPendingQuestions();

  return (
    <div>
      <AdminPageHeader
        title="Jawab Tanya Ustadz"
        subtitle="Antrian pertanyaan jamaah yang menunggu jawaban. Nama Anda tercantum otomatis — jawaban ustadz tidak bisa anonim."
        action={
          list.length > 0 ? (
            <Badge tone="gold">
              <CircleDot className="h-3 w-3" /> {list.length} menunggu
            </Badge>
          ) : undefined
        }
      />

      {list.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
            <MessageCircleQuestion className="h-7 w-7" />
          </span>
          <h2 className="display mt-4 text-lg text-ink">Tidak ada pertanyaan menunggu</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Semua pertanyaan jamaah sudah terjawab. Jazakallahu khairan.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          {list.map((q) => (
            <Card key={q.id} className="p-5">
              {/* Pertanyaan */}
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black/5 text-muted">
                  <VenetianMask className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{q.askerDisplay}</p>
                  <p className="text-[11px] text-muted">
                    {q.categoryName ? `${q.categoryName} · ` : ""}diajukan{" "}
                    {dateFmt.format(q.createdAt)}
                  </p>
                </div>
                <Badge tone="gold">Menunggu</Badge>
              </div>

              <p className="mt-3 text-base font-bold leading-snug text-ink">{q.title}</p>
              <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
                {q.body}
              </p>

              {/* Identitas penjawab (otomatis, tidak anonim) */}
              <div className="mt-4 flex items-center gap-3 rounded-sm border border-line bg-cream p-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {ustadzName.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-ink">Dijawab oleh {ustadzName}</p>
                  <p className="text-[11px] text-muted">
                    Nama Anda tercantum otomatis — jawaban ustadz tidak bisa anonim.
                  </p>
                </div>
                <Lock className="h-4 w-4 text-muted" />
              </div>

              {/* Form jawaban */}
              <form action={answerQuestion} className="mt-4 space-y-3">
                <input type="hidden" name="question_id" value={q.id} />
                <label
                  htmlFor={`body-${q.id}`}
                  className="text-xs font-bold text-muted"
                >
                  Tulis jawaban
                </label>
                <textarea
                  id={`body-${q.id}`}
                  name="body"
                  rows={5}
                  required
                  placeholder="Tulis jawaban Anda di sini…"
                  className={textareaCls}
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] text-muted">
                    Jawaban tampil publik atas nama Anda.
                  </p>
                  <ConfirmSubmit
                    danger={false}
                    title="Kirim jawaban ini?"
                    text="Jawaban akan tampil publik atas nama Anda dan tidak bisa anonim."
                    confirmText="Ya, kirim"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-sm bg-brand-600 px-5 text-sm font-bold tracking-[0.01em] text-white transition-colors hover:bg-brand-700"
                  >
                    <Send className="h-4 w-4" /> Kirim Jawaban
                  </ConfirmSubmit>
                </div>
              </form>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
