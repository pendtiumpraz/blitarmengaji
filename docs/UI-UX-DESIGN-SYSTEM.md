# 🎨 Blitar Mengaji — Design System & UI/UX Spec

> Sumber kebenaran tampilan. Preview interaktif: **`docs/ui/index.html`** (buka di browser).
> Token di sini = token yang akan dipakai di Tailwind config aplikasi nanti.

---

## 1. Prinsip Visual
- **Teduh & khusyuk, tapi modern.** Banyak ruang kosong, sudut membulat, bayangan halus.
- **Mobile-first.** Semua dirancang untuk layar HP dulu; desktop = penyesuaian lebar.
- **Hemat kuota & cepat.** Placeholder ringan, gambar lazy-load, ikon vektor.
- **Mudah dibaca.** Kontras cukup (WCAG AA), ukuran tap ≥ 44px, lebar baca ~70ch.
- **Ramah & inklusif.** Nada hangat ("Hamba Allah"), empty state yang menenangkan.

## 2. Warna (Design Tokens)
| Token | Hex | Pakai untuk |
|---|---|---|
| `brand-600` (Primary) | `#0E6E55` | Header, nav aktif, tombol utama, link |
| `brand-700` | `#0B5947` | Hover tombol utama |
| `brand-50` | `#E9F5F1` | Background lembut, chip aktif |
| `gold` (Accent) | `#C9A227` | Highlight, CTA sekunder, badge donasi |
| `gold-light` | `#E3C766` | Aksen lembut, progress |
| `cream` | `#F7F5EF` | Background halaman |
| `ink` | `#1F2A37` | Teks utama |
| `slate-500` | `#64748B` | Teks sekunder |
| `success` | `#16A34A` | Status "Dijawab/Selesai" |
| `warning` | `#D97706` | Status "Menunggu/Pending" |
| `danger` | `#DC2626` | Hapus / error |

Skala brand: `50 #E9F5F1 · 100 #CDEAE1 · 200 #9FD6C6 · 300 #6BBEA8 · 400 #3C9E84 · 500 #18816A · 600 #0E6E55 · 700 #0B5947 · 800 #094736 · 900 #073A2D`

## 3. Tipografi
- **UI / Heading:** `Plus Jakarta Sans` (400/500/600/700/800).
- **Arab / Ayat:** `Amiri` (untuk kutipan ayat & kaligrafi).
- **Skala:** display 28–32 · h1 24 · h2 20 · h3 17 · body 15–16 · caption 13 · micro 12.
- **Line-height:** heading 1.2, body 1.6. Lebar baca konten ~680px / 70ch.

## 4. Spacing, Radius, Shadow
- **Spacing:** kelipatan 4 (4/8/12/16/24/32). Padding kartu 16, gap grid 12–16.
- **Radius:** sm 8 · md 12 · lg 16 · xl 20 · pill 999. Default kartu = `rounded-2xl`.
- **Shadow:** `card` = halus (y2 blur8 /5%), `pop` (sheet/menu) sedikit lebih dalam.

## 5. Komponen Inti
- **Button:** Primary (brand, isi), Secondary (outline brand), Ghost, Gold (CTA), Danger. Tinggi 44px, radius pill/lg, ikon kiri opsional.
- **Card:** putih, radius 2xl, shadow card, padding 16. Varian: KajianCard, TitikCard, DonasiCard, PdfCard, ProductPoster.
- **Badge/Chip:** status (success/warning), kategori (filter), "Live" (merah berkedip).
- **Input/Form:** label di atas, radius lg, focus ring brand, helper & error text.
- **Tabs:** underline brand untuk konten (Jadwal/Galeri/Video/Donasi).
- **Bottom Nav (mobile):** 5 item — Beranda · Peta · Jadwal · Tanya · Akun. Item aktif brand.
- **Bottom Sheet / Drawer:** untuk filter & detail di peta.
- **Progress bar:** untuk target donasi (gold).
- **Empty state:** ikon + kalimat menenangkan + aksi.
- **Toast / Alert:** sukses/error/info.

## 6. Pola Navigasi
- **Publik (mobile):** top bar (logo + notifikasi) + bottom nav. Filter via sheet.
- **Publik (desktop):** top navbar horizontal + footer.
- **Admin:** sidebar kiri **dinamis** (item muncul sesuai permission RBAC) + topbar (search, profil, role switcher untuk multi-role).
- **Akun jamaah:** layout ringan (profil, pertanyaanku, kelasku, unduhanku).

## 7. Ikonografi & Ilustrasi
- **Lucide** (open-source, konsisten). Aksen Islami halus (kubah/bulan sabit) hanya di branding, tidak berlebihan.
- Foto/gambar: rasio konsisten (16:9 cover, 1:1 thumbnail), `next/image` + Vercel Blob.

## 8. Aksesibilitas
- Kontras AA, fokus terlihat, label form jelas, alt text gambar, target tap besar,
  dukungan reduce-motion, struktur heading benar. Aman untuk WebView (no hover-only).

## 9. File Prototype (buka di browser, saling tertaut lewat bar navigasi 10-link)
Semua file di bawah **theme-aware** (ikut floating switcher 🎨 di kanan-bawah).
- **`docs/ui/index.html`** — Design System + layar inti mobile: Beranda, Peta, Detail Titik, Jadwal, Tanya Ustadz, Donasi, Catatan (note reader), AI Assistant, + Admin Dashboard.
- **`docs/ui/02-mobile-more.html`** — Perpustakaan, Kelas Online (list & player), Event/Webinar, Lapak, Partner & Media, Akun Jamaah, Form Tanya, Masuk/Daftar.
- **`docs/ui/03-admin.html`** — Admin & RBAC detail: Manajemen Role + matriks Permission, Builder Menu dinamis, tabel CRUD, Input Keuangan, Manajemen Donasi, Verifikasi akun.
- **`docs/ui/04-desktop.html`** — Versi desktop/web responsive: Beranda (hero), Peta, Jadwal, Detail Titik, Catatan reader, Donasi + navbar & footer.
- **`docs/ui/05-ustadz.html`** — Dashboard Ustadz: jawab Tanya Ustadz, editor transcript→catatan (Tiptap-style), upload PDF, kelola kelas.
- **`docs/ui/06-kajian-video.html`** — Detail Kajian + Video Player (rekaman & LIVE), mobile + desktop, sitasi catatan terkait.
- **`docs/ui/07-states.html`** — UX States: loading/skeleton, empty, error/404/500/offline, onboarding/splash, toast, konfirmasi, login wall.
- **`docs/ui/08-keuangan.html`** — Transparansi keuangan publik: grafik batang & donut, tabel transaksi, filter, unduh PDF, Global vs per-Titik.
- **`docs/ui/09-entity-dash.html`** — Dashboard pemilik entitas (Pengelola Titik / Media Partner / Partner Usaha), pola `manage_own`.
- **`docs/ui/themes.html`** — 🎨 Showcase theme switcher (8 tema dinamis + penjelasan arsitektur).
- **`docs/ui/10-pdf.html`** — 📄 Template PDF resmi tingkat platform (A4): Laporan Keuangan, Laporan Donasi, Sertifikat Kelas (landscape), Kwitansi, Jadwal Kajian printable.
- **`docs/ui/11-pdf-masjid.html`** — 📄 **6 template laporan keuangan per-masjid** yang bisa di-custom (slot **logo masjid** + **warna aksen** live), cocok agar tiap titik punya identitasnya sendiri.

### Dokumen PDF (output resmi — print-friendly)
PDF = dokumen resmi → print-friendly (putih, tabel rapi, tanda tangan, footer). Generate final via **@react-pdf/renderer** atau **pdf-lib**.
- **PDF platform** (`10-pdf.html`): identitas Blitar Mengaji (Teduh, tetap). Laporan keuangan global, laporan donasi, sertifikat, kwitansi, jadwal cetak.
- **PDF per-masjid** (`11-pdf-masjid.html`): **6 gaya** (Kop Surat Resmi, Modern Minimal, Sidebar Aksen, Infografis, Ringkas/Saldo-berjalan, Buletin 2-kolom). Tiap masjid **pilih template + unggah logo + set warna aksen** (disimpan di `titik_dakwah.report_template/logo_url/report_accent`). Cocok untuk masjid besar maupun mushola kecil.

### Mesin tema bersama (dipakai semua file di atas)
- **`docs/ui/theme-tokens.css`** — definisi 8 tema (CSS variables `--c-*`).
- **`docs/ui/theme-switcher.js`** — floating switcher self-injecting (simpan pilihan di localStorage).

## 10. Theming / Template UI Dinamis
- **Mekanisme:** CSS variables di-skin lewat atribut `data-theme` pada `<html>`. Komponen memakai `var(--primary)`, `var(--accent)`, `var(--bg)`, `var(--surface)`, `var(--ink)`, `var(--radius)`, `var(--font)`, dst.
- **6 tema awal:** Teduh (default, Hijau+Emas), Modern (Teal+Amber), Earthy (hangat), Elegan (Navy+serif), Minimalis (bersih), Senja (dark mode).
- **Pilihan:** per-user (`users.theme_pref`) + default global admin (`settings.default_theme`); tema custom di tabel `ui_themes` (tokens JSON).
- **SSR-safe:** baca cookie/preferensi sebelum render agar tidak ada "kedip" (FOUC).
- **Default & identitas:** Teduh (Hijau Zaitun + Emas) tetap warna resmi; tema lain murni personalisasi.
