/**
 * ============================================================
 * Blitar Mengaji — Drizzle ORM Schema (Postgres / Neon)
 * ============================================================
 * Sumber kebenaran: docs/BLITAR-MENGAJI-BRAINSTORM.md (Bagian 6).
 * Disusun per-grup sesuai dokumen desain:
 *   6.1 Auth & RBAC
 *   6.2 Entitas / Profil
 *   6.3 Kajian, Jadwal & Media
 *   6.4 Keuangan + Donasi
 *   6.5 Konten Komunitas
 *   6.6 Belajar & Acara
 *   6.7 Lapak
 *   6.8 AI & Sistem (termasuk ui_themes & users.theme_pref)
 *
 * Konvensi:
 *  - PK: uuid default random.
 *  - FK pakai suffix _id + references().
 *  - Semua tabel punya created_at & updated_at (kecuali tabel join/khusus).
 *  - Soft-delete via deleted_at untuk data penting.
 *  - Enum status/tipe pakai pgEnum.
 * ============================================================
 */

import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  bigint,
  numeric,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
  customType,
} from 'drizzle-orm/pg-core';

/* ============================================================
 * Helper SOFT DELETE (Recycle Bin) — lihat docs/DATABASE-ARCHITECTURE.md §2.
 * Spread `...softDelete` ke tiap pgTable ENTITAS/KONTEN agar konsisten.
 *   - deleted_at NULL = aktif; terisi = di-"sampah"-kan.
 *   - deleted_by = siapa yang menghapus.
 * Catatan: `deleted_by` SENGAJA tanpa .references(() => users.id) untuk
 * menghindari siklus deklarasi (helper ini dipakai di tabel `users` sendiri
 * & tabel lain yang dideklarasikan sebelum `users`). Integritas dijaga di
 * service layer / FK ditambahkan via migration manual bila diperlukan.
 * ============================================================ */
const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedBy: uuid('deleted_by'), // ref logis -> users.id (tanpa .references untuk hindari siklus)
};

/* ============================================================
 * Tipe custom: pgvector (untuk content_embeddings.embedding)
 * Dimensi 1024 (sesuai desain Bagian 6.8).
 * TODO: pastikan extension `pgvector` di-enable di Neon
 *       (CREATE EXTENSION IF NOT EXISTS vector;).
 * ============================================================ */
export const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1024)';
  },
  toDriver(value: number[]): string {
    // Disimpan sebagai literal pgvector: "[0.1,0.2,...]"
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return value
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(',')
      .filter(Boolean)
      .map(Number);
  },
});

/* ============================================================
 * ENUMS (status & tipe generik)
 * ============================================================ */
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'banned']);
export const entityStatusEnum = pgEnum('entity_status', ['active', 'pending', 'rejected']);
export const kajianTypeEnum = pgEnum('kajian_type', ['offline', 'online', 'hybrid']);
export const contentStatusEnum = pgEnum('content_status', ['draft', 'published']);
export const scheduleStatusEnum = pgEnum('schedule_status', ['scheduled', 'ongoing', 'done', 'cancelled']);
export const categoryTypeEnum = pgEnum('category_type', ['kajian', 'blog', 'library', 'qa']);
export const mediaOwnerTypeEnum = pgEnum('media_owner_type', ['titik', 'kajian', 'event', 'media', 'partner', 'course']);
export const mediaKindEnum = pgEnum('media_kind', ['image', 'pdf', 'doc']);
export const videoOwnerTypeEnum = pgEnum('video_owner_type', ['titik', 'media', 'partner', 'kajian']);
export const videoPlatformEnum = pgEnum('video_platform', ['youtube', 'facebook']);
export const financeTypeEnum = pgEnum('finance_type', ['income', 'expense']);
export const financeTrxStatusEnum = pgEnum('finance_trx_status', ['posted', 'draft']);
export const reportScopeEnum = pgEnum('report_scope', ['global', 'titik']);
export const donationStatusEnum = pgEnum('donation_status', ['active', 'completed', 'closed']);
export const postTypeEnum = pgEnum('post_type', ['catatan', 'artikel']);
export const questionStatusEnum = pgEnum('question_status', ['pending', 'answered', 'published']);
export const lessonKindEnum = pgEnum('lesson_kind', ['video', 'text', 'pdf']);
export const eventOrganizerTypeEnum = pgEnum('event_organizer_type', ['partner', 'internal']);
export const eventKindEnum = pgEnum('event_kind', ['webinar', 'offline', 'hybrid']);
export const registrationStatusEnum = pgEnum('registration_status', ['registered', 'attended', 'cancelled']);
export const productStatusEnum = pgEnum('product_status', ['active', 'inactive']);
export const aiRoleEnum = pgEnum('ai_role', ['user', 'assistant', 'system']);

// Storage per-entitas (lihat §3 DATABASE-ARCHITECTURE.md).
export const storageOwnerTypeEnum = pgEnum('storage_owner_type', ['global', 'user', 'titik', 'media', 'partner', 'ustadz']);
export const storageProviderEnum = pgEnum('storage_provider', ['vercel_blob', 's3', 'r2', 'other']);
export const storageStatusEnum = pgEnum('storage_status', ['active', 'disabled']);

// Pembayaran QRIS + konfirmasi WhatsApp (lihat §4 DATABASE-ARCHITECTURE.md).
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['qris', 'bank', 'ewallet']);
export const paymentKindEnum = pgEnum('payment_kind', ['donation', 'order']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'confirmed', 'rejected']);

/* ============================================================
 * 6.1 AUTH & RBAC
 * ============================================================ */

// Tabel pengguna inti. theme_pref null = ikuti default global (settings.default_theme).
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash'), // null jika nanti pakai OAuth
    phone: varchar('phone', { length: 32 }),
    image: text('image'),
    status: userStatusEnum('status').notNull().default('active'),
    themePref: varchar('theme_pref', { length: 64 }), // null = ikuti default global
    emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    emailUq: uniqueIndex('users_email_uq').on(t.email),
  }),
);

// NextAuth: accounts (untuk OAuth di masa depan — disiapkan walau MVP pakai Credentials).
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 64 }).notNull(),
    provider: varchar('provider', { length: 64 }).notNull(),
    providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: varchar('token_type', { length: 64 }),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (t) => ({
    providerUq: uniqueIndex('accounts_provider_uq').on(t.provider, t.providerAccountId),
  }),
);

// NextAuth: sessions (jika pakai database session strategy).
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: varchar('session_token', { length: 255 }).notNull().unique(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

// NextAuth: verification_tokens (email verify / magic link).
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: varchar('identifier', { length: 255 }).notNull(),
    token: varchar('token', { length: 255 }).notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.identifier, t.token] }),
  }),
);

// Role = kumpulan permission. is_system menandai role inti (tak boleh dihapus).
export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    // Partial unique: roles ber-soft-delete, slug bekas bisa dipakai lagi.
    slugActiveUq: uniqueIndex('roles_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Permission granular dengan format `modul.aksi` (mis. kajian.create).
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: varchar('key', { length: 128 }).notNull(),
    group: varchar('group', { length: 64 }).notNull(),
    label: varchar('label', { length: 255 }).notNull(),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyUq: uniqueIndex('permissions_key_uq').on(t.key),
  }),
);

// Join role <-> permission (PK gabungan).
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
  }),
);

// Join user <-> role (PK gabungan, mendukung multi-role per user).
export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.roleId] }),
  }),
);

// Menu admin dinamis (bisa nested via parent_id). Tampil jika user punya permission_key.
export const menuItems = pgTable('menu_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id'),
  label: varchar('label', { length: 128 }).notNull(),
  icon: varchar('icon', { length: 64 }), // nama ikon Lucide
  path: varchar('path', { length: 255 }),
  permissionKey: varchar('permission_key', { length: 128 }), // null = selalu tampil
  order: integer('order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

/* ============================================================
 * 6.2 ENTITAS / PROFIL
 * (titik dakwah, ustadz, media partner, partner usaha)
 * ============================================================ */

// Titik dakwah (masjid/mushola/majelis). Punya owner_user_id & status verifikasi.
export const titikDakwah = pgTable(
  'titik_dakwah',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    address: text('address'),
    kelurahan: varchar('kelurahan', { length: 128 }),
    kecamatan: varchar('kecamatan', { length: 128 }),
    latitude: numeric('latitude', { precision: 10, scale: 7 }),
    longitude: numeric('longitude', { precision: 10, scale: 7 }),
    gmapsUrl: text('gmaps_url'), // link Google Maps yang diinput pengelola (klik -> buka GMaps)
    coverImage: text('cover_image'),
    logoUrl: text('logo_url'),
    contactPhone: varchar('contact_phone', { length: 32 }),
    contactEmail: varchar('contact_email', { length: 255 }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: entityStatusEnum('status').notNull().default('pending'),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    // Partial unique: slug unik hanya untuk baris aktif (deleted_at IS NULL).
    slugActiveUq: uniqueIndex('titik_dakwah_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Profil ustadz (ditautkan ke user).
export const ustadzProfiles = pgTable(
  'ustadz_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    bio: text('bio'),
    photo: text('photo'),
    specialization: varchar('specialization', { length: 255 }),
    status: entityStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('ustadz_profiles_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Media partner (kelola profil + embed video/livestream).
export const mediaPartners = pgTable(
  'media_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    logo: text('logo'),
    description: text('description'),
    website: varchar('website', { length: 255 }),
    socialJson: jsonb('social_json'), // { instagram, facebook, youtube, ... }
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: entityStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('media_partners_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Partner usaha (profil usaha + lapak + event).
export const businessPartners = pgTable(
  'business_partners',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    logo: text('logo'),
    description: text('description'),
    category: varchar('category', { length: 128 }),
    contactWa: varchar('contact_wa', { length: 32 }),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    status: entityStatusEnum('status').notNull().default('pending'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('business_partners_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

/* ============================================================
 * 6.3 KAJIAN, JADWAL & MEDIA
 * ============================================================ */

// Kategori generik (dipakai kajian/blog/library/qa).
export const categories = pgTable(
  'categories',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    type: categoryTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugTypeActiveUq: uniqueIndex('categories_slug_type_active_idx')
      .on(t.slug, t.type)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Kajian (info kitab/tema, ustadz, lokasi, status publikasi).
export const kajian = pgTable(
  'kajian',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    ustadzId: uuid('ustadz_id').references(() => ustadzProfiles.id, { onDelete: 'set null' }),
    titikDakwahId: uuid('titik_dakwah_id').references(() => titikDakwah.id, { onDelete: 'set null' }),
    categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
    kitab: varchar('kitab', { length: 255 }),
    type: kajianTypeEnum('type').notNull().default('offline'),
    coverImage: text('cover_image'),
    status: contentStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('kajian_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Jadwal kajian (mendukung recurrence via RRULE & online stream).
export const kajianSchedules = pgTable('kajian_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  kajianId: uuid('kajian_id').references(() => kajian.id, { onDelete: 'cascade' }),
  titikDakwahId: uuid('titik_dakwah_id').references(() => titikDakwah.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }),
  recurrenceRule: text('recurrence_rule'), // RRULE string | null
  isOnline: boolean('is_online').notNull().default(false),
  streamUrl: text('stream_url'),
  status: scheduleStatusEnum('status').notNull().default('scheduled'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Media generik (Vercel Blob) — polymorphic owner via owner_type + owner_id.
export const mediaAssets = pgTable(
  'media_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerType: mediaOwnerTypeEnum('owner_type').notNull(),
    ownerId: uuid('owner_id').notNull(),
    kind: mediaKindEnum('kind').notNull().default('image'),
    url: text('url').notNull(),
    blobKey: text('blob_key'),
    caption: text('caption'),
    order: integer('order').notNull().default(0),
    size: integer('size'),
    mime: varchar('mime', { length: 128 }),
    // NULL ⇒ pakai storage default platform (global). Lihat §3 DATABASE-ARCHITECTURE.md.
    storageConfigId: uuid('storage_config_id').references(() => storageConfigs.id, { onDelete: 'set null' }),
    uploadedBy: uuid('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    ownerIdx: index('media_assets_owner_idx').on(t.ownerType, t.ownerId),
    storageConfigIdx: index('media_assets_storage_config_idx').on(t.storageConfigId),
  }),
);

// Video embed (YouTube/Facebook) — polymorphic owner.
export const videos = pgTable(
  'videos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerType: videoOwnerTypeEnum('owner_type').notNull(),
    ownerId: uuid('owner_id').notNull(),
    platform: videoPlatformEnum('platform').notNull(),
    sourceUrl: text('source_url').notNull(),
    embedId: varchar('embed_id', { length: 255 }),
    title: varchar('title', { length: 255 }),
    isLive: boolean('is_live').notNull().default(false),
    recordedAt: timestamp('recorded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    ownerIdx: index('videos_owner_idx').on(t.ownerType, t.ownerId),
  }),
);

/* ============================================================
 * 6.4 KEUANGAN + DONASI
 * ============================================================ */

// Kategori transaksi keuangan (income/expense).
export const financeCategories = pgTable('finance_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 128 }).notNull(),
  type: financeTypeEnum('type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Transaksi keuangan. titik_dakwah_id null = kas global (pusat Blitar Mengaji).
export const financeTransactions = pgTable('finance_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  titikDakwahId: uuid('titik_dakwah_id').references(() => titikDakwah.id, { onDelete: 'set null' }), // null = global
  categoryId: uuid('category_id').references(() => financeCategories.id, { onDelete: 'set null' }),
  type: financeTypeEnum('type').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  description: text('description'),
  trxDate: timestamp('trx_date', { withTimezone: true }).notNull(),
  proofUrl: text('proof_url'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  status: financeTrxStatusEnum('status').notNull().default('posted'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Laporan keuangan snapshot (PDF) — scope global atau per titik.
export const financeReports = pgTable('finance_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  scope: reportScopeEnum('scope').notNull().default('global'),
  titikDakwahId: uuid('titik_dakwah_id').references(() => titikDakwah.id, { onDelete: 'set null' }), // null jika global
  periodStart: timestamp('period_start', { withTimezone: true }),
  periodEnd: timestamp('period_end', { withTimezone: true }),
  pdfUrl: text('pdf_url'),
  totalIncome: numeric('total_income', { precision: 14, scale: 2 }),
  totalExpense: numeric('total_expense', { precision: 14, scale: 2 }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Kampanye donasi per titik dakwah (poster + target/progress + status).
export const donationCampaigns = pgTable(
  'donation_campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    titikDakwahId: uuid('titik_dakwah_id')
      .notNull()
      .references(() => titikDakwah.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    posterImage: text('poster_image'),
    description: text('description'),
    targetAmount: numeric('target_amount', { precision: 14, scale: 2 }),
    collectedAmount: numeric('collected_amount', { precision: 14, scale: 2 }).notNull().default('0'),
    status: donationStatusEnum('status').notNull().default('active'),
    startAt: timestamp('start_at', { withTimezone: true }),
    endAt: timestamp('end_at', { withTimezone: true }),
    qrisImage: text('qris_image'),
    contactLink: text('contact_link'),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('donation_campaigns_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Update/laporan penggunaan dana per campaign (transparansi ke publik).
export const donationUpdates = pgTable('donation_updates', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => donationCampaigns.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body'),
  amountUsed: numeric('amount_used', { precision: 14, scale: 2 }),
  attachmentUrl: text('attachment_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Pencatatan donasi masuk (manual). Opsional sinkron ke finance_transactions.
export const donationRecords = pgTable('donation_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  campaignId: uuid('campaign_id')
    .notNull()
    .references(() => donationCampaigns.id, { onDelete: 'cascade' }),
  donorName: varchar('donor_name', { length: 255 }),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  note: text('note'),
  recordedBy: uuid('recorded_by').references(() => users.id, { onDelete: 'set null' }),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

/* ============================================================
 * 6.5 KONTEN KOMUNITAS
 * (posts/catatan, tanya ustadz, perpustakaan, tags)
 * ============================================================ */

// Posts (catatan kajian / artikel). content_rich = JSON Tiptap.
export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    type: postTypeEnum('type').notNull().default('catatan'),
    kajianId: uuid('kajian_id').references(() => kajian.id, { onDelete: 'set null' }),
    authorUserId: uuid('author_user_id').references(() => users.id, { onDelete: 'set null' }),
    contentRich: jsonb('content_rich'), // JSON dari Tiptap
    excerpt: text('excerpt'),
    coverImage: text('cover_image'),
    status: contentStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    views: integer('views').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('posts_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Tags untuk posts.
export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('tags_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Join post <-> category (PK gabungan).
export const postCategories = pgTable(
  'post_categories',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.categoryId] }),
  }),
);

// Join post <-> tag (PK gabungan).
export const postTags = pgTable(
  'post_tags',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.postId, t.tagId] }),
  }),
);

// Tanya ustadz — pertanyaan (boleh anonim "Hamba Allah").
export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }), // null jika anonim & tanpa akun
  askerName: varchar('asker_name', { length: 255 }),
  isAnonymous: boolean('is_anonymous').notNull().default(false),
  title: varchar('title', { length: 255 }).notNull(),
  body: text('body').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  status: questionStatusEnum('status').notNull().default('pending'),
  assignedUstadzId: uuid('assigned_ustadz_id').references(() => ustadzProfiles.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Jawaban ustadz — nama ustadz selalu tampil (wajib).
export const answers = pgTable('answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  questionId: uuid('question_id')
    .notNull()
    .references(() => questions.id, { onDelete: 'cascade' }),
  ustadzId: uuid('ustadz_id')
    .notNull()
    .references(() => ustadzProfiles.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Perpustakaan PDF (di-upload ustadz).
export const libraryItems = pgTable('library_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  author: varchar('author', { length: 255 }),
  ustadzId: uuid('ustadz_id').references(() => ustadzProfiles.id, { onDelete: 'set null' }), // uploader
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  pdfUrl: text('pdf_url').notNull(),
  blobKey: text('blob_key'),
  coverImage: text('cover_image'),
  fileSize: integer('file_size'),
  downloads: integer('downloads').notNull().default(0),
  status: contentStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

/* ============================================================
 * 6.6 BELAJAR & ACARA
 * (kelas online + event/webinar)
 * ============================================================ */

// Kursus / kelas online.
export const courses = pgTable(
  'courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    ustadzId: uuid('ustadz_id').references(() => ustadzProfiles.id, { onDelete: 'set null' }),
    coverImage: text('cover_image'),
    level: varchar('level', { length: 64 }), // pemula/menengah/lanjut
    status: contentStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('courses_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Modul kursus (kumpulan pelajaran).
export const courseModules = pgTable('course_modules', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id')
    .notNull()
    .references(() => courses.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Pelajaran (video/teks/pdf).
export const courseLessons = pgTable('course_lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id')
    .notNull()
    .references(() => courseModules.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  kind: lessonKindEnum('kind').notNull().default('video'),
  content: text('content'), // teks/markdown atau url pdf
  videoUrl: text('video_url'),
  order: integer('order').notNull().default(0),
  duration: integer('duration'), // detik
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Enrollment user ke kursus + progress.
export const enrollments = pgTable(
  'enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    progress: integer('progress').notNull().default(0), // 0-100
    enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    // Partial unique agar enrol ulang setelah soft delete tetap mungkin.
    courseUserActiveUq: uniqueIndex('enrollments_course_user_active_idx')
      .on(t.courseId, t.userId)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Progress per pelajaran.
export const lessonProgress = pgTable(
  'lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => enrollments.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => courseLessons.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => ({
    enrollLessonUq: uniqueIndex('lesson_progress_enroll_lesson_uq').on(t.enrollmentId, t.lessonId),
  }),
);

// Event / webinar (organizer bisa partner atau internal).
export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    organizerType: eventOrganizerTypeEnum('organizer_type').notNull().default('internal'),
    organizerId: uuid('organizer_id'), // FK polymorphic (business_partners.id atau null untuk internal)
    kind: eventKindEnum('kind').notNull().default('offline'),
    coverImage: text('cover_image'),
    startAt: timestamp('start_at', { withTimezone: true }),
    endAt: timestamp('end_at', { withTimezone: true }),
    location: text('location'),
    onlineUrl: text('online_url'),
    capacity: integer('capacity'),
    needsRegistration: boolean('needs_registration').notNull().default(false),
    status: contentStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('events_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Registrasi peserta event.
export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id')
    .notNull()
    .references(() => events.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  status: registrationStatusEnum('status').notNull().default('registered'),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

/* ============================================================
 * 6.7 LAPAK
 * (maks 3 produk aktif/partner — divalidasi di service layer)
 * ============================================================ */

export const products = pgTable(
  'products',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessPartnerId: uuid('business_partner_id')
      .notNull()
      .references(() => businessPartners.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    posterImage: text('poster_image'),
    description: text('description'),
    price: numeric('price', { precision: 14, scale: 2 }),
    contactLink: text('contact_link'),
    status: productStatusEnum('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    partnerIdx: index('products_partner_idx').on(t.businessPartnerId),
  }),
);

/* ============================================================
 * 6.8 AI & SISTEM
 * (ai chat, embeddings/RAG, settings, ui_themes, audit, notif)
 * ============================================================ */

// Percakapan AI (history per user).
export const aiConversations = pgTable('ai_conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  ...softDelete,
});

// Pesan AI (user/assistant/system).
export const aiMessages = pgTable('ai_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => aiConversations.id, { onDelete: 'cascade' }),
  role: aiRoleEnum('role').notNull(),
  content: text('content').notNull(),
  model: varchar('model', { length: 64 }),
  tokens: integer('tokens'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Embeddings untuk RAG (pgvector). embedding = vector(1024).
export const contentEmbeddings = pgTable(
  'content_embeddings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceType: varchar('source_type', { length: 64 }).notNull(), // post/library/kajian/answer
    sourceId: uuid('source_id').notNull(),
    chunkText: text('chunk_text').notNull(),
    embedding: vector('embedding'), // pgvector(1024)
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sourceIdx: index('content_embeddings_source_idx').on(t.sourceType, t.sourceId),
    // TODO: tambah index HNSW/IVFFlat untuk pencarian vector via migration manual.
  }),
);

// Settings global (key/value JSON) — termasuk default_theme, toggle fitur, branding.
export const settings = pgTable(
  'settings',
  {
    key: varchar('key', { length: 128 }).primaryKey(),
    valueJson: jsonb('value_json'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
);

// Tema UI dinamis (bawaan + custom admin). tokens_json = CSS variables tema.
export const uiThemes = pgTable(
  'ui_themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 64 }).notNull(),
    tokensJson: jsonb('tokens_json'), // { "--c-brand-600": "#0E6E55", ... }
    isActive: boolean('is_active').notNull().default(true),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugActiveUq: uniqueIndex('ui_themes_slug_active_idx')
      .on(t.slug)
      .where(sql`${t.deletedAt} is null`),
  }),
);

// Audit log aksi sensitif (keuangan, RBAC, hapus data).
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  action: varchar('action', { length: 128 }).notNull(),
  entity: varchar('entity', { length: 128 }),
  entityId: varchar('entity_id', { length: 128 }),
  metaJson: jsonb('meta_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Notifikasi in-app per user. (Hard delete diperbolehkan — tanpa soft delete.)
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 64 }).notNull(),
  payloadJson: jsonb('payload_json'),
  readAt: timestamp('read_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/* ============================================================
 * 6.9 STORAGE & PEMBAYARAN
 * (penyimpanan Blob per-user/entitas + pembayaran QRIS/konfirmasi WA)
 * Lihat docs/DATABASE-ARCHITECTURE.md §3 & §4.
 * ============================================================ */

// Konfigurasi storage per-entitas (Blob/S3/R2). Token DISIMPAN TERENKRIPSI
// (AES-256-GCM via STORAGE_ENC_KEY) & TIDAK PERNAH dikirim ke client.
export const storageConfigs = pgTable(
  'storage_configs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerType: storageOwnerTypeEnum('owner_type').notNull().default('global'),
    ownerId: uuid('owner_id'), // NULL utk global (platform)
    provider: storageProviderEnum('provider').notNull().default('vercel_blob'),
    label: text('label'), // mis. "Blob Masjid Al-Falah"
    tokenCiphertext: text('token_ciphertext'), // token TERENKRIPSI (AES-256-GCM)
    tokenIv: text('token_iv'), // nonce enkripsi
    tokenTag: text('token_tag'), // auth tag enkripsi
    baseUrl: text('base_url'), // opsional (custom domain/bucket)
    isDefault: boolean('is_default').notNull().default(false), // default utk owner tsb
    status: storageStatusEnum('status').notNull().default('active'),
    bytesUsed: bigint('bytes_used', { mode: 'number' }).notNull().default(0), // akumulasi pemakaian
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    ownerIdx: index('storage_configs_owner_idx').on(t.ownerType, t.ownerId),
  }),
);

// Metode pembayaran (QRIS/bank/ewallet) per entitas atau global.
export const paymentMethods = pgTable(
  'payment_methods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerType: storageOwnerTypeEnum('owner_type').notNull().default('global'), // global/titik/partner (+user/media/ustadz)
    ownerId: uuid('owner_id'), // NULL utk global
    type: paymentMethodTypeEnum('type').notNull().default('qris'),
    qrisImage: text('qris_image'),
    bankName: varchar('bank_name', { length: 128 }),
    accountNo: varchar('account_no', { length: 64 }),
    accountName: varchar('account_name', { length: 255 }),
    waNumber: varchar('wa_number', { length: 32 }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    ownerIdx: index('payment_methods_owner_idx').on(t.ownerType, t.ownerId),
  }),
);

// Konfirmasi pembayaran (donasi/pesanan) — manual + konfirmasi via WhatsApp.
export const paymentConfirmations = pgTable(
  'payment_confirmations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    kind: paymentKindEnum('kind').notNull(), // donation | order
    refId: uuid('ref_id').notNull(), // ref ke donation_campaign / product/order (polymorphic)
    payerName: varchar('payer_name', { length: 255 }),
    isAnonymous: boolean('is_anonymous').notNull().default(false),
    amount: numeric('amount', { precision: 14, scale: 2 }),
    note: text('note'),
    proofUrl: text('proof_url'), // bukti transfer (Blob)
    waLink: text('wa_link'), // wa.me prefilled
    status: paymentStatusEnum('status').notNull().default('pending'),
    confirmedBy: uuid('confirmed_by').references(() => users.id, { onDelete: 'set null' }),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    refIdx: index('payment_confirmations_ref_idx').on(t.kind, t.refId),
    statusIdx: index('payment_confirmations_status_idx').on(t.status),
  }),
);

/* ============================================================
 * RELATIONS (relasi utama untuk query relasional Drizzle)
 * ============================================================ */

// users
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  ustadzProfiles: many(ustadzProfiles),
  titikDakwah: many(titikDakwah),
  mediaPartners: many(mediaPartners),
  businessPartners: many(businessPartners),
  posts: many(posts),
  questions: many(questions),
  enrollments: many(enrollments),
  eventRegistrations: many(eventRegistrations),
  notifications: many(notifications),
  aiConversations: many(aiConversations),
}));

// roles
export const rolesRelations = relations(roles, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userRoles: many(userRoles),
}));

// permissions
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

// role_permissions (join)
export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

// user_roles (join)
export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

// menu_items (self-relation untuk nested menu)
export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: 'menu_parent',
  }),
  children: many(menuItems, { relationName: 'menu_parent' }),
}));

// titik_dakwah
export const titikDakwahRelations = relations(titikDakwah, ({ one, many }) => ({
  owner: one(users, { fields: [titikDakwah.ownerUserId], references: [users.id] }),
  kajian: many(kajian),
  schedules: many(kajianSchedules),
  donationCampaigns: many(donationCampaigns),
}));

// ustadz_profiles
export const ustadzProfilesRelations = relations(ustadzProfiles, ({ one, many }) => ({
  user: one(users, { fields: [ustadzProfiles.userId], references: [users.id] }),
  kajian: many(kajian),
  answers: many(answers),
  libraryItems: many(libraryItems),
  courses: many(courses),
}));

// media_partners
export const mediaPartnersRelations = relations(mediaPartners, ({ one }) => ({
  owner: one(users, { fields: [mediaPartners.ownerUserId], references: [users.id] }),
}));

// business_partners
export const businessPartnersRelations = relations(businessPartners, ({ one, many }) => ({
  owner: one(users, { fields: [businessPartners.ownerUserId], references: [users.id] }),
  products: many(products),
}));

// kajian
export const kajianRelations = relations(kajian, ({ one, many }) => ({
  ustadz: one(ustadzProfiles, { fields: [kajian.ustadzId], references: [ustadzProfiles.id] }),
  titikDakwah: one(titikDakwah, { fields: [kajian.titikDakwahId], references: [titikDakwah.id] }),
  category: one(categories, { fields: [kajian.categoryId], references: [categories.id] }),
  schedules: many(kajianSchedules),
  posts: many(posts),
}));

// kajian_schedules
export const kajianSchedulesRelations = relations(kajianSchedules, ({ one }) => ({
  kajian: one(kajian, { fields: [kajianSchedules.kajianId], references: [kajian.id] }),
  titikDakwah: one(titikDakwah, {
    fields: [kajianSchedules.titikDakwahId],
    references: [titikDakwah.id],
  }),
}));

// categories
export const categoriesRelations = relations(categories, ({ many }) => ({
  kajian: many(kajian),
  questions: many(questions),
  libraryItems: many(libraryItems),
  postCategories: many(postCategories),
}));

// finance
export const financeCategoriesRelations = relations(financeCategories, ({ many }) => ({
  transactions: many(financeTransactions),
}));

export const financeTransactionsRelations = relations(financeTransactions, ({ one }) => ({
  titikDakwah: one(titikDakwah, {
    fields: [financeTransactions.titikDakwahId],
    references: [titikDakwah.id],
  }),
  category: one(financeCategories, {
    fields: [financeTransactions.categoryId],
    references: [financeCategories.id],
  }),
  createdByUser: one(users, { fields: [financeTransactions.createdBy], references: [users.id] }),
}));

// donations
export const donationCampaignsRelations = relations(donationCampaigns, ({ one, many }) => ({
  titikDakwah: one(titikDakwah, {
    fields: [donationCampaigns.titikDakwahId],
    references: [titikDakwah.id],
  }),
  updates: many(donationUpdates),
  records: many(donationRecords),
}));

export const donationUpdatesRelations = relations(donationUpdates, ({ one }) => ({
  campaign: one(donationCampaigns, {
    fields: [donationUpdates.campaignId],
    references: [donationCampaigns.id],
  }),
}));

export const donationRecordsRelations = relations(donationRecords, ({ one }) => ({
  campaign: one(donationCampaigns, {
    fields: [donationRecords.campaignId],
    references: [donationCampaigns.id],
  }),
}));

// posts
export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorUserId], references: [users.id] }),
  kajian: one(kajian, { fields: [posts.kajianId], references: [kajian.id] }),
  postCategories: many(postCategories),
  postTags: many(postTags),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, { fields: [postCategories.postId], references: [posts.id] }),
  category: one(categories, { fields: [postCategories.categoryId], references: [categories.id] }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  postTags: many(postTags),
}));

// questions & answers
export const questionsRelations = relations(questions, ({ one, many }) => ({
  user: one(users, { fields: [questions.userId], references: [users.id] }),
  category: one(categories, { fields: [questions.categoryId], references: [categories.id] }),
  assignedUstadz: one(ustadzProfiles, {
    fields: [questions.assignedUstadzId],
    references: [ustadzProfiles.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  question: one(questions, { fields: [answers.questionId], references: [questions.id] }),
  ustadz: one(ustadzProfiles, { fields: [answers.ustadzId], references: [ustadzProfiles.id] }),
}));

// library
export const libraryItemsRelations = relations(libraryItems, ({ one }) => ({
  ustadz: one(ustadzProfiles, { fields: [libraryItems.ustadzId], references: [ustadzProfiles.id] }),
  category: one(categories, { fields: [libraryItems.categoryId], references: [categories.id] }),
}));

// courses
export const coursesRelations = relations(courses, ({ one, many }) => ({
  ustadz: one(ustadzProfiles, { fields: [courses.ustadzId], references: [ustadzProfiles.id] }),
  modules: many(courseModules),
  enrollments: many(enrollments),
}));

export const courseModulesRelations = relations(courseModules, ({ one, many }) => ({
  course: one(courses, { fields: [courseModules.courseId], references: [courses.id] }),
  lessons: many(courseLessons),
}));

export const courseLessonsRelations = relations(courseLessons, ({ one, many }) => ({
  module: one(courseModules, { fields: [courseLessons.moduleId], references: [courseModules.id] }),
  progress: many(lessonProgress),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  lessonProgress: many(lessonProgress),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [lessonProgress.enrollmentId],
    references: [enrollments.id],
  }),
  lesson: one(courseLessons, {
    fields: [lessonProgress.lessonId],
    references: [courseLessons.id],
  }),
}));

// events
export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  user: one(users, { fields: [eventRegistrations.userId], references: [users.id] }),
}));

// products (lapak)
export const productsRelations = relations(products, ({ one }) => ({
  businessPartner: one(businessPartners, {
    fields: [products.businessPartnerId],
    references: [businessPartners.id],
  }),
}));

// AI
export const aiConversationsRelations = relations(aiConversations, ({ one, many }) => ({
  user: one(users, { fields: [aiConversations.userId], references: [users.id] }),
  messages: many(aiMessages),
}));

export const aiMessagesRelations = relations(aiMessages, ({ one }) => ({
  conversation: one(aiConversations, {
    fields: [aiMessages.conversationId],
    references: [aiConversations.id],
  }),
}));

// notifications
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

/* ------------------------------------------------------------
 * 6.9 Storage & Pembayaran — relations
 * Catatan: owner_type/owner_id bersifat polymorphic sehingga relasi
 * owner TIDAK didefinisikan di sini (di-resolve di service layer).
 * ------------------------------------------------------------ */

// storage_configs <-> media_assets (1 config dipakai banyak media).
export const storageConfigsRelations = relations(storageConfigs, ({ many }) => ({
  mediaAssets: many(mediaAssets),
}));

// media_assets -> storage_config (nullable; NULL = default global).
export const mediaAssetsRelations = relations(mediaAssets, ({ one }) => ({
  storageConfig: one(storageConfigs, {
    fields: [mediaAssets.storageConfigId],
    references: [storageConfigs.id],
  }),
  uploadedByUser: one(users, { fields: [mediaAssets.uploadedBy], references: [users.id] }),
}));

// payment_confirmations -> user (confirmed_by). ref_id polymorphic (tanpa relasi).
export const paymentConfirmationsRelations = relations(paymentConfirmations, ({ one }) => ({
  confirmedByUser: one(users, {
    fields: [paymentConfirmations.confirmedBy],
    references: [users.id],
  }),
}));

// payment_methods: owner polymorphic — tanpa relasi otomatis.

/* ============================================================
 * 6.10 AI PROVIDERS & MODELS (manajemen multi-provider/model)
 * - Provider OpenAI-compatible (DeepSeek/OpenAI/Groq/xAI/Mistral/dll).
 * - API key TERENKRIPSI (AES-256-GCM via STORAGE_ENC_KEY) — tidak di env.
 * - ai_task_bindings: tiap task (chat/agent/doc/embedding/...) -> 1 model aktif.
 * ============================================================ */
export const aiTaskEnum = pgEnum('ai_task', [
  'chat',
  'agent',
  'doc',
  'embedding',
  'transcribe',
  'summarize',
  'vision',
]);
export const aiModelKindEnum = pgEnum('ai_model_kind', [
  'chat',
  'reasoning',
  'embedding',
  'vision',
  'multimodal',
]);

export const aiProviders = pgTable(
  'ai_providers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 128 }).notNull(),
    slug: varchar('slug', { length: 128 }).notNull(),
    baseUrl: text('base_url').notNull(), // endpoint OpenAI-compatible (mis. https://api.deepseek.com)
    apiKeyCiphertext: text('api_key_ciphertext'), // null = belum diisi
    apiKeyIv: text('api_key_iv'),
    apiKeyTag: text('api_key_tag'),
    docsUrl: text('docs_url'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    slugUq: uniqueIndex('ai_providers_slug_active_idx').on(t.slug).where(sql`${t.deletedAt} is null`),
  }),
);

export const aiModels = pgTable(
  'ai_models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    providerId: uuid('provider_id')
      .notNull()
      .references(() => aiProviders.id, { onDelete: 'cascade' }),
    modelId: varchar('model_id', { length: 160 }).notNull(), // mis. 'deepseek-chat'
    label: varchar('label', { length: 160 }).notNull(),
    kind: aiModelKindEnum('kind').notNull().default('chat'),
    contextWindow: integer('context_window'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    providerIdx: index('ai_models_provider_idx').on(t.providerId),
  }),
);

export const aiTaskBindings = pgTable(
  'ai_task_bindings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    task: aiTaskEnum('task').notNull(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => aiModels.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    ...softDelete,
  },
  (t) => ({
    taskUq: uniqueIndex('ai_task_bindings_task_active_idx').on(t.task).where(sql`${t.deletedAt} is null`),
  }),
);

/* ============================================================
 * 6.11 PROGRESS BELAJAR (per-pelajaran) — untuk pemutar kelas.
 * Course % dihitung dari completed/total → bisa sinkron ke enrollments.progress.
 * ============================================================ */
export const courseLessonProgress = pgTable(
  'course_lesson_progress',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: uuid('lesson_id')
      .notNull()
      .references(() => courseLessons.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userLessonUq: uniqueIndex('clp_user_lesson_uq').on(t.userId, t.lessonId),
    userCourseIdx: index('clp_user_course_idx').on(t.userId, t.courseId),
  }),
);
