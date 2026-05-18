# 明薪记上下文压缩快照

更新时间：2026-05-18 09:20 CST

## 当前项目状态

- 项目目录：`/Users/yuanhuang/code/worktimeapp`
- 当前版本：`v0.4.4`
- 用户展示名：`明薪记`
- 技术 ID 保持不变：`cn.yuanhuang.worktimeapp`、KV `worktimeapp`、本地存储 `worktimeapp:v1`
- 已新增原生壳：Capacitor Android/iOS、Electron 桌面端、HarmonyOS ArkTS/ArkWeb 骨架
- 已新增自分发目录流程：`scripts/prepare-release.mjs`、`npm run release:prepare`、`npm run dist:self`
- ESA Pages 静态输出目录仍是 `dist/`，ESA 函数入口仍是 `functions/index.js`

## 本版发布重点

- `v0.4.4` 是原生外壳修复版：修复 macOS 26 Electron Framework library validation 崩溃，新增 helper entitlement。
- Android 壳新增 `WorkTimeNative` bridge、原生返回键桥接和 `io.github.kyant0:backdrop` 依赖基础。
- iOS 壳新增自定义 `WorkTimeBridgeViewController`，用 WKUserScript 注入 Apple native shell 状态，WKWebView 与系统材质背景衔接。
- HarmonyOS 新增 `harmony/` ArkTS/ArkUI + ArkWeb 初始骨架，支持本地 rawfile PWA 或生产 URL。
- 深色模式玻璃层提高表面不透明度、边框和文字对比，避免黑底透明层导致输入框/抽屉/底部导航读不清。

## 发布流程提醒

1. 先完成文档和版本文件，运行测试与构建。
2. 推送 `main` 到 GitHub，方便 ESA 直接部署。
3. 重新构建 Android debug APK 和 Electron macOS arm64 DMG/ZIP。
4. 运行 `npm run release:prepare` 生成 `release-upload/`、安装说明、清单和 SHA-256。
5. 创建 `v0.4.4` Git 标签和 GitHub Release，上传 `release-upload/` 中的安装包与校验文件。

## 重要约束

- 不要破坏现有云同步、KV 命名、本地存储 key 和包名。
- AndroidLiquidGlass / Kyant0 Backdrop 已作为 Android 依赖基础加入；完整 Compose 原生材质层仍需后续 Android Studio 真机验证后再覆盖 WebView 外层。
- 普通 PWA 不能直接获得鸿蒙握持手/左右手识别能力；当前通过 HarmonyOS ArkWeb JS bridge 注入平台和握持偏好。
- 每次有意义修改都必须同步 `PROJECT.md` 和 `MEMORY_UPDATES.md`。
