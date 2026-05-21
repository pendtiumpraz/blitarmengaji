/**
 * Hapus semua data CONTOH UAT (yang dibuat db/seed-uat.ts).
 * Jalankan: npx tsx db/unseed-uat.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { cleanupUat } from "./seed-uat";

async function main() {
  console.log("Menghapus seluruh data UAT...");
  await cleanupUat();
  console.log("Selesai. Data UAT bersih.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
