"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  BookOpen,
  FileText,
  MessageCircleQuestion,
  MessageSquare,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  PanelLeft,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { deleteConversation } from "@/lib/actions/ai-chat";
import type {
  ConversationListItem,
  ConversationMessage,
} from "@/lib/queries/ai-chat";

type CitationSource = "catatan" | "perpustakaan" | "tanya-ustadz";
type Citation = { title: string; href: string; source: CitationSource };

type Message = {
  id: number;
  role: "user" | "ai";
  text: string;
  citations?: Citation[];
  pending?: boolean;
};

type ChatApiResponse = {
  answer: string;
  citations: Citation[];
  conversationId?: string | null;
};

const suggestions = [
  "Apa pembatal wudhu?",
  "Tata cara tayammum",
  "Macam-macam najis",
];

/** Konversi pesan tersimpan (DB) → bentuk pesan UI. Lewati peran 'system'. */
function fromStored(stored: ConversationMessage[]): Message[] {
  return stored
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, i) => ({
      id: -(i + 1), // id negatif → tidak bentrok dengan id sesi (mulai 1)
      role: m.role === "assistant" ? "ai" : "user",
      text: m.content,
    }));
}

function CitationChip({ citation }: { citation: Citation }) {
  const Icon =
    citation.source === "perpustakaan"
      ? FileText
      : citation.source === "tanya-ustadz"
        ? MessageCircleQuestion
        : BookOpen;
  const external = /^https?:\/\//.test(citation.href);

  const className =
    "inline-flex max-w-full items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-[10px] font-bold text-brand-700 transition-colors hover:bg-brand-100";

  const inner = (
    <>
      <Icon className="h-3 w-3 flex-none" />
      <span className="truncate">{citation.title}</span>
    </>
  );

  return external ? (
    <a href={citation.href} target="_blank" rel="noopener noreferrer" className={className}>
      {inner}
    </a>
  ) : (
    <Link href={citation.href} className={className}>
      {inner}
    </Link>
  );
}

export function Chat({
  initialQuery,
  conversations = [],
  initialMessages = [],
  initialConversationId,
}: {
  initialQuery?: string;
  conversations?: ConversationListItem[];
  initialMessages?: ConversationMessage[];
  initialConversationId?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(() => fromStored(initialMessages));
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);

  const hasSidebar = conversations.length > 0;

  function genId() {
    return nextId.current++;
  }

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: genId(), role: "user", text: trimmed };
    const pendingId = genId();
    const pendingMsg: Message = { id: pendingId, role: "ai", text: "", pending: true };

    // Riwayat untuk dikirim ke API (sebelum menambahkan placeholder pending).
    const history = [...messages, userMsg]
      .filter((m) => !m.pending)
      .map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text }));

    setMessages((prev) => [...prev, userMsg, pendingMsg]);
    setDraft("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, conversationId }),
      });
      const data = (await res.json()) as ChatApiResponse;
      // Simpan id percakapan baru bila server membuatkannya (lanjutan tersimpan).
      if (data.conversationId) setConversationId(data.conversationId);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: m.id,
                role: "ai",
                text: data.answer || "Maaf, jawaban tidak tersedia.",
                citations: data.citations ?? [],
              }
            : m,
        ),
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? {
                id: m.id,
                role: "ai",
                text: "Maaf, terjadi gangguan koneksi. Silakan coba lagi.",
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  /** Mulai percakapan baru: reset pesan & id, tutup sidebar (mobile). */
  function newChat() {
    if (loading) return;
    setMessages([]);
    setConversationId(null);
    setDraft("");
    sentInitial.current = true; // jangan auto-kirim ?q= lagi setelah reset manual
    setSidebarOpen(false);
  }

  // Auto-kirim query awal dari URL (?q=) sekali saja — hanya bila tidak membuka
  // percakapan tersimpan (?c=).
  useEffect(() => {
    if (sentInitial.current) return;
    if (initialConversationId) {
      sentInitial.current = true;
      return;
    }
    if (initialQuery && initialQuery.trim()) {
      sentInitial.current = true;
      void ask(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, initialConversationId]);

  // Auto-scroll ke bawah saat ada pesan baru.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void ask(draft);
  }

  const isEmpty = messages.length === 0;

  const sidebar = useMemo(
    () => (
      <aside className="flex h-full flex-col gap-3 bg-cream p-3">
        <button
          type="button"
          onClick={newChat}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Chat Baru
        </button>

        <p className="px-1 pt-1 text-[11px] font-bold uppercase tracking-wide text-muted">
          Riwayat
        </p>

        <div className="flex-1 space-y-1 overflow-y-auto">
          {conversations.map((c) => {
            const active = c.id === conversationId;
            return (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-sm px-1 transition-colors ${
                  active ? "bg-brand-50" : "hover:bg-surface"
                }`}
              >
                <Link
                  href={`/tanya-ai?c=${c.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 py-2 pl-1.5 text-sm"
                  title={c.title ?? "Percakapan"}
                >
                  <MessageSquare
                    className={`h-4 w-4 flex-none ${active ? "text-brand-700" : "text-muted"}`}
                  />
                  <span
                    className={`truncate ${active ? "font-bold text-brand-700" : "text-ink"}`}
                  >
                    {c.title?.trim() || "Percakapan"}
                  </span>
                </Link>

                <form action={deleteConversation} className="flex-none">
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    aria-label="Hapus percakapan"
                    title="Hapus percakapan"
                    className="grid h-7 w-7 place-items-center rounded-full text-muted opacity-0 transition-colors hover:bg-red-50 hover:text-red-600 focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </aside>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversations, conversationId, loading],
  );

  return (
    <div
      className={`mx-auto grid w-full gap-4 ${
        hasSidebar ? "max-w-5xl md:grid-cols-[260px_1fr]" : "max-w-2xl"
      }`}
    >
      {/* SIDEBAR — desktop (hanya bila login & ada percakapan). */}
      {hasSidebar ? (
        <div className="hidden overflow-hidden rounded-[3px] border border-line bg-surface shadow-sm md:block">
          {sidebar}
        </div>
      ) : null}

      {/* SIDEBAR — mobile (drawer/overlay). */}
      {hasSidebar && sidebarOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Tutup daftar percakapan"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <div className="absolute left-0 top-0 h-full w-72 max-w-[80%] overflow-hidden border-r border-line bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="display text-sm text-ink">Percakapan</p>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setSidebarOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-cream"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-2.75rem)]">{sidebar}</div>
          </div>
        </div>
      ) : null}

      {/* PANEL CHAT */}
      <div className="flex w-full flex-col overflow-hidden rounded-[3px] border border-line bg-surface shadow-sm">
        {/* Header asisten */}
        <div className="flex items-center gap-3 bg-brand-600 px-4 py-3 text-cream">
          {hasSidebar ? (
            <button
              type="button"
              aria-label="Buka daftar percakapan"
              onClick={() => setSidebarOpen(true)}
              className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25 md:hidden"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-white/15">
            <Bot className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="display text-base leading-none text-white">Asisten Kajian</p>
            <p className="mt-1 text-[11px] text-cream/70">Menjawab dari konten platform · dengan sitasi</p>
          </div>
          <Sparkles className="h-4 w-4 text-gold-light/80" />
        </div>

        {/* Area chat */}
        <div
          ref={scrollRef}
          className="flex max-h-[60vh] min-h-[420px] flex-1 flex-col gap-3 overflow-y-auto bg-cream p-4"
        >
          {isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50">
                <Bot className="h-6 w-6 text-brand-700" />
              </div>
              <p className="text-sm leading-relaxed text-muted">
                Tanyakan istilah fiqih, ringkasan kajian, atau materi catatan. Jawaban diambil
                dari catatan kajian, perpustakaan, dan jawaban ustadz di platform.
              </p>
            </div>
          ) : (
            messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex gap-2">
                  <div className="grid h-7 w-7 flex-none place-items-center rounded-full bg-brand-50">
                    <Bot className="h-4 w-4 text-brand-700" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-ink shadow-sm">
                    {m.pending ? (
                      <span className="flex items-center gap-2 text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sedang menyusun jawaban…
                      </span>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                        {m.citations && m.citations.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1 border-t border-line pt-2">
                            {m.citations.map((c, i) => (
                              <CitationChip key={`${c.href}-${i}`} citation={c} />
                            ))}
                          </div>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              ),
            )
          )}

          {/* Saran pertanyaan lanjutan */}
          <div className="mt-auto flex gap-2 pt-1">
            <div className="h-7 w-7 flex-none" aria-hidden />
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void ask(s)}
                  disabled={loading}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-brand-600 hover:text-brand-700 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer khilafiyah */}
          <p className="px-6 text-center text-[10px] leading-relaxed text-muted">
            Jawaban AI, verifikasi ke ustadz. Untuk hukum personal silakan{" "}
            <Link href="/tanya-ustadz" className="font-bold text-brand-700 hover:underline">
              Tanya Ustadz
            </Link>
            .
          </p>
        </div>

        {/* Input bar bawah */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 border-t border-line bg-surface p-3"
        >
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tanyakan sesuatu…"
            aria-label="Tulis pertanyaan untuk asisten kajian"
            disabled={loading}
            className="rounded-full bg-cream"
          />
          <button
            type="submit"
            aria-label="Kirim pertanyaan"
            className="grid h-11 w-11 flex-none place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
            disabled={loading || !draft.trim()}
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
