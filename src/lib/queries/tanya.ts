import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  answers,
  categories,
  questions,
  ustadzProfiles,
  users,
} from "../../../db/schema";

/**
 * Query layer untuk modul Tanya Ustadz.
 * Selalu memfilter soft-delete (deleted_at IS NULL) sesuai konvensi repo.
 */

export type QuestionFilter = "all" | "pending" | "answered";

export type AnswerItem = {
  id: string;
  body: string;
  ustadzName: string;
  ustadzSpecialization: string | null;
  createdAt: Date;
};

export type QuestionListItem = {
  id: string;
  title: string;
  body: string;
  status: "pending" | "answered" | "published";
  isPublic: boolean;
  isAnonymous: boolean;
  /** Nama penanya siap-tampil ("Hamba Allah" bila anonim / tanpa nama). */
  askerDisplay: string;
  categoryName: string | null;
  createdAt: Date;
  answers: AnswerItem[];
};

/** Nama penanya siap-tampil: anonim => "Hamba Allah". */
function resolveAsker(
  isAnonymous: boolean,
  askerName: string | null,
  userName: string | null,
): string {
  if (isAnonymous) return "Hamba Allah";
  return askerName?.trim() || userName?.trim() || "Hamba Allah";
}

/**
 * Daftar pertanyaan (terbaru dulu) lengkap dengan jawaban ustadz bila ada.
 * filter: 'all' (default), 'pending' (belum dijawab), 'answered' (sudah dijawab/terbit).
 */
export async function listQuestions(
  filter: QuestionFilter = "all",
  publicOnly = false,
): Promise<QuestionListItem[]> {
  const conds = [isNull(questions.deletedAt)];
  if (publicOnly) conds.push(eq(questions.isPublic, true));
  if (filter === "pending") conds.push(eq(questions.status, "pending"));
  if (filter === "answered") {
    // 'answered' mencakup status answered & published (sudah ada jawaban).
    // Difilter di JS karena status bisa salah satu dari keduanya.
  }

  const rows = await db
    .select({
      id: questions.id,
      title: questions.title,
      body: questions.body,
      status: questions.status,
      isPublic: questions.isPublic,
      isAnonymous: questions.isAnonymous,
      askerName: questions.askerName,
      userName: users.name,
      categoryName: categories.name,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .leftJoin(categories, eq(questions.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(desc(questions.createdAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // Ambil semua jawaban untuk pertanyaan-pertanyaan tsb dalam satu query.
  const answerRows = await db
    .select({
      id: answers.id,
      questionId: answers.questionId,
      body: answers.body,
      ustadzName: ustadzProfiles.name,
      ustadzSpecialization: ustadzProfiles.specialization,
      createdAt: answers.createdAt,
    })
    .from(answers)
    .innerJoin(ustadzProfiles, eq(answers.ustadzId, ustadzProfiles.id))
    .where(isNull(answers.deletedAt))
    .orderBy(desc(answers.createdAt));

  const byQuestion = new Map<string, AnswerItem[]>();
  for (const a of answerRows) {
    if (!ids.includes(a.questionId)) continue;
    const list = byQuestion.get(a.questionId) ?? [];
    list.push({
      id: a.id,
      body: a.body,
      ustadzName: a.ustadzName,
      ustadzSpecialization: a.ustadzSpecialization,
      createdAt: a.createdAt,
    });
    byQuestion.set(a.questionId, list);
  }

  const mapped: QuestionListItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    status: r.status,
    isPublic: r.isPublic,
    isAnonymous: r.isAnonymous,
    askerDisplay: resolveAsker(r.isAnonymous, r.askerName, r.userName),
    categoryName: r.categoryName,
    createdAt: r.createdAt,
    answers: byQuestion.get(r.id) ?? [],
  }));

  if (filter === "answered") {
    return mapped.filter((q) => q.answers.length > 0);
  }
  return mapped;
}

/** Detail satu pertanyaan beserta jawabannya. null bila tidak ditemukan/terhapus. */
export async function getQuestion(
  id: string,
): Promise<QuestionListItem | null> {
  const rows = await db
    .select({
      id: questions.id,
      title: questions.title,
      body: questions.body,
      status: questions.status,
      isPublic: questions.isPublic,
      isAnonymous: questions.isAnonymous,
      askerName: questions.askerName,
      userName: users.name,
      categoryName: categories.name,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .leftJoin(categories, eq(questions.categoryId, categories.id))
    .where(and(eq(questions.id, id), isNull(questions.deletedAt)))
    .limit(1);

  const q = rows[0];
  if (!q) return null;

  const answerRows = await db
    .select({
      id: answers.id,
      body: answers.body,
      ustadzName: ustadzProfiles.name,
      ustadzSpecialization: ustadzProfiles.specialization,
      createdAt: answers.createdAt,
    })
    .from(answers)
    .innerJoin(ustadzProfiles, eq(answers.ustadzId, ustadzProfiles.id))
    .where(and(eq(answers.questionId, id), isNull(answers.deletedAt)))
    .orderBy(desc(answers.createdAt));

  return {
    id: q.id,
    title: q.title,
    body: q.body,
    status: q.status,
    isPublic: q.isPublic,
    isAnonymous: q.isAnonymous,
    askerDisplay: resolveAsker(q.isAnonymous, q.askerName, q.userName),
    categoryName: q.categoryName,
    createdAt: q.createdAt,
    answers: answerRows.map((a) => ({
      id: a.id,
      body: a.body,
      ustadzName: a.ustadzName,
      ustadzSpecialization: a.ustadzSpecialization,
      createdAt: a.createdAt,
    })),
  };
}

export type QaCategory = { id: string; name: string };

/** Kategori bertipe 'qa' yang aktif (untuk form ajukan). Bisa kosong. */
export async function listQaCategories(): Promise<QaCategory[]> {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(and(eq(categories.type, "qa"), isNull(categories.deletedAt)))
    .orderBy(categories.name);
}

/** Daftar pertanyaan per halaman (+ total) lengkap dgn jawaban. publicOnly → hanya is_public. */
export async function listQuestionsPaged(
  page: number,
  pageSize: number,
  opts: { publicOnly?: boolean } = {},
): Promise<{ rows: QuestionListItem[]; total: number }> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 10);
  const conds = [isNull(questions.deletedAt)];
  if (opts.publicOnly) conds.push(eq(questions.isPublic, true));

  const [totalRow] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(questions)
    .where(and(...conds));
  const total = totalRow?.c ?? 0;

  const rows = await db
    .select({
      id: questions.id,
      title: questions.title,
      body: questions.body,
      status: questions.status,
      isPublic: questions.isPublic,
      isAnonymous: questions.isAnonymous,
      askerName: questions.askerName,
      userName: users.name,
      categoryName: categories.name,
      createdAt: questions.createdAt,
    })
    .from(questions)
    .leftJoin(users, eq(questions.userId, users.id))
    .leftJoin(categories, eq(questions.categoryId, categories.id))
    .where(and(...conds))
    .orderBy(desc(questions.createdAt))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);

  if (rows.length === 0) return { rows: [], total };

  const ids = rows.map((r) => r.id);
  const answerRows = await db
    .select({
      id: answers.id,
      questionId: answers.questionId,
      body: answers.body,
      ustadzName: ustadzProfiles.name,
      ustadzSpecialization: ustadzProfiles.specialization,
      createdAt: answers.createdAt,
    })
    .from(answers)
    .innerJoin(ustadzProfiles, eq(answers.ustadzId, ustadzProfiles.id))
    .where(isNull(answers.deletedAt))
    .orderBy(desc(answers.createdAt));

  const byQuestion = new Map<string, AnswerItem[]>();
  for (const a of answerRows) {
    if (!ids.includes(a.questionId)) continue;
    const list = byQuestion.get(a.questionId) ?? [];
    list.push({
      id: a.id,
      body: a.body,
      ustadzName: a.ustadzName,
      ustadzSpecialization: a.ustadzSpecialization,
      createdAt: a.createdAt,
    });
    byQuestion.set(a.questionId, list);
  }

  const mapped: QuestionListItem[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    status: r.status,
    isPublic: r.isPublic,
    isAnonymous: r.isAnonymous,
    askerDisplay: resolveAsker(r.isAnonymous, r.askerName, r.userName),
    categoryName: r.categoryName,
    createdAt: r.createdAt,
    answers: byQuestion.get(r.id) ?? [],
  }));

  return { rows: mapped, total };
}
