import { put, del } from "@vercel/blob";

/**
 * Upload satu File ke Vercel Blob. Kembalikan URL publik, atau null bila tidak ada file.
 * `prefix` = folder logis (mis. "titik", "donasi/poster"). `token` opsional untuk
 * storage milik entitas (lihat resolveUploadToken); default pakai token global env.
 */
export async function uploadToBlob(
  file: File | null | undefined,
  prefix: string,
  token?: string,
): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80) || "file";
  const blob = await put(`${prefix}/${safe}`, file, {
    access: "public",
    addRandomSuffix: true,
    token: token ?? process.env.BLOB_READ_WRITE_TOKEN,
  });
  return blob.url;
}

/** Hapus berkas dari Blob berdasarkan URL (best-effort). */
export async function deleteFromBlob(url: string | null | undefined, token?: string): Promise<void> {
  if (!url) return;
  try {
    await del(url, { token: token ?? process.env.BLOB_READ_WRITE_TOKEN });
  } catch {
    // abaikan; berkas mungkin sudah tiada
  }
}
