// node make-icon.js        -> docs/icon-180.png, icon-512.png, icon-1024.png (the iOS app icon). Needs Edge or Chrome; run locally and commit.
// node make-icon.js splash -> native/splash.png (plain green launch screen). No dependencies; CI runs this.
// The icon is the same fan of cards as the app header, using the suit drawings straight from docs/index.html.
const fs = require('fs'), zlib = require('zlib'), os = require('os'), path = require('path'), { execFileSync } = require('child_process');

const BG = [27, 67, 50];

function png(size, rgb) { // rgb(x, y) -> [r, g, b]; 8-bit RGB, no alpha (iOS icons must be opaque)
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) raw.set(rgb(x, y), y * (size * 3 + 1) + 1 + x * 3);
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Reads the browser's screenshot (8-bit RGB/RGBA, non-interlaced) so it can be re-saved without the alpha channel.
function readPng(buf) {
  let p = 8, w, h, ct; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] || (ct !== 2 && ct !== 6)) throw Error('unexpected PNG format'); }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, stride = w * bpp, src = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = src[y * (stride + 1)];
    for (let i = 0; i < stride; i++) {
      const x = src[y * (stride + 1) + 1 + i], a = i >= bpp ? out[y * stride + i - bpp] : 0, b = y ? out[(y - 1) * stride + i] : 0, c = y && i >= bpp ? out[(y - 1) * stride + i - bpp] : 0;
      const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
      out[y * stride + i] = (x + [0, a, b, (a + b) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? b : c][f]) & 255;
    }
  }
  return { w, h, px: (x, y) => [...out.subarray(y * stride + x * bpp, y * stride + x * bpp + 3)] };
}

function iconSvg() {
  const html = fs.readFileSync(`${__dirname}/docs/index.html`, 'utf8');
  const suits = ['srce', 'zir', 'list', 'zvono'].map(k => html.match(new RegExp(`${k}: '<svg[^>]*>(.*?)</svg>'`))[1]);
  // Same proportions as .fan.big: 52x76 cards turning about a point 2.26 card-heights below their top edge.
  const W = 220, H = W * 76 / 52, R = H * 2.26, ang = [-27, -9, 9, 27], rad = a => a * Math.PI / 180;
  const corners = ang.flatMap(a => [[-W / 2, -R], [W / 2, -R], [-W / 2, H - R], [W / 2, H - R]]
    .map(([x, y]) => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))]));
  const xs = corners.map(c => c[0]), ys = corners.map(c => c[1]);
  const s = 800 / (Math.max(...xs) - Math.min(...xs)); // fan fills ~78% of the width
  const cx = 512 - s * (Math.max(...xs) + Math.min(...xs)) / 2, cy = 512 - s * (Math.max(...ys) + Math.min(...ys)) / 2 + 20;
  const S = W * 40 / 52; // a bit bigger than in the app so the suits read at home-screen size
  const cards = ang.map((a, i) => `<g transform="rotate(${a})">
      <rect x="${-W / 2 + 5}" y="${-R + 10}" width="${W}" height="${H}" rx="${W * 9 / 52}" fill="rgba(0,0,0,.28)"/>
      <rect x="${-W / 2}" y="${-R}" width="${W}" height="${H}" rx="${W * 9 / 52}" fill="#fffdf6" stroke="#1b1b18" stroke-width="${W * 2 / 52}"/>
      <svg x="${-S / 2}" y="${-R + H / 2 - S / 2}" width="${S}" height="${S}" viewBox="0 0 24 24">${suits[i]}</svg></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
    <defs><radialGradient id="felt" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#2a6a4a"/><stop offset="1" stop-color="#1b4332"/></radialGradient></defs>
    <rect width="1024" height="1024" fill="url(#felt)"/>
    <g transform="translate(${cx} ${cy}) scale(${s})">${cards}</g></svg>`;
}

function icons() {
  const browser = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(fs.existsSync);
  if (!browser) throw Error('Edge or Chrome is needed to draw the icon');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'belaicon-')), page = path.join(dir, 'icon.html');
  fs.writeFileSync(page, `<!doctype html><style>html,body{margin:0;height:100%;overflow:hidden}</style>${iconSvg()}`);
  // Edge won't open a window narrower than ~500px, so small icons are box-averaged down from a bigger shot.
  for (const [size, k] of [[1024, 1], [512, 2], [180, 4]]) {
    const big = size * k, shot = path.join(dir, `${size}.png`);
    execFileSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      `--window-size=${big},${big}`, `--user-data-dir=${path.join(dir, 'profile')}`, `--screenshot=${shot}`, 'file:///' + page.replace(/\\/g, '/')], { stdio: 'ignore' });
    const img = readPng(fs.readFileSync(shot));
    if (img.w !== big || img.h !== big) throw Error(`screenshot is ${img.w}x${img.h}, wanted ${big}`);
    fs.writeFileSync(`${__dirname}/docs/icon-${size}.png`, png(size, (x, y) => {
      const acc = [0, 0, 0];
      for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) img.px(x * k + i, y * k + j).forEach((v, c) => acc[c] += v);
      return acc.map(v => Math.round(v / (k * k)));
    }));
  }
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('icons written');
}

if (process.argv[2] === 'splash') {
  fs.mkdirSync(`${__dirname}/native`, { recursive: true });
  fs.writeFileSync(`${__dirname}/native/splash.png`, png(2732, () => BG));
  console.log('splash written');
} else icons();
