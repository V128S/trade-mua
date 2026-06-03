// One-off: turn the square brand icon into a circular favicon (transparent
// corners) for src/app/icon.png, and rebuild src/app/favicon.ico from circular
// 16/32/48 PNGs. Run with: node scripts/round-favicon.mjs
import sharp from "sharp";
import { writeFile, rename } from "node:fs/promises";

const SRC = "src/app/icon.png";

const mask = (size) =>
  Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`
  );

// Circular PNG buffer at a given size (corners become transparent via dest-in).
async function circlePng(size) {
  return sharp(SRC)
    .resize(size, size, { fit: "cover" })
    .composite([{ input: mask(size), blend: "dest-in" }])
    .png()
    .toBuffer();
}

// Minimal ICO encoder embedding PNG-compressed entries (supported by all
// modern browsers). https://en.wikipedia.org/wiki/ICO_(file_format)
function buildIco(pngs) {
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(count, 4);

  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const bodies = [];
  pngs.forEach(({ size, data }, i) => {
    const e = 16 * i;
    dir.writeUInt8(size >= 256 ? 0 : size, e + 0); // width
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1); // height
    dir.writeUInt8(0, e + 2); // palette
    dir.writeUInt8(0, e + 3); // reserved
    dir.writeUInt16LE(1, e + 4); // color planes
    dir.writeUInt16LE(32, e + 6); // bits per pixel
    dir.writeUInt32LE(data.length, e + 8); // size of image data
    dir.writeUInt32LE(offset, e + 12); // offset
    offset += data.length;
    bodies.push(data);
  });
  return Buffer.concat([header, dir, ...bodies]);
}

// 1) Circular app icon (keep the original 640px resolution)
const meta = await sharp(SRC).metadata();
const full = await sharp(SRC)
  .composite([{ input: mask(meta.width), blend: "dest-in" }])
  .png()
  .toBuffer();
await writeFile("src/app/icon.tmp.png", full);
await rename("src/app/icon.tmp.png", SRC);

// 2) Circular multi-size favicon.ico
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map(async (size) => ({ size, data: await circlePng(size) })));
await writeFile("src/app/favicon.ico", buildIco(pngs));

console.log("done: circular icon.png + favicon.ico (", sizes.join("/"), ")");
