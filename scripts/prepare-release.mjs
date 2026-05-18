import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { basename, extname, join, relative } from "node:path";

const root = process.cwd();
const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const version = `v${packageJson.version}`;
const productName = "明薪记";
const outDir = join(root, "release-upload");

const copied = [];
const skipped = [];
const ignored = [];

async function copyPath(source, targetName, label) {
  if (!existsSync(source)) {
    skipped.push({ label, source: relative(root, source) });
    return;
  }
  const target = join(outDir, targetName);
  await mkdir(join(target, ".."), { recursive: true });
  await cp(source, target, { recursive: true });
  copied.push({ label, path: targetName });
}

async function copyElectronArtifacts() {
  const releaseDir = join(root, "release");
  if (!existsSync(releaseDir)) {
    skipped.push({ label: "Electron 桌面分发包", source: "release/" });
    return;
  }
  const allowed = new Set([".dmg", ".zip", ".exe", ".msi", ".AppImage", ".deb", ".rpm"]);
  const names = await readdir(releaseDir);
  let count = 0;
  for (const name of names) {
    const source = join(releaseDir, name);
    const fileStat = await stat(source);
    if (!fileStat.isFile()) continue;
    const extension = extname(name);
    if (!allowed.has(extension)) continue;
    if (!name.includes(packageJson.version)) {
      ignored.push({ label: "Electron 旧版本分发包", source: `release/${name}` });
      continue;
    }
    await copyPath(source, `desktop/${name}`, `Electron ${extension.slice(1)} 分发包`);
    count += 1;
  }
  if (count === 0) skipped.push({ label: "Electron 桌面分发包", source: "release/*.{dmg,zip,exe,msi,AppImage,deb,rpm}" });
}

async function walkFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(file));
    } else if (entry.isFile()) {
      files.push(file);
    }
  }
  return files;
}

async function sha256(file) {
  const hash = createHash("sha256");
  hash.update(await readFile(file));
  return hash.digest("hex");
}

function installGuide() {
  return `# ${productName} ${version} 自分发安装说明

本目录用于上传到 GitHub Release、网盘或内部分发目录。正式对外发布前，优先上传平台安装包和 \`SHA256SUMS.txt\`，方便用户校验下载是否完整。

## Android

下载 \`${productName}-${version}-android-debug.apk\` 或你自行签名后的 release APK，在手机系统设置中允许当前文件管理器或浏览器“安装未知应用”，然后打开 APK 安装。debug APK 适合内测和小范围分发；长期分发建议配置 release keystore 后生成签名包。

## iPhone / iPad

iOS 不能像 Android 一样把 IPA 放到网盘后让普通用户直接安装。当前推荐把 \`dist/\` 部署为 PWA，用户用 Safari 打开站点后“添加到主屏幕”。如果后续需要原生 iOS 包，建议走 TestFlight、企业/组织内签名或开发者设备签名，并准备 Apple Team、证书和 provisioning profile。

## macOS

优先下载 \`.dmg\` 或 \`.zip\`。当前本地包默认未做 Developer ID 公证，macOS 可能提示来自未验证开发者；只应在确认来源可信时通过右键打开。macOS 26 对 Hardened Runtime 下的 Electron Framework 更严格，桌面包已启用 library validation 例外，避免 Electron Framework Team ID / DYLD library validation 拦截。正式公开分发前建议补 Developer ID 签名、notarization 和 staple。

## Windows

下载 \`.exe\` 安装包或便携包。未签名安装包可能触发 SmartScreen 提示；公开分发前建议配置代码签名证书。

## Linux

下载 \`.AppImage\` 后执行 \`chmod +x\` 再运行。不同发行版也可以使用后续生成的 \`.deb\` 或 \`.rpm\`。

## PWA 静态包

\`pwa-dist/\` 是 PWA 静态文件，可直接上传到 ESA Pages、GitHub Pages 或其他静态站点服务。阿里云 ESA Pages 的输出目录仍是 \`dist\`，函数入口仍是 \`functions/index.js\`。
`;
}

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

await copyPath(join(root, "dist"), "pwa-dist", "PWA 静态包");
await copyPath(
  join(root, "android", "app", "build", "outputs", "apk", "debug", "app-debug.apk"),
  `${productName}-${version}-android-debug.apk`,
  "Android debug APK"
);
await copyPath(
  join(root, "android", "app", "build", "outputs", "apk", "release", "app-release.apk"),
  `${productName}-${version}-android-release.apk`,
  "Android release APK"
);
await copyPath(
  join(root, "android", "app", "build", "outputs", "bundle", "release", "app-release.aab"),
  `${productName}-${version}-android-release.aab`,
  "Android release AAB"
);
await copyElectronArtifacts();

await writeFile(join(outDir, "INSTALL.md"), installGuide());
await writeFile(join(outDir, "release-manifest.json"), `${JSON.stringify({
  productName,
  version,
  generatedAt: new Date().toISOString(),
  copied,
  skipped
}, null, 2)}\n`);

const allFiles = (await walkFiles(outDir))
  .filter((file) => basename(file) !== "SHA256SUMS.txt")
  .sort((a, b) => relative(outDir, a).localeCompare(relative(outDir, b), "zh-Hans-CN"));
const checksumLines = [];
for (const file of allFiles) {
  checksumLines.push(`${await sha256(file)}  ${relative(outDir, file)}`);
}
await writeFile(join(outDir, "SHA256SUMS.txt"), `${checksumLines.join("\n")}\n`);

console.log(`Prepared ${productName} ${version} self-distribution folder at release-upload/`);
if (skipped.length) {
  console.log("Skipped missing artifacts:");
  for (const item of skipped) console.log(`- ${item.label}: ${item.source}`);
}
if (ignored.length) {
  console.log("Ignored stale artifacts:");
  for (const item of ignored) console.log(`- ${item.label}: ${item.source}`);
}
