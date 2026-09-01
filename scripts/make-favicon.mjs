import { deflateSync } from 'zlib';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');

const BG = [201, 228, 222, 255];
const TOP = [210, 228, 240, 255];
const MID = [197, 216, 232, 255];
const BOT = [155, 184, 200, 255];
const HI = [255, 252, 248, 200];
const SHADE = [122, 154, 168, 90];
const INK = [90, 97, 108, 230];
const WHITE = [255, 252, 248, 255];
const BLUSH = [232, 165, 152, 110];
const OUT = [122, 132, 144, 90];

const BODY_ROWS = [
  [0.44, -0.44],
  [0.66, -0.36],
  [0.84, -0.24],
  [0.98, -0.1],
  [1.0, 0.04],
  [1.0, 0.18],
  [0.96, 0.3],
  [0.8, 0.38],
  [0.58, 0.42],
];

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function encodePng(w, h, rgba) {
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function put(px, w, x, y, rgba) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= w || iy >= w) return;
  const o = (iy * w + ix) * 4;
  const a = rgba[3] / 255;
  if (a >= 0.99) {
    px[o] = rgba[0];
    px[o + 1] = rgba[1];
    px[o + 2] = rgba[2];
    px[o + 3] = 255;
    return;
  }
  px[o] = Math.round(px[o] * (1 - a) + rgba[0] * a);
  px[o + 1] = Math.round(px[o + 1] * (1 - a) + rgba[1] * a);
  px[o + 2] = Math.round(px[o + 2] * (1 - a) + rgba[2] * a);
  px[o + 3] = 255;
}

function fillRect(px, w, x, y, rw, rh, rgba) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + rw);
  const y1 = Math.round(y + rh);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) put(px, w, xx, yy, rgba);
  }
}

function rowColor(i, total) {
  if (i <= 1) return TOP;
  if (i >= total - 2) return BOT;
  return MID;
}

function drawBlob(size) {
  const px = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    px[i * 4] = BG[0];
    px[i * 4 + 1] = BG[1];
    px[i * 4 + 2] = BG[2];
    px[i * 4 + 3] = 255;
  }

  const cx = size / 2;
  const cy = size / 2 + size * 0.04;
  const bw = size * 0.72;
  const bh = size * 0.72;
  const u = Math.max(1, Math.round(size / 16));
  const total = BODY_ROWS.length;

  for (let i = 0; i < total; i++) {
    const [ww, yy] = BODY_ROWS[i];
    const nextY = i < total - 1 ? BODY_ROWS[i + 1][1] : yy + 0.1;
    const rw = bw * ww;
    const ry = cy + bh * yy;
    const rh = Math.max(u, bh * (nextY - yy) + u * 0.2);
    fillRect(px, size, cx - rw / 2, ry, rw, rh, rowColor(i, total));
  }

  fillRect(px, size, cx - bw * 0.44, cy - bh * 0.12, u, bh * 0.38, SHADE);
  fillRect(px, size, cx - bw * 0.18, cy - bh * 0.34, bw * 0.36, u * 2, HI);
  fillRect(px, size, cx - bw * 0.1, cy - bh * 0.28, bw * 0.22, u, WHITE);

  fillRect(px, size, cx - bw * 0.36, cy - bh * 0.38, u * 2, u * 2, TOP);
  fillRect(px, size, cx + bw * 0.28, cy - bh * 0.38, u * 2, u * 2, TOP);

  fillRect(px, size, cx - bw * 0.32, cy + bh * 0.3, bw * 0.64, u * 2, BOT);

  for (const [ww, yy] of BODY_ROWS) {
    const rw = bw * ww;
    const ry = cy + bh * yy;
    fillRect(px, size, cx - rw / 2, ry, u, u * 2, OUT);
    fillRect(px, size, cx + rw / 2 - u, ry, u, u * 2, OUT);
  }

  const eyeY = cy - u * 2.2;
  const eyeW = u * 3;
  const eyeH = u * 4;
  const gap = u * 1.1;
  fillRect(px, size, cx - gap - eyeW, eyeY, eyeW, eyeH, WHITE);
  fillRect(px, size, cx + gap, eyeY, eyeW, eyeH, WHITE);
  fillRect(px, size, cx - gap - eyeW + u * 0.7, eyeY + u * 1.1, u * 1.6, u * 2.1, INK);
  fillRect(px, size, cx + gap + u * 0.7, eyeY + u * 1.1, u * 1.6, u * 2.1, INK);
  fillRect(px, size, cx - gap - eyeW + u * 1.4, eyeY + u * 1.3, u * 0.7, u * 0.7, WHITE);
  fillRect(px, size, cx + gap + u * 1.4, eyeY + u * 1.3, u * 0.7, u * 0.7, WHITE);

  fillRect(px, size, cx - gap - eyeW - u * 0.2, cy + u * 1.4, eyeW, u, BLUSH);
  fillRect(px, size, cx + gap, cy + u * 1.4, eyeW, u, BLUSH);

  const mouthY = cy + u * 2.6;
  fillRect(px, size, cx - u, mouthY, u * 2, u, INK);

  return px;
}

function scaleNearest(src, srcSize, destSize) {
  const out = Buffer.alloc(destSize * destSize * 4);
  for (let y = 0; y < destSize; y++) {
    const sy = Math.min(srcSize - 1, Math.floor((y * srcSize) / destSize));
    for (let x = 0; x < destSize; x++) {
      const sx = Math.min(srcSize - 1, Math.floor((x * srcSize) / destSize));
      const si = (sy * srcSize + sx) * 4;
      const di = (y * destSize + x) * 4;
      out[di] = src[si];
      out[di + 1] = src[si + 1];
      out[di + 2] = src[si + 2];
      out[di + 3] = src[si + 3];
    }
  }
  return out;
}

function hex(c) {
  return `#${c
    .slice(0, 3)
    .map((n) => n.toString(16).padStart(2, '0'))
    .join('')}`;
}

function makeSvg() {
  const s = 32;
  const px = drawBlob(s);
  let rects = '';
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const o = (y * s + x) * 4;
      const r = px[o];
      const g = px[o + 1];
      const b = px[o + 2];
      if (r === BG[0] && g === BG[1] && b === BG[2]) continue;
      rects += `<rect x="${x}" y="${y}" width="1" height="1" fill="rgb(${r},${g},${b})"/>`;
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">
  <rect width="32" height="32" rx="6" fill="${hex(BG)}"/>
  ${rects}
</svg>
`;
}

mkdirSync(PUBLIC, { recursive: true });

const src32 = drawBlob(32);
writeFileSync(join(PUBLIC, 'favicon-32.png'), encodePng(32, 32, src32));
writeFileSync(join(PUBLIC, 'favicon.svg'), makeSvg());

const src48 = drawBlob(48);
writeFileSync(join(PUBLIC, 'favicon-48.png'), encodePng(48, 48, src48));

const src32for180 = drawBlob(36);
const apple = scaleNearest(src32for180, 36, 180);
writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), encodePng(180, 180, apple));

writeFileSync(
  join(PUBLIC, 'site.webmanifest'),
  JSON.stringify(
    {
      name: 'Ascend Soft',
      short_name: 'Ascend',
      description: 'Torre sensorial ASMR. Suba. Pouse. Ouça.',
      start_url: './',
      display: 'standalone',
      background_color: '#c9e4de',
      theme_color: '#d8ebe4',
      icons: [
        { src: './favicon-48.png', sizes: '48x48', type: 'image/png' },
        { src: './apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    null,
    2,
  ),
);

console.log('favicon gerado em public/');
