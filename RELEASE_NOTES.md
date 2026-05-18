# Release Notes - v0.4.4

发布日期：2026-05-18

## 概览

`v0.4.4` 是明薪记的原生外壳修复与平台适配版本。重点解决 macOS 26 Electron 启动崩溃、深色玻璃对比度异常，并补齐 Android、iOS 和 HarmonyOS 原生壳桥接。

## 修复

- 修复 macOS 26 上 Electron 包启动即崩溃的问题：主 app 和 helper entitlements 启用 `com.apple.security.cs.disable-library-validation`，避免 Electron Framework 被 Hardened Runtime 的 library validation 拦截。
- 深色模式不再使用接近纯黑和过度透明的玻璃层，输入框、底部导航、登记抽屉、倒班详情、设置详情和云同步块的文字对比度更稳定。
- Web 侧新增 `WorkTimeNativeShell.consumeBack()` / `WorkTimeHarmonyShell.consumeBack()`，原生返回键会优先关闭 App 内二级层。

## 原生外壳

- Android Capacitor 壳新增 `WorkTimeNative` JS bridge，注入 Android 平台、native shell 和材质状态；返回键先交给 PWA 子层处理，再回退 WebView 或退出。
- Android 工程加入 `io.github.kyant0:backdrop` 依赖，作为后续 Kyant0/AndroidLiquidGlass 原生 Compose 材质层接入基础；当前 PWA 主界面继续由 WebView 渲染，避免破坏现有跨平台主线。
- iOS Capacitor 壳改为自定义 `WorkTimeBridgeViewController`，注入 Apple native shell 状态，WKWebView 背景透明并与系统分组背景衔接，为 Liquid Glass/系统材质保留原生承载层。
- 新增 `harmony/` ArkTS/ArkUI + ArkWeb 初始工程骨架，可在 DevEco Studio 中接手；包名保持 `cn.yuanhuang.worktimeapp`，支持本地 rawfile PWA 或生产 URL，并预留握持偏好与返回键桥接。

## 打包状态

- 版本 `v0.4.4`，Service Worker 缓存名 `worktimeapp-v44`。
- Android `versionCode 44` / `versionName 0.4.4`。
- iOS `CURRENT_PROJECT_VERSION 44` / `MARKETING_VERSION 0.4.4`。
- HarmonyOS `versionCode 44` / `versionName 0.4.4`。
- PWA 构建输出目录仍为 `dist/`，ESA 函数入口仍为 `functions/index.js`。

## 发布注意

- 当前 macOS 包仍是 ad-hoc 开发/自分发包；公开长期分发仍需要 Developer ID 签名、notarization 和 staple。
- HarmonyOS 目录是 DevEco Studio 初始骨架，本机未执行 HarmonyOS SDK 构建和签名。
- Android 当前仍输出 debug APK；长期公开分发建议配置 release keystore。
