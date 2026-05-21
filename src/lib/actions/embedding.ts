"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requirePermission } from "@/lib/rbac";
import { runAIEmbedding } from "@/lib/ai";

/**
 * Server action (MUTATION) untuk INFRA EMBEDDING / RAG.
 * - RBAC: requirePermission('settings.manage') (lihat AGENTS.md §4).
 * - Kumpulkan teks dari konten publik (posts/library_items/answers/kajian),
 *   buat embedding via task 'embedding', lalu simpan ke content_embeddings.
 * - Idempoten per item: HAPUS embedding lama (sourceType+sourceId) sebelum insert.
 * - Butuh provider+model task 'embedding' ber-API key (lihat /admin/ai).
 */

// Satu item konten yang akan di-index: identitas sumber + teks gabungan.
type IndexItem = {
  sourceType: "post" | "library" | "answer" | "kajian";
  sourceId: string;
  chunkText: string;
};

// Ukuran batch embedding per panggilan API (jaga payload tetap wajar).
const BATCH_SIZE = 50;

// Rapikan & batasi panjang teks agar payload embedding tidak kebablasan.
function buildChunk(parts: (string | null | undefined)[]): string {
  return parts
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join("\n\n")
    .slice(0, 8000);
}

/**
 * Reindex seluruh konten publik ke content_embeddings.
 * Mengembalikan ringkasan jumlah item ter-index (+ pesan ramah).
 */
export async function reindexContent(): Promise<{ indexed: number; message: string }> {
  await requirePermission("settings.manage");

  try {
    const items: IndexItem[] = [];

    // 1) Posts terpublikasi: judul + ringkasan (body asli = JSON Tiptap → pakai excerpt).
    const postRows = await db
      .select({
        id: schema.posts.id,
        title: schema.posts.title,
        excerpt: schema.posts.excerpt,
      })
      .from(schema.posts)
      .where(and(eq(schema.posts.status, "published"), isNull(schema.posts.deletedAt)));
    for (const r of postRows) {
      const chunkText = buildChunk([r.title, r.excerpt]);
      if (chunkText) items.push({ sourceType: "post", sourceId: r.id, chunkText });
    }

    // 2) Perpustakaan terpublikasi: judul + deskripsi.
    const libRows = await db
      .select({
        id: schema.libraryItems.id,
        title: schema.libraryItems.title,
        description: schema.libraryItems.description,
      })
      .from(schema.libraryItems)
      .where(
        and(eq(schema.libraryItems.status, "published"), isNull(schema.libraryItems.deletedAt)),
      );
    for (const r of libRows) {
      const chunkText = buildChunk([r.title, r.description]);
      if (chunkText) items.push({ sourceType: "library", sourceId: r.id, chunkText });
    }

    // 3) Jawaban ustadz (Tanya Ustadz): isi jawaban.
    const answerRows = await db
      .select({
        id: schema.answers.id,
        body: schema.answers.body,
      })
      .from(schema.answers)
      .where(isNull(schema.answers.deletedAt));
    for (const r of answerRows) {
      const chunkText = buildChunk([r.body]);
      if (chunkText) items.push({ sourceType: "answer", sourceId: r.id, chunkText });
    }

    // 4) Kajian terpublikasi: judul + deskripsi.
    const kajianRows = await db
      .select({
        id: schema.kajian.id,
        title: schema.kajian.title,
        description: schema.kajian.description,
      })
      .from(schema.kajian)
      .where(and(eq(schema.kajian.status, "published"), isNull(schema.kajian.deletedAt)));
    for (const r of kajianRows) {
      const chunkText = buildChunk([r.title, r.description]);
      if (chunkText) items.push({ sourceType: "kajian", sourceId: r.id, chunkText });
    }

    if (items.length === 0) {
      return { indexed: 0, message: "Tidak ada konten publik untuk di-index." };
    }

    // Proses per batch: panggil embedding, lalu replace (hapus lama → insert baru).
    let indexed = 0;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      const vectors = await runAIEmbedding(batch.map((b) => b.chunkText));

      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const embedding = vectors[j];
        if (!embedding || embedding.length === 0) continue;

        // Idempoten: bersihkan embedding lama untuk (sourceType, sourceId).
        await db
          .delete(schema.contentEmbeddings)
          .where(
            and(
              eq(schema.contentEmbeddings.sourceType, item.sourceType),
              eq(schema.contentEmbeddings.sourceId, item.sourceId),
            ),
          );

        await db.insert(schema.contentEmbeddings).values({
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          chunkText: item.chunkText,
          embedding,
        });
        indexed++;
      }
    }

    return {
      indexed,
      message: `Berhasil meng-index ${indexed} konten ke basis RAG.`,
    };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Kesalahan tak terduga.";
    throw new Error(`Gagal meng-index konten: ${detail}`);
  }
}

/**
 * Pembungkus form-action: dipakai langsung di `<form action={reindexContentAction}>`.
 * Menelan nilai kembalian (form action harus bertipe void) & memuat ulang halaman.
 */
export async function reindexContentAction(_formData: FormData): Promise<void> {
  await reindexContent();
  revalidatePath("/admin/ai");
}
