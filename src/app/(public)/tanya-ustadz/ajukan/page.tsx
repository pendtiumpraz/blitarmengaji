import { Send } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Field, Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { auth } from "@/lib/auth";
import { askQuestion } from "@/lib/actions/tanya";
import { listQaCategories } from "@/lib/queries/tanya";
import { AnonToggle } from "./anon-toggle";
import { CategoryPicker } from "./category-picker";

export const dynamic = "force-dynamic";

export default async function AjukanPertanyaanPage() {
  const [session, categories] = await Promise.all([auth(), listQaCategories()]);
  const isGuest = !session?.user?.id;

  return (
    <Container className="max-w-2xl py-10">
      <SectionHeading
        align="left"
        eyebrow="Tanya Ustadz"
        title="Ajukan Pertanyaan"
        subtitle="Tuliskan pertanyaanmu dengan jelas agar ustadz dapat menjawab dengan tepat."
        className="mb-8"
      />

      <form action={askQuestion} className="space-y-5">
        <Field label="Judul pertanyaan" htmlFor="title">
          <Input id="title" name="title" placeholder="Tulis inti pertanyaan…" required minLength={8} maxLength={255} />
        </Field>

        <CategoryPicker categories={categories} />

        <Field label="Detail pertanyaan" htmlFor="body">
          <textarea
            id="body"
            name="body"
            rows={5}
            required
            minLength={15}
            placeholder="Jelaskan kondisimu dengan lengkap…"
            className="w-full rounded-sm border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>

        <AnonToggle isGuest={isGuest} />

        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-sm bg-gold text-sm font-bold tracking-[0.01em] text-[#241f10] transition-colors hover:bg-gold-light"
        >
          <Send className="h-4 w-4" /> Kirim Pertanyaan
        </button>

        <p className="text-center text-[11px] text-muted">
          Jawaban ustadz wajib menyebut nama beliau, meski penanya memilih anonim.
        </p>
      </form>
    </Container>
  );
}
