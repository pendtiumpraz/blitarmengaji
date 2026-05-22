/**
 * URL unduh APK. Pakai env NEXT_PUBLIC_APK_URL bila di-set,
 * jika tidak fallback ke GitHub Release (selalu tersedia → klik = langsung download).
 */
export const APK_DOWNLOAD_URL =
  process.env.NEXT_PUBLIC_APK_URL ||
  "https://github.com/pendtiumpraz/blitarmengaji/releases/download/v2.0.0/blitarmengaji.apk";
