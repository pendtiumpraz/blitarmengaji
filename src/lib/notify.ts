import { db, schema } from "@/lib/db";

/**
 * Infrastruktur NOTIFIKASI in-app.
 *
 * `notify(userId, type, payload)` menyimpan satu baris ke tabel `notifications`
 * (lihat db/schema.ts). payloadJson disimpan apa adanya: { title, body, link }.
 *
 * PRINSIP: notifikasi bersifat BEST-EFFORT — TIDAK boleh mengganggu aksi utama.
 * Karena itu seluruh operasi dibungkus try/catch; kegagalan hanya di-log.
 * Bila userId null/kosong (mis. penanya tamu) → lewati (skip) tanpa error.
 */

/** Isi payload notifikasi yang dirender di /notifikasi. */
export type NotifyPayload = {
  title: string;
  body?: string;
  link?: string;
};

/**
 * Simpan notifikasi untuk satu user. Aman dipanggil "fire-and-forget":
 * tidak pernah melempar error (dibungkus try/catch) dan otomatis skip
 * bila penerima tidak diketahui (userId null/kosong).
 */
export async function notify(
  userId: string | null | undefined,
  type: string,
  payload: NotifyPayload,
): Promise<void> {
  // Skip bila tidak ada penerima (mis. pertanyaan dari tamu tanpa akun).
  if (!userId) return;

  try {
    await db.insert(schema.notifications).values({
      userId,
      type,
      payloadJson: payload,
    });
  } catch (err) {
    // Jangan ganggu aksi utama — cukup log.
    console.error("[notify] gagal menyimpan notifikasi:", err);
  }
}
