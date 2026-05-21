import { and, desc, eq, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { embeddingConfigured, runAIEmbedding } from "@/lib/ai";

/**
 * Retrieval untuk grounding Tanya AI.
 *
 * Strategi: RAG VEKTOR dulu (pgvector / cosine similarity di content_embeddings),
 * lalu FALLBACK ke pencarian lexical (ILIKE) bila embedding belum dikonfigurasi,
 * tabel embedding kosong, atau terjadi error. Bentuk hasil {title, snippet, href,
 * source} dijaga konsisten agar kompatibel dengan /api/ai/chat.
 *
 * Konten yang dipakai hanya yang AKTIF (deleted_at IS NULL) dan layak tampil
 * publik (status 'published' bila ada), dikembalikan sebagai daftar
 * {title, snippet, href} untuk KONTEKS prompt + SITASI.
 */

export type KnowledgeHit = {
  /** Judul sumber, dipakai sebagai label sitasi. */
  title: string;
  /** Potongan teks ringkas untuk konteks model. */
  snippet: string;
  /** Tautan ke sumber asli (relatif/absolut). */
  href: string;
  /** Asal data — untuk ikon/label di UI. */
  source: "catatan" | "perpustakaan" | "tanya-ustadz";
};

/** Ringkas teks panjang menjadi snippet (single-line, dipangkas). */
function snippetOf(value: string | null | undefined, max = 280): string {
  if (!value) return "";
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

/**
 * Ekstrak kata kunci dari query (buang kata terlalu pendek/umum).
 * Maks 5 kata agar query ILIKE tetap ringan.
 */
function keywords(query: string): string[] {
  const stop = new Set([
    "yang", "dan", "atau", "dengan", "untuk", "pada", "apa", "apakah",
    "bagaimana", "kenapa", "mengapa", "saya", "kita", "ini", "itu", "dari",
    "ke", "di", "the", "is", "are", "tentang", "mohon", "tolong",
  ]);
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((w) => w.length >= 3 && !stop.has(w)),
    ),
  ).slice(0, 5);
}

/** Buat kondisi OR berisi ILIKE %kw% untuk satu kolom. */
function ilikeAny(column: Parameters<typeof ilike>[0], terms: string[]): SQL | undefined {
  const parts = terms.map((t) => ilike(column, `%${t}%`));
  if (parts.length === 0) return undefined;
  return parts.length === 1 ? parts[0] : or(...parts);
}

/* ============================================================
 * RAG VEKTOR (pgvector / cosine similarity)
 * ============================================================ */

/** Baris mentah dari content_embeddings hasil pencarian vektor. */
type EmbeddingRow = {
  sourceType: string;
  sourceId: string;
  chunkText: string;
  score: number;
};

/**
 * Susun literal pgvector "[a,b,...]" dari array angka.
 * Saring nilai non-finite agar literal tetap valid.
 */
function toVectorLiteral(values: number[]): string {
  return `[${values.map((v) => (Number.isFinite(v) ? v : 0)).join(",")}]`;
}

/**
 * Resolve judul/href per sourceType dengan satu query per tabel sumber
 * (batch via inArray) lalu petakan kembali ke urutan skor embedding.
 * Mengembalikan null bila tidak ada baris embedding yang bisa di-resolve.
 */
async function resolveEmbeddingHits(rows: EmbeddingRow[]): Promise<KnowledgeHit[]> {
  const idsByType = new Map<string, string[]>();
  for (const r of rows) {
    const list = idsByType.get(r.sourceType) ?? [];
    list.push(r.sourceId);
    idsByType.set(r.sourceType, list);
  }

  // Resolusi judul/slug/href per tabel sumber (hanya yang aktif & published).
  type Meta = { title: string; href: string; source: KnowledgeHit["source"] };
  const meta = new Map<string, Meta>(); // key = `${sourceType}:${sourceId}`

  const tasks: Promise<void>[] = [];

  const postIds = idsByType.get("post");
  if (postIds && postIds.length > 0) {
    tasks.push(
      db
        .select({ id: schema.posts.id, title: schema.posts.title, slug: schema.posts.slug })
        .from(schema.posts)
        .where(
          and(
            inArray(schema.posts.id, postIds),
            isNull(schema.posts.deletedAt),
            eq(schema.posts.status, "published"),
          ),
        )
        .then((res) => {
          for (const p of res) {
            meta.set(`post:${p.id}`, {
              title: p.title,
              href: `/catatan/${p.slug}`,
              source: "catatan",
            });
          }
        }),
    );
  }

  const libIds = idsByType.get("library");
  if (libIds && libIds.length > 0) {
    tasks.push(
      db
        .select({
          id: schema.libraryItems.id,
          title: schema.libraryItems.title,
          pdfUrl: schema.libraryItems.pdfUrl,
        })
        .from(schema.libraryItems)
        .where(
          and(
            inArray(schema.libraryItems.id, libIds),
            isNull(schema.libraryItems.deletedAt),
            eq(schema.libraryItems.status, "published"),
          ),
        )
        .then((res) => {
          for (const l of res) {
            meta.set(`library:${l.id}`, {
              title: l.title,
              href: l.pdfUrl || "/perpustakaan",
              source: "perpustakaan",
            });
          }
        }),
    );
  }

  const answerIds = idsByType.get("answer");
  if (answerIds && answerIds.length > 0) {
    tasks.push(
      db
        .select({
          id: schema.answers.id,
          questionTitle: schema.questions.title,
        })
        .from(schema.answers)
        .innerJoin(schema.questions, eq(schema.questions.id, schema.answers.questionId))
        .where(
          and(
            inArray(schema.answers.id, answerIds),
            isNull(schema.answers.deletedAt),
            isNull(schema.questions.deletedAt),
            eq(schema.questions.status, "published"),
          ),
        )
        .then((res) => {
          for (const a of res) {
            meta.set(`answer:${a.id}`, {
              title: a.questionTitle,
              href: "/tanya-ustadz",
              source: "tanya-ustadz",
            });
          }
        }),
    );
  }

  const kajianIds = idsByType.get("kajian");
  if (kajianIds && kajianIds.length > 0) {
    tasks.push(
      db
        .select({ id: schema.kajian.id, title: schema.kajian.title, slug: schema.kajian.slug })
        .from(schema.kajian)
        .where(
          and(
            inArray(schema.kajian.id, kajianIds),
            isNull(schema.kajian.deletedAt),
            eq(schema.kajian.status, "published"),
          ),
        )
        .then((res) => {
          for (const k of res) {
            // Tidak ada label "kajian" pada union source → pakai "catatan"
            // (ikon BookOpen) namun href tetap ke halaman kajian.
            meta.set(`kajian:${k.id}`, {
              title: k.title,
              href: `/kajian/${k.slug}`,
              source: "catatan",
            });
          }
        }),
    );
  }

  await Promise.all(tasks);

  // Petakan kembali sesuai urutan skor; buang yang tak ter-resolve (mis. sudah
  // dihapus / belum published / sourceType tak dikenal).
  const hits: KnowledgeHit[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const key = `${r.sourceType}:${r.sourceId}`;
    if (seen.has(key)) continue;
    const m = meta.get(key);
    if (!m) continue;
    seen.add(key);
    hits.push({
      title: m.title,
      snippet: snippetOf(r.chunkText) || m.title,
      href: m.href,
      source: m.source,
    });
  }
  return hits;
}

/**
 * Pencarian vektor: embed query → cari tetangga terdekat (cosine) di
 * content_embeddings → resolve metadata sumber. Mengembalikan null bila
 * tidak layak (belum dikonfigurasi / tabel kosong / error) agar pemanggil
 * jatuh ke fallback ILIKE.
 */
async function searchByVector(query: string, limit: number): Promise<KnowledgeHit[] | null> {
  try {
    if (!(await embeddingConfigured())) return null;

    // Pastikan tabel embedding tidak kosong sebelum membuang kuota embed query.
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(schema.contentEmbeddings)
      .where(sql`${schema.contentEmbeddings.embedding} is not null`)
      .limit(1);
    if (!Number(n)) return null;

    const vectors = await runAIEmbedding([query]);
    const vec = vectors?.[0];
    if (!vec || vec.length === 0) return null;
    const vecLiteral = toVectorLiteral(vec);

    // Ambil lebih banyak kandidat dari limit agar setelah resolusi (filter
    // published/aktif & dedup) tetap cukup untuk diisi sampai `limit`.
    const candidateLimit = Math.max(limit * 4, limit);

    const rows = (await db
      .select({
        sourceType: schema.contentEmbeddings.sourceType,
        sourceId: schema.contentEmbeddings.sourceId,
        chunkText: schema.contentEmbeddings.chunkText,
        score: sql<number>`1 - (${schema.contentEmbeddings.embedding} <=> ${vecLiteral}::vector)`,
      })
      .from(schema.contentEmbeddings)
      .where(sql`${schema.contentEmbeddings.embedding} is not null`)
      .orderBy(sql`${schema.contentEmbeddings.embedding} <=> ${vecLiteral}::vector`)
      .limit(candidateLimit)) as EmbeddingRow[];

    if (rows.length === 0) return null;

    const hits = await resolveEmbeddingHits(rows);
    return hits.slice(0, limit);
  } catch {
    // Error apa pun (extension belum aktif, dimensi tak cocok, jaringan, dll)
    // → kembalikan null agar pemanggil fallback ke ILIKE.
    return null;
  }
}

/* ============================================================
 * FALLBACK LEXICAL (ILIKE)
 * ============================================================ */

/**
 * Cari potongan relevan dari posts (catatan/artikel), library_items, dan answers
 * memakai ILIKE. Dipakai sebagai fallback saat RAG vektor tak tersedia.
 */
async function searchByIlike(query: string, limit: number): Promise<KnowledgeHit[]> {
  const terms = keywords(query);
  if (terms.length === 0) return [];

  const perSource = Math.max(2, Math.ceil(limit / 2));

  // 1) POSTS (catatan/artikel) — hanya yang published.
  const postCond = or(
    ilikeAny(schema.posts.title, terms),
    ilikeAny(schema.posts.excerpt, terms),
  );
  const postsQ = db
    .select({
      title: schema.posts.title,
      slug: schema.posts.slug,
      excerpt: schema.posts.excerpt,
    })
    .from(schema.posts)
    .where(
      and(
        isNull(schema.posts.deletedAt),
        eq(schema.posts.status, "published"),
        postCond,
      ),
    )
    .orderBy(desc(schema.posts.publishedAt), desc(schema.posts.createdAt))
    .limit(perSource);

  // 2) LIBRARY_ITEMS — hanya yang published.
  const libCond = or(
    ilikeAny(schema.libraryItems.title, terms),
    ilikeAny(schema.libraryItems.description, terms),
  );
  const libQ = db
    .select({
      title: schema.libraryItems.title,
      description: schema.libraryItems.description,
      pdfUrl: schema.libraryItems.pdfUrl,
    })
    .from(schema.libraryItems)
    .where(
      and(
        isNull(schema.libraryItems.deletedAt),
        eq(schema.libraryItems.status, "published"),
        libCond,
      ),
    )
    .orderBy(desc(schema.libraryItems.createdAt))
    .limit(perSource);

  // 3) ANSWERS (jawaban ustadz) — gabung ke pertanyaan untuk judul.
  const ansCond = or(
    ilikeAny(schema.answers.body, terms),
    ilikeAny(schema.questions.title, terms),
  );
  const ansQ = db
    .select({
      questionTitle: schema.questions.title,
      body: schema.answers.body,
      ustadzName: schema.ustadzProfiles.name,
    })
    .from(schema.answers)
    .innerJoin(schema.questions, eq(schema.questions.id, schema.answers.questionId))
    .innerJoin(
      schema.ustadzProfiles,
      eq(schema.ustadzProfiles.id, schema.answers.ustadzId),
    )
    .where(
      and(
        isNull(schema.answers.deletedAt),
        isNull(schema.questions.deletedAt),
        eq(schema.questions.status, "published"),
        ansCond,
      ),
    )
    .orderBy(desc(schema.answers.createdAt))
    .limit(perSource);

  const [postRows, libRows, ansRows] = await Promise.all([postsQ, libQ, ansQ]);

  const hits: KnowledgeHit[] = [];

  for (const p of postRows) {
    hits.push({
      title: p.title,
      snippet: snippetOf(p.excerpt) || p.title,
      href: `/catatan/${p.slug}`,
      source: "catatan",
    });
  }

  for (const l of libRows) {
    hits.push({
      title: l.title,
      snippet: snippetOf(l.description) || l.title,
      href: l.pdfUrl || "/perpustakaan",
      source: "perpustakaan",
    });
  }

  for (const a of ansRows) {
    hits.push({
      title: a.questionTitle,
      snippet: snippetOf(`Jawaban ${a.ustadzName}: ${a.body}`),
      href: "/tanya-ustadz",
      source: "tanya-ustadz",
    });
  }

  // Interleave per-sumber agar variatif, lalu potong ke limit.
  return hits.slice(0, limit);
}

/* ============================================================
 * ENTRY POINT
 * ============================================================ */

/**
 * Cari potongan relevan untuk grounding Tanya AI.
 *
 * Mengutamakan RAG vektor (cosine similarity di content_embeddings); bila
 * embedding belum dikonfigurasi, tabel kosong, atau gagal, otomatis fallback
 * ke pencarian lexical (ILIKE). Mengembalikan maksimum `limit` hit (default 5).
 */
export async function searchKnowledge(query: string, limit = 5): Promise<KnowledgeHit[]> {
  const q = query.trim();
  if (!q) return [];

  // 1) Coba RAG vektor.
  const vectorHits = await searchByVector(q, limit);
  if (vectorHits && vectorHits.length > 0) return vectorHits;

  // 2) Fallback lexical (ILIKE) — implementasi lama dipertahankan.
  return searchByIlike(q, limit);
}
