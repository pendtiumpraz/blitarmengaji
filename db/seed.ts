/**
 * ============================================================
 * Blitar Mengaji — Seed Script (Fase 0)
 * ============================================================
 * Mengisi data fondasi:
 *   1. PERMISSIONS lengkap (semua grup di Bagian 4 + trash/storage/payment)
 *   2. ROLES preset + pemetaan role -> permission
 *   3. MENU_ITEMS contoh (admin sidebar dinamis)
 *   4. 1 user SUPER ADMIN (email dari env)
 *   5. UI_THEMES (8 tema bawaan) + default 'teduh'
 *   6. settings: default_theme = 'teduh'
 *   7. storage_configs GLOBAL default + settings.default_storage_config_id
 *   8. settings: trash_retention_days = 30
 *
 * Jalankan: `npx tsx db/seed.ts` (butuh DATABASE_URL di env).
 * Idempoten: pakai onConflictDoNothing / onConflictDoUpdate.
 * ============================================================
 */

import { config } from 'dotenv';
config({ path: '.env.local' }); // muat kredensial dari .env.local
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { and, eq, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

import * as schema from './schema';
import {
  permissions,
  roles,
  rolePermissions,
  users,
  userRoles,
  menuItems,
  uiThemes,
  settings,
  storageConfigs,
} from './schema';

/* ============================================================
 * Koneksi Drizzle (Neon HTTP)
 * ============================================================ */
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL belum di-set di env. Lihat .env.example');
}
const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

/* ============================================================
 * 1. DAFTAR PERMISSIONS (Bagian 4 — semua grup)
 * Format: { key, group, label }
 * ============================================================ */
const PERMISSIONS: { key: string; group: string; label: string }[] = [
  // dashboard
  { key: 'dashboard.view', group: 'dashboard', label: 'Lihat Dashboard' },

  // kajian
  { key: 'kajian.view', group: 'kajian', label: 'Lihat Kajian' },
  { key: 'kajian.create', group: 'kajian', label: 'Buat Kajian' },
  { key: 'kajian.update', group: 'kajian', label: 'Ubah Kajian' },
  { key: 'kajian.delete', group: 'kajian', label: 'Hapus Kajian' },
  { key: 'kajian.publish', group: 'kajian', label: 'Publikasi Kajian' },

  // jadwal
  { key: 'jadwal.view', group: 'jadwal', label: 'Lihat Jadwal' },
  { key: 'jadwal.manage', group: 'jadwal', label: 'Kelola Jadwal' },

  // titik dakwah
  { key: 'titik.view', group: 'titik', label: 'Lihat Titik Dakwah' },
  { key: 'titik.create', group: 'titik', label: 'Buat Titik Dakwah' },
  { key: 'titik.update', group: 'titik', label: 'Ubah Titik Dakwah' },
  { key: 'titik.delete', group: 'titik', label: 'Hapus Titik Dakwah' },
  { key: 'titik.manage_own', group: 'titik', label: 'Kelola Titik Sendiri' },

  // media
  { key: 'media.view', group: 'media', label: 'Lihat Media Partner' },
  { key: 'media.manage', group: 'media', label: 'Kelola Media Partner' },
  { key: 'media.manage_own', group: 'media', label: 'Kelola Media Sendiri' },

  // partner
  { key: 'partner.view', group: 'partner', label: 'Lihat Partner Usaha' },
  { key: 'partner.manage', group: 'partner', label: 'Kelola Partner Usaha' },
  { key: 'partner.manage_own', group: 'partner', label: 'Kelola Partner Sendiri' },

  // ustadz
  { key: 'ustadz.view', group: 'ustadz', label: 'Lihat Ustadz' },
  { key: 'ustadz.manage', group: 'ustadz', label: 'Kelola Ustadz' },

  // keuangan
  { key: 'finance.view', group: 'finance', label: 'Lihat Keuangan' },
  { key: 'finance.create', group: 'finance', label: 'Input Transaksi' },
  { key: 'finance.update', group: 'finance', label: 'Ubah Transaksi' },
  { key: 'finance.delete', group: 'finance', label: 'Hapus Transaksi' },
  { key: 'finance.report', group: 'finance', label: 'Buat Laporan Keuangan' },

  // donasi
  { key: 'donation.view', group: 'donation', label: 'Lihat Donasi' },
  { key: 'donation.create', group: 'donation', label: 'Buat Kampanye Donasi' },
  { key: 'donation.manage_own', group: 'donation', label: 'Kelola Donasi Sendiri' },
  { key: 'donation.manage', group: 'donation', label: 'Kelola Semua Donasi' },
  { key: 'donation.report', group: 'donation', label: 'Laporan Donasi' },

  // galeri
  { key: 'gallery.view', group: 'gallery', label: 'Lihat Galeri' },
  { key: 'gallery.manage', group: 'gallery', label: 'Kelola Galeri' },

  // video
  { key: 'video.view', group: 'video', label: 'Lihat Video' },
  { key: 'video.manage', group: 'video', label: 'Kelola Video' },

  // catatan / blog
  { key: 'blog.view', group: 'blog', label: 'Lihat Catatan/Blog' },
  { key: 'blog.create', group: 'blog', label: 'Buat Catatan/Blog' },
  { key: 'blog.update', group: 'blog', label: 'Ubah Catatan/Blog' },
  { key: 'blog.delete', group: 'blog', label: 'Hapus Catatan/Blog' },
  { key: 'blog.publish', group: 'blog', label: 'Publikasi Catatan/Blog' },

  // tanya ustadz
  { key: 'qa.view', group: 'qa', label: 'Lihat Tanya Ustadz' },
  { key: 'qa.answer', group: 'qa', label: 'Jawab Pertanyaan' },
  { key: 'qa.manage', group: 'qa', label: 'Kelola Tanya Ustadz' },
  { key: 'qa.publish', group: 'qa', label: 'Publikasi Tanya Jawab' },

  // perpustakaan
  { key: 'library.view', group: 'library', label: 'Lihat Perpustakaan' },
  { key: 'library.upload', group: 'library', label: 'Upload PDF Perpustakaan' },
  { key: 'library.manage', group: 'library', label: 'Kelola Perpustakaan' },

  // kelas
  { key: 'course.view', group: 'course', label: 'Lihat Kelas' },
  { key: 'course.create', group: 'course', label: 'Buat Kelas' },
  { key: 'course.manage', group: 'course', label: 'Kelola Kelas' },
  { key: 'course.enroll', group: 'course', label: 'Daftar Kelas' },

  // event
  { key: 'event.view', group: 'event', label: 'Lihat Event' },
  { key: 'event.create', group: 'event', label: 'Buat Event' },
  { key: 'event.manage', group: 'event', label: 'Kelola Event' },
  { key: 'event.register', group: 'event', label: 'Daftar Event' },

  // lapak
  { key: 'lapak.view', group: 'lapak', label: 'Lihat Lapak' },
  { key: 'lapak.manage', group: 'lapak', label: 'Kelola Semua Lapak' },
  { key: 'lapak.manage_own', group: 'lapak', label: 'Kelola Lapak Sendiri' },

  // user
  { key: 'user.view', group: 'user', label: 'Lihat Pengguna' },
  { key: 'user.manage', group: 'user', label: 'Kelola Pengguna' },

  // rbac
  { key: 'role.manage', group: 'rbac', label: 'Kelola Role' },
  { key: 'permission.manage', group: 'rbac', label: 'Kelola Permission' },
  { key: 'menu.manage', group: 'rbac', label: 'Kelola Menu Admin' },

  // AI
  { key: 'ai.use', group: 'ai', label: 'Gunakan AI Assistant' },
  { key: 'ai.manage', group: 'ai', label: 'Kelola AI' },

  // settings
  { key: 'settings.manage', group: 'settings', label: 'Kelola Pengaturan' },
  { key: 'theme.manage', group: 'settings', label: 'Kelola Tema UI' },
  { key: 'audit.view', group: 'settings', label: 'Lihat Audit Log' },

  // trash / recycle bin (soft delete + restore)
  { key: 'trash.view', group: 'trash', label: 'Lihat Sampah (Recycle Bin)' },
  { key: 'trash.restore', group: 'trash', label: 'Pulihkan Item Terhapus' },
  { key: 'trash.purge', group: 'trash', label: 'Hapus Permanen (Purge)' },

  // storage (penyimpanan Blob per-entitas)
  { key: 'storage.view', group: 'storage', label: 'Lihat Konfigurasi Storage' },
  { key: 'storage.manage_own', group: 'storage', label: 'Kelola Storage Sendiri' },
  { key: 'storage.manage', group: 'storage', label: 'Kelola Semua Storage' },

  // payment (pembayaran QRIS + konfirmasi WhatsApp)
  { key: 'payment.view', group: 'payment', label: 'Lihat Pembayaran' },
  { key: 'payment.confirm', group: 'payment', label: 'Konfirmasi Pembayaran' },
  { key: 'payment.manage_own', group: 'payment', label: 'Kelola Pembayaran Sendiri' },
];

// Semua key permission (untuk Super Admin).
const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

/* ============================================================
 * 2. ROLES preset + pemetaan role -> permission (Bagian 4)
 * ============================================================ */
const ROLES: {
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissions: string[]; // daftar key; '*' = semua
}[] = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Akses penuh ke seluruh sistem (tak bisa dihapus).',
    isSystem: true,
    permissions: ['*'], // semua permission
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Hampir semua akses kecuali RBAC sensitif.',
    isSystem: true,
    // semua kecuali permission RBAC sensitif
    permissions: ALL_PERMISSION_KEYS.filter(
      (k) => !['role.manage', 'permission.manage', 'menu.manage'].includes(k),
    ),
  },
  {
    name: 'Bendahara',
    slug: 'bendahara',
    description: 'Kelola keuangan & laporan.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'finance.view',
      'finance.create',
      'finance.update',
      'finance.delete',
      'finance.report',
      'donation.view',
      'donation.report',
    ],
  },
  {
    name: 'Ustadz',
    slug: 'ustadz',
    description: 'Catatan/blog, jawab tanya, upload perpustakaan, buat kelas.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'blog.view',
      'blog.create',
      'blog.update',
      'blog.delete',
      'blog.publish',
      'qa.view',
      'qa.answer',
      'library.view',
      'library.upload',
      'course.view',
      'course.create',
      'kajian.view',
    ],
  },
  {
    name: 'Pengelola Titik',
    slug: 'pengelola-titik',
    description: 'Kelola titik dakwah sendiri: jadwal, galeri, video, donasi, kas.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'titik.view',
      'titik.manage_own',
      'jadwal.view',
      'jadwal.manage',
      'gallery.view',
      'gallery.manage',
      'video.view',
      'video.manage',
      'donation.view',
      'donation.manage_own',
      'finance.view',
      'finance.create', // kas titik sendiri
      // storage & pembayaran milik titik sendiri + pulihkan dari sampah (terbatas)
      'storage.view',
      'storage.manage_own',
      'payment.view',
      'payment.confirm',
      'payment.manage_own',
      'trash.view',
      'trash.restore',
    ],
  },
  {
    name: 'Media Partner',
    slug: 'media-partner',
    description: 'Kelola profil media sendiri & video/livestream.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'media.view',
      'media.manage_own',
      'video.view',
      'video.manage',
      // storage milik media sendiri + pulihkan dari sampah (terbatas)
      'storage.view',
      'storage.manage_own',
      'trash.view',
      'trash.restore',
    ],
  },
  {
    name: 'Partner Usaha',
    slug: 'partner-usaha',
    description: 'Kelola profil usaha sendiri, lapak, & event.',
    isSystem: true,
    permissions: [
      'dashboard.view',
      'partner.view',
      'partner.manage_own',
      'lapak.view',
      'lapak.manage_own',
      'event.view',
      'event.create',
      // storage & pembayaran milik partner sendiri + pulihkan dari sampah (terbatas)
      'storage.view',
      'storage.manage_own',
      'payment.view',
      'payment.confirm',
      'payment.manage_own',
      'trash.view',
      'trash.restore',
    ],
  },
  {
    name: 'Penulis',
    slug: 'penulis',
    description: 'Tulis & edit artikel/blog.',
    isSystem: true,
    permissions: ['dashboard.view', 'blog.view', 'blog.create', 'blog.update'],
  },
  {
    name: 'Jamaah',
    slug: 'jamaah',
    description: 'Role default pengguna umum.',
    isSystem: true,
    permissions: ['qa.view', 'ai.use', 'course.enroll', 'event.register', 'library.view'],
  },
];

/* ============================================================
 * 3. MENU_ITEMS contoh (admin sidebar dinamis)
 * permission_key null = selalu tampil.
 * ============================================================ */
const MENU_ITEMS: {
  label: string;
  icon: string;
  path: string;
  permissionKey: string | null;
  order: number;
}[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/admin', permissionKey: 'dashboard.view', order: 1 },
  { label: 'Kajian & Jadwal', icon: 'BookOpen', path: '/admin/kajian', permissionKey: 'kajian.view', order: 2 },
  { label: 'Titik Dakwah', icon: 'MapPin', path: '/admin/titik', permissionKey: 'titik.view', order: 3 },
  { label: 'Keuangan', icon: 'Wallet', path: '/admin/keuangan', permissionKey: 'finance.view', order: 4 },
  { label: 'Donasi', icon: 'HeartHandshake', path: '/admin/donasi', permissionKey: 'donation.view', order: 5 },
  { label: 'Tanya Ustadz', icon: 'MessageCircleQuestion', path: '/admin/tanya-ustadz', permissionKey: 'qa.view', order: 6 },
  { label: 'RBAC & Role', icon: 'ShieldCheck', path: '/admin/rbac', permissionKey: 'role.manage', order: 7 },
  { label: 'Pengguna', icon: 'Users', path: '/admin/pengguna', permissionKey: 'user.view', order: 8 },
  { label: 'Pengaturan', icon: 'Settings', path: '/admin/pengaturan', permissionKey: 'settings.manage', order: 9 },
];

/* ============================================================
 * 5. UI THEMES (8 tema bawaan) — ringkasan token utama.
 * tokens_json menyimpan CSS variables (lihat docs/ui/theme-tokens.css).
 * default = teduh.
 * ============================================================ */
const UI_THEMES: { name: string; slug: string; tokens: Record<string, string> }[] = [
  {
    name: 'Teduh',
    slug: 'teduh',
    tokens: {
      '--c-brand-600': '#0E6E55',
      '--c-gold': '#C9A227',
      '--c-cream': '#F7F5EF',
      '--c-surface': '#FFFFFF',
      '--c-ink': '#1F2A37',
    },
  },
  {
    name: 'Modern',
    slug: 'modern',
    tokens: {
      '--c-brand-600': '#0F766E',
      '--c-gold': '#F59E0B',
      '--c-cream': '#F8FAFC',
      '--c-surface': '#FFFFFF',
      '--c-ink': '#0F172A',
    },
  },
  {
    name: 'Earthy',
    slug: 'earthy',
    tokens: {
      '--c-brand-600': '#14532D',
      '--c-gold': '#B45309',
      '--c-cream': '#FAF6EF',
      '--c-surface': '#FFFBF4',
      '--c-ink': '#292524',
    },
  },
  {
    name: 'Elegan',
    slug: 'elegan',
    tokens: {
      '--c-brand-600': '#1E3A5F',
      '--c-gold': '#C9A227',
      '--c-cream': '#F5F3EE',
      '--c-surface': '#FFFFFF',
      '--c-ink': '#0F172A',
    },
  },
  {
    name: 'Minimalis',
    slug: 'minimalis',
    tokens: {
      '--c-brand-600': '#111827',
      '--c-gold': '#10B981',
      '--c-cream': '#FFFFFF',
      '--c-surface': '#FFFFFF',
      '--c-ink': '#111827',
    },
  },
  {
    name: 'Samudra',
    slug: 'samudra',
    tokens: {
      '--c-brand-600': '#2563EB',
      '--c-gold': '#06B6D4',
      '--c-cream': '#F0F9FF',
      '--c-surface': '#FFFFFF',
      '--c-ink': '#0F172A',
    },
  },
  {
    name: 'Klasik',
    slug: 'klasik',
    tokens: {
      '--c-brand-600': '#7B2D24',
      '--c-gold': '#B8860B',
      '--c-cream': '#F5EFE3',
      '--c-surface': '#FBF6EA',
      '--c-ink': '#2B2118',
    },
  },
  {
    name: 'Senja',
    slug: 'senja',
    tokens: {
      '--c-brand-600': '#0E6E55',
      '--c-gold': '#FBBF24',
      '--c-cream': '#0F172A',
      '--c-surface': '#1E293B',
      '--c-ink': '#E2E8F0',
    },
  },
];

/* ============================================================
 * MAIN
 * ============================================================ */
async function main() {
  console.log('Mulai seed Blitar Mengaji...');

  // ---- 1. Permissions (idempoten via onConflictDoNothing) ----
  console.log(`Seed ${PERMISSIONS.length} permissions...`);
  await db.insert(permissions).values(PERMISSIONS).onConflictDoNothing();
  const allPerms = await db.select().from(permissions);
  const permByKey = new Map(allPerms.map((p) => [p.key, p.id]));

  // ---- 2. Roles + pemetaan ----
  console.log(`Seed ${ROLES.length} roles + pemetaan permission...`);
  for (const r of ROLES) {
    // upsert role by slug
    await db
      .insert(roles)
      .values({ name: r.name, slug: r.slug, description: r.description, isSystem: r.isSystem })
      .onConflictDoUpdate({
        target: roles.slug,
        // roles.slug kini partial unique (WHERE deleted_at IS NULL) — cocokkan predikatnya.
        targetWhere: isNull(roles.deletedAt),
        set: { name: r.name, description: r.description, isSystem: r.isSystem },
      });

    const [roleRow] = await db
      .select()
      .from(roles)
      .where(and(eq(roles.slug, r.slug), isNull(roles.deletedAt)));
    if (!roleRow) continue;

    // tentukan daftar key permission untuk role ini
    const keys = r.permissions.includes('*') ? ALL_PERMISSION_KEYS : r.permissions;
    const mappings = keys
      .map((k) => permByKey.get(k))
      .filter((id): id is string => Boolean(id))
      .map((permissionId) => ({ roleId: roleRow.id, permissionId }));

    if (mappings.length > 0) {
      await db.insert(rolePermissions).values(mappings).onConflictDoNothing();
    }
  }

  // ---- 3. Menu items ----
  console.log(`Seed ${MENU_ITEMS.length} menu items...`);
  for (const m of MENU_ITEMS) {
    // hindari duplikat berdasarkan path
    const existing = await db.select().from(menuItems).where(eq(menuItems.path, m.path));
    if (existing.length === 0) {
      await db.insert(menuItems).values({
        label: m.label,
        icon: m.icon,
        path: m.path,
        permissionKey: m.permissionKey ?? undefined,
        order: m.order,
        isActive: true,
      });
    }
  }

  // ---- 4. Super Admin user ----
  const superEmail = process.env.SUPERADMIN_EMAIL ?? 'development@privasimu.com';
  const superPassword = process.env.SUPERADMIN_PASSWORD ?? 'changeme-please';
  console.log(`Seed Super Admin (${superEmail})...`);

  // TODO: GANTI password setelah login pertama. Hash via bcryptjs.
  const passwordHash = await bcrypt.hash(superPassword, 10);

  let superUserId: string;
  const existingUser = await db.select().from(users).where(eq(users.email, superEmail));
  if (existingUser.length === 0) {
    const [created] = await db
      .insert(users)
      .values({
        name: 'Super Admin',
        email: superEmail,
        passwordHash,
        status: 'active',
        emailVerifiedAt: new Date(),
      })
      .returning();
    superUserId = created.id;
  } else {
    superUserId = existingUser[0].id;
  }

  // tautkan ke role super-admin
  const [superRole] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.slug, 'super-admin'), isNull(roles.deletedAt)));
  if (superRole) {
    await db
      .insert(userRoles)
      .values({ userId: superUserId, roleId: superRole.id })
      .onConflictDoNothing();
  }

  // ---- 5. UI Themes (8 tema, is_system true) ----
  console.log(`Seed ${UI_THEMES.length} UI themes...`);
  for (const th of UI_THEMES) {
    await db
      .insert(uiThemes)
      .values({
        name: th.name,
        slug: th.slug,
        tokensJson: th.tokens,
        isActive: true,
        isSystem: true,
      })
      .onConflictDoUpdate({
        target: uiThemes.slug,
        // uiThemes.slug kini partial unique (WHERE deleted_at IS NULL).
        targetWhere: isNull(uiThemes.deletedAt),
        set: { name: th.name, tokensJson: th.tokens, isActive: true, isSystem: true },
      });
  }

  // ---- 6. Settings: default_theme = 'teduh' ----
  console.log("Seed settings default_theme = 'teduh'...");
  await db
    .insert(settings)
    .values({ key: 'default_theme', valueJson: 'teduh' })
    .onConflictDoUpdate({ target: settings.key, set: { valueJson: 'teduh', updatedAt: new Date() } });

  // ---- 7. Storage config GLOBAL default (Vercel Blob) ----
  // TODO ENKRIPSI: token di sini HANYA placeholder. Pada implementasi nyata,
  // enkripsi BLOB_READ_WRITE_TOKEN dengan AES-256-GCM memakai STORAGE_ENC_KEY,
  // lalu simpan ciphertext/iv/tag (token JANGAN disimpan/di-log plaintext).
  console.log('Seed storage_configs GLOBAL default (vercel_blob)...');
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? '';
  let globalStorageId: string | undefined;
  // Cari config global default yang masih aktif.
  const [existingGlobalStorage] = await db
    .select()
    .from(storageConfigs)
    .where(
      and(
        eq(storageConfigs.ownerType, 'global'),
        eq(storageConfigs.isDefault, true),
        isNull(storageConfigs.deletedAt),
      ),
    );
  if (existingGlobalStorage) {
    globalStorageId = existingGlobalStorage.id;
  } else {
    const [createdStorage] = await db
      .insert(storageConfigs)
      .values({
        ownerType: 'global',
        ownerId: null,
        provider: 'vercel_blob',
        label: 'Blob Global (Platform)',
        // TODO: ganti placeholder ini dengan hasil enkripsi token sebenarnya.
        tokenCiphertext: blobToken ? 'TODO_ENCRYPT_BLOB_TOKEN' : null,
        tokenIv: null,
        tokenTag: null,
        baseUrl: null,
        isDefault: true,
        status: 'active',
      })
      .returning();
    globalStorageId = createdStorage?.id;
  }

  // settings.default_storage_config_id -> id storage global default.
  if (globalStorageId) {
    console.log('Seed settings default_storage_config_id...');
    await db
      .insert(settings)
      .values({ key: 'default_storage_config_id', valueJson: globalStorageId })
      .onConflictDoUpdate({
        target: settings.key,
        set: { valueJson: globalStorageId, updatedAt: new Date() },
      });
  }

  // ---- 8. Settings: trash_retention_days = 30 (job purge otomatis) ----
  console.log('Seed settings trash_retention_days = 30...');
  await db
    .insert(settings)
    .values({ key: 'trash_retention_days', valueJson: 30 })
    .onConflictDoUpdate({ target: settings.key, set: { valueJson: 30, updatedAt: new Date() } });

  console.log('Seed selesai.');
}

main()
  .then(() => {
    console.log('OK.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed gagal:', err);
    process.exit(1);
  });
