import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

/**
 * Generator PDF "Panduan Admin" Blitar Mengaji.
 * Dokumen berdesain penuh: sampul, daftar isi, section emas, multi-halaman,
 * footer nomor halaman. Memakai @react-pdf/renderer (font default Helvetica).
 *
 * Warna brand selaras keuangan.tsx & donasi.tsx:
 *   emerald (hijau teduh) + emas + parchment.
 */

const BRAND = "#0E5C46"; // emerald
const BRAND_DARK = "#0B4636"; // emerald gelap
const GOLD = "#C9A227"; // emas
const GOLD_SOFT = "#FBF4DD"; // emas pucat
const INK = "#1F2A24";
const MUTED = "#6B7A72";
const LINE = "#D9E2DC";
const SOFT = "#F5F8F6"; // hijau sangat muda
const PARCHMENT = "#FBF8F1";

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    lineHeight: 1.5,
    color: INK,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },

  /* ============ SAMPUL ============ */
  cover: {
    flex: 1,
    backgroundColor: BRAND,
    color: "#FFFFFF",
    padding: 0,
  },
  coverInner: {
    flex: 1,
    paddingHorizontal: 56,
    paddingTop: 96,
    paddingBottom: 56,
  },
  coverRule: {
    height: 6,
    backgroundColor: GOLD,
    width: 70,
    marginBottom: 28,
  },
  coverCrest: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: GOLD,
    color: BRAND_DARK,
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 12,
    marginBottom: 28,
  },
  coverEyebrow: {
    fontSize: 11,
    letterSpacing: 4,
    color: GOLD_SOFT,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    lineHeight: 1.1,
  },
  coverTitleGold: {
    fontSize: 40,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
    lineHeight: 1.1,
    marginBottom: 22,
  },
  coverLede: {
    fontSize: 12,
    color: "#DCEBE4",
    lineHeight: 1.6,
    maxWidth: 380,
  },
  coverMetaWrap: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#2E6E5A",
    paddingTop: 16,
    flexDirection: "row",
  },
  coverMetaBlock: {
    flex: 1,
  },
  coverMetaLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    color: "#8FB8AB",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  coverMetaValue: {
    fontSize: 10,
    color: "#FFFFFF",
    fontFamily: "Helvetica-Bold",
  },

  /* ============ KOP HALAMAN ISI ============ */
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 10,
    marginBottom: 18,
  },
  crest: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: BRAND,
    color: GOLD,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 6,
    marginRight: 9,
  },
  headTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  headSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 1,
  },
  headRight: {
    marginLeft: "auto",
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  /* ============ SECTION EMAS ============ */
  sectionBand: {
    backgroundColor: BRAND,
    borderRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  sectionNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: GOLD,
    color: BRAND_DARK,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 4,
    marginRight: 10,
  },
  sectionBandTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: GOLD_SOFT,
  },
  subHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginTop: 12,
    marginBottom: 5,
  },
  paragraph: {
    fontSize: 9.5,
    color: INK,
    marginBottom: 8,
    lineHeight: 1.55,
  },
  lead: {
    fontSize: 10,
    color: BRAND_DARK,
    marginBottom: 10,
    lineHeight: 1.55,
  },

  /* ============ DAFTAR (bullet & langkah) ============ */
  bulletRow: {
    flexDirection: "row",
    marginBottom: 4,
    paddingRight: 6,
  },
  bulletDot: {
    width: 12,
    color: GOLD,
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.5,
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 5,
  },
  stepNum: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BRAND,
    color: BRAND,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 2,
    marginRight: 8,
  },
  stepText: {
    flex: 1,
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.5,
  },
  termRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  term: {
    fontFamily: "Helvetica-Bold",
    color: BRAND_DARK,
  },

  /* ============ KARTU CATATAN / TIP ============ */
  note: {
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    backgroundColor: GOLD_SOFT,
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 10,
  },
  noteLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#8A6D12",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  noteText: {
    fontSize: 9,
    color: "#5E4E12",
    lineHeight: 1.5,
  },

  /* ============ TABEL ============ */
  table: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: BRAND,
  },
  th: {
    color: GOLD_SOFT,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 6,
    paddingHorizontal: 7,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  trAlt: {
    backgroundColor: SOFT,
  },
  td: {
    fontSize: 8.5,
    paddingVertical: 5,
    paddingHorizontal: 7,
    color: INK,
    lineHeight: 1.45,
  },
  cKey: { width: "32%", fontFamily: "Helvetica-Bold", color: BRAND_DARK },
  cVal: { width: "68%" },
  cRole: { width: "26%", fontFamily: "Helvetica-Bold", color: BRAND_DARK },
  cPerm: { width: "32%" },
  cDesc: { width: "42%" },

  /* ============ TOC ============ */
  tocItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },
  tocNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: SOFT,
    borderWidth: 1,
    borderColor: BRAND,
    color: BRAND,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3,
    marginRight: 12,
  },
  tocText: {
    fontSize: 11,
    color: INK,
    fontFamily: "Helvetica-Bold",
  },
  tocSub: {
    fontSize: 8.5,
    color: MUTED,
    marginTop: 1,
  },

  /* ============ FOOTER ============ */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 7,
    flexDirection: "row",
    fontSize: 7,
    color: MUTED,
  },
  footerNote: { flex: 1 },
  footerPage: { textAlign: "right" },
});

/* ===================== Helper komponen ===================== */

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow} wrap={false}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <View style={styles.stepRow} wrap={false}>
      <Text style={styles.stepNum}>{n}</Text>
      <Text style={styles.stepText}>{children}</Text>
    </View>
  );
}

function Note({ label = "Catatan", children }: { label?: string; children: React.ReactNode }) {
  return (
    <View style={styles.note} wrap={false}>
      <Text style={styles.noteLabel}>{label}</Text>
      <Text style={styles.noteText}>{children}</Text>
    </View>
  );
}

function Section({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View style={styles.sectionBand} wrap={false}>
        <Text style={styles.sectionNum}>{num}</Text>
        <Text style={styles.sectionBandTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ContentHeader() {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.crest}>BM</Text>
      <View>
        <Text style={styles.headTitle}>Panduan Admin · Blitar Mengaji</Text>
        <Text style={styles.headSub}>Petunjuk operasional panel administrasi</Text>
      </View>
      <Text style={styles.headRight}>Internal</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerNote}>
        Blitar Mengaji · Panduan Admin · Dokumen internal untuk pengelola & ustadz terverifikasi.
      </Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/* ===================== Daftar isi (untuk TOC) ===================== */

const TOC: { num: number; title: string; sub: string }[] = [
  { num: 1, title: "Login Admin & Dashboard", sub: "Masuk panel, ringkasan, pintasan kerja" },
  { num: 2, title: "RBAC: Role & Permission", sub: "Peran, izin, super admin (akses penuh)" },
  { num: 3, title: "Titik Dakwah", sub: "Lokasi, status aktif/nonaktif, peta" },
  { num: 4, title: "Kajian & Jadwal", sub: "Tema, pemateri, waktu, pengulangan" },
  { num: 5, title: "Keuangan", sub: "Transaksi, kategori, PDF laporan" },
  { num: 6, title: "Donasi", sub: "Campaign, konfirmasi pembayaran" },
  { num: 7, title: "Catatan, Perpustakaan, Kelas", sub: "Faedah, koleksi, kelas pembelajaran" },
  { num: 8, title: "Event & Lapak", sub: "Acara dan etalase UMKM jamaah" },
  { num: 9, title: "Verifikasi Pendaftaran Entitas", sub: "Pengelola/ustadz/partner → role otomatis" },
  { num: 10, title: "Recycle Bin, Audit Log, Notifikasi", sub: "Pulihkan data, jejak aksi, pemberitahuan" },
  { num: 11, title: "Manajemen AI & Storage", sub: "Provider/model/binding, token terenkripsi" },
  { num: 12, title: "WA Ingest", sub: "Webhook & review kajian/faedah dari WhatsApp" },
  { num: 13, title: "Pengaturan, Tema & Pembayaran", sub: "Konfigurasi, tampilan, QRIS" },
  { num: 14, title: "Tips Penggunaan Panel", sub: "Tabel, konfirmasi, notifikasi" },
];

/* ===================== Dokumen ===================== */

function AdminGuideDocument({ generatedAt }: { generatedAt: Date }) {
  return (
    <Document
      title="Panduan Admin Blitar Mengaji"
      author="Blitar Mengaji"
      subject="Panduan operasional panel administrasi"
    >
      {/* ---------- SAMPUL ---------- */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverInner}>
          <Text style={styles.coverCrest}>BM</Text>
          <View style={styles.coverRule} />
          <Text style={styles.coverEyebrow}>Blitar Mengaji</Text>
          <Text style={styles.coverTitle}>Panduan</Text>
          <Text style={styles.coverTitleGold}>Admin</Text>
          <Text style={styles.coverLede}>
            Petunjuk lengkap pengelolaan panel administrasi Blitar Mengaji: dari titik dakwah,
            kajian, keuangan, hingga manajemen AI, storage, dan WA Ingest. Disusun agar setiap
            pengelola dapat bekerja amanah, rapi, dan dapat diaudit.
          </Text>

          <View style={styles.coverMetaWrap}>
            <View style={styles.coverMetaBlock}>
              <Text style={styles.coverMetaLabel}>Dokumen</Text>
              <Text style={styles.coverMetaValue}>Panduan Admin (Internal)</Text>
            </View>
            <View style={styles.coverMetaBlock}>
              <Text style={styles.coverMetaLabel}>Disusun</Text>
              <Text style={styles.coverMetaValue}>{dateTimeFmt.format(generatedAt)} WIB</Text>
            </View>
            <View style={styles.coverMetaBlock}>
              <Text style={styles.coverMetaLabel}>Untuk</Text>
              <Text style={styles.coverMetaValue}>Pengelola & Ustadz</Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ---------- DAFTAR ISI ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <View style={styles.sectionBand} wrap={false}>
          <Text style={styles.sectionNum}>i</Text>
          <Text style={styles.sectionBandTitle}>Daftar Isi</Text>
        </View>
        <Text style={styles.paragraph}>
          Panduan ini membahas seluruh modul panel admin Blitar Mengaji secara berurutan. Gunakan
          daftar di bawah sebagai peta; setiap bagian berdiri sendiri dan dapat dibaca sesuai
          kebutuhan tugas Anda.
        </Text>
        {TOC.map((t) => (
          <View key={t.num} style={styles.tocItem} wrap={false}>
            <Text style={styles.tocNum}>{t.num}</Text>
            <View>
              <Text style={styles.tocText}>{t.title}</Text>
              <Text style={styles.tocSub}>{t.sub}</Text>
            </View>
          </View>
        ))}
        <Footer />
      </Page>

      {/* ---------- BAGIAN 1: LOGIN & DASHBOARD ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={1} title="Login Admin & Dashboard">
          <Text style={styles.lead}>
            Pintu masuk panel administrasi. Hanya akun terverifikasi dengan peran yang sesuai yang
            dapat mengakses menu pengelolaan.
          </Text>

          <Text style={styles.subHeading}>Langkah masuk</Text>
          <Step n={1}>Buka halaman masuk di rute /masuk.</Step>
          <Step n={2}>
            Masukkan email & kata sandi (Credentials), atau gunakan Google bila tombolnya tampil.
          </Step>
          <Step n={3}>
            Sistem memverifikasi akun (status harus aktif) lalu mengarahkan ke Dashboard admin.
          </Step>
          <Step n={4}>
            Menu yang muncul menyesuaikan permission akun Anda — menu tanpa izin disembunyikan.
          </Step>

          <Text style={styles.subHeading}>Dashboard</Text>
          <Text style={styles.paragraph}>
            Dashboard menampilkan ringkasan operasional: jumlah titik dakwah aktif, kajian terdekat,
            saldo kas, donasi berjalan, serta antrean yang menunggu tindakan (verifikasi
            pendaftaran, konfirmasi pembayaran, review WA Ingest).
          </Text>
          <Bullet>Kartu ringkasan: data kunci dalam sekali pandang.</Bullet>
          <Bullet>Antrean tindakan: tautan cepat ke item yang perlu ditangani.</Bullet>
          <Bullet>Pintasan: akses cepat ke modul yang sering dipakai.</Bullet>

          <Note label="Keamanan">
            Jangan bagikan kredensial. Akun nonaktif otomatis ditolak saat login. Setiap aksi
            penting tercatat di Audit Log (lihat Bagian 10).
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 2: RBAC ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={2} title="RBAC: Role & Permission">
          <Text style={styles.lead}>
            RBAC (Role-Based Access Control) mengatur siapa boleh melakukan apa. Setiap akun memiliki
            satu atau lebih role; setiap role memuat sekumpulan permission.
          </Text>

          <Text style={styles.subHeading}>Konsep</Text>
          <View style={styles.termRow}>
            <Text style={styles.bulletText}>
              <Text style={styles.term}>Role</Text> — kumpulan peran (mis. pengelola, ustadz,
              partner, admin keuangan).
            </Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.bulletText}>
              <Text style={styles.term}>Permission</Text> — izin granular berbentuk key, mis.
              dashboard.view, keuangan.manage, donasi.confirm.
            </Text>
          </View>
          <View style={styles.termRow}>
            <Text style={styles.bulletText}>
              <Text style={styles.term}>Super Admin</Text> — role khusus dengan wildcard (*) yang
              memberi akses penuh ke semua modul tanpa perlu mendaftarkan tiap permission.
            </Text>
          </View>

          <Text style={styles.subHeading}>Contoh pemetaan role &rarr; permission</Text>
          <View style={styles.table}>
            <View style={styles.thead} fixed>
              <Text style={[styles.th, styles.cRole]}>Role</Text>
              <Text style={[styles.th, styles.cPerm]}>Contoh Permission</Text>
              <Text style={[styles.th, styles.cDesc]}>Cakupan</Text>
            </View>
            {[
              ["Super Admin", "*", "Akses penuh seluruh modul & pengaturan sistem."],
              ["Pengelola", "dashboard.view, titik.manage, kajian.manage", "Operasional titik dakwah & jadwal kajian."],
              ["Admin Keuangan", "keuangan.manage, donasi.confirm", "Catat transaksi, konfirmasi pembayaran donasi."],
              ["Ustadz", "kajian.manage, catatan.manage", "Kelola kajian yang diampu & faedah/catatan."],
              ["Partner", "lapak.manage, event.manage", "Kelola lapak UMKM & event."],
            ].map((r, i) => (
              <View key={r[0]} style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr} wrap={false}>
                <Text style={[styles.td, styles.cRole]}>{r[0]}</Text>
                <Text style={[styles.td, styles.cPerm]}>{r[1]}</Text>
                <Text style={[styles.td, styles.cDesc]}>{r[2]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.subHeading}>Mengelola role</Text>
          <Step n={1}>Buka modul Pengaturan &rarr; Role &amp; Permission.</Step>
          <Step n={2}>Buat/edit role, lalu centang permission yang diizinkan.</Step>
          <Step n={3}>Tetapkan role ke akun pengguna pada daftar pengguna.</Step>

          <Note>
            Berikan permission seperlunya (least privilege). Cadangkan role Super Admin hanya untuk
            pihak yang benar-benar tepercaya.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 3: TITIK DAKWAH ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={3} title="Kelola Titik Dakwah">
          <Text style={styles.lead}>
            Titik Dakwah adalah lokasi penyelenggaraan kajian (masjid, musala, majelis). Data ini
            menjadi dasar peta dan penjadwalan.
          </Text>

          <Text style={styles.subHeading}>Menambah / mengubah titik</Text>
          <Step n={1}>Buka modul Titik Dakwah, klik Tambah.</Step>
          <Step n={2}>Isi nama, alamat, kecamatan/desa, dan deskripsi singkat.</Step>
          <Step n={3}>Tentukan koordinat (latitude/longitude) agar muncul tepat di peta.</Step>
          <Step n={4}>Simpan; gunakan tombol aktif/nonaktif untuk mengatur visibilitas.</Step>

          <Text style={styles.subHeading}>Status & peta</Text>
          <Bullet>
            <Text style={styles.term}>Aktif</Text> — tampil di peta publik & dapat dipakai untuk
            jadwal kajian.
          </Bullet>
          <Bullet>
            <Text style={styles.term}>Nonaktif</Text> — disembunyikan dari publik tanpa menghapus
            data (riwayat tetap aman).
          </Bullet>
          <Bullet>Peta menampilkan penanda lokasi; pastikan koordinat akurat.</Bullet>

          <Note>
            Menonaktifkan lebih aman daripada menghapus. Bila terlanjur terhapus, data masih dapat
            dipulihkan lewat Recycle Bin (Bagian 10).
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 4: KAJIAN & JADWAL ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={4} title="Kelola Kajian & Jadwal">
          <Text style={styles.lead}>
            Modul kajian mengatur tema, pemateri, dan waktu pelaksanaan di tiap titik dakwah,
            termasuk jadwal berulang.
          </Text>

          <Text style={styles.subHeading}>Membuat kajian</Text>
          <Step n={1}>Buka modul Kajian, klik Tambah.</Step>
          <Step n={2}>Pilih titik dakwah, isi tema/judul dan ringkasan materi.</Step>
          <Step n={3}>Tetapkan pemateri (ustadz) dari daftar akun terverifikasi.</Step>
          <Step n={4}>Atur tanggal/jam mulai; aktifkan pengulangan bila rutin (mingguan/bulanan).</Step>
          <Step n={5}>Simpan; kajian akan tampil di jadwal publik sesuai waktunya.</Step>

          <Text style={styles.subHeading}>Pengelolaan jadwal</Text>
          <Bullet>Filter berdasarkan titik dakwah, pemateri, atau rentang tanggal.</Bullet>
          <Bullet>Ubah/batalkan kajian; perubahan langsung tercermin di jadwal publik.</Bullet>
          <Bullet>Tandai selesai untuk arsip; rekap dapat dijadikan catatan/faedah.</Bullet>

          <Note label="Tips">
            Manfaatkan pengulangan untuk kajian rutin agar tidak perlu input ulang setiap pekan.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 5: KEUANGAN ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={5} title="Kelola Keuangan">
          <Text style={styles.lead}>
            Modul keuangan mencatat seluruh pemasukan dan pengeluaran secara transparan. Laporan
            dapat diunduh sebagai PDF resmi yang dapat diaudit publik.
          </Text>

          <Text style={styles.subHeading}>Mencatat transaksi</Text>
          <Step n={1}>Buka modul Keuangan, klik Tambah Transaksi.</Step>
          <Step n={2}>Pilih tipe: Pemasukan atau Pengeluaran.</Step>
          <Step n={3}>Pilih kategori, isi jumlah (Rp), tanggal, dan keterangan.</Step>
          <Step n={4}>Tentukan lingkup (scope) bila ada beberapa kas/unit.</Step>
          <Step n={5}>Simpan; saldo kas otomatis terhitung ulang.</Step>

          <Text style={styles.subHeading}>Kategori & laporan</Text>
          <Bullet>Kelola kategori agar pencatatan konsisten dan mudah direkap.</Bullet>
          <Bullet>Ringkasan menampilkan Saldo Kas, Total Pemasukan, dan Total Pengeluaran.</Bullet>
          <Bullet>
            Unduh <Text style={styles.term}>PDF Laporan Keuangan</Text> untuk transparansi —
            dokumen memuat ringkasan & daftar transaksi.
          </Bullet>

          <Note label="Amanah">
            Catat setiap rupiah tepat waktu. Laporan keuangan bersifat terbuka; pastikan keterangan
            jelas agar setiap transaksi dapat ditelusuri.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 6: DONASI ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={6} title="Kelola Donasi & Konfirmasi Pembayaran">
          <Text style={styles.lead}>
            Modul donasi mengelola campaign penggalangan dana beserta verifikasi pembayaran dari
            donatur.
          </Text>

          <Text style={styles.subHeading}>Membuat campaign</Text>
          <Step n={1}>Buka modul Donasi, klik Tambah Campaign.</Step>
          <Step n={2}>Isi judul, cerita/tujuan, target dana, dan tenggat (opsional).</Step>
          <Step n={3}>Unggah gambar sampul; publikasikan saat siap.</Step>

          <Text style={styles.subHeading}>Konfirmasi pembayaran</Text>
          <Step n={1}>Buka daftar donasi masuk; donasi baru berstatus menunggu.</Step>
          <Step n={2}>Periksa bukti transfer / pembayaran QRIS yang diunggah donatur.</Step>
          <Step n={3}>Klik Konfirmasi bila valid, atau Tolak bila tidak sesuai.</Step>
          <Step n={4}>
            Setelah dikonfirmasi, nominal otomatis menambah progres campaign & dapat tercatat di
            keuangan.
          </Step>

          <Bullet>Pantau progres terkumpul vs target pada tiap campaign.</Bullet>
          <Bullet>Laporan penggunaan dana dapat diterbitkan sebagai PDF transparansi.</Bullet>

          <Note>
            Selalu cocokkan bukti pembayaran dengan mutasi rekening/QRIS sebelum mengonfirmasi.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 7: CATATAN, PERPUSTAKAAN, KELAS ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={7} title="Catatan, Perpustakaan & Kelas">
          <Text style={styles.lead}>
            Tiga modul konten ilmu: ringkasan faedah, koleksi pustaka, dan kelas pembelajaran
            terstruktur.
          </Text>

          <Text style={styles.subHeading}>Catatan (Faedah)</Text>
          <Bullet>Tulis ringkasan/faedah kajian; dapat ditautkan ke kajian terkait.</Bullet>
          <Bullet>Atur status publikasi (draf / terbit) sebelum tampil ke publik.</Bullet>
          <Bullet>Banyak catatan berasal dari WA Ingest yang telah direview (Bagian 12).</Bullet>

          <Text style={styles.subHeading}>Perpustakaan</Text>
          <Bullet>Kelola koleksi: judul, penulis, kategori, dan berkas/tautan.</Bullet>
          <Bullet>Unggah dokumen ke Storage (Vercel Blob) lalu sematkan tautannya.</Bullet>

          <Text style={styles.subHeading}>Kelas</Text>
          <Bullet>Buat kelas pembelajaran: deskripsi, pengampu, dan jadwal.</Bullet>
          <Bullet>Kelola materi/sesi serta peserta sesuai kebutuhan kelas.</Bullet>

          <Note label="Tips">
            Gunakan kategori yang konsisten agar konten mudah dicari lewat pencarian & filter tabel.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 8: EVENT & LAPAK ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={8} title="Kelola Event & Lapak">
          <Text style={styles.lead}>
            Event memublikasikan acara, sedangkan Lapak menjadi etalase UMKM jamaah.
          </Text>

          <Text style={styles.subHeading}>Event</Text>
          <Step n={1}>Buka modul Event, klik Tambah.</Step>
          <Step n={2}>Isi judul, deskripsi, lokasi, tanggal/jam, dan poster.</Step>
          <Step n={3}>Publikasikan; event tampil di kalender/daftar acara publik.</Step>

          <Text style={styles.subHeading}>Lapak</Text>
          <Step n={1}>Buka modul Lapak; tinjau pengajuan lapak dari jamaah/partner.</Step>
          <Step n={2}>Periksa nama usaha, produk, harga, kontak, dan foto.</Step>
          <Step n={3}>Setujui untuk menayangkan, atau nonaktifkan bila tidak sesuai.</Step>

          <Note>
            Pastikan lapak yang tayang relevan dan layak. Lapak bermasalah cukup dinonaktifkan, tidak
            harus dihapus.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 9: VERIFIKASI ENTITAS ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={9} title="Verifikasi Pendaftaran Entitas">
          <Text style={styles.lead}>
            Pendaftar sebagai pengelola, ustadz, atau partner harus diverifikasi admin. Setelah
            disetujui, sistem otomatis memberi role yang sesuai.
          </Text>

          <Text style={styles.subHeading}>Alur verifikasi</Text>
          <Step n={1}>Buka antrean Pendaftaran/Verifikasi pada panel admin.</Step>
          <Step n={2}>Tinjau data pendaftar & dokumen pendukung yang dilampirkan.</Step>
          <Step n={3}>Setujui bila valid — atau tolak disertai alasan.</Step>
          <Step n={4}>
            Persetujuan otomatis menetapkan role: pendaftar ustadz mendapat role Ustadz, pengelola
            mendapat role Pengelola, partner mendapat role Partner.
          </Step>

          <Text style={styles.subHeading}>Pemetaan otomatis</Text>
          <View style={styles.table}>
            <View style={styles.thead} fixed>
              <Text style={[styles.th, styles.cKey]}>Jenis Pendaftaran</Text>
              <Text style={[styles.th, styles.cVal]}>Role Otomatis & Hak Akses</Text>
            </View>
            {[
              ["Pengelola", "Role Pengelola — kelola titik dakwah & kajian di wilayahnya."],
              ["Ustadz", "Role Ustadz — kelola kajian yang diampu & catatan/faedah."],
              ["Partner", "Role Partner — kelola lapak UMKM & event."],
            ].map((r, i) => (
              <View key={r[0]} style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr} wrap={false}>
                <Text style={[styles.td, styles.cKey]}>{r[0]}</Text>
                <Text style={[styles.td, styles.cVal]}>{r[1]}</Text>
              </View>
            ))}
          </View>

          <Note label="Penting">
            Verifikasi adalah gerbang keamanan. Pastikan identitas dan kelayakan pendaftar sebelum
            menyetujui, karena role memberi akses ke modul pengelolaan.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 10: RECYCLE BIN, AUDIT LOG, NOTIFIKASI ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={10} title="Recycle Bin, Audit Log & Notifikasi">
          <Text style={styles.lead}>
            Tiga fitur keandalan: pemulihan data, jejak aksi, dan pemberitahuan.
          </Text>

          <Text style={styles.subHeading}>Recycle Bin</Text>
          <Bullet>Data yang dihapus masuk ke Recycle Bin (soft delete), bukan hilang permanen.</Bullet>
          <Bullet>
            <Text style={styles.term}>Restore</Text> mengembalikan data ke kondisi semula.
          </Bullet>
          <Bullet>
            <Text style={styles.term}>Hapus Permanen</Text> menghilangkan data selamanya — lakukan
            dengan hati-hati.
          </Bullet>

          <Text style={styles.subHeading}>Audit Log</Text>
          <Bullet>Mencatat aksi penting: siapa, apa, kapan (buat/ubah/hapus/konfirmasi).</Bullet>
          <Bullet>Gunakan untuk penelusuran masalah & pertanggungjawaban.</Bullet>

          <Text style={styles.subHeading}>Notifikasi</Text>
          <Bullet>Pemberitahuan untuk antrean tindakan: verifikasi, pembayaran, review WA.</Bullet>
          <Bullet>Tandai sudah dibaca agar daftar tetap rapi.</Bullet>

          <Note>
            Hapus permanen sebaiknya hanya untuk data uji/sampah. Untuk data operasional, cukup
            biarkan di Recycle Bin atau pulihkan bila diperlukan.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 11: MANAJEMEN AI & STORAGE ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={11} title="Manajemen AI & Storage">
          <Text style={styles.lead}>
            Konfigurasi penyedia AI dan penyimpanan berkas. Kredensial sensitif disimpan terenkripsi.
          </Text>

          <Text style={styles.subHeading}>Manajemen AI</Text>
          <Bullet>
            <Text style={styles.term}>Provider</Text> — daftar penyedia model (mis. DeepSeek).
          </Bullet>
          <Bullet>
            <Text style={styles.term}>Model</Text> — model spesifik milik provider.
          </Bullet>
          <Bullet>
            <Text style={styles.term}>Binding</Text> — pemetaan fitur ke model tertentu (mis. fitur
            ringkasan memakai model A).
          </Bullet>
          <Step n={1}>Tambah provider & masukkan API key (disimpan terenkripsi).</Step>
          <Step n={2}>Daftarkan model, lalu buat binding fitur &rarr; model.</Step>
          <Step n={3}>Uji koneksi sebelum dipakai pada fitur produksi.</Step>

          <Text style={styles.subHeading}>Storage</Text>
          <Bullet>Penyimpanan berkas memakai Vercel Blob untuk gambar & dokumen.</Bullet>
          <Bullet>Token akses disimpan terenkripsi; jangan pernah tampilkan di publik.</Bullet>

          <Note label="Keamanan">
            Token & API key bersifat rahasia. Jangan menyalinnya ke catatan terbuka, chat, atau
            commit. Rotasi kunci bila diduga bocor.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 12: WA INGEST ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={12} title="WA Ingest (Review Kajian/Faedah dari WhatsApp)">
          <Text style={styles.lead}>
            WA Ingest menangkap pesan dari grup WhatsApp melalui webhook, lalu menyiapkannya untuk
            ditinjau dan diterbitkan sebagai kajian atau faedah.
          </Text>

          <Text style={styles.subHeading}>Cara kerja</Text>
          <Step n={1}>Pesan grup WhatsApp dikirim ke endpoint webhook ingest.</Step>
          <Step n={2}>Sistem menyimpan pesan masuk ke antrean review.</Step>
          <Step n={3}>Admin/ustadz meninjau isi pesan pada modul WA Ingest.</Step>
          <Step n={4}>Edit & rapikan teks; AI dapat membantu meringkas (lihat Bagian 11).</Step>
          <Step n={5}>Terbitkan sebagai kajian atau catatan/faedah — atau abaikan bila tidak relevan.</Step>

          <Text style={styles.subHeading}>Saat review</Text>
          <Bullet>Verifikasi keaslian & kelengkapan sebelum menerbitkan.</Bullet>
          <Bullet>Tautkan ke titik dakwah/pemateri yang tepat bila menjadi kajian.</Bullet>
          <Bullet>Item yang ditolak tidak tampil ke publik.</Bullet>

          <Note>
            Webhook bersifat sensitif. Pastikan hanya sumber tepercaya yang dapat mengirim, dan
            review setiap item sebelum publikasi.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 13: PENGATURAN, TEMA & PEMBAYARAN ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={13} title="Pengaturan, Tema & Pembayaran">
          <Text style={styles.lead}>
            Konfigurasi umum situs, tampilan tema, dan metode pembayaran (QRIS).
          </Text>

          <Text style={styles.subHeading}>Pengaturan</Text>
          <Bullet>Identitas situs: nama, deskripsi, kontak, dan tautan sosial.</Bullet>
          <Bullet>Preferensi operasional sesuai kebutuhan komunitas.</Bullet>

          <Text style={styles.subHeading}>Tema</Text>
          <Bullet>Atur tampilan agar selaras identitas Blitar Mengaji (emerald &amp; emas).</Bullet>
          <Bullet>Perubahan tema berlaku pada antarmuka publik.</Bullet>

          <Text style={styles.subHeading}>Pembayaran (QRIS)</Text>
          <Step n={1}>Unggah/atur kode QRIS resmi pada modul pembayaran.</Step>
          <Step n={2}>Pastikan QRIS aktif & atas nama lembaga yang sah.</Step>
          <Step n={3}>QRIS dipakai donatur untuk pembayaran, lalu dikonfirmasi (Bagian 6).</Step>

          <Note label="Penting">
            Verifikasi QRIS benar-benar milik lembaga sebelum dipublikasikan agar dana tidak salah
            sasaran.
          </Note>
        </Section>
        <Footer />
      </Page>

      {/* ---------- BAGIAN 14: TIPS ---------- */}
      <Page size="A4" style={styles.page}>
        <ContentHeader />
        <Section num={14} title="Tips Penggunaan Panel">
          <Text style={styles.lead}>
            Kebiasaan kecil yang membuat pengelolaan lebih cepat, aman, dan nyaman.
          </Text>

          <Text style={styles.subHeading}>Tabel data</Text>
          <Bullet>
            Setiap tabel mendukung <Text style={styles.term}>pencarian (search)</Text> untuk
            menemukan data dengan cepat.
          </Bullet>
          <Bullet>
            Gunakan <Text style={styles.term}>filter</Text> untuk mempersempit (status, kategori,
            tanggal).
          </Bullet>
          <Bullet>
            Klik header kolom untuk <Text style={styles.term}>mengurutkan (sort)</Text> naik/turun.
          </Bullet>

          <Text style={styles.subHeading}>Konfirmasi & umpan balik</Text>
          <Bullet>
            Aksi berisiko (hapus, hapus permanen, tolak) memunculkan dialog konfirmasi
            <Text style={styles.term}> SweetAlert</Text> — baca pesannya sebelum melanjutkan.
          </Bullet>
          <Bullet>
            Hasil aksi ditampilkan lewat <Text style={styles.term}>toast</Text> (notifikasi singkat)
            di pojok layar.
          </Bullet>

          <Text style={styles.subHeading}>Kebiasaan baik</Text>
          <Bullet>Nonaktifkan daripada menghapus bila masih mungkin dipakai lagi.</Bullet>
          <Bullet>Tulis keterangan yang jelas pada transaksi & catatan.</Bullet>
          <Bullet>Tangani antrean (verifikasi, pembayaran, WA) secara berkala agar tidak menumpuk.</Bullet>
          <Bullet>Jaga kerahasiaan kredensial, token, dan API key.</Bullet>

          <Note label="Selamat bertugas">
            Semoga setiap amanah yang dikelola lewat panel ini menjadi sebab kebaikan yang terus
            mengalir. Barakallahu fiikum.
          </Note>
        </Section>
        <Footer />
      </Page>
    </Document>
  );
}

/** Render Panduan Admin menjadi PDF buffer (Uint8Array) untuk dikirim sebagai Response. */
export async function renderAdminGuidePdf(): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await renderToBuffer(<AdminGuideDocument generatedAt={new Date()} />);
  // Salin ke ArrayBuffer baru agar tipe pasti Uint8Array<ArrayBuffer> (cocok BodyInit).
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}
