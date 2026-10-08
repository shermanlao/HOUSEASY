/**
 * Builds the house favicon used by the app tab and standalone print pages.
 * Run: node scripts/generate-house-icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const BLUE = [37, 99, 235, 255];
const WHITE = [255, 255, 255, 255];

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function pointInTri(px, py, ax, ay, bx, by, cx, cy) {
  const v0x = cx - ax;
  const v0y = cy - ay;
  const v1x = bx - ax;
  const v1y = by - ay;
  const v2x = px - ax;
  const v2y = py - ay;
  const dot00 = v0x * v0x + v0y * v0y;
  const dot01 = v0x * v1x + v0y * v1y;
  const dot02 = v0x * v2x + v0y * v2y;
  const dot11 = v1x * v1x + v1y * v1y;
  const dot12 = v1x * v2x + v1y * v2y;
  const inv = 1 / (dot00 * dot11 - dot01 * dot01);
  const u = (dot11 * dot02 - dot01 * dot12) * inv;
  const v = (dot00 * dot12 - dot01 * dot02) * inv;
  return u >= 0 && v >= 0 && u + v <= 1;
}

function inRoundedSquare(nx, ny) {
  const m = 0.04;
  const r = 0.22;
  const x0 = m;
  const y0 = m;
  const x1 = 1 - m;
  const y1 = 1 - m;
  if (nx < x0 || nx > x1 || ny < y0 || ny > y1) return false;
  let cx = nx;
  let cy = ny;
  if (nx < x0 + r) cx = x0 + r;
  else if (nx > x1 - r) cx = x1 - r;
  if (ny < y0 + r) cy = y0 + r;
  else if (ny > y1 - r) cy = y1 - r;
  if (cx === nx && cy === ny) return true;
  const dx = nx - cx;
  const dy = ny - cy;
  return dx * dx + dy * dy <= r * r;
}

function inHouse(nx, ny) {
  const roof = pointInTri(nx, ny, 0.16, 0.48, 0.5, 0.16, 0.84, 0.48);
  const body = nx >= 0.26 && nx <= 0.74 && ny >= 0.46 && ny <= 0.84;
  const door = nx >= 0.44 && nx <= 0.56 && ny >= 0.62 && ny <= 0.84;
  const window = nx >= 0.32 && nx <= 0.42 && ny >= 0.54 && ny <= 0.66;
  if (door || window) return false;
  return roof || body;
}

function sample(nx, ny) {
  if (!inRoundedSquare(nx, ny)) return [0, 0, 0, 0];
  if (inHouse(nx, ny)) return WHITE;
  return BLUE;
}

function render(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const samples = 4;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const nx = (x + (sx + 0.5) / samples) / size;
          const ny = (y + (sy + 0.5) / samples) / size;
          const [pr, pg, pb, pa] = sample(nx, ny);
          r += pr;
          g += pg;
          b += pb;
          a += pa;
        }
      }
      const n = samples * samples;
      const i = (y * size + x) * 4;
      rgba[i] = Math.round(r / n);
      rgba[i + 1] = Math.round(g / n);
      rgba[i + 2] = Math.round(b / n);
      rgba[i + 3] = Math.round(a / n);
    }
  }
  return rgba;
}

function pngFromRgba(size, rgba) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const row = y * (1 + size * 4);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * size * 4, (y + 1) * size * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function ico(images) {
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  const parts = [header, dir];
  images.forEach((img, i) => {
    const e = i * 16;
    dir[e] = img.size >= 256 ? 0 : img.size;
    dir[e + 1] = img.size >= 256 ? 0 : img.size;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(img.png.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += img.png.length;
    parts.push(img.png);
  });
  return Buffer.concat(parts);
}

const appDir = path.join(__dirname, '..', 'src', 'app');
const sizes = [16, 32, 48];
const images = sizes.map((size) => ({ size, png: pngFromRgba(size, render(size)) }));
const icon = ico(images);

fs.writeFileSync(path.join(appDir, 'favicon.ico'), icon);
fs.writeFileSync(path.join(appDir, 'icon.ico'), icon);
fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngFromRgba(180, render(180)));

console.log('wrote favicon.ico, icon.ico, apple-icon.png');
