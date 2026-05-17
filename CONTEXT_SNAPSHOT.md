# 明薪记上下文压缩快照

更新时间：2026-05-18 00:42 CST

## 当前项目状态

- 项目目录：`/Users/yuanhuang/code/worktimeapp`
- 当前版本：`v0.4.3`
- 用户展示名：`明薪记`
- 技术 ID 保持不变：`cn.yuanhuang.worktimeapp`、KV `worktimeapp`、本地存储 `worktimeapp:v1`
- 已新增原生壳：Capacitor Android/iOS、Electron 桌面端
- 已新增自分发目录流程：`scripts/prepare-release.mjs`、`npm run release:prepare`、`npm run dist:self`
- ESA Pages 静态输出目录仍是 `dist/`，ESA 函数入口仍是 `functions/index.js`

## 本版发布重点

- `v0.4.3` 是 App 化平台体验正式版：登记抽屉、设置详情、云备份改密和倒班详情统一进入 App 内返回栈。
- 平板和窄桌面宽度（721-1120px）也走 App 式底部导航、移动月历、登录状态页脚和设置 drill-in。
- Android/HarmonyOS 使用 Web 层类 Liquid Glass 玻璃材质变量；PWA 不直接引入 AndroidLiquidGlass Compose 依赖。
- 新增平台识别和握持偏好桥接：根节点写入 `data-platform`、`data-display-mode`、`data-pointer`、`data-handedness`、`data-native-shell`，并暴露 `WorkTimeAppBridge.setHandedness()`。
- 自分发脚本只收集当前 `package.json` 版本的桌面安装包，旧版本 DMG/ZIP 只提示 ignored，不写入 `release-upload/` 清单。

## 发布流程提醒

1. 先完成文档和版本文件，运行测试与构建。
2. 推送 `main` 到 GitHub，方便 ESA 直接部署。
3. 重新构建 Android debug APK 和 Electron macOS arm64 DMG/ZIP。
4. 运行 `npm run release:prepare` 生成 `release-upload/`、安装说明、清单和 SHA-256。
5. 创建 `v0.4.3` Git 标签和 GitHub Release，上传 `release-upload/` 中的安装包与校验文件。

## 重要约束

- 不要破坏现有云同步、KV 命名、本地存储 key 和包名。
- 不要直接把 AndroidLiquidGlass Kotlin/Compose 接入当前 PWA/WebView 架构；除非后续另起原生 Compose 壳。
- 普通 PWA 不能直接获得鸿蒙握持手/左右手识别能力，需要后续 HarmonyOS 原生壳通过安全 JS bridge 注入。
- 每次有意义修改都必须同步 `PROJECT.md` 和 `MEMORY_UPDATES.md`。
