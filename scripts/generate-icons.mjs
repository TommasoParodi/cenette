/**
 * Genera tutte le icone dell'app da public/cenette-icon.png
 * Richiede: sharp, png-to-ico
 * Uso: node scripts/generate-icons.mjs
 */

import sharp from "sharp";
import pngToIco from "png-to-ico";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const srcPath = path.join(publicDir, "cenette-icon.png");

const SIZES = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "icons/icon-192.png", size: 192 },
  { name: "icons/icon-512.png", size: 512 },
];

async function main() {
  const image = sharp(srcPath);

  for (const { name, size } of SIZES) {
    const outPath = path.join(publicDir, name);
    await mkdir(path.dirname(outPath), { recursive: true });
    await image
      .clone()
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log("Scritto:", name);
  }

  // Favicon.ico (multi-size 16 e 32)
  const path16 = path.join(publicDir, "favicon-16x16.png");
  const path32 = path.join(publicDir, "favicon-32x32.png");
  const ico = await pngToIco([path16, path32]);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);
  console.log("Scritto: favicon.ico");

  console.log("Icone generate.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
