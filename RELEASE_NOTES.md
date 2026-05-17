# Release Notes - v0.4.3

发布日期：2026-05-18

## 概览

`v0.4.3` 是明薪记的 App 化交互与平台体验版本。它保留 `v0.4.1` 的品牌和自分发能力，同时重点修复移动端二级菜单返回、抽屉历史栈、窄平板 App 感不足，以及 Android/HarmonyOS 类玻璃材质适配。

## App 交互

- 统一 App 内返回栈：登记抽屉、设置详情、云备份改密表单、倒班详情都会先被系统返回/手势返回关闭，不再直接退到桌面或留下空返回层。
- 保存工时和保存设置后会同步消费对应 history 层，避免“看起来关闭了，下一次返回却卡一下”的问题。
- 嵌套二级层关闭时按层数一次性回退 history，云备份改密、设置详情等组合操作不会出现空跳。
- 721-1120px 平板/窄桌面也进入 App 化布局，使用底部导航、移动月历和设置分组详情，不再是一整页网页表单压缩。
- 倒班日历在移动端点击日期后打开底部详情抽屉，查看完可以返回手势关闭。

## 视觉

- 增强底部导航、登记抽屉、倒班详情和设置详情的玻璃材质：更接近原生 App 的浮层，而不是网页卡片。
- Android / HarmonyOS 平台会使用更圆润的控件半径和透明玻璃变量，参考 Android Liquid Glass 的模糊、亮边、透镜层思路在 Web 层实现。
- 触控目标统一提升到至少 44px，优化准点/加班快捷按钮、批量切换、管理员登录和移动日历格子。
- 暗色模式改用离纯黑更远的离屏黑，玻璃层边缘和阴影更稳定。

## 平台能力

- 新增运行时平台识别：Android、iOS、macOS、Windows、Linux、HarmonyOS、standalone、native shell 都会写入根节点 `data-*`，供样式和后续原生桥接使用。
- 新增握持习惯设置：自动、左手优先、右手优先。PWA 不能直接读取真实握持手，但 HarmonyOS/原生壳后续可通过 `WorkTimeAppBridge.setHandedness()` 同步原生识别结果。
- 保持 Android 包名、KV 绑定和本地存储 key 不变，确保升级不影响已有数据。

## 打包状态

- 版本 `v0.4.3`，Service Worker 缓存名 `worktimeapp-v43`。
- Android `versionCode 43` / `versionName 0.4.3`。
- iOS `CURRENT_PROJECT_VERSION 43` / `MARKETING_VERSION 0.4.3`。
- PWA 构建输出目录仍为 `dist/`，ESA 函数入口仍为 `functions/index.js`。
- `release-upload/` 已重新生成，包含 PWA 静态包、Android debug APK、macOS arm64 DMG/ZIP 和 SHA-256 校验；脚本会跳过旧版本桌面包。

## 发布注意

- AndroidLiquidGlass 是 Jetpack Compose 生态的原生库，当前 PWA/Capacitor 架构未直接引入 Kotlin/Compose；本版在 Web 层复刻玻璃观感，避免破坏跨平台主线。
- HarmonyOS 的握持/左右手识别不属于普通 PWA 可直接获得的能力，后续若创建鸿蒙原生壳，需要通过 ArkWeb/WebView JS bridge 安全注入。
- 自分发目录仍使用 `npm run release:prepare` 或 `npm run dist:self` 生成。
