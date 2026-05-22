import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

/**
 * Generator PDF "Panduan Pengguna" Blitar Mengaji.
 * Memakai @react-pdf/renderer (font default Helvetica, tanpa next/font).
 * Selaras design system: emerald #0E5C46, emas #C9A227, cream #F4EEE1.
 *
 * Dokumen berisi halaman bersampul + bagian-bagian terstruktur yang
 * mencakup seluruh fitur publik aplikasi. Bahasa Indonesia.
 */

const COLORS = {
  emerald: "#0E5C46", // emerald (warna utama brand)
  emeraldDark: "#0A4435",
  emeraldSoft: "#E7F1ED",
  gold: "#C9A227", // emas (judul section & aksen)
  goldSoft: "#FBF4DD",
  cream: "#F4EEE1", // cream (latar sampul & kartu)
  ink: "#1F2A24",
  muted: "#5E6B63",
  line: "#D9E2DC",
  white: "#FFFFFF",
};

const tanggalPanjang = (d: Date) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const styles = StyleSheet.create({
  // ===== Halaman umum =====
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    lineHeight: 1.45,
    color: COLORS.ink,
    fontFamily: "Helvetica",
    backgroundColor: COLORS.white,
  },

  // ===== Sampul =====
  cover: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    fontFamily: "Helvetica",
    color: COLORS.ink,
    backgroundColor: COLORS.cream,
  },
  coverBand: {
    backgroundColor: COLORS.emerald,
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 48,
  },
  coverCrest: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: COLORS.goldSoft,
    color: COLORS.emerald,
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 12,
    marginBottom: 22,
  },
  coverBrand: {
    fontSize: 11,
    letterSpacing: 3,
    color: COLORS.gold,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 40,
    color: COLORS.white,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.1,
  },
  coverTagline: {
    fontSize: 12,
    color: COLORS.cream,
    marginTop: 14,
    maxWidth: 380,
    lineHeight: 1.5,
  },
  coverBody: {
    paddingHorizontal: 48,
    paddingTop: 36,
  },
  coverLead: {
    fontSize: 11,
    color: COLORS.ink,
    lineHeight: 1.6,
    maxWidth: 420,
  },
  coverTocTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
    marginTop: 30,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tocRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  tocNum: {
    width: 22,
    color: COLORS.gold,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tocText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.ink,
  },
  coverFooter: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
    paddingTop: 10,
    fontSize: 8.5,
    color: COLORS.muted,
  },

  // ===== Kop berjalan (header tiap halaman isi) =====
  runHead: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.emerald,
    paddingBottom: 8,
    marginBottom: 18,
  },
  runCrest: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
    color: COLORS.gold,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
    marginRight: 8,
  },
  runTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
  },
  runMeta: {
    marginLeft: "auto",
    fontSize: 8,
    color: COLORS.muted,
  },

  // ===== Judul bagian (emas) =====
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 10,
  },
  sectionNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.gold,
    color: COLORS.white,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 6,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    flex: 1,
  },
  sectionIntro: {
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.55,
    marginBottom: 12,
  },

  // ===== Sub-bagian =====
  subHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
    marginTop: 10,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.55,
    marginBottom: 6,
  },

  // ===== Bullet =====
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 6,
  },
  bulletDot: {
    width: 12,
    color: COLORS.gold,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.5,
  },
  bulletLabel: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.emeraldDark,
  },

  // ===== Langkah bernomor =====
  stepRow: {
    flexDirection: "row",
    marginBottom: 5,
    paddingRight: 6,
  },
  stepNum: {
    width: 18,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.emeraldSoft,
    color: COLORS.emerald,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3,
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.5,
  },

  // ===== Kotak catatan (tips/penting) =====
  note: {
    backgroundColor: COLORS.emeraldSoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emerald,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  noteGold: {
    backgroundColor: COLORS.goldSoft,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  noteLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emeraldDark,
    marginBottom: 2,
  },
  noteLabelGold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.5,
  },

  // ===== Footer (nomor halaman) =====
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    flexDirection: "row",
    fontSize: 7.5,
    color: COLORS.muted,
  },
  footerNote: { flex: 1 },
  footerPage: { textAlign: "right" },

  // jarak antar bagian dalam satu halaman
  sectionBlock: {
    marginBottom: 18,
  },
});

// ===== Komponen kecil (helper) =====

function Bullet({ label, children }: { label?: string; children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>
        {label ? <Text style={styles.bulletLabel}>{label} </Text> : null}
        {children}
      </Text>
    </View>
  );
}

function Step({ n, children }: { n: number; children: string }) {
  return (
    <View style={styles.stepRow}>
      <Text style={styles.stepNum}>{n}</Text>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

function Note({
  children,
  gold = false,
  label,
}: {
  children: string;
  gold?: boolean;
  label?: string;
}) {
  return (
    <View style={gold ? styles.noteGold : styles.note}>
      <Text style={gold ? styles.noteLabelGold : styles.noteLabel}>
        {label ?? (gold ? "Tips" : "Catatan")}
      </Text>
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

function SectionHeading({ num, title }: { num: number; title: string }) {
  return (
    <View style={styles.sectionHeading} wrap={false}>
      <Text style={styles.sectionNum}>{num}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function RunningHead() {
  return (
    <View style={styles.runHead} fixed>
      <Text style={styles.runCrest}>BM</Text>
      <Text style={styles.runTitle}>Blitar Mengaji — Panduan Pengguna</Text>
      <Text style={styles.runMeta}>Panduan resmi pengguna</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerNote}>
        Blitar Mengaji · Satu pintu kajian, dakwah, & donasi Blitar Raya.
      </Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) =>
          `Halaman ${pageNumber} / ${totalPages}`
        }
      />
    </View>
  );
}

// Daftar isi (dipakai di sampul & sebagai urutan bagian).
const DAFTAR_ISI = [
  "Pendahuluan & Cara Akses",
  "Menjelajah: Peta, Jadwal, Kajian & Titik Dakwah",
  "Donasi",
  "Catatan/Faedah & Perpustakaan",
  "Kelas Online & Event",
  "Tanya Ustadz & Tanya AI",
  "Akun: Daftar, Login, Tema & Notifikasi",
  "Gabung Jadi Pengelola, Ustadz, atau Partner",
];

function UserGuideDocument({ generatedAt }: { generatedAt: Date }) {
  return (
    <Document
      title="Panduan Pengguna Blitar Mengaji"
      author="Blitar Mengaji"
      subject="Panduan penggunaan aplikasi & layanan publik Blitar Mengaji"
    >
      {/* ===================== SAMPUL ===================== */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverBand}>
          <Text style={styles.coverCrest}>BM</Text>
          <Text style={styles.coverBrand}>Blitar Mengaji · Blitar Raya</Text>
          <Text style={styles.coverTitle}>Panduan{"\n"}Pengguna</Text>
          <Text style={styles.coverTagline}>
            Satu pintu untuk menemukan kajian, mengikuti dakwah, belajar, dan
            berdonasi di seluruh Blitar Raya.
          </Text>
        </View>

        <View style={styles.coverBody}>
          <Text style={styles.coverLead}>
            Selamat datang. Panduan ini menuntun Anda memakai seluruh fitur
            publik Blitar Mengaji — dari menjelajah Peta Kajian, mengikuti kelas
            online, mencatat faedah, hingga berdonasi dengan amanah. Tidak perlu
            mahir teknologi; cukup ikuti langkah demi langkah.
          </Text>

          <Text style={styles.coverTocTitle}>Daftar Isi</Text>
          {DAFTAR_ISI.map((judul, i) => (
            <View style={styles.tocRow} key={judul}>
              <Text style={styles.tocNum}>{i + 1}.</Text>
              <Text style={styles.tocText}>{judul}</Text>
            </View>
          ))}
        </View>

        <View style={styles.coverFooter}>
          <Text>
            Dokumen panduan resmi pengguna · Disusun {tanggalPanjang(generatedAt)} ·
            Untuk jamaah & masyarakat umum Blitar Raya.
          </Text>
        </View>
      </Page>

      {/* ===================== ISI ===================== */}
      <Page size="A4" style={styles.page}>
        <RunningHead />

        {/* 1. PENDAHULUAN & CARA AKSES */}
        <View style={styles.sectionBlock}>
          <SectionHeading num={1} title="Pendahuluan & Cara Akses" />
          <Text style={styles.sectionIntro}>
            Blitar Mengaji adalah platform dakwah digital yang menghimpun jadwal
            kajian, titik dakwah, kelas online, perpustakaan, serta donasi dalam
            satu aplikasi. Sebagian besar fitur dapat dinikmati tanpa harus
            mendaftar; akun hanya diperlukan untuk fitur personal seperti
            menyimpan catatan, mengikuti kelas, atau bertanya kepada ustadz.
          </Text>

          <Text style={styles.subHeading}>Mengakses lewat Web</Text>
          <Bullet>
            Buka peramban (Chrome, Safari, atau lainnya) di ponsel maupun
            komputer, lalu kunjungi situs resmi Blitar Mengaji.
          </Bullet>
          <Bullet>
            Halaman beranda menyajikan kajian terdekat, jadwal hari ini, dan
            menu utama. Semua dapat dibuka langsung tanpa login.
          </Bullet>

          <Text style={styles.subHeading}>Memasang sebagai Aplikasi (PWA)</Text>
          <Step n={1}>
            Buka situs Blitar Mengaji di peramban ponsel Anda.
          </Step>
          <Step n={2}>
            Ketuk menu peramban, lalu pilih “Tambahkan ke Layar Utama” (Add to
            Home Screen).
          </Step>
          <Step n={3}>
            Ikon Blitar Mengaji akan muncul di layar utama dan bisa dibuka layak
            aplikasi biasa, termasuk sebagian akses saat sinyal lemah.
          </Step>

          <Text style={styles.subHeading}>Memasang APK (Android)</Text>
          <Bullet>
            Bagi pengguna Android, tersedia berkas APK resmi yang dapat dipasang
            langsung. Unduh hanya dari tautan resmi Blitar Mengaji.
          </Bullet>
          <Bullet>
            Jika muncul peringatan “sumber tidak dikenal”, izinkan pemasangan
            untuk berkas tersebut, lalu lanjutkan seperti memasang aplikasi pada
            umumnya.
          </Bullet>

          <Note gold label="Tips">
            Versi PWA dan APK menampilkan fitur yang sama dengan versi web,
            sehingga Anda dapat memilih cara akses yang paling nyaman.
          </Note>
        </View>

        {/* 2. MENJELAJAH */}
        <View style={styles.sectionBlock}>
          <SectionHeading
            num={2}
            title="Menjelajah Kajian & Dakwah"
          />
          <Text style={styles.sectionIntro}>
            Empat menu utama membantu Anda menemukan kajian yang tepat: Peta
            Kajian, Jadwal, daftar Kajian beserta detailnya, dan Titik Dakwah.
          </Text>

          <Text style={styles.subHeading}>Peta Kajian</Text>
          <Bullet>
            Menampilkan lokasi kajian dan titik dakwah pada peta interaktif.
            Geser dan perbesar peta untuk melihat kajian di sekitar Anda.
          </Bullet>
          <Bullet>
            Ketuk penanda (pin) untuk melihat ringkasan kajian: tema, ustadz,
            waktu, dan tombol menuju detail.
          </Bullet>

          <Text style={styles.subHeading}>Jadwal</Text>
          <Bullet>
            Daftar kajian tersusun menurut waktu — hari ini, pekan ini, dan
            seterusnya — lengkap dengan jam dan lokasi.
          </Bullet>
          <Bullet>
            Gunakan penyaring (filter) berdasarkan tema, ustadz, atau wilayah
            untuk mempersempit pencarian.
          </Bullet>

          <Text style={styles.subHeading}>Kajian & Halaman Detail</Text>
          <Bullet label="Detail kajian:">
            memuat tema, nama ustadz, kitab/materi, waktu, lokasi lengkap, serta
            tautan peta untuk menuju lokasi.
          </Bullet>
          <Bullet label="Kajian rutin:">
            menampilkan pola jadwal berulang (mis. setiap pekan) agar Anda mudah
            merencanakan kehadiran.
          </Bullet>

          <Text style={styles.subHeading}>Titik Dakwah</Text>
          <Bullet>
            Titik Dakwah adalah masjid, musala, atau majelis yang menjadi pusat
            kegiatan. Halamannya merangkum profil lokasi dan kajian yang
            diselenggarakan di sana.
          </Bullet>
          <Bullet>
            Dari sebuah titik dakwah Anda dapat melihat seluruh kajian terkait
            sekaligus campaign donasi yang sedang berjalan.
          </Bullet>

          <Note label="Catatan">
            Sebagian kajian dapat berubah waktu atau lokasi. Periksa kembali
            detail terbaru sebelum berangkat.
          </Note>
        </View>

        <Footer />
      </Page>

      {/* Halaman: DONASI + CATATAN/PERPUSTAKAAN */}
      <Page size="A4" style={styles.page}>
        <RunningHead />

        {/* 3. DONASI */}
        <View style={styles.sectionBlock}>
          <SectionHeading num={3} title="Donasi" />
          <Text style={styles.sectionIntro}>
            Anda dapat menyalurkan donasi untuk mendukung kegiatan dakwah,
            pembangunan, atau program tertentu melalui campaign yang tersedia.
            Seluruh proses dirancang transparan dan mudah.
          </Text>

          <Text style={styles.subHeading}>Melihat Campaign</Text>
          <Bullet>
            Buka menu Donasi untuk melihat daftar campaign yang sedang berjalan,
            lengkap dengan target dana, dana terkumpul, dan progres.
          </Bullet>
          <Bullet>
            Buka detail campaign untuk membaca latar belakang, lokasi (titik
            dakwah), serta laporan penggunaan dana.
          </Bullet>

          <Text style={styles.subHeading}>Berdonasi via QRIS</Text>
          <Step n={1}>Pilih campaign yang ingin Anda dukung.</Step>
          <Step n={2}>
            Pindai kode QRIS yang tertera memakai aplikasi mobile banking atau
            dompet digital apa pun yang mendukung QRIS.
          </Step>
          <Step n={3}>
            Masukkan nominal donasi, lalu selesaikan pembayaran sesuai aplikasi
            Anda.
          </Step>

          <Text style={styles.subHeading}>Konfirmasi via WhatsApp</Text>
          <Step n={1}>
            Setelah membayar, ketuk tombol konfirmasi untuk membuka WhatsApp.
          </Step>
          <Step n={2}>
            Lampirkan bukti transfer dan sebutkan nama campaign agar donasi
            tercatat dengan tepat.
          </Step>
          <Step n={3}>
            Anda boleh memakai nama “Hamba Allah” jika ingin berdonasi tanpa
            mencantumkan identitas.
          </Step>

          <Note gold label="Amanah">
            Penggunaan dana dilaporkan secara terbuka. Anda dapat memeriksa
            laporan penggunaan dana pada halaman campaign.
          </Note>
        </View>

        {/* 4. CATATAN & PERPUSTAKAAN */}
        <View style={styles.sectionBlock}>
          <SectionHeading num={4} title="Catatan/Faedah & Perpustakaan" />

          <Text style={styles.subHeading}>Catatan / Faedah</Text>
          <Bullet>
            Simpan faedah atau poin penting dari kajian dalam bentuk catatan
            pribadi sehingga mudah ditinjau kembali kapan saja.
          </Bullet>
          <Bullet>
            Catatan dapat ditautkan dengan kajian terkait agar konteksnya tetap
            jelas. Fitur ini memerlukan akun.
          </Bullet>

          <Text style={styles.subHeading}>Perpustakaan</Text>
          <Bullet>
            Kumpulan dokumen, ringkasan materi, dan bacaan bermanfaat yang dapat
            dibaca langsung di aplikasi.
          </Bullet>
          <Bullet label="Unduh PDF:">
            buka dokumen yang diinginkan, lalu ketuk tombol unduh untuk
            menyimpan berkas PDF ke perangkat dan membacanya secara luring.
          </Bullet>
        </View>

        <Footer />
      </Page>

      {/* Halaman: KELAS ONLINE + EVENT */}
      <Page size="A4" style={styles.page}>
        <RunningHead />

        {/* 5. KELAS ONLINE & EVENT */}
        <View style={styles.sectionBlock}>
          <SectionHeading num={5} title="Kelas Online & Event" />
          <Text style={styles.sectionIntro}>
            Tingkatkan ilmu lewat kelas online terstruktur dan ikuti event
            keagamaan yang diselenggarakan komunitas.
          </Text>

          <Text style={styles.subHeading}>Mendaftar Kelas (Enroll)</Text>
          <Step n={1}>Buka menu Kelas dan telusuri daftar kelas tersedia.</Step>
          <Step n={2}>
            Buka detail kelas untuk membaca silabus, pengajar, dan jumlah
            materi.
          </Step>
          <Step n={3}>
            Ketuk tombol “Daftar/Ikuti Kelas” (enroll). Anda perlu masuk dengan
            akun terlebih dahulu.
          </Step>

          <Text style={styles.subHeading}>Belajar & Memantau Progress</Text>
          <Bullet>
            Materi tersaji per bagian (modul/pelajaran). Selesaikan satu per
            satu sesuai urutan.
          </Bullet>
          <Bullet label="Progress:">
            penyelesaian materi tercatat otomatis sehingga Anda tahu sejauh mana
            kemajuan belajar dan dapat melanjutkan dari titik terakhir.
          </Bullet>
          <Bullet>
            Anda bisa belajar kapan saja sesuai kecepatan masing-masing.
          </Bullet>

          <Text style={styles.subHeading}>Event</Text>
          <Bullet>
            Menu Event menampilkan kegiatan khusus seperti tabligh akbar,
            seminar, atau kajian tematik beserta waktu dan lokasinya.
          </Bullet>
          <Bullet>
            Buka detail event untuk informasi lengkap dan cara mengikuti.
          </Bullet>

          <Note label="Catatan">
            Riwayat kelas dan progress tersimpan pada akun Anda, sehingga tetap
            tersinkron meski berpindah perangkat.
          </Note>
        </View>

        <Footer />
      </Page>

      {/* Halaman: TANYA USTADZ + TANYA AI */}
      <Page size="A4" style={styles.page}>
        <RunningHead />

        {/* 6. TANYA USTADZ & TANYA AI */}
        <View style={styles.sectionBlock}>
          <SectionHeading num={6} title="Tanya Ustadz & Tanya AI" />
          <Text style={styles.sectionIntro}>
            Punya pertanyaan seputar agama? Blitar Mengaji menyediakan dua jalur:
            bertanya langsung kepada ustadz, atau memakai bantuan Tanya AI untuk
            jawaban cepat.
          </Text>

          <Text style={styles.subHeading}>Tanya Ustadz</Text>
          <Step n={1}>Buka menu Tanya Ustadz.</Step>
          <Step n={2}>
            Tuliskan pertanyaan Anda sejelas mungkin agar jawaban lebih tepat.
          </Step>
          <Step n={3}>
            Anda boleh mencantumkan nama atau memakai “Hamba Allah” bila ingin
            bertanya tanpa identitas.
          </Step>
          <Step n={4}>
            Kirim pertanyaan, lalu pantau halaman tanya jawab untuk melihat
            balasan ustadz.
          </Step>

          <Text style={styles.subHeading}>Tanya AI</Text>
          <Bullet>
            Tanya AI memberi jawaban cepat berbasis materi yang tersedia di
            Blitar Mengaji, cocok untuk pertanyaan ringan atau mencari rujukan
            awal.
          </Bullet>
          <Bullet>
            Ketik pertanyaan pada kolom percakapan, lalu kirim. Jawaban akan
            muncul beserta rujukan bila tersedia.
          </Bullet>

          <Note gold label="Penting">
            Tanya AI bersifat membantu, bukan pengganti fatwa. Untuk persoalan
            penting, mohon tetap merujuk kepada ustadz melalui menu Tanya Ustadz.
          </Note>
        </View>

        {/* 7. AKUN */}
        <View style={styles.sectionBlock}>
          <SectionHeading num={7} title="Akun: Daftar, Login, Tema & Notifikasi" />
          <Text style={styles.sectionIntro}>
            Akun membuka fitur personal: menyimpan catatan, mengikuti kelas
            beserta progress-nya, dan bertanya kepada ustadz.
          </Text>

          <Text style={styles.subHeading}>Mendaftar</Text>
          <Step n={1}>Buka menu Masuk/Daftar, lalu pilih “Daftar”.</Step>
          <Step n={2}>
            Isi data yang diminta (mis. nama dan email), lalu tetapkan kata
            sandi.
          </Step>
          <Step n={3}>Selesaikan pendaftaran dan langsung masuk.</Step>

          <Text style={styles.subHeading}>Masuk (Login)</Text>
          <Bullet>
            Masukkan email dan kata sandi pada halaman Masuk, lalu ketuk tombol
            masuk.
          </Bullet>

          <Text style={styles.subHeading}>Lupa Kata Sandi</Text>
          <Bullet>
            Pada halaman Masuk, pilih “Lupa kata sandi”, lalu ikuti petunjuk
            pemulihan untuk menetapkan sandi baru.
          </Bullet>

          <Text style={styles.subHeading}>Mengganti Tema</Text>
          <Bullet>
            Tersedia pilihan tema terang dan gelap. Ubah lewat pengaturan tampilan
            agar membaca lebih nyaman, terutama di malam hari.
          </Bullet>

          <Text style={styles.subHeading}>Notifikasi</Text>
          <Bullet>
            Aktifkan notifikasi untuk menerima pengingat jadwal kajian, kabar
            event, atau pembaruan campaign donasi.
          </Bullet>
          <Bullet>
            Anda dapat mengizinkan atau menonaktifkan notifikasi kapan saja
            melalui pengaturan perangkat maupun aplikasi.
          </Bullet>
        </View>

        <Footer />
      </Page>

      {/* Halaman: GABUNG */}
      <Page size="A4" style={styles.page}>
        <RunningHead />

        {/* 8. GABUNG */}
        <View style={styles.sectionBlock}>
          <SectionHeading
            num={8}
            title="Gabung Jadi Pengelola, Ustadz, atau Partner"
          />
          <Text style={styles.sectionIntro}>
            Ingin berkontribusi lebih? Anda dapat bergabung dalam ekosistem
            Blitar Mengaji sesuai peran. Berikut gambaran ringkasnya.
          </Text>

          <Text style={styles.subHeading}>Pengelola Titik Dakwah</Text>
          <Bullet>
            Mengelola profil titik dakwah, menambah dan memperbarui jadwal
            kajian, serta mengurus campaign donasi terkait lokasinya.
          </Bullet>

          <Text style={styles.subHeading}>Ustadz / Pengajar</Text>
          <Bullet>
            Tercantum sebagai pengisi kajian, mengisi kelas online, dan menjawab
            pertanyaan jamaah lewat menu Tanya Ustadz.
          </Bullet>

          <Text style={styles.subHeading}>Partner / Mitra</Text>
          <Bullet>
            Lembaga, komunitas, atau donatur yang mendukung program dakwah dan
            kegiatan Blitar Mengaji secara berkelanjutan.
          </Bullet>

          <Text style={styles.subHeading}>Cara Bergabung</Text>
          <Step n={1}>
            Buka halaman/menu “Gabung” atau “Kontak” pada aplikasi.
          </Step>
          <Step n={2}>
            Pilih peran yang sesuai (pengelola, ustadz, atau partner) dan ikuti
            petunjuk pengajuan.
          </Step>
          <Step n={3}>
            Tim Blitar Mengaji akan meninjau pengajuan Anda dan menindaklanjuti.
          </Step>

          <Note gold label="Terima Kasih">
            Setiap kontribusi — sekecil apa pun — membantu menyebarkan ilmu dan
            kebaikan di Blitar Raya. Jazakumullah khairan.
          </Note>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}

/** Render dokumen Panduan Pengguna menjadi PDF (Uint8Array) untuk Response. */
export async function renderUserGuidePdf(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await renderToBuffer(
    <UserGuideDocument generatedAt={new Date()} />,
  );
  // Salin ke ArrayBuffer baru agar tipe pasti Uint8Array<ArrayBuffer> (cocok BodyInit).
  const out = new Uint8Array(buffer.byteLength);
  out.set(buffer);
  return out;
}
