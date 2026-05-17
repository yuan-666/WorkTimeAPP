import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { deflateSync } from "node:zlib";

const root = process.cwd();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function png(width, height, draw) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const [r, g, b, a] = draw(x, y, width, height);
      const i = (y * width + x) * 4;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = a;
    }
  }
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    rows.push(Buffer.from([0]));
    rows.push(rgba.subarray(y * width * 4, (y + 1) * width * 4));
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

function inRoundedRect(x, y, left, top, right, bottom, radius) {
  const cx = x < left + radius ? left + radius : x > right - radius ? right - radius : x;
  const cy = y < top + radius ? top + radius : y > bottom - radius ? bottom - radius : y;
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

function iconPixel(x, y, width) {
  const s = width / 512;
  const bgTop = [14, 143, 131, 255];
  const bgBottom = [11, 79, 73, 255];
  const paper = [245, 247, 236, 255];
  const teal = [12, 111, 102, 255];
  const tealDark = [11, 94, 86, 255];
  const gold = [244, 200, 74, 255];
  const shine = [255, 255, 255, 42];
  const transparent = [0, 0, 0, 0];
  if (!inRoundedRect(x, y, 0, 0, width - 1, width - 1, 104 * s)) return transparent;
  const mix = Math.max(0, Math.min(1, y / width));
  let color = bgTop.map((channel, index) => Math.round(channel * (1 - mix) + bgBottom[index] * mix));
  color[3] = 255;

  if (x >= 83 * s && x <= 420 * s && y >= 70 * s && y <= 224 * s && y < (-0.28 * x + 214 * s)) {
    color = shine;
  }

  const card = { left: 88 * s, top: 104 * s, right: 424 * s, bottom: 398 * s, radius: 48 * s };
  if (inRoundedRect(x, y, card.left, card.top, card.right, card.bottom, card.radius)) color = paper;

  if (inRoundedRect(x, y, 116 * s, 132 * s, 396 * s, 190 * s, 25 * s)) color = gold;

  const rows = [
    [128, 224, 236, 248, 255],
    [128, 286, 280, 310, 230],
    [128, 348, 254, 372, 198]
  ];
  for (const [left, top, right, bottom, alpha] of rows) {
    if (inRoundedRect(x, y, left * s, top * s, right * s, bottom * s, 12 * s)) color = [...teal.slice(0, 3), alpha];
  }

  const coin = ((x - 348 * s) ** 2 + (y - 306 * s) ** 2) <= (66 * s) ** 2;
  if (coin) color = gold;
  const stroke = 17 * s;
  const nearLine = (x1, y1, x2, y2) => {
    x1 *= s; y1 *= s; x2 *= s; y2 *= s;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSq));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    return ((x - px) ** 2 + (y - py) ** 2) <= (stroke / 2) ** 2;
  };
  if (coin && (
    nearLine(312, 262, 348, 304)
    || nearLine(384, 262, 348, 304)
    || nearLine(348, 304, 348, 358)
    || inRoundedRect(x, y, 322 * s, 295 * s, 374 * s, 313 * s, 9 * s)
    || inRoundedRect(x, y, 326 * s, 321 * s, 370 * s, 339 * s, 9 * s)
  )) {
    color = tealDark;
  }
  return color;
}

function splashPixel(x, y, width, height) {
  const bg = [242, 242, 247, 255];
  const scale = Math.min(width, height) / 1536;
  const iconSize = 320 * scale;
  const left = width / 2 - iconSize / 2;
  const top = height / 2 - iconSize / 2;
  if (x >= left && x < left + iconSize && y >= top && y < top + iconSize) {
    return iconPixel(Math.floor((x - left) / iconSize * 512), Math.floor((y - top) / iconSize * 512), 512);
  }
  return bg;
}

async function save(file, bytes) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, bytes);
}

async function saveText(file, text) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, text);
}

await save(join(root, "assets", "native", "icon-1024.png"), png(1024, 1024, (x, y) => iconPixel(x, y, 1024)));
await save(join(root, "build", "icon.png"), png(1024, 1024, (x, y) => iconPixel(x, y, 1024)));
await save(join(root, "assets", "native", "adaptive-icon-foreground.png"), png(432, 432, (x, y) => iconPixel(x, y, 432)));
await save(join(root, "assets", "native", "splash-2732x2732.png"), png(2732, 2732, splashPixel));

const androidIconSizes = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192
};
for (const [folder, size] of Object.entries(androidIconSizes)) {
  const bytes = png(size, size, (x, y) => iconPixel(x, y, size));
  await save(join(root, "android", "app", "src", "main", "res", folder, "ic_launcher.png"), bytes);
  await save(join(root, "android", "app", "src", "main", "res", folder, "ic_launcher_round.png"), bytes);
  await save(join(root, "android", "app", "src", "main", "res", folder, "ic_launcher_foreground.png"), bytes);
}

const androidSplash = png(1024, 1024, splashPixel);
await save(join(root, "android", "app", "src", "main", "res", "drawable", "splash.png"), androidSplash);
await saveText(join(root, "android", "app", "src", "main", "res", "drawable", "ic_launcher_monochrome.xml"), `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
    <path
        android:fillColor="#FFFFFFFF"
        android:fillType="evenOdd"
        android:pathData="M22,22H86C91.5,22 96,26.5 96,32V78C96,83.5 91.5,88 86,88H22C16.5,88 12,83.5 12,78V32C12,26.5 16.5,22 22,22ZM22,32H86V44H22V32ZM24,53H48V59H24V53ZM24,66H58V72H24V66ZM76,52C64.4,52 55,61.4 55,73C55,84.6 64.4,94 76,94C87.6,94 97,84.6 97,73C97,61.4 87.6,52 76,52ZM65,61L76,73L87,61H78L76,63.2L74,61H65ZM70,73H82V78H70V73ZM73,79H79V88H73V79Z" />
</vector>
`);
const adaptiveIconXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>
</adaptive-icon>
`;
await saveText(join(root, "android", "app", "src", "main", "res", "mipmap-anydpi-v26", "ic_launcher.xml"), adaptiveIconXml);
await saveText(join(root, "android", "app", "src", "main", "res", "mipmap-anydpi-v26", "ic_launcher_round.xml"), adaptiveIconXml);

const iosIcon = png(1024, 1024, (x, y) => iconPixel(x, y, 1024));
await save(join(root, "ios", "App", "App", "Assets.xcassets", "AppIcon.appiconset", "AppIcon-512@2x.png"), iosIcon);
const iosSplash = png(2732, 2732, splashPixel);
await save(join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset", "splash-2732x2732.png"), iosSplash);
await save(join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset", "splash-2732x2732-1.png"), iosSplash);
await save(join(root, "ios", "App", "App", "Assets.xcassets", "Splash.imageset", "splash-2732x2732-2.png"), iosSplash);

const iconSetDir = join(root, "build", "icon.iconset");
const iconSetSizes = [
  [16, "icon_16x16.png"],
  [32, "icon_16x16@2x.png"],
  [32, "icon_32x32.png"],
  [64, "icon_32x32@2x.png"],
  [128, "icon_128x128.png"],
  [256, "icon_128x128@2x.png"],
  [256, "icon_256x256.png"],
  [512, "icon_256x256@2x.png"],
  [512, "icon_512x512.png"],
  [1024, "icon_512x512@2x.png"]
];
for (const [size, name] of iconSetSizes) {
  await save(join(iconSetDir, name), png(size, size, (x, y) => iconPixel(x, y, size)));
}
if (process.platform === "darwin" && existsSync("/usr/bin/iconutil")) {
  try {
    execFileSync("/usr/bin/iconutil", ["-c", "icns", iconSetDir, "-o", join(root, "build", "icon.icns")], { stdio: "ignore" });
  } catch {
    // Electron Builder can still consume build/icon.png; keep iconset files for manual design export.
  }
}

console.log("Generated native PNG assets in assets/native/ and native platform icon slots when present.");
