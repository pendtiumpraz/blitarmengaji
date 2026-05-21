import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { FinanceSummary, TransactionRow } from "@/lib/queries/keuangan";

/**
 * Generator PDF Laporan Keuangan Blitar Mengaji.
 * Memakai @react-pdf/renderer (tanpa next/font, font default Helvetica).
 * Warna brand: emerald #0E5C46 + emas #C9A227.
 */

export type KeuanganPdfData = {
  summary: FinanceSummary;
  transactions: TransactionRow[];
  generatedAt?: Date;
};

const BRAND = "#0E5C46"; // emerald
const GOLD = "#C9A227"; // emas
const INK = "#1F2A24";
const MUTED = "#6B7A72";
const LINE = "#D9E2DC";
const INCOME = "#15803D";
const EXPENSE = "#DC2626";

function rupiah(n: number): string {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

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
  // Ringkasan
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BRAND,
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 4,
    padding: 10,
  },
  summaryCardDark: {
    flex: 1,
    borderRadius: 4,
    padding: 10,
    backgroundColor: BRAND,
  },
  summaryLabel: {
    fontSize: 8,
    color: MUTED,
    marginBottom: 4,
  },
  summaryLabelLight: {
    fontSize: 8,
    color: "#CFE0D8",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
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
  // Lebar kolom: Tgl / Kategori / Tipe / Jumlah
  cTgl: { width: "16%" },
  cKat: { width: "44%" },
  cTipe: { width: "18%" },
  cJml: { width: "22%", textAlign: "right" },
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

function KeuanganDocument({ summary, transactions, generatedAt }: KeuanganPdfData) {
  const printedAt = generatedAt ?? new Date();

  return (
    <Document
      title="Laporan Keuangan Blitar Mengaji"
      author="Blitar Mengaji"
      subject="Laporan Keuangan Terbuka"
    >
      <Page size="A4" style={styles.page}>
        {/* KOP */}
        <View style={styles.header} fixed>
          <View style={styles.brandRow}>
            <Text style={styles.crest}>BM</Text>
            <View>
              <Text style={styles.brandTitle}>BLITAR MENGAJI — Laporan Keuangan</Text>
              <Text style={styles.brandSub}>
                Laporan keuangan terbuka & amanah · transparansi untuk jamaah Blitar Raya
              </Text>
            </View>
            <View style={styles.metaRight}>
              <Text style={styles.metaLabel}>Dicetak</Text>
              <Text style={styles.metaValue}>{dateTimeFmt.format(printedAt)} WIB</Text>
            </View>
          </View>
        </View>

        {/* RINGKASAN */}
        <Text style={styles.sectionTitle}>Ringkasan</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCardDark}>
            <Text style={styles.summaryLabelLight}>Saldo Kas</Text>
            <Text style={[styles.summaryValue, { color: GOLD }]}>{rupiah(summary.balance)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Pemasukan</Text>
            <Text style={[styles.summaryValue, { color: INCOME }]}>
              {rupiah(summary.totalIncome)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Pengeluaran</Text>
            <Text style={[styles.summaryValue, { color: EXPENSE }]}>
              {rupiah(summary.totalExpense)}
            </Text>
          </View>
        </View>

        {/* TABEL TRANSAKSI */}
        <Text style={styles.sectionTitle}>
          Daftar Transaksi ({summary.count} transaksi tercatat)
        </Text>
        <View style={styles.table}>
          <View style={styles.thead} fixed>
            <Text style={[styles.th, styles.cTgl]}>Tgl</Text>
            <Text style={[styles.th, styles.cKat]}>Kategori</Text>
            <Text style={[styles.th, styles.cTipe]}>Tipe</Text>
            <Text style={[styles.th, styles.cJml]}>Jumlah</Text>
          </View>

          {transactions.length === 0 ? (
            <Text style={styles.empty}>Belum ada transaksi tercatat.</Text>
          ) : (
            transactions.map((t, i) => {
              const masuk = t.type === "income";
              return (
                <View
                  key={t.id}
                  style={i % 2 === 1 ? [styles.tr, styles.trAlt] : styles.tr}
                  wrap={false}
                >
                  <Text style={[styles.td, styles.cTgl]}>{dateFmt.format(t.trxDate)}</Text>
                  <Text style={[styles.td, styles.cKat]}>
                    {t.categoryName ?? "Tanpa kategori"}
                    {t.description ? ` — ${t.description}` : ""}
                    {`  ·  ${t.scopeName}`}
                  </Text>
                  <Text style={[styles.td, styles.cTipe, { color: masuk ? INCOME : EXPENSE }]}>
                    {masuk ? "Pemasukan" : "Pengeluaran"}
                  </Text>
                  <Text style={[styles.td, styles.cJml, { color: masuk ? INCOME : EXPENSE }]}>
                    {masuk ? "+ " : "- "}
                    {rupiah(t.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerNote}>
            Blitar Mengaji · Laporan resmi, sah, & dapat diaudit. Setiap rupiah dapat ditelusuri publik.
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

/** Render dokumen menjadi PDF buffer (Uint8Array) untuk dikirim sebagai Response. */
export async function renderKeuanganPdf(data: KeuanganPdfData): Promise<Uint8Array<ArrayBuffer>> {
  const buf = await renderToBuffer(<KeuanganDocument {...data} />);
  // Salin ke ArrayBuffer baru agar tipe pasti Uint8Array<ArrayBuffer> (cocok BodyInit).
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}
