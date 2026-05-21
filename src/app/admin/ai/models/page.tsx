import Link from "next/link";
import {
  ArrowUpRight,
  BrainCircuit,
  Cpu,
  Inbox,
  Pencil,
  PlusCircle,
  Power,
  ServerCog,
  Trash2,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Field } from "@/components/ui/input";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { listAiModels, listProviderOptions } from "@/lib/queries/ai-admin";
import {
  createModel,
  softDeleteModel,
  toggleModelActive,
} from "@/lib/actions/ai-models";

// Halaman ini membaca data langsung dari Neon → jangan di-cache statik.
export const dynamic = "force-dynamic";

const selectCls =
  "h-11 w-full rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

type ModelKind = "chat" | "reasoning" | "embedding" | "vision" | "multimodal";

const KINDS: { value: ModelKind; label: string }[] = [
  { value: "chat", label: "Chat" },
  { value: "reasoning", label: "Reasoning" },
  { value: "embedding", label: "Embedding" },
  { value: "vision", label: "Vision" },
  { value: "multimodal", label: "Multimodal" },
];

const KIND_TONE: Record<ModelKind, "brand" | "gold" | "success" | "warning" | "muted"> = {
  chat: "brand",
  reasoning: "gold",
  embedding: "success",
  vision: "warning",
  multimodal: "muted",
};

const KIND_LABEL: Record<ModelKind, string> = {
  chat: "Chat",
  reasoning: "Reasoning",
  embedding: "Embedding",
  vision: "Vision",
  multimodal: "Multimodal",
};

function formatContext(n: number | null) {
  if (!n) return "—";
  if (n >= 1000) return `${Math.round(n / 1000).toLocaleString("id-ID")}K`;
  return n.toLocaleString("id-ID");
}

export default async function AdminAiModelsPage() {
  const [models, providers] = await Promise.all([listAiModels(), listProviderOptions()]);

  return (
    <div>
      <AdminPageHeader
        title="Model AI"
        subtitle="Daftar model per provider yang dapat dipakai untuk chat, reasoning, embedding, maupun visi. Aktifkan model yang siap dipakai lalu tautkan ke tugas."
        action={
          <Button href="/admin/ai/providers" variant="outline">
            <ServerCog className="h-4 w-4" /> Kelola Provider
          </Button>
        }
      />

      {providers.length === 0 ? (
        // Empty state: model selalu menempel pada provider — arahkan ke halaman provider dulu.
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <ServerCog className="h-7 w-7 text-brand-600" />
          </span>
          <p className="display text-lg text-ink">Belum ada provider</p>
          <p className="max-w-md text-sm text-muted">
            Setiap model AI menempel pada sebuah provider (mis. DeepSeek). Tambahkan provider lebih
            dulu, lalu kembali ke sini untuk mendaftarkan modelnya.
          </p>
          <Button href="/admin/ai/providers" variant="primary" className="mt-1">
            <PlusCircle className="h-4 w-4" /> Tambah Provider
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          {/* Form tambah model (kiri) */}
          <div className="lg:col-span-2">
            <Card className="p-5">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
                <PlusCircle className="h-4 w-4 text-brand-600" /> Tambah Model
              </h2>

              <form action={createModel} className="space-y-4">
                <Field label="Provider" htmlFor="m-provider">
                  <select id="m-provider" name="providerId" required className={selectCls} defaultValue="">
                    <option value="" disabled>
                      Pilih provider…
                    </option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="ID Model" htmlFor="m-modelId" hint="Persis seperti dipakai API, mis. deepseek-chat.">
                  <Input id="m-modelId" name="modelId" placeholder="deepseek-chat" required />
                </Field>

                <Field label="Label" htmlFor="m-label" hint="Nama ramah yang tampil di antarmuka.">
                  <Input id="m-label" name="label" placeholder="DeepSeek Chat" required />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jenis" htmlFor="m-kind">
                    <select id="m-kind" name="kind" defaultValue="chat" className={selectCls}>
                      {KINDS.map((k) => (
                        <option key={k.value} value={k.value}>
                          {k.label}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Context Window" htmlFor="m-context" hint="Token (opsional).">
                    <Input
                      id="m-context"
                      name="contextWindow"
                      type="number"
                      min={1}
                      placeholder="64000"
                      inputMode="numeric"
                    />
                  </Field>
                </div>

                <Button type="submit" className="w-full">
                  <PlusCircle className="h-4 w-4" /> Simpan Model
                </Button>
              </form>
            </Card>
          </div>

          {/* Tabel model (kanan) */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 font-bold text-ink">
                  <BrainCircuit className="h-4 w-4 text-brand-600" /> Katalog Model
                </h2>
                <span className="text-[11px] text-muted">{models.length} model terdaftar</span>
              </div>

              {models.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                  <Inbox className="h-9 w-9 text-brand-300" />
                  <p className="font-bold text-ink">Belum ada model</p>
                  <p className="max-w-xs text-sm text-muted">
                    Daftarkan model pertama lewat formulir di samping. Model nonaktif tidak akan
                    muncul di pilihan tugas AI.
                  </p>
                </div>
              ) : (
                <Table className="border-0">
                  <THead>
                    <TR className="border-0">
                      <TH>Provider</TH>
                      <TH>Model</TH>
                      <TH>Jenis</TH>
                      <TH className="text-right">Context</TH>
                      <TH className="text-center">Status</TH>
                      <TH className="text-center">Aksi</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {models.map((m) => {
                      const kind = m.kind as ModelKind;
                      return (
                        <TR key={m.id}>
                          <TD className="whitespace-nowrap text-muted">{m.providerName}</TD>
                          <TD>
                            <span className="font-semibold text-ink">{m.label}</span>
                            <span className="block font-mono text-[11px] text-muted">{m.modelId}</span>
                          </TD>
                          <TD>
                            <Badge tone={KIND_TONE[kind]}>{KIND_LABEL[kind] ?? kind}</Badge>
                          </TD>
                          <TD className="whitespace-nowrap text-right tabular-nums text-ink">
                            {formatContext(m.contextWindow)}
                          </TD>
                          <TD className="text-center">
                            <Badge tone={m.isActive ? "success" : "muted"}>
                              {m.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </TD>
                          <TD className="text-center">
                            <div className="inline-flex items-center gap-1">
                              <form action={toggleModelActive}>
                                <input type="hidden" name="id" value={m.id} />
                                <input type="hidden" name="current" value={String(m.isActive)} />
                                <button
                                  type="submit"
                                  title={m.isActive ? "Nonaktifkan model" : "Aktifkan model"}
                                  aria-label={m.isActive ? "Nonaktifkan model" : "Aktifkan model"}
                                  className={cn(
                                    "inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors",
                                    m.isActive
                                      ? "hover:bg-amber-50 hover:text-amber-700"
                                      : "hover:bg-brand-50 hover:text-brand-700",
                                  )}
                                >
                                  <Power className="h-4 w-4" />
                                </button>
                              </form>
                              <Link
                                href={`/admin/ai/models/${m.id}`}
                                title="Ubah model"
                                aria-label="Ubah model"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                              <form action={softDeleteModel}>
                                <input type="hidden" name="id" value={m.id} />
                                <button
                                  type="submit"
                                  title="Hapus model"
                                  aria-label="Hapus model"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted transition-colors hover:bg-red-50 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </form>
                            </div>
                          </TD>
                        </TR>
                      );
                    })}
                  </tbody>
                </Table>
              )}

              <p className="flex items-center gap-1.5 border-t border-line px-5 py-3 text-[11px] text-muted">
                <Cpu className="h-3.5 w-3.5 text-brand-400" />
                Hapus = pindah ke recycle bin (soft delete). Tautkan model aktif ke tugas lewat{" "}
                <Link href="/admin/ai/bindings" className="inline-flex items-center gap-0.5 font-bold text-brand-700 hover:underline">
                  Pemetaan Tugas <ArrowUpRight className="h-3 w-3" />
                </Link>
                .
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
