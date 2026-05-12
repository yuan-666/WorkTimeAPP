import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const outDir = join(root, "dist");
const files = [
  "index.html",
  "admin.html",
  "changelog.html",
  "styles.css",
  "sw.js",
  "manifest.webmanifest",
  "src",
  "assets"
];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of files) {
  await cp(join(root, file), join(outDir, file), { recursive: true });
}

console.log("Built static PWA to dist/");
