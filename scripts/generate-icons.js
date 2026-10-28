import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  const bytesPerPixel = 4;
  const scanlineLength = width * bytesPerPixel + 1; // +1 for filter byte (0)
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * bytesPerPixel;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);

    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);

    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(body), 0);

    return Buffer.concat([len, body, crc]);
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth
  ihdr[9] = 6; // Color type 6 (RGBA)
  ihdr[10] = 0; // Compression (deflate)
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace (none)

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Standard CRC32 table
const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return c ^ -1;
}

// Arrow icon drawer with rich blue-indigo gradient, white/cyan arrow shape
function drawArrowIcon(x, y, w, h, isMaskable = false) {
  const nx = x / w;
  const ny = y / h;

  // Background gradient: dark indigo to electric blue
  let r = Math.round(30 + nx * 10 + ny * 20);
  let g = Math.round(58 + nx * 40 + ny * 50);
  let b = Math.round(180 + nx * 50 + ny * 40);

  // Rounded rectangle mask if not maskable
  if (!isMaskable) {
    const rad = w * 0.22;
    const dx = Math.max(rad - x, 0, x - (w - rad));
    const dy = Math.max(rad - y, 0, y - (h - rad));
    if (dx * dx + dy * dy > rad * rad) {
      return [0, 0, 0, 0]; // Transparent outside rounded corner
    }
  }

  // Draw arrow shape: winding path from bottom-left to top-right
  const scale = isMaskable ? 0.72 : 1.0;
  const cx = 0.5;
  const cy = 0.5;
  const lx = (nx - cx) / scale + cx;
  const ly = (ny - cy) / scale + cy;

  // L-turn arrow path
  // Shaft 1: vertical segment around lx ~ 0.35, ly 0.35 to 0.70
  const onVert = Math.abs(lx - 0.36) < 0.055 && ly >= 0.42 && ly <= 0.70;
  // Shaft 2: horizontal segment around ly ~ 0.42, lx 0.36 to 0.65
  const onHoriz = Math.abs(ly - 0.42) < 0.055 && lx >= 0.36 && lx <= 0.65;

  // Arrowhead triangle at (0.65, 0.42) pointing right
  const inHead =
    lx >= 0.60 && lx <= 0.78 &&
    Math.abs(ly - 0.42) <= (0.78 - lx) * 0.95;

  if (onVert || onHoriz || inHead) {
    // Crisp white/cyan arrow with highlight
    return [255, 255, 255, 255];
  }

  // Subtle grid dot accents
  const gx = Math.round(nx * 4) / 4;
  const gy = Math.round(ny * 4) / 4;
  if (Math.hypot(nx - gx, ny - gy) < 0.015) {
    return [Math.min(255, r + 40), Math.min(255, g + 40), Math.min(255, b + 40), 255];
  }

  return [r, g, b, 255];
}

// Generate PNGs
fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, (x, y, w, h) => drawArrowIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, (x, y, w, h) => drawArrowIcon(x, y, w, h, false)));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, (x, y, w, h) => drawArrowIcon(x, y, w, h, true)));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, (x, y, w, h) => drawArrowIcon(x, y, w, h, false)));

console.log('Successfully generated all PWA icons: 192x192, 512x512, maskable, apple-touch-icon.');
