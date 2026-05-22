import { db, schema } from "@/lib/db";
import { desc, isNotNull } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * Query READ untuk RECYCLE BIN (Recycle Bin / Sampah).
 * Kebalikan dari konvensi normal: di sini justru memuat baris yang
 * `deletedAt IS NOT NULL` (sudah di-soft-delete) agar bisa dipulihkan
 * atau dihapus permanen — lihat AGENTS.md §4.
 */

/**
 * Tipe entitas yang didukung Recycle Bin.
 * Mencakup SEMUA tabel ber-`deletedAt` (soft delete) di db/schema.ts.
 */
export type SampahType =
  // 6.1 Auth & RBAC
  | "users"
  | "roles"
  | "menuItems"
  // 6.2 Entitas / Profil
  | "titikDakwah"
  | "ustadzProfiles"
  | "mediaPartners"
  | "businessPartners"
  // 6.3 Kajian, Jadwal & Media
  | "categories"
  | "kajian"
  | "kajianSchedules"
  | "mediaAssets"
  | "videos"
  // 6.4 Keuangan + Donasi
  | "financeCategories"
  | "financeTransactions"
  | "financeReports"
  | "donationCampaigns"
  | "donationUpdates"
  | "donationRecords"
  // 6.5 Konten Komunitas
  | "posts"
  | "tags"
  | "questions"
  | "answers"
  | "libraryItems"
  // 6.6 Belajar & Acara
  | "courses"
  | "courseModules"
  | "courseLessons"
  | "enrollments"
  | "events"
  | "eventRegistrations"
  // 6.7 Lapak
  | "products"
  // 6.8 AI & Sistem
  | "aiConversations"
  | "uiThemes"
  // 6.9 Storage & Pembayaran
  | "storageConfigs"
  | "paymentMethods"
  | "paymentConfirmations"
  // 6.10 AI Providers/Models
  | "aiProviders"
  | "aiModels"
  | "aiTaskBindings";

type SampahTableMeta = {
  /**
   * Tabel Drizzle (punya kolom id/deletedAt/deletedBy).
   * `updatedAt` OPSIONAL: sebagian tabel ber-soft-delete tidak punya kolom ini.
   */
  table: PgTable & {
    id: PgColumn;
    deletedAt: PgColumn;
    deletedBy: PgColumn;
    updatedAt?: PgColumn;
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
  // ── 6.1 Auth & RBAC ──────────────────────────────────────────
  users: {
    table: schema.users,
    labelCol: schema.users.name,
    title: "Pengguna",
  },
  roles: {
    table: schema.roles,
    labelCol: schema.roles.name,
    title: "Peran (Role)",
  },
  menuItems: {
    table: schema.menuItems,
    labelCol: schema.menuItems.label,
    title: "Menu Admin",
  },

  // ── 6.2 Entitas / Profil ─────────────────────────────────────
  titikDakwah: {
    table: schema.titikDakwah,
    labelCol: schema.titikDakwah.name,
    title: "Titik Dakwah",
  },
  ustadzProfiles: {
    table: schema.ustadzProfiles,
    labelCol: schema.ustadzProfiles.name,
    title: "Profil Ustadz",
  },
  mediaPartners: {
    table: schema.mediaPartners,
    labelCol: schema.mediaPartners.name,
    title: "Media Partner",
  },
  businessPartners: {
    table: schema.businessPartners,
    labelCol: schema.businessPartners.name,
    title: "Partner Usaha",
  },

  // ── 6.3 Kajian, Jadwal & Media ───────────────────────────────
  categories: {
    table: schema.categories,
    labelCol: schema.categories.name,
    title: "Kategori",
  },
  kajian: {
    table: schema.kajian,
    labelCol: schema.kajian.title,
    title: "Kajian",
  },
  kajianSchedules: {
    table: schema.kajianSchedules,
    labelCol: schema.kajianSchedules.title,
    title: "Jadwal Kajian",
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

  // ── 6.4 Keuangan + Donasi ────────────────────────────────────
  financeCategories: {
    table: schema.financeCategories,
    labelCol: schema.financeCategories.name,
    title: "Kategori Keuangan",
  },
  financeTransactions: {
    table: schema.financeTransactions,
    labelCol: schema.financeTransactions.description,
    title: "Transaksi Keuangan",
  },
  financeReports: {
    table: schema.financeReports,
    labelCol: schema.financeReports.title,
    title: "Laporan Keuangan",
  },
  donationCampaigns: {
    table: schema.donationCampaigns,
    labelCol: schema.donationCampaigns.title,
    title: "Kampanye Donasi",
  },
  donationUpdates: {
    table: schema.donationUpdates,
    labelCol: schema.donationUpdates.title,
    title: "Update Donasi",
  },
  donationRecords: {
    table: schema.donationRecords,
    labelCol: schema.donationRecords.donorName,
    title: "Catatan Donasi Masuk",
  },

  // ── 6.5 Konten Komunitas ─────────────────────────────────────
  posts: {
    table: schema.posts,
    labelCol: schema.posts.title,
    title: "Catatan & Artikel",
  },
  tags: {
    table: schema.tags,
    labelCol: schema.tags.name,
    title: "Tag",
  },
  questions: {
    table: schema.questions,
    labelCol: schema.questions.title,
    title: "Pertanyaan (Tanya Ustadz)",
  },
  answers: {
    table: schema.answers,
    labelCol: schema.answers.body,
    title: "Jawaban Ustadz",
  },
  libraryItems: {
    table: schema.libraryItems,
    labelCol: schema.libraryItems.title,
    title: "Perpustakaan",
  },

  // ── 6.6 Belajar & Acara ──────────────────────────────────────
  courses: {
    table: schema.courses,
    labelCol: schema.courses.title,
    title: "Kelas Online",
  },
  courseModules: {
    table: schema.courseModules,
    labelCol: schema.courseModules.title,
    title: "Modul Kelas",
  },
  courseLessons: {
    table: schema.courseLessons,
    labelCol: schema.courseLessons.title,
    title: "Pelajaran Kelas",
  },
  enrollments: {
    table: schema.enrollments,
    labelCol: schema.enrollments.userId,
    title: "Pendaftaran Kelas (Enrollment)",
  },
  events: {
    table: schema.events,
    labelCol: schema.events.title,
    title: "Event",
  },
  eventRegistrations: {
    table: schema.eventRegistrations,
    labelCol: schema.eventRegistrations.name,
    title: "Registrasi Event",
  },

  // ── 6.7 Lapak ────────────────────────────────────────────────
  products: {
    table: schema.products,
    labelCol: schema.products.title,
    title: "Lapak / Produk",
  },

  // ── 6.8 AI & Sistem ──────────────────────────────────────────
  aiConversations: {
    table: schema.aiConversations,
    labelCol: schema.aiConversations.title,
    title: "Percakapan AI",
  },
  uiThemes: {
    table: schema.uiThemes,
    labelCol: schema.uiThemes.name,
    title: "Tema UI",
  },

  // ── 6.9 Storage & Pembayaran ─────────────────────────────────
  storageConfigs: {
    table: schema.storageConfigs,
    labelCol: schema.storageConfigs.label,
    title: "Konfigurasi Storage",
  },
  paymentMethods: {
    table: schema.paymentMethods,
    labelCol: schema.paymentMethods.accountName,
    title: "Metode Pembayaran",
  },
  paymentConfirmations: {
    table: schema.paymentConfirmations,
    labelCol: schema.paymentConfirmations.payerName,
    title: "Konfirmasi Pembayaran",
  },

  // ── 6.10 AI Providers / Models ───────────────────────────────
  aiProviders: {
    table: schema.aiProviders,
    labelCol: schema.aiProviders.name,
    title: "Penyedia AI (Provider)",
  },
  aiModels: {
    table: schema.aiModels,
    labelCol: schema.aiModels.label,
    title: "Model AI",
  },
  aiTaskBindings: {
    table: schema.aiTaskBindings,
    labelCol: schema.aiTaskBindings.task,
    title: "Binding Tugas AI",
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
