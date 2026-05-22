import type { ReactNode } from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

/**
 * Generator PDF "Panduan Partner Usaha Blitar Mengaji".
 * Dokumen panduan berdesain penuh: sampul, section emas, multi-halaman.
 * Gaya selaras dengan src/lib/pdf/keuangan.tsx (emerald + emas + parchment).
 * Memakai @react-pdf/renderer (font default Helvetica). Bahasa Indonesia.
 */

// Palet brand (selaras design tokens: emerald hangat + emas + parchment).
const COLORS = {
  emerald: "#0E5C46",
  emeraldDark: "#0B4A39",
  emeraldSoft: "#EAF1EC",
  gold: "#C9A227",
  goldLight: "#E6CC8A",
  goldDark: "#9A7A1E",
  goldSoft: "#FBF4DD",
  cream: "#F4EEE1",
  surface: "#FBF7EE",
  ink: "#23241E",
  muted: "#5E6B63",
  line: "#D9E2DC",
  white: "#FFFFFF",
};

const tanggalPanjang = (d: Date) =>
  d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontSize: 10,
    lineHeight: 1.5,
    color: COLORS.ink,
    fontFamily: "Helvetica",
    backgroundColor: COLORS.white,
  },

  /* ====================== SAMPUL ====================== */
  cover: {
    flex: 1,
    backgroundColor: COLORS.emerald,
    paddingVertical: 64,
    paddingHorizontal: 54,
    color: COLORS.white,
  },
  coverBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 6,
    padding: 36,
    justifyContent: "space-between",
  },
  coverTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  coverCrest: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: COLORS.gold,
    color: COLORS.emeraldDark,
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 11,
    marginRight: 14,
  },
  coverBrand: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    letterSpacing: 1,
  },
  coverBrandSub: {
    fontSize: 9,
    color: COLORS.goldLight,
    marginTop: 2,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  coverCenter: {
    marginTop: "auto",
    marginBottom: "auto",
  },
  coverEyebrow: {
    fontSize: 10,
    color: COLORS.goldLight,
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: "Helvetica-Bold",
    color: COLORS.white,
    lineHeight: 1.15,
  },
  coverTitleGold: {
    color: COLORS.gold,
  },
  coverRule: {
    height: 3,
    width: 96,
    backgroundColor: COLORS.gold,
    marginTop: 22,
    marginBottom: 18,
    borderRadius: 2,
  },
  coverLede: {
    fontSize: 11,
    color: COLORS.cream,
    lineHeight: 1.6,
    maxWidth: 380,
  },
  coverFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(230,204,138,0.4)",
    paddingTop: 14,
  },
  coverFooterText: {
    fontSize: 9,
    color: COLORS.goldLight,
  },
  coverFooterMeta: {
    fontSize: 9,
    color: COLORS.cream,
    marginTop: 2,
  },

  /* ====================== KOP HALAMAN ISI ====================== */
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.emerald,
    paddingBottom: 10,
    marginBottom: 18,
  },
  headerCrest: {
    width: 26,
    height: 26,
    borderRadius: 4,
    backgroundColor: COLORS.emerald,
    color: COLORS.gold,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 6,
    marginRight: 9,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
  },
  headerSub: {
    fontSize: 8,
    color: COLORS.muted,
    marginTop: 1,
  },
  headerTag: {
    marginLeft: "auto",
    fontSize: 8,
    color: COLORS.goldDark,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },

  /* ====================== SECTION ====================== */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 6,
  },
  sectionNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    color: COLORS.emeraldDark,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 5,
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
    flex: 1,
  },
  sectionRule: {
    height: 2,
    backgroundColor: COLORS.goldSoft,
    marginBottom: 12,
  },

  para: {
    fontSize: 10,
    color: COLORS.ink,
    marginBottom: 9,
    lineHeight: 1.55,
  },
  lead: {
    fontSize: 11,
    color: COLORS.emeraldDark,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
    lineHeight: 1.5,
  },

  /* daftar manfaat / bullet */
  bulletRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  bulletDot: {
    width: 12,
    color: COLORS.gold,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
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

  /* langkah bernomor */
  stepRow: {
    flexDirection: "row",
    marginBottom: 9,
  },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.emerald,
    color: COLORS.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 4,
    marginRight: 10,
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emeraldDark,
    marginBottom: 1,
  },
  stepText: {
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.5,
  },

  /* kartu emas (callout) */
  goldCard: {
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  goldCardTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.goldDark,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  /* kartu emerald (fitur) */
  featureCard: {
    backgroundColor: COLORS.emeraldSoft,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emerald,
    padding: 12,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emeraldDark,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.5,
  },

  /* highlight inline kuota */
  pill: {
    fontFamily: "Helvetica-Bold",
    color: COLORS.goldDark,
  },

  /* daftar checklist etika */
  checkRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  checkMark: {
    width: 14,
    color: COLORS.emerald,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  checkText: {
    flex: 1,
    fontSize: 10,
    color: COLORS.ink,
    lineHeight: 1.5,
  },

  /* penutup */
  closingCard: {
    backgroundColor: COLORS.emerald,
    borderRadius: 6,
    padding: 18,
    marginTop: 10,
  },
  closingTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.gold,
    marginBottom: 6,
  },
  closingText: {
    fontSize: 10,
    color: COLORS.cream,
    lineHeight: 1.6,
  },

  /* ====================== FOOTER ====================== */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 8,
    flexDirection: "row",
    fontSize: 7,
    color: COLORS.muted,
  },
  footerNote: {
    flex: 1,
  },
  footerPage: {
    textAlign: "right",
  },
});

/* ---------- komponen kecil yang dapat dipakai ulang ---------- */

function SectionHead({ num, title }: { num: string; title: string }) {
  return (
    <View>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionNum}>{num}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionRule} />
    </View>
  );
}

function Bullet({ label, children }: { label?: string; children: string }) {
  return (
    <View style={styles.bulletRow} wrap={false}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>
        {label ? <Text style={styles.bulletLabel}>{label}: </Text> : null}
        {children}
      </Text>
    </View>
  );
}

function Step({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.stepRow} wrap={false}>
      <Text style={styles.stepNum}>{num}</Text>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepText}>{children}</Text>
      </View>
    </View>
  );
}

function Check({ children }: { children: string }) {
  return (
    <View style={styles.checkRow} wrap={false}>
      <Text style={styles.checkMark}>✓</Text>
      <Text style={styles.checkText}>{children}</Text>
    </View>
  );
}

function PageHeader() {
  return (
    <View style={styles.header} fixed>
      <Text style={styles.headerCrest}>BM</Text>
      <View>
        <Text style={styles.headerTitle}>Panduan Partner Usaha</Text>
        <Text style={styles.headerSub}>Blitar Mengaji · ekosistem usaha jamaah</Text>
      </View>
      <Text style={styles.headerTag}>Partner Usaha</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerNote}>
        Blitar Mengaji · Panduan Partner Usaha · Bersama memajukan UMKM jamaah Blitar Raya.
      </Text>
      <Text
        style={styles.footerPage}
        render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

/* ====================== DOKUMEN ====================== */

function PartnerGuideDocument() {
  const printedAt = new Date();

  return (
    <Document
      title="Panduan Partner Usaha Blitar Mengaji"
      author="Blitar Mengaji"
      subject="Panduan menjadi Partner Usaha Blitar Mengaji"
    >
      {/* ---------------- HALAMAN SAMPUL ---------------- */}
      <Page size="A4" style={{ padding: 0, fontFamily: "Helvetica" }}>
        <View style={styles.cover}>
          <View style={styles.coverBorder}>
            <View style={styles.coverTopRow}>
              <Text style={styles.coverCrest}>BM</Text>
              <View>
                <Text style={styles.coverBrand}>BLITAR MENGAJI</Text>
                <Text style={styles.coverBrandSub}>Blitar Raya</Text>
              </View>
            </View>

            <View style={styles.coverCenter}>
              <Text style={styles.coverEyebrow}>Panduan Resmi</Text>
              <Text style={styles.coverTitle}>
                Partner Usaha{"\n"}
                <Text style={styles.coverTitleGold}>Blitar Mengaji</Text>
              </Text>
              <View style={styles.coverRule} />
              <Text style={styles.coverLede}>
                Wadah bagi pelaku UMKM jamaah untuk memperkenalkan usaha, berjualan,
                dan menjangkau lebih banyak warga Blitar Raya — dalam satu ekosistem
                dakwah yang amanah, halal, dan saling menguatkan.
              </Text>
            </View>

            <View style={styles.coverFooter}>
              <Text style={styles.coverFooterText}>
                Dokumen panduan untuk calon & anggota Partner Usaha.
              </Text>
              <Text style={styles.coverFooterMeta}>
                Diterbitkan {tanggalPanjang(printedAt)} · blitarmengaji.id
              </Text>
            </View>
          </View>
        </View>
      </Page>

      {/* ---------------- HALAMAN 1: APA & MANFAAT ---------------- */}
      <Page size="A4" style={styles.page}>
        <PageHeader />

        <SectionHead num="1" title="Apa itu Partner Usaha?" />
        <Text style={styles.lead}>
          Partner Usaha Blitar Mengaji adalah program kemitraan bagi pelaku UMKM dari
          kalangan jamaah untuk mempromosikan dan menjual produknya melalui platform
          Blitar Mengaji.
        </Text>
        <Text style={styles.para}>
          Lewat program ini, usaha kecil dan menengah milik jamaah mendapat panggung
          untuk dikenal lebih luas — sekaligus menguatkan ekonomi umat. Setiap partner
          memperoleh halaman lapak, kemampuan mengunggah produk, membuat event, hingga
          (bila relevan) menjadi media partner. Semua berpijak pada nilai dakwah:
          jujur, halal, dan saling menolong.
        </Text>

        <SectionHead num="2" title="Manfaat menjadi Partner" />
        <Bullet label="Promosi gratis">
          Usaha Anda tampil di lapak Blitar Mengaji dan dilihat ribuan jamaah Blitar Raya.
        </Bullet>
        <Bullet label="Jangkauan jamaah">
          Menjangkau pasar yang relevan — sesama jamaah yang lebih percaya pada usaha saudara seiman.
        </Bullet>
        <Bullet label="Dashboard mandiri">
          Kelola produk, event, dan media sendiri lewat dashboard /kelola tanpa biaya bulanan.
        </Bullet>
        <Bullet label="Kontak langsung">
          Pembeli menghubungi Anda langsung via WhatsApp — tanpa potongan komisi.
        </Bullet>
        <Bullet label="Berkah & dakwah">
          Ikut menghidupkan ekonomi umat dan menjadi bagian dari ekosistem dakwah Blitar Mengaji.
        </Bullet>

        <View style={styles.goldCard}>
          <Text style={styles.goldCardTitle}>Catatan Penting</Text>
          <Text style={styles.featureText}>
            Setiap Partner Usaha dapat menampilkan maksimal{" "}
            <Text style={styles.pill}>3 produk aktif</Text> sekaligus. Ini menjaga lapak
            tetap rapi, adil bagi semua partner, dan fokus pada produk unggulan Anda.
          </Text>
        </View>

        <PageFooter />
      </Page>

      {/* ---------------- HALAMAN 2: CARA DAFTAR ---------------- */}
      <Page size="A4" style={styles.page}>
        <PageHeader />

        <SectionHead num="3" title="Cara Daftar jadi Partner Usaha" />
        <Text style={styles.para}>
          Pendaftaran dilakukan sepenuhnya online dan gratis. Ikuti langkah berikut:
        </Text>

        <Step num={1} title="Buka halaman Gabung">
          Kunjungi menu /gabung di situs Blitar Mengaji, lalu pilih opsi “Partner Usaha”.
        </Step>
        <Step num={2} title="Isi data usaha">
          Lengkapi formulir: nama usaha, kategori usaha, deskripsi singkat, nomor kontak
          WhatsApp aktif, serta unggah logo usaha Anda.
        </Step>
        <Step num={3} title="Ajukan permohonan">
          Periksa kembali data, lalu tekan tombol “Ajukan”. Permohonan Anda akan masuk
          ke antrean verifikasi.
        </Step>
        <Step num={4} title="Verifikasi admin">
          Tim admin Blitar Mengaji memeriksa kelengkapan dan kelayakan usaha (kesesuaian
          dengan nilai & syariat). Anda akan dikabari setelah ditinjau.
        </Step>
        <Step num={5} title="Akses dashboard /kelola">
          Setelah disetujui, akun Anda mendapat akses ke dashboard /kelola untuk mulai
          mengelola lapak, produk, dan event.
        </Step>

        <View style={styles.goldCard}>
          <Text style={styles.goldCardTitle}>Siapkan sebelum mendaftar</Text>
          <Bullet>Nama usaha & kategori yang sesuai.</Bullet>
          <Bullet>Deskripsi singkat yang jelas dan jujur.</Bullet>
          <Bullet>Nomor WhatsApp aktif untuk dihubungi pembeli.</Bullet>
          <Bullet>File logo usaha (format gambar, rasio persegi disarankan).</Bullet>
        </View>

        <PageFooter />
      </Page>

      {/* ---------------- HALAMAN 3: APA YANG BISA DILAKUKAN ---------------- */}
      <Page size="A4" style={styles.page}>
        <PageHeader />

        <SectionHead num="4" title="Yang bisa dilakukan Partner Usaha" />
        <Text style={styles.para}>
          Melalui dashboard /kelola, partner usaha memiliki beberapa kemampuan utama:
        </Text>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Lapak — Etalase Produk</Text>
          <Text style={styles.featureText}>
            Unggah produk lengkap dengan poster/foto, harga, dan kontak WhatsApp. Gunakan
            untuk berjualan maupun promo. Batas tampil:{" "}
            <Text style={styles.pill}>maksimal 3 produk aktif</Text> per partner.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Event — Acara & Webinar</Text>
          <Text style={styles.featureText}>
            Buat acara, kelas, atau webinar partner — misalnya pelatihan, bazar, atau
            kajian bertema usaha. Event tampil di kanal Blitar Mengaji agar mudah
            ditemukan jamaah.
          </Text>
        </View>

        <View style={styles.featureCard}>
          <Text style={styles.featureTitle}>Media Partner (bila relevan)</Text>
          <Text style={styles.featureText}>
            Bagi partner yang bergerak di bidang media/konten, tersedia pengelolaan video
            dan livestream untuk mendukung syiar dan publikasi kegiatan.
          </Text>
        </View>

        <SectionHead num="5" title="Aturan & Etika Partner" />
        <Check>Produk dan jasa wajib halal serta sesuai syariat Islam.</Check>
        <Check>Deskripsi, harga, dan foto harus jujur — tidak menipu pembeli.</Check>
        <Check>Maksimal 3 produk aktif ditampilkan dalam satu waktu.</Check>
        <Check>
          Untuk mengganti produk, nonaktifkan dulu salah satu produk aktif agar slot terbuka.
        </Check>
        <Check>Jaga adab dalam berkomunikasi dengan calon pembeli.</Check>
        <Check>
          Admin berhak meninjau ulang atau menonaktifkan lapak yang melanggar ketentuan.
        </Check>

        <PageFooter />
      </Page>

      {/* ---------------- HALAMAN 4: LANGKAH PRAKTIS UPLOAD ---------------- */}
      <Page size="A4" style={styles.page}>
        <PageHeader />

        <SectionHead num="6" title="Langkah praktis upload produk" />
        <Text style={styles.para}>
          Setelah masuk ke dashboard /kelola, ikuti alur singkat berikut untuk
          menambahkan produk ke lapak Anda:
        </Text>

        <Step num={1} title="Masuk ke menu Lapak">
          Pada dashboard /kelola, buka tab “Lapak” lalu tekan “Tambah Produk”.
        </Step>
        <Step num={2} title="Isi detail produk">
          Masukkan nama produk, deskripsi, dan harga. Tulis dengan jelas dan jujur.
        </Step>
        <Step num={3} title="Unggah poster / foto">
          Tambahkan foto produk atau poster promo yang menarik dan tajam.
        </Step>
        <Step num={4} title="Cantumkan kontak WhatsApp">
          Pastikan nomor WhatsApp benar agar pembeli dapat langsung menghubungi Anda.
        </Step>
        <Step num={5} title="Aktifkan & publikasikan">
          Simpan dan aktifkan produk. Ingat batas{" "}
          maksimal 3 produk aktif — nonaktifkan produk lama bila slot penuh.
        </Step>

        <View style={styles.goldCard}>
          <Text style={styles.goldCardTitle}>Tips Foto & Poster</Text>
          <Bullet>Foto dengan cahaya cukup (alami / dekat jendela), tidak gelap.</Bullet>
          <Bullet>Latar bersih dan polos agar produk menonjol.</Bullet>
          <Bullet>Gunakan rasio persegi atau potret agar rapi di layar ponsel.</Bullet>
          <Bullet>Tampilkan harga & keunggulan singkat pada poster.</Bullet>
          <Bullet>Hindari gambar buram, terlalu ramai, atau ber-watermark berlebihan.</Bullet>
        </View>

        <SectionHead num="7" title="Bagaimana pembeli menghubungi Anda" />
        <Text style={styles.para}>
          Pada setiap produk terdapat tombol WhatsApp. Saat pembeli menekannya, aplikasi
          WhatsApp terbuka menuju nomor Anda dengan pesan awal otomatis berisi nama
          produk — sehingga Anda langsung tahu produk mana yang ditanyakan. Transaksi dan
          kesepakatan dilakukan langsung antara Anda dan pembeli, tanpa potongan komisi
          dari Blitar Mengaji.
        </Text>

        <View style={styles.closingCard}>
          <Text style={styles.closingTitle}>Selamat berkarya, Partner!</Text>
          <Text style={styles.closingText}>
            Semoga usaha Anda berkah dan menjadi sebab kebaikan bagi banyak orang.
            Bila ada kendala, hubungi admin Blitar Mengaji melalui kanal resmi.
            Bersama kita majukan UMKM jamaah Blitar Raya.
          </Text>
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

/** Render dokumen panduan partner menjadi PDF (Uint8Array) untuk Response. */
export async function renderPartnerGuidePdf(): Promise<Uint8Array<ArrayBuffer>> {
  const buffer = await renderToBuffer(<PartnerGuideDocument />);
  // Salin ke ArrayBuffer baru agar tipe pasti Uint8Array<ArrayBuffer> (cocok BodyInit).
  const out = new Uint8Array(buffer.byteLength);
  out.set(buffer);
  return out;
}
