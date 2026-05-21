import { and, count, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  financeCategories,
  financeTransactions,
  titikDakwah,
} from "../../../db/schema";

/**
 * Query layer KEUANGAN — sumber data NYATA dari Neon (Drizzle).
 * Default selalu `WHERE deleted_at IS NULL` (soft delete, lihat AGENTS.md §4).
 */

export type TransactionRow = {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  trxDate: Date;
  proofUrl: string | null;
  categoryName: string | null;
  scopeName: string; // "Global (Kas Pusat)" atau nama titik dakwah
};

export type FinanceSummary = {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  count: number;
};

/** Daftar transaksi aktif (terbaru dulu), lengkap dengan nama kategori & scope. */
export async function listTransactions(limit?: number): Promise<TransactionRow[]> {
  const base = db
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
    .where(isNull(financeTransactions.deletedAt))
    .orderBy(desc(financeTransactions.trxDate));

  const rows = limit ? await base.limit(limit) : await base;

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description,
    trxDate: r.trxDate,
    proofUrl: r.proofUrl,
    categoryName: r.categoryName,
    scopeName: r.titikName ?? "Global (Kas Pusat)",
  }));
}

/** Daftar transaksi aktif dengan pagination (terbaru dulu). page mulai dari 1. */
export async function listTransactionsPaged(
  page: number,
  pageSize: number,
): Promise<TransactionRow[]> {
  const safePage = Math.max(1, Math.floor(page) || 1);
  const safeSize = Math.max(1, Math.floor(pageSize) || 1);

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
    .where(isNull(financeTransactions.deletedAt))
    .orderBy(desc(financeTransactions.trxDate))
    .limit(safeSize)
    .offset((safePage - 1) * safeSize);

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    description: r.description,
    trxDate: r.trxDate,
    proofUrl: r.proofUrl,
    categoryName: r.categoryName,
    scopeName: r.titikName ?? "Global (Kas Pusat)",
  }));
}

/** Jumlah total transaksi aktif (untuk hitung total halaman). */
export async function countTransactions(): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(financeTransactions)
    .where(isNull(financeTransactions.deletedAt));

  return Number(row?.value ?? 0);
}

/** Satu transaksi aktif berdasarkan id (untuk halaman edit). null bila tidak ada. */
export async function getTransactionById(id: string): Promise<{
  id: string;
  titikDakwahId: string | null;
  categoryId: string | null;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  trxDate: Date;
  proofUrl: string | null;
} | null> {
  const [row] = await db
    .select({
      id: financeTransactions.id,
      titikDakwahId: financeTransactions.titikDakwahId,
      categoryId: financeTransactions.categoryId,
      type: financeTransactions.type,
      amount: financeTransactions.amount,
      description: financeTransactions.description,
      trxDate: financeTransactions.trxDate,
      proofUrl: financeTransactions.proofUrl,
    })
    .from(financeTransactions)
    .where(and(eq(financeTransactions.id, id), isNull(financeTransactions.deletedAt)))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    titikDakwahId: row.titikDakwahId,
    categoryId: row.categoryId,
    type: row.type,
    amount: Number(row.amount),
    description: row.description,
    trxDate: row.trxDate,
    proofUrl: row.proofUrl,
  };
}

/** Daftar kategori keuangan aktif (untuk panel kategori). */
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
    .orderBy(desc(financeCategories.createdAt));
}

/**
 * Ringkasan keuangan: total pemasukan, pengeluaran & saldo.
 * Ambil semua transaksi aktif lalu reduce (jumlah transaksi MVP tidak besar).
 */
export async function getSummary(): Promise<FinanceSummary> {
  const rows = await db
    .select({
      type: financeTransactions.type,
      amount: financeTransactions.amount,
    })
    .from(financeTransactions)
    .where(isNull(financeTransactions.deletedAt));

  return rows.reduce<FinanceSummary>(
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

/** Pilihan scope untuk form: Global + titik dakwah aktif. */
export async function listScopes(): Promise<{ id: string | ""; name: string }[]> {
  const titik = await db
    .select({ id: titikDakwah.id, name: titikDakwah.name })
    .from(titikDakwah)
    .where(isNull(titikDakwah.deletedAt))
    .orderBy(titikDakwah.name);

  return [{ id: "", name: "Global (Kas Pusat)" }, ...titik];
}

/** Pilihan kategori untuk form (aktif). */
export async function listCategories(): Promise<
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
    .orderBy(financeCategories.name);
}

/** Komposisi pengeluaran per kategori (untuk grafik publik). */
export async function getExpenseComposition(): Promise<
  { label: string; value: number }[]
> {
  const rows = await db
    .select({
      categoryName: financeCategories.name,
      amount: financeTransactions.amount,
    })
    .from(financeTransactions)
    .leftJoin(financeCategories, eq(financeTransactions.categoryId, financeCategories.id))
    .where(
      and(isNull(financeTransactions.deletedAt), eq(financeTransactions.type, "expense")),
    );

  const map = new Map<string, number>();
  for (const r of rows) {
    const label = r.categoryName ?? "Lainnya";
    map.set(label, (map.get(label) ?? 0) + Number(r.amount));
  }

  return Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
