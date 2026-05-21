/**
 * Seed DATA CONTOH untuk UAT (realistis, Blitar Raya). Idempoten.
 * Semua data ditandai agar mudah dibersihkan:
 *   - tabel ber-slug → slug diawali "uat-"
 *   - tabel tanpa slug → judul/nama/deskripsi diawali "[UAT] "
 * Jalankan:  npx tsx db/seed-uat.ts        (isi / refresh)
 * Bersihkan: npx tsx db/unseed-uat.ts      (hapus semua data UAT)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { and, eq, inArray, like, isNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set");
export const db = drizzle(neon(url), { schema });

const {
  users, titikDakwah, ustadzProfiles, kajian, kajianSchedules, financeCategories,
  financeTransactions, donationCampaigns, donationUpdates, posts, libraryItems,
  courses, courseModules, courseLessons, events, businessPartners, mediaPartners,
  products, questions, answers,
} = schema;

const cover = (_s?: string): string | null => null; // placeholder; biar tak bergantung Blob
const tiptap = (text: string) => ({
  type: "doc",
  content: text.split("\n").filter(Boolean).map((p) => ({
    type: "paragraph",
    content: [{ type: "text", text: p }],
  })),
});
const daysFromNow = (d: number, h = 5) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  dt.setHours(h, 0, 0, 0);
  return dt;
};

/** Hapus seluruh data UAT (urut anak → induk). Dipakai seed (refresh) & unseed. */
export async function cleanupUat() {
  const ids = async (tbl: typeof titikDakwah | typeof kajian | typeof courses | typeof events | typeof businessPartners | typeof donationCampaigns) =>
    (await db.select({ id: tbl.id }).from(tbl).where(like(tbl.slug, "uat-%"))).map((r) => r.id);

  // questions/answers (tanpa slug → tanda [UAT])
  const qIds = (await db.select({ id: questions.id }).from(questions).where(like(questions.title, "[UAT]%"))).map((r) => r.id);
  if (qIds.length) await db.delete(answers).where(inArray(answers.questionId, qIds));
  if (qIds.length) await db.delete(questions).where(inArray(questions.id, qIds));

  // courses → modules → lessons
  const courseIds = await ids(courses);
  if (courseIds.length) {
    const modIds = (await db.select({ id: courseModules.id }).from(courseModules).where(inArray(courseModules.courseId, courseIds))).map((r) => r.id);
    if (modIds.length) await db.delete(courseLessons).where(inArray(courseLessons.moduleId, modIds));
    await db.delete(courseModules).where(inArray(courseModules.courseId, courseIds));
    await db.delete(courses).where(inArray(courses.id, courseIds));
  }

  // events
  const evIds = await ids(events);
  if (evIds.length) await db.delete(events).where(inArray(events.id, evIds));

  // products → business_partners ; media_partners
  const bpIds = await ids(businessPartners);
  if (bpIds.length) await db.delete(products).where(inArray(products.businessPartnerId, bpIds));
  if (bpIds.length) await db.delete(businessPartners).where(inArray(businessPartners.id, bpIds));
  await db.delete(mediaPartners).where(like(mediaPartners.slug, "uat-%"));

  // donations
  const campIds = await ids(donationCampaigns);
  if (campIds.length) await db.delete(donationUpdates).where(inArray(donationUpdates.campaignId, campIds));
  if (campIds.length) await db.delete(donationCampaigns).where(inArray(donationCampaigns.id, campIds));

  // finance
  await db.delete(financeTransactions).where(like(financeTransactions.description, "[UAT]%"));
  await db.delete(financeCategories).where(like(financeCategories.name, "[UAT]%"));

  // kajian → schedules
  const kIds = await ids(kajian);
  if (kIds.length) await db.delete(kajianSchedules).where(inArray(kajianSchedules.kajianId, kIds));
  if (kIds.length) await db.delete(kajian).where(inArray(kajian.id, kIds));

  // konten
  await db.delete(libraryItems).where(like(libraryItems.title, "[UAT]%"));
  await db.delete(posts).where(like(posts.slug, "uat-%"));
  await db.delete(ustadzProfiles).where(like(ustadzProfiles.slug, "uat-%"));

  // titik (induk paling akhir)
  await db.delete(titikDakwah).where(like(titikDakwah.slug, "uat-%"));
}

async function main() {
  console.log("Membersihkan data UAT lama (refresh)...");
  await cleanupUat();

  const [admin] = await db.select({ id: users.id }).from(users).where(isNull(users.deletedAt)).limit(1);
  const owner = admin?.id ?? null;

  console.log("Seed titik dakwah...");
  const titikData = [
    { name: "Masjid Agung Kota Blitar", slug: "uat-masjid-agung-blitar", kelurahan: "Kepanjenkidul", kecamatan: "Kepanjenkidul", address: "Jl. Merdeka, Kota Blitar", lat: "-8.0954", lng: "112.1609" },
    { name: "Masjid Al-Falah Sananwetan", slug: "uat-al-falah-sananwetan", kelurahan: "Sananwetan", kecamatan: "Sananwetan", address: "Jl. Cemara, Kota Blitar", lat: "-8.0876", lng: "112.1820" },
    { name: "Mushola An-Nur Garum", slug: "uat-an-nur-garum", kelurahan: "Garum", kecamatan: "Garum", address: "Garum, Kab. Blitar", lat: "-8.0312", lng: "112.2360" },
    { name: "Masjid Baiturrahman Wlingi", slug: "uat-baiturrahman-wlingi", kelurahan: "Wlingi", kecamatan: "Wlingi", address: "Wlingi, Kab. Blitar", lat: "-8.0790", lng: "112.3140" },
  ];
  const titikRows = await db.insert(titikDakwah).values(
    titikData.map((t) => ({
      name: t.name, slug: t.slug, description: `Titik dakwah aktif di ${t.kecamatan}, Blitar Raya.`,
      address: t.address, kelurahan: t.kelurahan, kecamatan: t.kecamatan,
      latitude: t.lat, longitude: t.lng, gmapsUrl: `https://www.google.com/maps?q=${t.lat},${t.lng}`,
      coverImage: cover(t.slug), contactPhone: "0812-3456-7890", ownerUserId: owner, status: "active" as const,
    })),
  ).returning({ id: titikDakwah.id, slug: titikDakwah.slug });
  const titikId = (s: string) => titikRows.find((r) => r.slug === s)!.id;

  console.log("Seed ustadz...");
  const ustadzRows = await db.insert(ustadzProfiles).values([
    { userId: owner, name: "Ust. Ahmad Fauzi, Lc.", slug: "uat-ahmad-fauzi", specialization: "Fiqih & Tafsir", bio: "Pengajar kajian rutin di Blitar Raya.", status: "active" as const },
    { userId: owner, name: "Ust. Yusuf Mansur (UAT)", slug: "uat-yusuf-uat", specialization: "Akhlak & Tazkiyah", bio: "Pembina majelis taklim.", status: "active" as const },
  ]).returning({ id: ustadzProfiles.id, slug: ustadzProfiles.slug });
  const uId = (s: string) => ustadzRows.find((r) => r.slug === s)!.id;

  console.log("Seed kajian + jadwal...");
  const kajianRows = await db.insert(kajian).values([
    { title: "Kajian Tafsir Al-Qur'an", slug: "uat-tafsir-quran", description: "Kajian tafsir ba'da Subuh setiap Ahad.", ustadzId: uId("uat-ahmad-fauzi"), titikDakwahId: titikId("uat-masjid-agung-blitar"), kitab: "Tafsir Ibnu Katsir", type: "offline" as const, status: "published" as const },
    { title: "Bedah Kitab Riyadhus Shalihin", slug: "uat-riyadhus-shalihin", description: "Kajian akhlak rutin malam Jumat.", ustadzId: uId("uat-yusuf-uat"), titikDakwahId: titikId("uat-al-falah-sananwetan"), kitab: "Riyadhus Shalihin", type: "hybrid" as const, status: "published" as const },
    { title: "Fiqih Ibadah Praktis", slug: "uat-fiqih-ibadah", description: "Belajar fiqih ibadah sehari-hari.", ustadzId: uId("uat-ahmad-fauzi"), titikDakwahId: titikId("uat-an-nur-garum"), kitab: "Fiqih Sunnah", type: "offline" as const, status: "published" as const },
  ]).returning({ id: kajian.id, slug: kajian.slug, titikDakwahId: kajian.titikDakwahId });
  const kId = (s: string) => kajianRows.find((r) => r.slug === s)!;
  await db.insert(kajianSchedules).values([
    { kajianId: kId("uat-tafsir-quran").id, titikDakwahId: kId("uat-tafsir-quran").titikDakwahId, title: "uat Tafsir — Pekan ini", startAt: daysFromNow(2, 5), endAt: daysFromNow(2, 7), isOnline: false, status: "scheduled" as const },
    { kajianId: kId("uat-riyadhus-shalihin").id, titikDakwahId: kId("uat-riyadhus-shalihin").titikDakwahId, title: "uat Riyadhus — Malam Jumat", startAt: daysFromNow(4, 19), endAt: daysFromNow(4, 21), isOnline: true, streamUrl: "https://youtu.be/dakwah", status: "scheduled" as const },
    { kajianId: kId("uat-fiqih-ibadah").id, titikDakwahId: kId("uat-fiqih-ibadah").titikDakwahId, title: "uat Fiqih — Sabtu", startAt: daysFromNow(6, 16), endAt: daysFromNow(6, 17), isOnline: false, status: "scheduled" as const },
  ]);

  console.log("Seed keuangan...");
  const catRows = await db.insert(financeCategories).values([
    { name: "[UAT] Infak Jumat", type: "income" as const },
    { name: "[UAT] Donasi Umum", type: "income" as const },
    { name: "[UAT] Operasional", type: "expense" as const },
  ]).returning({ id: financeCategories.id, name: financeCategories.name });
  const catId = (n: string) => catRows.find((r) => r.name === n)!.id;
  await db.insert(financeTransactions).values([
    { titikDakwahId: titikId("uat-masjid-agung-blitar"), categoryId: catId("[UAT] Infak Jumat"), type: "income" as const, amount: "2500000.00", description: "[UAT] Infak kotak amal Jumat", trxDate: daysFromNow(-3), createdBy: owner },
    { titikDakwahId: titikId("uat-masjid-agung-blitar"), categoryId: catId("[UAT] Donasi Umum"), type: "income" as const, amount: "5000000.00", description: "[UAT] Donasi hamba Allah", trxDate: daysFromNow(-2), createdBy: owner },
    { titikDakwahId: titikId("uat-masjid-agung-blitar"), categoryId: catId("[UAT] Operasional"), type: "expense" as const, amount: "1200000.00", description: "[UAT] Listrik & kebersihan", trxDate: daysFromNow(-1), createdBy: owner },
  ]);

  console.log("Seed donasi...");
  const campRows = await db.insert(donationCampaigns).values([
    { titikDakwahId: titikId("uat-masjid-agung-blitar"), title: "Renovasi Tempat Wudhu", slug: "uat-renovasi-wudhu", description: "Bantu renovasi tempat wudhu jamaah.", targetAmount: "50000000.00", collectedAmount: "18500000.00", status: "active" as const, startAt: daysFromNow(-10), endAt: daysFromNow(40), contactLink: "https://wa.me/6281234567890", createdBy: owner },
    { titikDakwahId: titikId("uat-al-falah-sananwetan"), title: "Wakaf Al-Qur'an", slug: "uat-wakaf-quran", description: "Pengadaan 200 mushaf untuk TPQ.", targetAmount: "15000000.00", collectedAmount: "9000000.00", status: "active" as const, startAt: daysFromNow(-5), endAt: daysFromNow(25), contactLink: "https://wa.me/6281234567890", createdBy: owner },
  ]).returning({ id: donationCampaigns.id, slug: donationCampaigns.slug });
  await db.insert(donationUpdates).values([
    { campaignId: campRows[0].id, title: "Progres pekan 1", body: "Pembelian material tahap awal.", amountUsed: "5000000.00" },
  ]);

  console.log("Seed catatan & pustaka...");
  await db.insert(posts).values([
    { title: "Adab Menuntut Ilmu", slug: "uat-adab-menuntut-ilmu", type: "catatan" as const, contentRich: tiptap("Niat ikhlas adalah pondasi.\nHormati guru dan sabar dalam belajar."), excerpt: "Ringkasan adab penuntut ilmu.", authorUserId: owner, status: "published" as const, publishedAt: daysFromNow(-4), views: 42 },
    { title: "Keutamaan Sedekah", slug: "uat-keutamaan-sedekah", type: "catatan" as const, contentRich: tiptap("Sedekah tidak mengurangi harta.\nIa menumbuhkan keberkahan."), excerpt: "Catatan kajian tentang sedekah.", authorUserId: owner, status: "published" as const, publishedAt: daysFromNow(-2), views: 31 },
    { title: "Tafsir Surat Al-Fatihah", slug: "uat-tafsir-al-fatihah", type: "artikel" as const, contentRich: tiptap("Al-Fatihah induk Al-Qur'an.\nMengandung tauhid dan doa."), excerpt: "Pengantar tafsir Al-Fatihah.", authorUserId: owner, status: "published" as const, publishedAt: daysFromNow(-1), views: 58 },
  ]);
  await db.insert(libraryItems).values([
    { title: "[UAT] Panduan Shalat Lengkap", description: "E-book panduan shalat sesuai sunnah.", author: "Tim Blitar Mengaji", ustadzId: uId("uat-ahmad-fauzi"), pdfUrl: "https://example.com/uat/panduan-shalat.pdf", fileSize: 1240000, downloads: 12, status: "published" as const },
    { title: "[UAT] Kumpulan Doa Harian", description: "Doa-doa harian beserta artinya.", author: "Tim Blitar Mengaji", ustadzId: uId("uat-yusuf-uat"), pdfUrl: "https://example.com/uat/doa-harian.pdf", fileSize: 860000, downloads: 27, status: "published" as const },
  ]);

  console.log("Seed kelas + modul + pelajaran...");
  const courseRows = await db.insert(courses).values([
    { title: "Belajar Tajwid dari Nol", slug: "uat-tajwid-nol", description: "Kelas tahsin & tajwid untuk pemula.", level: "Pemula", ustadzId: uId("uat-ahmad-fauzi"), status: "published" as const },
    { title: "Fiqih Puasa Ramadhan", slug: "uat-fiqih-puasa", description: "Persiapan ibadah puasa.", level: "Menengah", ustadzId: uId("uat-yusuf-uat"), status: "published" as const },
  ]).returning({ id: courses.id, slug: courses.slug });
  const cId = (s: string) => courseRows.find((r) => r.slug === s)!.id;
  const modRows = await db.insert(courseModules).values([
    { courseId: cId("uat-tajwid-nol"), title: "Pengenalan Huruf Hijaiyah", order: 1 },
    { courseId: cId("uat-tajwid-nol"), title: "Hukum Nun Mati & Tanwin", order: 2 },
    { courseId: cId("uat-fiqih-puasa"), title: "Rukun & Syarat Puasa", order: 1 },
  ]).returning({ id: courseModules.id, title: courseModules.title });
  const mId = (t: string) => modRows.find((r) => r.title === t)!.id;
  await db.insert(courseLessons).values([
    { moduleId: mId("Pengenalan Huruf Hijaiyah"), title: "Makhraj Huruf", kind: "video" as const, videoUrl: "https://youtu.be/tajwid1", order: 1, duration: 600 },
    { moduleId: mId("Pengenalan Huruf Hijaiyah"), title: "Latihan Membaca", kind: "text" as const, content: "Latihan membaca huruf hijaiyah satu per satu.", order: 2 },
    { moduleId: mId("Hukum Nun Mati & Tanwin"), title: "Idzhar & Idgham", kind: "video" as const, videoUrl: "https://youtu.be/tajwid2", order: 1, duration: 720 },
    { moduleId: mId("Rukun & Syarat Puasa"), title: "Penjelasan Rukun", kind: "text" as const, content: "Rukun puasa: niat dan menahan diri dari pembatal.", order: 1 },
  ]);

  console.log("Seed event...");
  await db.insert(events).values([
    { title: "Tabligh Akbar Blitar Raya", slug: "uat-tabligh-akbar", description: "Tabligh akbar bersama ustadz nasional.", kind: "offline" as const, startAt: daysFromNow(14, 8), endAt: daysFromNow(14, 12), location: "Alun-alun Kota Blitar", capacity: 1000, needsRegistration: true, organizerType: "internal" as const, status: "published" as const },
    { title: "Webinar Parenting Islami", slug: "uat-webinar-parenting", description: "Mendidik anak ala Rasulullah.", kind: "webinar" as const, startAt: daysFromNow(7, 19), endAt: daysFromNow(7, 21), onlineUrl: "https://zoom.us/j/uat", capacity: 500, needsRegistration: true, organizerType: "internal" as const, status: "published" as const },
  ]);

  console.log("Seed partner & lapak...");
  const bpRows = await db.insert(businessPartners).values([
    { name: "Kurma Berkah Blitar", slug: "uat-kurma-berkah", description: "Penjual kurma & madu premium.", category: "Makanan", contactWa: "6281234567890", ownerUserId: owner, status: "active" as const },
  ]).returning({ id: businessPartners.id });
  await db.insert(products).values([
    { businessPartnerId: bpRows[0].id, title: "Kurma Ajwa 500g", description: "Kurma Ajwa premium.", price: "120000.00", contactLink: "https://wa.me/6281234567890", status: "active" as const },
    { businessPartnerId: bpRows[0].id, title: "Madu Hutan 250ml", description: "Madu murni.", price: "85000.00", contactLink: "https://wa.me/6281234567890", status: "active" as const },
  ]);
  await db.insert(mediaPartners).values([
    { name: "Radio Dakwah Blitar", slug: "uat-radio-dakwah", description: "Media partner siaran kajian.", website: "https://example.com", ownerUserId: owner, status: "active" as const },
  ]);

  console.log("Seed tanya ustadz...");
  const qRows = await db.insert(questions).values([
    { userId: owner, isAnonymous: true, title: "[UAT] Hukum qadha puasa", body: "Bagaimana cara mengganti puasa yang ditinggalkan?", status: "answered" as const, assignedUstadzId: uId("uat-ahmad-fauzi") },
    { userId: owner, isAnonymous: false, askerName: "Budi", title: "[UAT] Waktu shalat dhuha", body: "Kapan waktu terbaik shalat dhuha?", status: "pending" as const },
  ]).returning({ id: questions.id, title: questions.title });
  const ans = qRows.find((r) => r.title === "[UAT] Hukum qadha puasa");
  if (ans) await db.insert(answers).values([{ questionId: ans.id, ustadzId: uId("uat-ahmad-fauzi"), body: "Qadha puasa dilakukan sejumlah hari yang ditinggalkan, sebelum Ramadhan berikutnya." }]);

  console.log("Seed UAT selesai. Bersihkan dengan: npx tsx db/unseed-uat.ts");
}

// Jalankan hanya bila dipanggil langsung (bukan saat di-import unseed).
const isDirect = process.argv[1]?.replace(/\\/g, "/").endsWith("db/seed-uat.ts");
if (isDirect) main().catch((e) => { console.error(e); process.exit(1); });
