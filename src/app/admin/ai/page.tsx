import Link from "next/link";
import {
  Bot,
  BrainCircuit,
  Cpu,
  Database,
  ExternalLink,
  FileText,
  Languages,
  Layers,
  MessageSquare,
  Network,
  ScanEye,
  Sparkles,
  TextQuote,
} from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  listActiveModelOptions,
  listAiBindings,
  listAiModels,
  listAiProviders,
} from "@/lib/queries/ai-admin";
import { setTaskBinding } from "@/lib/actions/ai-bindings";
import { reindexContentAction } from "@/lib/actions/embedding";
import { embeddingConfigured } from "@/lib/ai";

// Hub AI: ringkasan provider/model + pemetaan model per task (BINDINGS).
// Data NYATA dari Neon; mutasi via server action setTaskBinding. Render dinamis.
export const dynamic = "force-dynamic";

type Task = "chat" | "agent" | "doc" | "embedding" | "transcribe" | "summarize" | "vision";

// Daftar task yang dikelola di halaman ini (urut sesuai alur pemakaian).
const TASKS: {
  key: Task;
  label: string;
  desc: string;
  icon: typeof MessageSquare;
}[] = [
  { key: "chat", label: "Chat", desc: "Percakapan umum Tanya Ustadz & asisten.", icon: MessageSquare },
  { key: "agent", label: "Agen", desc: "Tugas multi-langkah dengan tool/aksi.", icon: Bot },
  { key: "doc", label: "Dokumen", desc: "Tanya-jawab atas dokumen & kitab (RAG).", icon: FileText },
  { key: "embedding", label: "Embedding", desc: "Vektor untuk pencarian semantik RAG.", icon: Network },
  { key: "summarize", label: "Ringkasan", desc: "Meringkas kajian & catatan panjang.", icon: TextQuote },
  { key: "transcribe", label: "Transkrip", desc: "Audio kajian menjadi teks.", icon: Languages },
  { key: "vision", label: "Visi", desc: "Membaca gambar & poster.", icon: ScanEye },
];

export default async function AdminAiPage() {
  const [providers, models, bindings, modelOptions, ragReady] = await Promise.all([
    listAiProviders(),
    listAiModels(),
    listAiBindings(),
    listActiveModelOptions(),
    embeddingConfigured(),
  ]);

  const activeProviders = providers.filter((p) => p.isActive).length;
  const activeModels = models.filter((m) => m.isActive).length;

  // Peta task -> binding aktif saat ini (untuk preselect & tampilan ringkas).
  const bindingByTask = new Map(bindings.map((b) => [b.task, b]));
  const hasModels = modelOptions.length > 0;

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Manajemen AI"
        subtitle="Pusat kendali AI Blitar Mengaji: kelola provider & model, lalu pilih model mana yang menangani tiap jenis tugas (task binding)."
        action={
          <div className="flex flex-wrap gap-2">
            <Button href="/admin/ai/providers" variant="outline" size="sm">
              <Cpu className="h-4 w-4" /> Provider
            </Button>
            <Button href="/admin/ai/models" variant="outline" size="sm">
              <Layers className="h-4 w-4" /> Model
            </Button>
          </div>
        }
      />

      {/* ===================================================================== */}
      {/* RINGKASAN                                                              */}
      {/* ===================================================================== */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
            <Cpu className="h-6 w-6" />
          </span>
          <div>
            <p className="display text-2xl text-ink">{providers.length}</p>
            <p className="text-sm text-muted">
              Provider <span className="text-[11px]">({activeProviders} aktif)</span>
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
            <Layers className="h-6 w-6" />
          </span>
          <div>
            <p className="display text-2xl text-ink">{models.length}</p>
            <p className="text-sm text-muted">
              Model <span className="text-[11px]">({activeModels} aktif)</span>
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-gold/15 text-gold-dark">
            <Sparkles className="h-6 w-6" />
          </span>
          <div>
            <p className="display text-2xl text-ink">{bindings.length}</p>
            <p className="text-sm text-muted">Task terpetakan</p>
          </div>
        </Card>
      </section>

      {/* ===================================================================== */}
      {/* CATATAN API KEY                                                        */}
      {/* ===================================================================== */}
      <Card className="flex items-start gap-3 bg-brand-50/50 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-sm bg-brand-600 text-white">
          <Cpu className="h-4 w-4" />
        </span>
        <p className="text-sm text-ink/80">
          <span className="font-bold text-ink">Catatan:</span> API key tiap provider diisi di halaman{" "}
          <Link
            href="/admin/ai/providers"
            className="font-bold text-brand-700 underline underline-offset-2"
          >
            Provider
          </Link>
          . Halaman ini hanya memetakan model aktif ke tiap task. Tambah/aktifkan model di halaman{" "}
          <Link
            href="/admin/ai/models"
            className="font-bold text-brand-700 underline underline-offset-2"
          >
            Model
          </Link>
          .
        </p>
      </Card>

      {/* ===================================================================== */}
      {/* TASK BINDINGS                                                          */}
      {/* ===================================================================== */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <BrainCircuit className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">Pemetaan Model per Task</h2>
          <Badge tone="muted">{TASKS.length} task</Badge>
        </div>

        {!hasModels ? (
          <div className="grid place-items-center rounded-[3px] border border-dashed border-line bg-surface px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Layers className="h-7 w-7" />
            </span>
            <h3 className="display mt-4 text-lg text-ink">Belum ada model aktif</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Tambahkan provider beserta API key, lalu daftarkan minimal satu model aktif sebelum
              memetakan task.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button href="/admin/ai/providers" variant="outline" size="sm">
                <Cpu className="h-4 w-4" /> Atur Provider
              </Button>
              <Button href="/admin/ai/models" size="sm">
                <Layers className="h-4 w-4" /> Tambah Model
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-[3px] border border-line bg-surface">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-brand-50 text-left text-[11px] uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3 font-bold">Task</th>
                  <th className="px-4 py-3 font-bold">Model aktif saat ini</th>
                  <th className="px-4 py-3 font-bold">Pilih model</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {TASKS.map((t) => {
                  const current = bindingByTask.get(t.key);
                  const Icon = t.icon;
                  const selectId = `model-${t.key}`;
                  return (
                    <tr key={t.key} className="border-t border-line align-top hover:bg-brand-50/60">
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-2.5">
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="font-bold text-ink">{t.label}</p>
                            <p className="text-[11px] text-muted">{t.desc}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {current ? (
                          <div className="space-y-1">
                            <span className="font-bold text-ink">{current.modelLabel}</span>
                            <Badge tone="muted">{current.providerName}</Badge>
                          </div>
                        ) : (
                          <Badge tone="warning">Belum diatur</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <form
                          action={setTaskBinding}
                          className="flex flex-wrap items-center gap-2"
                          id={`form-${t.key}`}
                        >
                          <input type="hidden" name="task" value={t.key} />
                          <label htmlFor={selectId} className="sr-only">
                            Model untuk task {t.label}
                          </label>
                          <select
                            id={selectId}
                            name="modelId"
                            defaultValue={current?.modelDbId ?? ""}
                            required
                            className="h-11 min-w-[220px] rounded-sm border border-line bg-surface px-3 text-sm text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                          >
                            <option value="" disabled>
                              Pilih model…
                            </option>
                            {modelOptions.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.providerName} · {m.label}
                              </option>
                            ))}
                          </select>
                        </form>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button type="submit" form={`form-${t.key}`} size="sm" className="ml-auto">
                          Simpan
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
          <ExternalLink className="h-3 w-3" />
          Hanya model berstatus aktif yang muncul di pilihan. Mengubah pemetaan langsung berlaku pada
          fitur AI terkait.
        </p>
      </section>

      {/* ===================================================================== */}
      {/* RAG / EMBEDDING                                                        */}
      {/* ===================================================================== */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-brand-600" />
          <h2 className="display text-lg text-ink">RAG / Embedding</h2>
          <Badge tone={ragReady ? "success" : "warning"}>
            {ragReady ? "Siap" : "Belum siap"}
          </Badge>
        </div>

        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-sm bg-brand-50 text-brand-600">
              <Network className="h-6 w-6" />
            </span>
            <div className="space-y-1">
              <p className="font-bold text-ink">Index Konten (RAG)</p>
              <p className="max-w-xl text-sm text-muted">
                Membuat embedding (vektor) dari konten publik—catatan &amp; artikel terbit,
                perpustakaan, jawaban Tanya Ustadz, dan kajian—lalu menyimpannya untuk pencarian
                semantik &amp; tanya-jawab dokumen.
              </p>
              <p className="text-[11px] text-muted">
                Membutuhkan provider + model untuk task <span className="font-bold">embedding</span>{" "}
                yang memiliki API key.{" "}
                {ragReady ? (
                  "Konfigurasi terdeteksi siap dipakai."
                ) : (
                  <span className="text-amber-700">
                    Belum siap: petakan task embedding di tabel di atas.
                  </span>
                )}
              </p>
            </div>
          </div>

          <form action={reindexContentAction} className="shrink-0">
            <Button type="submit" disabled={!ragReady} className="w-full sm:w-auto">
              <Database className="h-4 w-4" /> Index Konten
            </Button>
          </form>
        </Card>

        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted">
          <ExternalLink className="h-3 w-3" />
          Proses ini menimpa embedding lama tiap konten (idempoten). Jalankan ulang setelah konten
          berubah agar hasil RAG tetap relevan.
        </p>
      </section>
    </div>
  );
}
