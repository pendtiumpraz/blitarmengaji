import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  financeCategories,
  financeTransactions,
  titikDakwah,
} from "../../../db/schema";

/**
 * Query READ untuk KELOLA KEUANGAN per-titik (route /kelola/keuangan).
 * Pengelola titik hanya melihat kas titik MILIKNYA (ownership manage_own,
 * lihat AGENTS.md §4) dan SELALU memfilter soft delete (deleted_at IS NULL).
 */

export type TitikOption = { id: string; name: string };

/** Daftar id titik dakwah milik user (aktif saja). Helper internal. */
async function myTitikIdList(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: titikDakwah.id })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)));
  return rows.map((r) => r.id);
}

/** Opsi titik dakwah milik user untuk dropdown form (id + nama). */
export async function myTitikOptions(userId: string): Promise<TitikOption[]> {
  return db
    .select({ id: titikDakwah.id, name: titikDakwah.name })
    .from(titikDakwah)
    .where(and(eq(titikDakwah.ownerUserId, userId), isNull(titikDakwah.deletedAt)))
    .orderBy(asc(titikDakwah.name));
}

export type MyTransactionRow = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  trxDate: Date;
  proofUrl: string | null;
  categoryName: string | null;
  titikName: string | null;
};

/**
 * Daftar transaksi keuangan pada titik milik user (aktif saja, terbaru dulu).
 * Join ke kategori (nama) & titik (nama). Kosong bila user tak punya titik.
 */
export async function myTitikTransactions(userId: string): Promise<MyTransactionRow[]> {
  const titikIds = await myTitikIdList(userId);
  if (titikIds.length === 0) return [];

  const rows = await db
    .select({
      id: financeTransactions.id,
      type: financeTransactions.type,
      amount: financeTransactions.amount,
      description: financeTransactions.description,
      trxDate: financeTransactions.trxDate,
      proofUrl: financeTransactions.proofUrl,
      categoryName: financeCategories.name,
      titikName: titikDakwah.name,
    })
    .from(financeTransactions)
    .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
    .leftJoin(titikDakwah, eq(financeTransactions.titikDakwahId, titikDakwah.id))
    .where(
      and(
        inArray(financeTransactions.titikDakwahId, titikIds),
        isNull(financeTransactions.deletedAt),
      ),
    )
    .orderBy(desc(financeTransactions.trxDate));

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description,
    trxDate: r.trxDate,
    proofUrl: r.proofUrl,
    categoryName: r.categoryName,
    titikName: r.titikName,
  }));
}

export type MySummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
};

/**
 * Ringkasan kas (pemasukan, pengeluaran, saldo) dari seluruh titik milik user.
 * Ambil transaksi aktif lalu reduce (volume MVP kecil).
 */
export async function mySummary(userId: string): Promise<MySummary> {
  const titikIds = await myTitikIdList(userId);
  if (titikIds.length === 0) {
    return { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 };
  }

  const rows = await db
    .select({
      type: financeTransactions.type,
      amount: financeTransactions.amount,
    })
    .from(financeTransactions)
    .where(
      and(
        inArray(financeTransactions.titikDakwahId, titikIds),
        isNull(financeTransactions.deletedAt),
      ),
    );

  return rows.reduce<MySummary>(
    (acc, r) => {
      const amount = Number(r.amount);
      if (r.type === "income") acc.totalIncome += amount;
      else acc.totalExpense += amount;
      acc.balance = acc.totalIncome - acc.totalExpense;
      acc.count += 1;
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, balance: 0, count: 0 },
  );
}

/** Daftar kategori keuangan aktif (untuk dropdown form). */
export async function listFinanceCategories(): Promise<
  { id: string; name: string; type: "income" | "expense" }[]
> {
  return db
    .select({
      id: financeCategories.id,
      name: financeCategories.name,
      type: financeCategories.type,
    })
    .from(financeCategories)
    .where(isNull(financeCategories.deletedAt))
    .orderBy(asc(financeCategories.name));
}
