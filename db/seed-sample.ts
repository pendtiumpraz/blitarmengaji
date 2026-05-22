/**
 * Seed DATA NYATA dari sample.html — titik dakwah Blitar Raya, ustadz (+akun),
 * akun pengelola per titik, dan kajian rutin + jadwal terdekat.
 * Idempoten: upsert by email/slug; password DI-RESET tiap run (agar cocok dgn PDF kredensial).
 * Kredensial ditulis ke data/sample-credentials.json (untuk PDF; JANGAN commit).
 * Jalankan: npx tsx db/seed-sample.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import fs from "fs";
import path from "path";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { and, eq, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set");
const db = drizzle(neon(url), { schema });

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "x";
const genPw = () => "bm-" + crypto.randomBytes(3).toString("hex");

// Enkripsi AES-256-GCM (sama dgn src/lib/storage.ts) — simpan kredensial di DB utk produksi.
function encKey(): Buffer {
  const hex = (process.env.STORAGE_ENC_KEY ?? "").padEnd(64, "0").slice(0, 64);
  return Buffer.from(hex, "hex");
}
function encryptStr(plain: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", encKey(), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return { ciphertext: ct.toString("base64"), iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64") };
}

const DAY: Record<string, number> = { minggu: 0, ahad: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, "jum'at": 5, jumat: 5, sabtu: 6 };
function nextDate(dayName: string, hour: number): Date {
  const target = DAY[dayName.toLowerCase()] ?? 2;
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  let add = (target - d.getDay() + 7) % 7;
  if (add === 0 && d.getTime() < Date.now()) add = 7;
  d.setDate(d.getDate() + add);
  return d;
}
function hourOf(time: string): number {
  const t = time.toLowerCase();
  if (t.includes("subuh")) return 5;
  if (t.includes("ashar")) return 16;
  if (t.includes("maghrib")) return 18;
  if (t.includes("isya")) return 19;
  const m = t.match(/(\d{1,2})[.:](\d{2})/);
  if (m) return Number(m[1]);
  return 18;
}

/* ---------- DATA (dari sample.html) ---------- */
const TITIK = [
  { name: "Masjid Baitul Manan", desc: "Belakang Jagal Sapi Muhsin — Utara RSI AMINAH", kec: "Kota Blitar", lat: -8.1259654, lng: 112.1555732 },
  { name: "Masjid Muhammad", desc: "MTT Al Qudwah, Tugurante", kec: "Kota Blitar", lat: -8.090052, lng: 112.1102272 },
  { name: "Masjid Ar Rohmah", desc: "Jl. A. Yani, Kota Blitar", kec: "Kota Blitar", lat: -8.0994661, lng: 112.1747329 },
  { name: "Mushalla Wakaf Ali Shalih Al-Khudhairi", desc: "Dusun Sumber, Desa Slorok, Garum", kec: "Garum", lat: -8.0470682, lng: 112.2450252 },
  { name: "Mushola TK/SD DINUNA", desc: "Jl. Kiai Arfan, Jatinom, Kanigoro", kec: "Kanigoro", lat: -8.1265279, lng: 112.1755271 },
  { name: "Mushola Al Ikhram", desc: "Blitar", kec: "Kota Blitar", lat: -8.0953845, lng: 112.169064 },
  { name: "Saung Gunung Gamping", desc: "Perbatasan Blitar - Tulungagung", kec: "Blitar", lat: -8.127514, lng: 112.120145 },
  { name: "Masjid At-Taqwa Sanggrahan", desc: "Sanggrahan, terbuka untuk umum", kec: "Garum", lat: -8.160525, lng: 112.367884 },
];

const USTADZ = [
  { name: "Ustadz Ayyub Nofel Baya'syut", spec: "Pembina Blitar Mengaji" },
  { name: "Ustadz Abu Haitsam Iqbal", spec: "Pengajar Ponpes Imam Syafi'i Blitar" },
  { name: "Ustadz Ahmad Syarifuddin", spec: "Pengasuh Ma'had Al Qudwah Kediri" },
  { name: "Ustadz Mohammad Zaenal Arifin", spec: "Pengajar Tahsin Al-Qur'an" },
  { name: "Ustadz Arif Darmawan", spec: "Staf Pengajar Ma'had Al Qudwah Sambi, Kediri" },
  { name: "Ustadz Anwar Zaen", spec: "Pemateri Kajian" },
  { name: "Ustadz M. Anwar Samuri, Lc", spec: "Pemateri Kajian" },
  { name: "Ustadz Rahmad Susanto", spec: "Pengajar Nahwu & Shorof" },
  { name: "Ustadz Abdullah bin Hamzah", spec: "Pemateri Fiqih" },
  { name: "Ustadz Izzu Abdil Barr", spec: "Pemateri Tafsir" },
  { name: "Ustadz Abdul Hadi Karaman", spec: "Pengajar Tahsin Al-Qur'an" },
];

const KAJIAN = [
  { title: "Kajian Ilmiah BLITAR MENGAJI", kitab: "Kitab Riyadhus Shalihin", ustadz: "Ustadz Ayyub Nofel Baya'syut", titik: "Masjid Baitul Manan", day: "Selasa", time: "Ba'da Maghrib" },
  { title: "Kajian Kitab Umdatul Ahkam", kitab: "Umdatul Ahkam (Hadist Fiqh)", ustadz: "Ustadz Abu Haitsam Iqbal", titik: "Masjid Muhammad", day: "Selasa", time: "Ba'da Maghrib" },
  { title: "Syarah Kitab Lum'atul I'tiqad", kitab: "Lum'atul I'tiqad", ustadz: "Ustadz Ayyub Nofel Baya'syut", titik: "Masjid Muhammad", day: "Senin", time: "Ba'da Maghrib" },
  { title: "Kajian Ahad Ke-3 Blitar Kota", kitab: "Hilyati Thalibil Ilmi (Adab Penuntut Ilmu)", ustadz: "Ustadz Ahmad Syarifuddin", titik: "Masjid Ar Rohmah", day: "Ahad", time: "09.00" },
  { title: "Kajian Tahsin Tilawah Al-Qur'an", kitab: "Perbaikan Bacaan Al-Qur'an", ustadz: "Ustadz Mohammad Zaenal Arifin", titik: "Mushalla Wakaf Ali Shalih Al-Khudhairi", day: "Jum'at", time: "Ba'da Maghrib" },
  { title: "Kajian Kamis Ke-2 & 4 Kota Blitar", kitab: "Khulashah Ta'zhim al Ilmi", ustadz: "Ustadz Arif Darmawan", titik: "Mushola TK/SD DINUNA", day: "Kamis", time: "Ba'da Maghrib" },
  { title: "Kajian Kitab Al Kabaair", kitab: "Al Kabaair (Dosa-Dosa Besar)", ustadz: "Ustadz Ayyub Nofel Baya'syut", titik: "Masjid Muhammad", day: "Rabu", time: "Ba'da Maghrib" },
  { title: "Majlis Taklim Firqotun Najiyah", kitab: "Kitab Riyadhus Shalihin", ustadz: "Ustadz Ayyub Nofel Baya'syut", titik: "Mushola Al Ikhram", day: "Selasa", time: "Ba'da Maghrib" },
  { title: "Kajian Tafsir Al-Qur'an", kitab: "Tafsir As Sa'dy (Juz 28)", ustadz: "Ustadz Abu Haitsam Iqbal", titik: "Masjid Muhammad", day: "Selasa", time: "Ba'da Maghrib" },
  { title: "Kajian Rutin Ahad Pagi", kitab: "Pohon Keimanan", ustadz: "Ustadz Anwar Zaen", titik: "Saung Gunung Gamping", day: "Ahad", time: "07.00" },
  { title: "Kajian Kun Salafiyyan 'Alal Jaddati", kitab: "Kun Salafiyyan 'Alal Jaddati", ustadz: "Ustadz M. Anwar Samuri, Lc", titik: "Masjid At-Taqwa Sanggrahan", day: "Ahad", time: "07.30" },
  { title: "Kajian Nahwu & Shorof", kitab: "Durusul Lughoh Al-Arobiyyati", ustadz: "Ustadz Rahmad Susanto", titik: "Masjid At-Taqwa Sanggrahan", day: "Selasa", time: "16.30" },
  { title: "Al Mumti' Syarah Al Jurumiyyah", kitab: "Al Mumti' Syarah Al Jurumiyyah", ustadz: "Ustadz Rahmad Susanto", titik: "Masjid At-Taqwa Sanggrahan", day: "Selasa", time: "Ba'da Maghrib" },
  { title: "Kajian Kitab Fiqih Shalat", kitab: "Fiqih Shalat", ustadz: "Ustadz Abdullah bin Hamzah", titik: "Masjid At-Taqwa Sanggrahan", day: "Kamis", time: "Ba'da Maghrib" },
  { title: "Tafsir Al-Baghowi", kitab: "Tafsir Al-Baghowi", ustadz: "Ustadz Izzu Abdil Barr", titik: "Masjid At-Taqwa Sanggrahan", day: "Kamis", time: "Ba'da Maghrib" },
  { title: "Ianatul Mustafiid (Syarah Kitabut Tauhid)", kitab: "Ianatul Mustafiid", ustadz: "Ustadz Ayyub Nofel Baya'syut", titik: "Masjid At-Taqwa Sanggrahan", day: "Sabtu", time: "Ba'da Maghrib" },
  { title: "Kajian Tahsin Al-Quran (Sanggrahan)", kitab: "Tahsin Al-Quran", ustadz: "Ustadz Abdul Hadi Karaman", titik: "Masjid At-Taqwa Sanggrahan", day: "Sabtu", time: "Ba'da Ashar" },
];

async function getRoleId(slug: string): Promise<string | null> {
  const r = await db.select({ id: schema.roles.id }).from(schema.roles).where(and(eq(schema.roles.slug, slug), isNull(schema.roles.deletedAt))).limit(1);
  return r[0]?.id ?? null;
}

async function upsertUser(name: string, email: string, pw: string): Promise<string> {
  const hash = await bcrypt.hash(pw, 10);
  const [u] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash: hash, status: "active" })
    .onConflictDoUpdate({ target: schema.users.email, set: { passwordHash: hash, name } })
    .returning({ id: schema.users.id });
  return u.id;
}
async function linkRole(userId: string, roleId: string | null) {
  if (!roleId) return;
  await db.insert(schema.userRoles).values({ userId, roleId }).onConflictDoNothing();
}

async function main() {
  console.log("Seed sample (titik + ustadz + akun + kajian)...");
  const ustadzRole = await getRoleId("ustadz");
  const pengelolaRole = await getRoleId("pengelola-titik");

  const creds = { ustadz: [] as Record<string, string>[], titik: [] as Record<string, string>[] };

  // USTADZ + akun + profil
  const ustadzProfileId = new Map<string, string>();
  for (const u of USTADZ) {
    const slug = "smp-" + slugify(u.name.replace(/^ustadz\s+/i, ""));
    const email = `${slugify(u.name.replace(/^ustadz\s+/i, "")).replace(/-/g, ".")}@ustadz.blitarmengaji.id`;
    const pw = genPw();
    const userId = await upsertUser(u.name, email, pw);
    await linkRole(userId, ustadzRole);
    // profil ustadz (by userId)
    const existing = await db.select({ id: schema.ustadzProfiles.id }).from(schema.ustadzProfiles).where(and(eq(schema.ustadzProfiles.userId, userId), isNull(schema.ustadzProfiles.deletedAt))).limit(1);
    let pid: string;
    if (existing[0]) {
      pid = existing[0].id;
      await db.update(schema.ustadzProfiles).set({ name: u.name, specialization: u.spec, status: "active" }).where(eq(schema.ustadzProfiles.id, pid));
    } else {
      const [p] = await db.insert(schema.ustadzProfiles).values({ userId, name: u.name, slug, specialization: u.spec, status: "active" }).returning({ id: schema.ustadzProfiles.id });
      pid = p.id;
    }
    ustadzProfileId.set(u.name, pid);
    creds.ustadz.push({ nama: u.name, spesialisasi: u.spec, email, password: pw });
  }

  // TITIK + akun pengelola
  const titikId = new Map<string, string>();
  for (const t of TITIK) {
    const slug = "smp-" + slugify(t.name);
    const email = `${slugify(t.name)}@titik.blitarmengaji.id`;
    const pw = genPw();
    const ownerId = await upsertUser(`Pengelola ${t.name}`, email, pw);
    await linkRole(ownerId, pengelolaRole);
    const existing = await db.select({ id: schema.titikDakwah.id }).from(schema.titikDakwah).where(and(eq(schema.titikDakwah.slug, slug), isNull(schema.titikDakwah.deletedAt))).limit(1);
    let id: string;
    const vals = {
      name: t.name, slug, description: t.desc, address: t.desc, kecamatan: t.kec,
      latitude: String(t.lat), longitude: String(t.lng),
      gmapsUrl: `https://www.google.com/maps?q=${t.lat},${t.lng}`,
      status: "active" as const, isActive: true, ownerUserId: ownerId,
    };
    if (existing[0]) { id = existing[0].id; await db.update(schema.titikDakwah).set(vals).where(eq(schema.titikDakwah.id, id)); }
    else { const [r] = await db.insert(schema.titikDakwah).values(vals).returning({ id: schema.titikDakwah.id }); id = r.id; }
    titikId.set(t.name, id);
    creds.titik.push({ titik: t.name, kecamatan: t.kec, email, password: pw });
  }

  // KAJIAN + jadwal
  for (const k of KAJIAN) {
    const slug = "smp-" + slugify(k.title);
    const tid = titikId.get(k.titik) ?? null;
    const uid = ustadzProfileId.get(k.ustadz) ?? null;
    const existing = await db.select({ id: schema.kajian.id }).from(schema.kajian).where(and(eq(schema.kajian.slug, slug), isNull(schema.kajian.deletedAt))).limit(1);
    let kid: string;
    const vals = { title: k.title, slug, description: `${k.day}, ${k.time} — bersama ${k.ustadz}`, ustadzId: uid, titikDakwahId: tid, kitab: k.kitab, type: "offline" as const, status: "published" as const };
    if (existing[0]) { kid = existing[0].id; await db.update(schema.kajian).set(vals).where(eq(schema.kajian.id, kid)); }
    else { const [r] = await db.insert(schema.kajian).values(vals).returning({ id: schema.kajian.id }); kid = r.id; }
    // jadwal terdekat (hapus jadwal smp lama utk kajian ini → 1 jadwal)
    await db.delete(schema.kajianSchedules).where(eq(schema.kajianSchedules.kajianId, kid));
    await db.insert(schema.kajianSchedules).values({ kajianId: kid, titikDakwahId: tid, title: `${k.title} (${k.day}, ${k.time})`, startAt: nextDate(k.day, hourOf(k.time)), isOnline: false, status: "scheduled" });
  }

  // tulis kredensial utk PDF
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "sample-credentials.json"), JSON.stringify(creds, null, 2));

  // Simpan terenkripsi ke DB → PDF akun bisa diakses di produksi (tanpa file lokal).
  const enc = encryptStr(JSON.stringify(creds));
  await db
    .insert(schema.settings)
    .values({ key: "sample_credentials", valueJson: enc })
    .onConflictDoUpdate({ target: schema.settings.key, set: { valueJson: enc, updatedAt: new Date() } });

  console.log(`Selesai: ${TITIK.length} titik (+akun), ${USTADZ.length} ustadz (+akun), ${KAJIAN.length} kajian.`);
  console.log(`Kredensial → data/sample-credentials.json + DB (settings.sample_credentials, terenkripsi)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
