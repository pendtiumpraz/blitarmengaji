import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

/**
 * Generator PDF Daftar Akun Ustadz Blitar Mengaji.
 * Memakai @react-pdf/renderer (tanpa next/font, font default Helvetica).
 * Warna brand: emerald #0E5C46, emas #C9A227, cream #F4EEE1.
 */

export type UstadzRow = {
  nama: string;
  spesialisasi: string;
  email: string;
  password: string;
};

const BRAND = "#0E5C46"; // emerald
const GOLD = "#C9A227"; // emas
const CREAM = "#F4EEE1"; // cream
const INK = "#1F2A24";
const MUTED = "#6B7A72";
const LINE = "#D9E2DC";

const dateTimeFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica",
  },
  // Kop
  header: {
    borderBottomWidth: 2,
    borderBottomColor: BRAND,
    paddingBottom: 12,
    marginBottom: 16,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  crest: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: BRAND,
    color: GOLD,
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 7,
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
  },
  brandSub: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  metaRight: {
    marginLeft: "auto",
    textAlign: "right",
  },
  metaLabel: {
    fontSize: 8,
    color: MUTED,
  },
  metaValue: {
    fontSize: 9,
    color: INK,
    fontFamily: "Helvetica-Bold",
  },
  // Catatan keamanan
  notice: {
    backgroundColor: CREAM,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 8,
    color: INK,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 8,
  },
  // Tabel
  table: {
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
  },
  thead: {
    flexDirection: "row",
    backgroundColor: BRAND,
  },
  th: {
    color: "#FBF4E2",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
  },
  trAlt: {
    backgroundColor: "#F5F8F6",
  },
  td: {
    fontSize: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: INK,
  },
  tdMono: {
    fontSize: 8,
    paddingVertical: 5,
    paddingHorizontal: 6,
    color: INK,
    fontFamily: "Courier",
  },
  // Lebar kolom: No / Nama / Spesialisasi / Email / Password
  cNo: { width: "6%", textAlign: "center" },
  cNama: { width: "26%" },
  cSpec: { width: "24%" },
  cEmail: { width: "28%" },
  cPass: { width: "16%" },
  empty: {
    padding: 16,
    textAlign: "center",
    color: MUTED,
    fontSize: 9,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
    flexDirection: "row",
    fontSize: 7,
    color: MUTED,
  },
  footerNote: {
    flex: 1,
  },
  footerPage: {
    textAlign: "right",
  },
});

function AkunUstadzDocument({ rows, generatedAt }: { rows: UstadzRow[]; generatedAt: Date }) {
  return (
    <Document
      title="Daftar Akun Ustadz — Blitar Mengaji"
      author="Blitar Mengaji"
      subject="Daftar Akun Ustadz"
    >
      <Page size="A4" style={styles.page}>
        {/* KOP */}
        <View style={styles.header} fixed>
          <View style={styles.brandRow}>
            <Text style={styles.crest}>BM</Text>
            <View>
              <Text style={styles.brandTitle}>BLITAR MENGAJI — Daftar Akun Ustadz</Text>
              <Text style={styles.brandSub}>
                Dokumen rahasia · kredensial akses untuk para ustadz pengajar
              </Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>Dicetak</Text>
              <Text style={styles.metaValue}>{dateTimeFmt.format(generatedAt)} WIB</Text>
            </View>
          </View>
        </View>

        {/* CATATAN KEAMANAN */}
        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Catatan Keamanan</Text>
          <Text style={styles.noticeText}>
            Segera ganti password setelah login pertama. Jangan bagikan kredensial ini kepada pihak
            yang tidak berkepentingan.
          </Text>
        </View>

        {/* TABEL */}
        <Text style={styles.sectionTitle}>Daftar Akun ({rows.length} ustadz)</Text>
        <View style={styles.table}>
          <View style={styles.thead} fixed>
            <Text style={[styles.th, styles.cNo]}>No</Text>
            <Text style={[styles.th, styles.cNama]}>Nama</Text>
            <Text style={[styles.th, styles.cSpec]}>Spesialisasi</Text>
            <Text style={[styles.th, styles.cEmail]}>Email</Text>
            <Text style={[styles.th, styles.cPass]}>Password</Text>
          </View>

          {rows.length === 0 ? (
            <Text style={styles.empty}>Belum ada data akun ustadz.</Text>
          ) : (
            rows.map((r, i) => (
              <View
                key={`${r.email}-${i}`}
                style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}
                wrap={false}
              >
                <Text style={[styles.td, styles.cNo]}>{i + 1}</Text>
                <Text style={[styles.td, styles.cNama]}>{r.nama}</Text>
                <Text style={[styles.td, styles.cSpec]}>{r.spesialisasi}</Text>
                <Text style={[styles.td, styles.cEmail]}>{r.email}</Text>
                <Text style={[styles.tdMono, styles.cPass]}>{r.password}</Text>
              </View>
            ))
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerNote}>
            Blitar Mengaji · Dokumen rahasia. Simpan dengan aman & musnahkan setelah didistribusikan.
          </Text>
          <Text
            style={styles.footerPage}
            render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}

/** Render daftar akun ustadz menjadi PDF buffer (Uint8Array) untuk dikirim sebagai Response. */
export async function renderAkunUstadzPdf(rows: UstadzRow[]): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await renderToBuffer(<AkunUstadzDocument rows={rows} generatedAt={new Date()} />);
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}
