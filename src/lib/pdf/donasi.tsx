import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { CampaignDetail, DonationUpdateItem } from "@/lib/queries/donasi";

/**
 * Dokumen PDF "Laporan Penggunaan Dana Donasi" per campaign.
 * Dipakai oleh route publik /api/laporan/donasi/[slug] (transparansi).
 * Warna brand: emerald (hijau teduh) + emas. Bahasa Indonesia.
 */

// Palet brand (selaras design tokens: emerald hangat + emas + parchment).
const COLORS = {
  emerald: "#0E6E55",
  emeraldDark: "#0B5743",
  emeraldSoft: "#E7F1ED",
  gold: "#C9A227",
  goldSoft: "#FBF4DD",
  ink: "#1F2A24",
  muted: "#5E6B63",
  line: "#D9E2DC",
  red: "#B23A2E",
  parchment: "#FBF8F1",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: COLORS.ink,
    backgroundColor: "#FFFFFF",
  },

  // KOP
  header: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.emerald,
    paddingBottom: 12,
    marginBottom: 16,
  },
  brand: {
    fontSize: 9,
    letterSpacing: 2,
    color: COLORS.gold,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 18,
    color: COLORS.emerald,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 3,
  },

  // INFO CAMPAIGN
  infoCard: {
    backgroundColor: COLORS.emeraldSoft,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.emerald,
    padding: 12,
    marginBottom: 16,
  },
  campaignTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emeraldDark,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 110,
    color: COLORS.muted,
    fontSize: 9,
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },

  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: COLORS.emerald,
    marginBottom: 8,
  },

  // TABEL
  table: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  tHead: {
    flexDirection: "row",
    backgroundColor: COLORS.emerald,
  },
  thNo: { width: 28, padding: 6, color: "#FFFFFF", fontSize: 9, fontFamily: "Helvetica-Bold" },
  thDate: { width: 80, padding: 6, color: "#FFFFFF", fontSize: 9, fontFamily: "Helvetica-Bold" },
  thDesc: { flex: 1, padding: 6, color: "#FFFFFF", fontSize: 9, fontFamily: "Helvetica-Bold" },
  thAmount: { width: 90, padding: 6, color: "#FFFFFF", fontSize: 9, fontFamily: "Helvetica-Bold", textAlign: "right" },

  tRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  tRowAlt: {
    backgroundColor: COLORS.parchment,
  },
  tdNo: { width: 28, padding: 6, fontSize: 9, color: COLORS.muted },
  tdDate: { width: 80, padding: 6, fontSize: 9, color: COLORS.ink },
  tdDesc: { flex: 1, padding: 6, fontSize: 9, color: COLORS.ink },
  tdDescTitle: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  tdDescBody: { color: COLORS.muted, fontSize: 8 },
  tdAmount: { width: 90, padding: 6, fontSize: 9, color: COLORS.red, fontFamily: "Helvetica-Bold", textAlign: "right" },

  empty: {
    padding: 14,
    textAlign: "center",
    fontSize: 9,
    color: COLORS.muted,
  },

  // SALDO / RINGKASAN
  summary: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    backgroundColor: COLORS.goldSoft,
    borderRadius: 4,
    padding: 12,
  },
  sumRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sumLabel: { fontSize: 9, color: COLORS.muted },
  sumValue: { fontSize: 9, fontFamily: "Helvetica-Bold", color: COLORS.ink },
  sumDivider: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gold,
    marginVertical: 6,
  },
  sumSaldoLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: COLORS.emeraldDark },
  sumSaldoValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: COLORS.emerald },

  // FOOTER
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COLORS.muted,
  },
});

export type DonasiPdfData = {
  campaign: CampaignDetail;
  updates: DonationUpdateItem[];
};

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const tanggal = (d: Date) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const tanggalPanjang = (d: Date) =>
  new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const statusLabel: Record<CampaignDetail["status"], string> = {
  active: "Aktif",
  completed: "Selesai",
  closed: "Ditutup",
};

function DonasiDocument({ campaign, updates }: DonasiPdfData) {
  const collected = Number(campaign.collectedAmount ?? 0);
  const target = Number(campaign.targetAmount ?? 0);
  const totalUsed = updates.reduce((acc, u) => acc + Number(u.amountUsed ?? 0), 0);
  const saldo = collected - totalUsed;
  const lokasi = [campaign.titikName, campaign.kecamatan].filter(Boolean).join(" - ") || "-";

  // Tabel diurutkan kronologis (lama ke baru) agar mudah dibaca sebagai laporan.
  const rows = [...updates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <Document
      title={`Laporan Penggunaan Dana Donasi - ${campaign.title}`}
      author="Blitar Mengaji"
    >
      <Page size="A4" style={styles.page}>
        {/* KOP */}
        <View style={styles.header}>
          <Text style={styles.brand}>Blitar Mengaji - Blitar Raya</Text>
          <Text style={styles.title}>Laporan Penggunaan Dana Donasi</Text>
          <Text style={styles.subtitle}>
            Dokumen transparansi penggunaan dana donasi. Dibuat pada{" "}
            {tanggalPanjang(new Date())}.
          </Text>
        </View>

        {/* INFO CAMPAIGN */}
        <View style={styles.infoCard}>
          <Text style={styles.campaignTitle}>{campaign.title}</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Titik Dakwah</Text>
            <Text style={styles.infoValue}>{lokasi}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Target Dana</Text>
            <Text style={styles.infoValue}>
              {target > 0 ? rupiah(target) : "Tanpa target nominal"}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Dana Terkumpul</Text>
            <Text style={styles.infoValue}>{rupiah(collected)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{statusLabel[campaign.status]}</Text>
          </View>
        </View>

        {/* TABEL PENGGUNAAN DANA */}
        <Text style={styles.sectionTitle}>Rincian Penggunaan Dana</Text>
        <View style={styles.table}>
          <View style={styles.tHead}>
            <Text style={styles.thNo}>No</Text>
            <Text style={styles.thDate}>Tanggal</Text>
            <Text style={styles.thDesc}>Uraian</Text>
            <Text style={styles.thAmount}>Jumlah</Text>
          </View>

          {rows.length === 0 ? (
            <View style={styles.tRow}>
              <Text style={styles.empty}>
                Belum ada laporan penggunaan dana yang dicatat.
              </Text>
            </View>
          ) : (
            rows.map((r, i) => (
              <View
                key={r.id}
                style={i % 2 === 1 ? [styles.tRow, styles.tRowAlt] : styles.tRow}
                wrap={false}
              >
                <Text style={styles.tdNo}>{i + 1}</Text>
                <Text style={styles.tdDate}>{tanggal(r.createdAt)}</Text>
                <View style={styles.tdDesc}>
                  <Text style={styles.tdDescTitle}>{r.title}</Text>
                  {r.body ? <Text style={styles.tdDescBody}>{r.body}</Text> : null}
                </View>
                <Text style={styles.tdAmount}>
                  {r.amountUsed ? rupiah(Number(r.amountUsed)) : "-"}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* RINGKASAN SALDO */}
        <View style={styles.summary}>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Total Dana Terkumpul</Text>
            <Text style={styles.sumValue}>{rupiah(collected)}</Text>
          </View>
          <View style={styles.sumRow}>
            <Text style={styles.sumLabel}>Total Dana Terpakai</Text>
            <Text style={styles.sumValue}>{rupiah(totalUsed)}</Text>
          </View>
          <View style={styles.sumDivider} />
          <View style={styles.sumRow}>
            <Text style={styles.sumSaldoLabel}>Saldo Tersisa</Text>
            <Text style={styles.sumSaldoValue}>{rupiah(saldo)}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text>Blitar Mengaji - Laporan dibuat otomatis & dapat diaudit.</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Halaman ${pageNumber} / ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

/** Render dokumen laporan donasi menjadi PDF (Uint8Array) untuk Response. */
export async function renderDonasiPdf(data: DonasiPdfData): Promise<Uint8Array> {
  const buffer = await renderToBuffer(<DonasiDocument {...data} />);
  return new Uint8Array(buffer);
}
