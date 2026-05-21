import { db, schema } from "@/lib/db";
import { desc, isNotNull } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * Query READ untuk RECYCLE BIN (Recycle Bin / Sampah).
 * Kebalikan dari konvensi normal: di sini justru memuat baris yang
 * `deletedAt IS NOT NULL` (sudah di-soft-delete) agar bisa dipulihkan
 * atau dihapus permanen — lihat AGENTS.md §4.
 */

/** Tipe entitas yang didukung Recycle Bin. */
export type SampahType =
  | "titikDakwah"
  | "kajian"
  | "donationCampaigns"
  | "financeTransactions"
  | "posts"
  | "libraryItems"
  | "courses"
  | "events"
  | "products"
  | "mediaAssets"
  | "videos";

type SampahTableMeta = {
  /** Tabel Drizzle (punya kolom id/deletedAt/deletedBy/updatedAt). */
  table: PgTable & {
    id: PgColumn;
    deletedAt: PgColumn;
    deletedBy: PgColumn;
    updatedAt: PgColumn;
  };
  /** Kolom yang dipakai sebagai label tampilan (name/title/caption/dll). */
  labelCol: PgColumn;
  /** Judul section yang ramah pengguna (Indonesia). */
  title: string;
};

/**
 * Peta tunggal entitas yang didukung Recycle Bin.
 * Dipakai bersama oleh queries (baca) & actions (restore/hard delete).
 */
export const TYPES: Record<SampahType, SampahTableMeta> = {
  titikDakwah: {
    table: schema.titikDakwah,
    labelCol: schema.titikDakwah.name,
    title: "Titik Dakwah",
  },
  kajian: {
    table: schema.kajian,
    labelCol: schema.kajian.title,
    title: "Kajian",
  },
  donationCampaigns: {
    table: schema.donationCampaigns,
    labelCol: schema.donationCampaigns.title,
    title: "Kampanye Donasi",
  },
  financeTransactions: {
    table: schema.financeTransactions,
    labelCol: schema.financeTransactions.description,
    title: "Transaksi Keuangan",
  },
  posts: {
    table: schema.posts,
    labelCol: schema.posts.title,
    title: "Catatan & Artikel",
  },
  libraryItems: {
    table: schema.libraryItems,
    labelCol: schema.libraryItems.title,
    title: "Perpustakaan",
  },
  courses: {
    table: schema.courses,
    labelCol: schema.courses.title,
    title: "Kelas Online",
  },
  events: {
    table: schema.events,
    labelCol: schema.events.title,
    title: "Event",
  },
  products: {
    table: schema.products,
    labelCol: schema.products.title,
    title: "Lapak / Produk",
  },
  mediaAssets: {
    table: schema.mediaAssets,
    labelCol: schema.mediaAssets.caption,
    title: "Media (Gambar/Berkas)",
  },
  videos: {
    table: schema.videos,
    labelCol: schema.videos.title,
    title: "Video",
  },
};

/** Daftar semua tipe yang didukung (urutan stabil untuk tampilan). */
export const SAMPAH_TYPES = Object.keys(TYPES) as SampahType[];

/** Validasi apakah suatu string adalah tipe Recycle Bin yang didukung. */
export function isSampahType(value: string): value is SampahType {
  return Object.prototype.hasOwnProperty.call(TYPES, value);
}

export type SampahItem = {
  type: SampahType;
  id: string;
  label: string;
  deletedAt: Date;
};

export type SampahSection = {
  type: SampahType;
  title: string;
  items: SampahItem[];
};

const PER_TYPE_LIMIT = 50;

/** Ambil baris ter-soft-delete untuk satu tipe (terbaru dihapus dulu). */
async function listDeletedForType(type: SampahType): Promise<SampahItem[]> {
  const meta = TYPES[type];

  const rows = await db
    .select({
      id: meta.table.id,
      label: meta.labelCol,
      deletedAt: meta.table.deletedAt,
    })
    .from(meta.table)
    .where(isNotNull(meta.table.deletedAt))
    .orderBy(desc(meta.table.deletedAt))
    .limit(PER_TYPE_LIMIT);

  return rows
    .filter((r): r is { id: string; label: string | null; deletedAt: Date } => r.deletedAt != null)
    .map((r) => ({
      type,
      id: r.id,
      label: r.label && String(r.label).trim().length ? String(r.label) : "(tanpa judul)",
      deletedAt: r.deletedAt,
    }));
}

/**
 * Ambil semua section Recycle Bin (satu per tipe, hanya yang berisi).
 * Section kosong tetap dikembalikan agar UI bisa menampilkan judul + 0,
 * tapi pemanggil boleh memfilter. Di sini section kosong DISERTAKAN dengan
 * items=[] supaya halaman bisa hitung total.
 */
export async function listSampah(): Promise<SampahSection[]> {
  const sections = await Promise.all(
    SAMPAH_TYPES.map(async (type) => ({
      type,
      title: TYPES[type].title,
      items: await listDeletedForType(type),
    })),
  );

  return sections;
}

/** Total item di seluruh Recycle Bin (untuk empty-state global). */
export function countSampah(sections: SampahSection[]): number {
  return sections.reduce((sum, s) => sum + s.items.length, 0);
}
