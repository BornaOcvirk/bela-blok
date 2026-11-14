// Generates docs/icon-180.png + docs/icon-512.png (web) and native/icon-1024.png + native/splash.png (iOS app).
// Run: node make-icon.js
// Forest-green tile, white card, green club. No dependencies: shapes are drawn per pixel, 4x4 supersampled.
const fs = require('fs'), zlib = require('zlib');

const BG = [27, 67, 50], CARD = [247, 245, 239], CLUB = [45, 106, 79];
const inCircle = (x, y, cx, cy, r) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
function inRoundRect(x, y, x0, y0, x1, y1, r) {
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r)), dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return x >= x0 && x <= x1 && y >= y0 && y <= y1 && dx * dx + dy * dy <= r * r;
}
function inStem(x, y) { // triangle: apex (0.5,0.47), base 0.44..0.56 at y=0.70
  if (y < 0.47 || y > 0.70) return false;
  return Math.abs(x - 0.5) <= ((y - 0.47) / 0.23) * 0.06;
}
function color(x, y) {
  if (inCircle(x, y, 0.5, 0.39, 0.09) || inCircle(x, y, 0.405, 0.535, 0.09) ||
      inCircle(x, y, 0.595, 0.535, 0.09) || inCircle(x, y, 0.5, 0.5, 0.06) || inStem(x, y)) return CLUB;
  if (inRoundRect(x, y, 0.23, 0.15, 0.77, 0.85, 0.06)) return CARD;
  return BG;
}

function png(size, paint = color, S = 4) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let py = 0; py < size; py++) {
    raw[py * (size * 3 + 1)] = 0; // filter: none
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
        const c = paint((px + (sx + 0.5) / S) / size, (py + (sy + 0.5) / S) / size);
        acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
      }
      const o = py * (size * 3 + 1) + 1 + px * 3;
      for (let k = 0; k < 3; k++) raw[o + k] = Math.round(acc[k] / (S * S));
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const s of [180, 512]) fs.writeFileSync(`${__dirname}/docs/icon-${s}.png`, png(s));
fs.mkdirSync(`${__dirname}/native`, { recursive: true });
fs.writeFileSync(`${__dirname}/native/icon-1024.png`, png(1024));
fs.writeFileSync(`${__dirname}/native/splash.png`, png(2732, () => BG, 1)); // plain green launch screen
console.log('icons written');
