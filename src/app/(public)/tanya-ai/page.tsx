import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { auth } from "@/lib/auth";
import {
  listMyConversations,
  getConversationMessages,
  type ConversationListItem,
  type ConversationMessage,
} from "@/lib/queries/ai-chat";
import { Chat } from "./chat";

export const metadata: Metadata = {
  title: "Tanya AI · Asisten Kajian — Blitar Mengaji",
  description:
    "Asisten Kajian berbasis DeepSeek yang menjawab dari catatan kajian & perpustakaan platform, lengkap dengan sitasi sumber.",
};

export const dynamic = "force-dynamic";

export default async function TanyaAiPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; c?: string | string[] }>;
}) {
  const sp = await searchParams;

  const rawQ = Array.isArray(sp.q) ? sp.q[0] : sp.q;
  const initialQuery = (rawQ ?? "").trim().slice(0, 500) || undefined;

  const rawC = Array.isArray(sp.c) ? sp.c[0] : sp.c;
  const requestedConversationId = (rawC ?? "").trim() || undefined;

  const session = await auth();
  const userId = session?.user?.id ?? null;

  let conversations: ConversationListItem[] = [];
  let initialMessages: ConversationMessage[] = [];
  let initialConversationId: string | undefined;

  if (userId) {
    conversations = await listMyConversations(userId);

    if (requestedConversationId) {
      const msgs = await getConversationMessages(requestedConversationId, userId);
      // Hanya anggap percakapan terbuka bila benar milik user & ada isinya.
      if (msgs.length > 0) {
        initialMessages = msgs;
        initialConversationId = requestedConversationId;
      }
    }
  }

  return (
    <Container className="py-12">
      <SectionHeading
        eyebrow="Asisten Kajian"
        title="Tanya AI"
        subtitle="Tanyakan istilah fiqih, ringkasan kajian, atau materi catatan — dijawab berbasis konten platform dengan sitasi sumbernya."
        className="mb-10"
      />

      <Chat
        initialQuery={initialQuery}
        conversations={conversations}
        initialMessages={initialMessages}
        initialConversationId={initialConversationId}
      />

      <p className="mx-auto mt-6 max-w-2xl text-center text-xs leading-relaxed text-muted">
        Asisten ini grounded ke konten (RAG): catatan kajian & perpustakaan Blitar Raya.
        Untuk persoalan hukum yang bersifat personal, mohon merujuk pada Tanya Ustadz.
      </p>
    </Container>
  );
}
