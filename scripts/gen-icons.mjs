// Generate ikon PWA (PNG) dari logo crest memakai sharp. Jalankan: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const inner = `
  <rect x="7.5" y="7.5" width="41" height="41" rx="9" fill="none" stroke="#C9A227" stroke-opacity=".55"/>
  <path d="M19 44 L19 27 C19 16 27 13 28 13 C29 13 37 16 37 27 L37 44" fill="none" stroke="#E6CC8A" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M23.5 44 L23.5 31 M32.5 44 L32.5 31" stroke="#E6CC8A" stroke-width="1.3" stroke-opacity=".6" stroke-linecap="round"/>
  <g transform="translate(28 9.5)" fill="#C9A227"><rect x="-3.2" y="-3.2" width="6.4" height="6.4"/><rect x="-3.2" y="-3.2" width="6.4" height="6.4" transform="rotate(45)"/></g>`;

// any: crest full-bleed (latar emerald penuh). maskable: konten di-skala ke zona aman ~80%.
const svg = (size, maskable) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 56 56">
  <rect width="56" height="56" ${maskable ? "" : 'rx="12"'} fill="#0E5C46"/>
  <g ${maskable ? 'transform="translate(5.6 5.6) scale(0.8)"' : ""}>${inner}</g>
</svg>`;

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "maskable-512.png", size: 512, maskable: true },
  { file: "apple-icon-180.png", size: 180, maskable: false },
];

await mkdir("public/icons", { recursive: true });
for (const t of targets) {
  await sharp(Buffer.from(svg(t.size, t.maskable))).png().toFile(`public/icons/${t.file}`);
  console.log("generated public/icons/" + t.file);
}
console.log("done.");
