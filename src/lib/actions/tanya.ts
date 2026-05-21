"use server";

import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermission } from "@/lib/rbac";
import { notify } from "@/lib/notify";
import { answers, questions, ustadzProfiles } from "../../../db/schema";

/**
 * Server actions modul Tanya Ustadz.
 * - askQuestion: terbuka untuk publik (tanpa permission khusus).
 * - answerQuestion: butuh permission 'qa.answer' (ustadz/penjawab); WAJIB pakai nama.
 */

function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 200) || "ustadz"
  );
}

const askSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(8, "Judul pertanyaan minimal 8 karakter.")
      .max(255, "Judul terlalu panjang."),
    body: z
      .string()
      .trim()
      .min(15, "Detail pertanyaan minimal 15 karakter."),
    categoryId: z.string().uuid().nullable(),
    isAnonymous: z.boolean(),
    askerName: z.string().trim().max(255).optional(),
  });

/**
 * Ajukan pertanyaan baru (publik). Jika user login: pakai user_id.
 * Jika tidak login & tidak anonim: asker_name WAJIB.
 * is_anonymous dari toggle; status 'pending'. Setelah simpan -> redirect /tanya-ustadz.
 */
export async function askQuestion(formData: FormData): Promise<void> {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const rawCategory = String(formData.get("category_id") ?? "").trim();
  const parsed = askSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    categoryId: rawCategory.length > 0 ? rawCategory : null,
    isAnonymous: String(formData.get("is_anonymous") ?? "") === "1",
    askerName: String(formData.get("asker_name") ?? ""),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const data = parsed.data;

  // Jika anonim -> nama tidak disimpan (tampil "Hamba Allah").
  // Jika tidak anonim & guest -> nama WAJIB.
  let askerName: string | null = null;
  if (!data.isAnonymous) {
    if (userId) {
      askerName = null; // nama diambil dari relasi user saat render
    } else {
      const name = data.askerName?.trim();
      if (!name) {
        throw new Error(
          'Mohon isi nama Anda, atau aktifkan opsi "Hamba Allah".',
        );
      }
      askerName = name;
    }
  }

  await db.insert(questions).values({
    userId,
    askerName,
    isAnonymous: data.isAnonymous,
    title: data.title,
    body: data.body,
    categoryId: data.categoryId,
    status: "pending",
  });

  revalidatePath("/tanya-ustadz");
  revalidatePath("/admin/tanya");
  redirect("/tanya-ustadz");
}

const answerSchema = z.object({
  questionId: z.string().uuid("Pertanyaan tidak valid."),
  body: z.string().trim().min(10, "Jawaban minimal 10 karakter."),
});

/**
 * Jawab pertanyaan (ustadz/penjawab). Butuh permission 'qa.answer'.
 * Nama penjawab WAJIB (tidak anonim) — diambil dari sesi (user.name).
 * Status pertanyaan diset 'answered'.
 */
export async function answerQuestion(formData: FormData): Promise<void> {
  await requirePermission("qa.answer");

  const session = await auth();
  const userId = session?.user?.id;
  const userName = session?.user?.name?.trim();
  if (!userId || !userName) {
    throw new Error("Sesi tidak valid. Silakan masuk kembali.");
  }

  const parsed = answerSchema.safeParse({
    questionId: String(formData.get("question_id") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  }
  const { questionId, body } = parsed.data;

  // Pastikan pertanyaan ada & belum terhapus.
  // Ambil juga userId penanya & judul untuk NOTIFIKASI in-app setelah dijawab.
  const qRows = await db
    .select({ id: questions.id, userId: questions.userId, title: questions.title })
    .from(questions)
    .where(and(eq(questions.id, questionId), isNull(questions.deletedAt)))
    .limit(1);
  const question = qRows[0];
  if (!question) throw new Error("Pertanyaan tidak ditemukan.");

  // answers.ustadz_id WAJIB (NOT NULL). Resolusi profil ustadz milik penjawab.
  // Bila belum ada profil, buat otomatis dengan NAMA dari sesi (jawaban WAJIB pakai nama).
  let ustadzId: string;
  const profileRows = await db
    .select({ id: ustadzProfiles.id })
    .from(ustadzProfiles)
    .where(and(eq(ustadzProfiles.userId, userId), isNull(ustadzProfiles.deletedAt)))
    .limit(1);

  if (profileRows[0]) {
    ustadzId = profileRows[0].id;
  } else {
    const slug = `${slugifyName(userName)}-${userId.slice(0, 8)}`;
    const inserted = await db
      .insert(ustadzProfiles)
      .values({
        userId,
        name: userName,
        slug,
        status: "active",
      })
      .returning({ id: ustadzProfiles.id });
    ustadzId = inserted[0].id;
  }

  await db.insert(answers).values({
    questionId,
    ustadzId,
    body,
  });

  // Tandai pertanyaan sudah dijawab + catat ustadz penjawab.
  await db
    .update(questions)
    .set({ status: "answered", assignedUstadzId: ustadzId, updatedAt: new Date() })
    .where(eq(questions.id, questionId));

  // NOTIFIKASI in-app: beri tahu penanya bahwa pertanyaannya dijawab.
  // Hanya bila penanya punya akun (userId ada); tamu/anonim tanpa akun dilewati.
  // Best-effort (notify dibungkus try/catch & skip bila userId null).
  await notify(question.userId, "question_answered", {
    title: "Pertanyaanmu dijawab",
    body: question.title,
    link: "/tanya-ustadz",
  });

  revalidatePath("/admin/tanya");
  revalidatePath("/tanya-ustadz");
}
