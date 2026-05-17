# 记忆修改登记

本文件用于给后续 AI 交接项目记忆。每次修改本项目时，都必须同时更新：

- `PROJECT.md`：更新当前项目事实、结构、规范或交接状态。
- `MEMORY_UPDATES.md`：新增一条本次修改登记。

登记格式建议：

```text
## YYYY-MM-DD HH:mm CST - 简短标题

- 触发原因：
- 修改文件：
- 行为变化：
- 验证结果：
- 风险/注意：
- 后续建议：
```

## 2026-05-18 00:42 CST - v0.4.3 App 化平台体验发布准备

- 触发原因：用户要求本版修改完成后发布为新版本，先推送 GitHub 方便 ESA 部署，再构建平台安装包并发布 GitHub Release，同时更新 README、版本说明和项目描述文件。
- 修改文件：`package.json`、`package-lock.json`、`index.html`、`sw.js`、`src/app.js`、`android/app/build.gradle`、`ios/App/App.xcodeproj/project.pbxproj`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`CONTEXT_SNAPSHOT.md`、`MEMORY_UPDATES.md`，以及 `dist/`、`android/app/src/main/assets/public/`、`ios/App/App/public/` 等构建同步产物。
- 行为变化：
  - 将发布线推进到 `v0.4.3`，入口资源参数、Service Worker 缓存名 `worktimeapp-v43`、Android `versionCode 43/versionName 0.4.3`、iOS `CURRENT_PROJECT_VERSION 43/MARKETING_VERSION 0.4.3` 同步对齐。
  - `CHANGELOG.md` 和 `changelog.html` 新增 `v0.4.3` 顶部条目，说明 App 内返回栈、平板/窄桌面 App 化布局、类 Liquid Glass 视觉、平台识别和自分发脚本修复。
  - `RELEASE_NOTES.md` 修正发布日期和 iOS build 号，作为 GitHub Release 的说明源。
  - `CONTEXT_SNAPSHOT.md` 从“待处理”改为当前发布快照，保留 ESA 输出目录、函数入口、自分发流程和后续原生壳约束。
- 验证结果：`npm test` 55 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/prepare-release.mjs`、`scripts/generate-native-assets.mjs`、`electron/main.cjs`、`electron/preload.cjs` 通过；`npm run build` 成功；`npm audit --audit-level=moderate` 0 漏洞；`npm run assets:native` 成功；`npx cap sync` 成功；`npx cap doctor android` 与 `npx cap doctor ios` 均通过；`git diff --check` 通过。
- 风险/注意：Git 仓库只提交源码、原生工程和描述文件；Android APK、macOS DMG/ZIP、`release-upload/` 等自分发附件由推送后单独构建并上传 GitHub Release。Android 当前仍是 debug APK；macOS 包仍未 Developer ID 公证。
- 后续建议：推送 `main` 后重新构建 Android debug APK、Electron macOS arm64 DMG/ZIP，运行 `npm run release:prepare`，确认 `release-upload/release-manifest.json` 只包含 `v0.4.3` 产物，再创建 `v0.4.3` GitHub Release。

## 2026-05-18 00:35 CST - v0.4.2 App 化收口与自分发产物校验

- 触发原因：继续未完成的 App 化任务，并补充用户指出的“设备页面更像 App、二级菜单要支持返回手势、Android/HarmonyOS 参考 Liquid Glass、检查溢出和平台体验”的要求。
- 修改文件：`src/app.js`、`styles.css`、`scripts/prepare-release.mjs`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`、`dist/`、`android/app/build/outputs/apk/debug/app-debug.apk`、`release/`、`release-upload/`。
- 行为变化：
  - `consumeLayerHistory()` 改为统计已打开层数后一次性 `history.go(-count)`，避免云备份改密 + 设置详情等嵌套层连续 `history.back()` 时出现空跳。
  - 721-1120px 的移动页脚和返回条增加后置 CSS 规则，修复被后续默认隐藏覆盖的问题；平板/窄桌面会保留底部导航、登录状态页脚和 App 式底部抽屉。
  - 平板宽度下登记抽屉和倒班详情居中显示为圆角浮层，减少“网页压窄”的视觉感。
  - `scripts/prepare-release.mjs` 只收集文件名包含当前 `package.json` 版本号的 Electron 桌面包，旧版本 DMG/ZIP 只在终端提示 ignored，不写入发布清单，也不混入新版发布目录。
  - 重新构建 Android debug APK 和 macOS arm64 Electron DMG/ZIP，并重新生成 `release-upload/` 与 SHA-256 校验。
- 验证结果：`npm test` 55 项通过；`node --check src/app.js`、`functions/index.js`、`sw.js`、`scripts/prepare-release.mjs` 通过；`npm run build` 成功；`npx cap sync` 成功；`npm run assets:native` 成功；`npx cap doctor android` 与 `npx cap doctor ios` 通过；`npm audit --audit-level=moderate` 0 漏洞；浏览器 390px 验证月历日期登记抽屉、设置数据管理二级页、云备份底部入口、倒班详情返回关闭、管理员登录页无溢出；浏览器 900px 验证底部导航/页脚显示、登记抽屉居中、无页面级横向滚动；`JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./gradlew assembleDebug` 成功，debug APK metadata 为 `versionCode 42/versionName 0.4.2`；`npm run electron:dist` 成功生成 `明薪记-0.4.2-arm64.dmg` 和 `明薪记-0.4.2-arm64-mac.zip`；`npm run release:prepare` 成功，发布目录仅收集 v0.4.2 桌面包，发布清单不含旧 v0.4.1 文件；`git diff --check` 通过。
- 风险/注意：当前 Android 仍是 debug APK，macOS 包仍为 ad-hoc 签名且未 notarize；AndroidLiquidGlass 未直接引入 Compose/Kotlin，当前用 Web CSS 实现类似玻璃观感；普通 PWA 不能直接读取鸿蒙握持手语义能力，后续需要原生壳安全桥接。
- 后续建议：发布前再次运行 `git diff --check` 和查看 `release-upload/release-manifest.json`；如果要公开长期分发，优先补 Android release keystore、macOS Developer ID notarization、Windows 代码签名。

## 2026-05-17 23:58 CST - v0.4.2 App 化返回手势与平台体验

- 触发原因：用户要求先压缩上下文再继续，并指出当前仍太像网页；二级菜单需要支持返回手势关闭而不是直接退出到桌面，同时希望 Android/HarmonyOS 视觉更接近 Liquid Glass，并为鸿蒙握持手/左右手识别等平台特性预留能力。
- 修改文件：`CONTEXT_SNAPSHOT.md`、`src/app.js`、`src/calculations.js`、`functions/index.js`、`tests/functions.test.js`、`styles.css`、`index.html`、`sw.js`、`package.json`、`package-lock.json`、`android/app/build.gradle`、`ios/App/App.xcodeproj/project.pbxproj`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 新增 `CONTEXT_SNAPSHOT.md`，压缩记录当前 `v0.4.2` 项目状态、自分发策略和本轮 App 化接手重点。
  - `isMobileViewport()` 扩展到 `max-width:1120px` 或粗指针设备，平板/窄桌面也使用底部导航、移动月历和设置二级详情，不再显示被压窄的桌面长表单。
  - 登记抽屉、设置详情、云备份改密表单和倒班详情统一进入 App 内返回栈；保存工时/设置、切换页面和快捷跳转时会消费对应 history 层，避免返回键空跳或直接退出。
  - 移动端倒班日期点击后打开倒班详情底部抽屉，展示本次结束、距本次结束、锚点和月统计，可用返回手势或关闭按钮退出。
  - 新增平台感知：根节点写入 `data-platform`、`data-display-mode`、`data-pointer`、`data-handedness`、`data-native-shell`；新增握持习惯设置（自动/左手优先/右手优先）和 `WorkTimeAppBridge.setHandedness()`，供后续鸿蒙/原生壳桥接真实识别结果。
  - Web 层增强类 Liquid Glass 视觉：底部导航、登记抽屉、倒班详情、设置详情和云备份改密表单使用更强的 blur、亮边、透镜层和圆角；Android/HarmonyOS 平台变量更圆润。
  - 触控目标统一提升到 44px 以上，优化快捷按钮、批量切换、移动日历、未补登项和后台登录页；管理员 30 日趋势改为明确横向滚动，降低窄屏溢出。
  - 版本提升到 `v0.4.2`，入口资源参数、Service Worker 缓存名 `worktimeapp-v42`、Android `versionCode 42/versionName 0.4.2`、iOS `CURRENT_PROJECT_VERSION 42/MARKETING_VERSION 0.4.2` 同步更新。
- 验证结果：完整收尾结果见上方 `2026-05-18 00:35 CST - v0.4.2 App 化收口与自分发产物校验`；本轮已完成测试、构建、Capacitor 同步、Capacitor doctor、npm audit、浏览器 390/900px 回归、Android debug APK、Electron macOS arm64 DMG/ZIP 和 `release-upload/` 重新生成。
- 风险/注意：AndroidLiquidGlass 是 Compose 原生库，当前 PWA/Capacitor 架构没有直接引入 Kotlin/Compose，而是在 WebView 中用 CSS 复刻玻璃材质；普通 PWA 无法直接获得鸿蒙握持手语义能力，必须靠后续 HarmonyOS 原生壳/ArkWeb JS bridge 安全注入。
- 后续建议：真机重点检查 Android 返回手势、iOS Safari 添加到主屏幕后返回层、HarmonyOS 浏览器/WebView 的 `backdrop-filter` 性能；若要做完整鸿蒙壳，建议新建 `harmony/` 工程而不是混入现有 Capacitor 目录。

## 2026-05-17 23:30 CST - v0.4.1 明薪记品牌与自分发

- 触发原因：用户确认暂时不需要应用商店分发，希望通过 GitHub、网盘等方式让用户自行下载安装，并要求基于项目取一个好听合适有意义的名字，同时生成图标。
- 修改文件：`.gitignore`、`package.json`、`package-lock.json`、`index.html`、`manifest.webmanifest`、`sw.js`、`src/app.js`、`admin.html`、`changelog.html`、`styles.css`、`DESIGN.md`、`capacitor.config.json`、`android/`、`ios/`、`electron/main.cjs`、`electron-builder.yml`、`assets/icon.svg`、`assets/native/`、`build/icon.png`、`scripts/generate-native-assets.mjs`、`scripts/prepare-release.mjs`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 产品展示名统一改为“明薪记”，含义是“把工资算明白、把工时记清楚”；PWA、首启向导、侧边栏、关于页、后台、更新日志、Android/iOS/Electron 展示名称同步修改。
  - 保留 `cn.yuanhuang.worktimeapp`、`worktimeapp` KV 和 `worktimeapp:v1` 本地存储 key，避免因为改名破坏已安装用户升级、云备份和本地数据。
  - 新图标改为青绿色记录卡片与金色工资符号；`npm run assets:native` 已重新生成 Android、iOS、Electron 所需图标和启动图资源。
  - 版本提升到 `v0.4.1`，入口资源参数、Service Worker 缓存名 `worktimeapp-v41`、Android `versionCode 41/versionName 0.4.1`、iOS `CURRENT_PROJECT_VERSION 41/MARKETING_VERSION 0.4.1` 同步更新。
  - 新增 `scripts/prepare-release.mjs`、`npm run release:prepare`、`npm run dist:self`、`npm run dist:android:debug`、`npm run dist:desktop`，用于 GitHub Release、网盘和内部下载分发。
  - `release-upload/` 会收集 `pwa-dist/`、已有 Android APK/AAB、已有 Electron 安装包、`INSTALL.md`、`release-manifest.json` 和 `SHA256SUMS.txt`；未生成的平台产物会在清单里标记为 skipped。
- 验证结果：`npm run assets:native` 成功；`npm run build` 成功；`npx cap sync` 成功；`npm test` 55 项通过；`node --check src/app.js`、`src/storage.js`、`src/calculations.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/generate-native-assets.mjs`、`scripts/prepare-release.mjs`、`electron/main.cjs`、`electron/preload.cjs` 均通过；`npx cap doctor android` 与 `npx cap doctor ios` 通过；`npm audit --audit-level=moderate` 0 漏洞；`git diff --check` 通过；Android debug APK 构建成功；`npm run electron:dist` 生成 macOS arm64 ZIP/DMG；`npm run release:prepare` 生成 `release-upload/` 和校验和；本地浏览器 `http://127.0.0.1:52741/index.html?fresh=v041-brand` 验证标题、首启文案和图标加载正常。
- 风险/注意：当前 Android 是 debug APK，长期公开分发仍建议配置 release keystore；macOS DMG/ZIP 为 ad-hoc 签名且未 notarize，普通用户可能遇到 Gatekeeper 提示；Windows/Linux 产物未在本机生成；iOS 不能承诺网盘下载 IPA 后普通用户直接安装，当前推荐 PWA 添加到主屏幕，原生包需 TestFlight、企业/组织内签名或开发者设备签名。
- 后续建议：若要长期自分发，优先补 Android release keystore、macOS Developer ID notarization、Windows 代码签名，以及 GitHub Actions 多平台构建，把 `release-upload/` 作为人工上传或 CI artifact。

## 2026-05-17 22:58 CST - v0.4.0 原生打包与发布安全加固

- 触发原因：用户要求把已测试的 PWA 打包成对应平台软件版本，Android 支持新系统特性，iOS/macOS 支持 Apple 新设计语言，同时做发布前 PM 级检查、安全检查和具体测试。
- 修改文件：`.gitignore`、`package.json`、`package-lock.json`、`index.html`、`sw.js`、`src/app.js`、`src/storage.js`、`styles.css`、`functions/index.js`、`tests/functions.test.js`、`capacitor.config.json`、`android/`、`ios/`、`electron/`、`electron-builder.yml`、`build/entitlements.mac.plist`、`build/icon.png`、`assets/native/`、`scripts/generate-native-assets.mjs`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 版本从 `v0.3.9` 提升到 `v0.4.0`，入口资源参数、Service Worker 缓存名、Android `versionCode/versionName`、iOS `CURRENT_PROJECT_VERSION/MARKETING_VERSION` 和 Electron 打包版本同步更新。
  - 新增 Capacitor Android/iOS 原生工程；Android 目标 SDK 36，配置预测返回、边到边显示、主题图标、禁用明文流量、禁用 Android 备份和关闭 WebView debug。
  - 新增 Electron 桌面壳和 `electron-builder.yml`，桌面端启用 `contextIsolation`、`sandbox`、禁用 Node 注入、CSP、安全外链限制和 macOS 系统材质窗口。
  - 新增 `npm run assets:native`，生成 Android/iOS/Electron 图标和启动图；原生壳自动使用 `https://time.yuan6.cn/api/cloud` 云同步接口。
  - 云备份接口加强 Origin 白名单、请求体真实字节限制、安全响应头、管理员登录限流、未知 action 前置拒绝、登录/注册/改密稳定限流分桶、用户会话版本失效和云端快照白名单清洗。
  - 用户修改云备份密码必须同时提交有效会话和原密码；本地 JSON 备份不再导出 `sessionToken`，导入备份也不会恢复旧 token。
  - 移动端底部导航加入图标；登记抽屉、设置详情和云备份/倒班设置入口支持返回键关闭；切换底部主导航时清理设置详情 history，避免空返回。
  - 修复首启向导在 360/390px 下的横向溢出；移动端设置详情的个税/休息方式条件字段恢复正确隐藏；保存按钮增加可触控宽度。
- 验证结果：`npm run assets:native`、`npm run build`、`npx cap sync`、`npm test` 55 项通过；`node --check src/app.js`、`src/storage.js`、`src/calculations.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/generate-native-assets.mjs`、`electron/main.cjs`、`electron/preload.cjs` 均通过；`npm audit --audit-level=moderate` 0 漏洞；`npx cap doctor android` 与 `npx cap doctor ios` 通过；`JAVA_HOME=/opt/homebrew/opt/openjdk@21 ANDROID_HOME=/opt/homebrew/share/android-commandlinetools ./gradlew assembleDebug` 成功生成 Android debug APK；`npm run electron:pack` 成功生成 macOS arm64 Electron app。本地内置浏览器在 390px 验证首启向导、设置个税详情、工作日与假期详情、底部云备份入口返回、设置详情切主导航后返回；756px 报表页未发现横向溢出。
- 风险/注意：Android 正式上架仍需 keystore/release signing/AAB；iOS/TestFlight 需要完整 Xcode、Apple Developer Team、证书和 provisioning profile；macOS 正式分发需要 Developer ID 签名、notarization 和 staple，当前 Electron app 只是 ad-hoc 开发验证包。生产 KV 建议配置 `SESSION_HMAC_SECRET`，并避免使用明文 `admin_passwd`。
- 后续建议：接入 CI 时把 `npm test`、`npm run build`、`npx cap sync`、Android assemble、Electron pack 分成独立 job；拿到 Apple/Android 签名材料后再补 release signing 和商店隐私清单。

## 2026-05-15 13:53 CST - v0.3.9 倒班云同步与结束倒计时

- 触发原因：用户要求倒班记录也参与云同步，并把倒班页底部无意义的轮次展示改为距本次班次结束还有多久；同时要求增加工时班次时间复用选项、再次检查接口和界面，并推送 GitHub。
- 修改文件：`src/app.js`、`src/calculations.js`、`functions/index.js`、`tests/functions.test.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 云备份快照升级为 `version: 3`，显式保存 `shiftCalendar`，同时保留 `settings.shiftCalendar`；恢复时优先读取独立倒班快照并兼容旧结构。
  - 后端 `sanitizeData` 会清洗倒班日历字段，保留开启状态、日历名、班组名、锚点日期、周期开始时间和最多 31 天轮班规则；下夜班/休班会清空上下班时间。
  - 管理员用户摘要新增倒班开启状态和周期长度，并兼容旧备份中只存在 `settings.shiftCalendar` 的用户。
  - 倒班页详情区不再展示“轮次”，改为“本次结束”和“距本次结束”；正在上班时显示剩余时长，未开始时显示结束时间，已结束时显示已结束。
  - 倒班规则新增“周期开始时间”；今日班次会结合锚点时间判断当前属于哪一天的周期。
  - 倒班周期行新增“复用时间”下拉框，可套用工时班次模板里的上下班时间；复用夜班时间时会自动把休班/下夜班行转成上夜班或白班。
  - 函数测试请求改用递增的测试 IP 头，避免生产限流逻辑在同一测试进程中被前置用例误触发。
- 验证结果：`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/serve.mjs` 均通过；`npm test` 50 项通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地浏览器访问 `http://127.0.0.1:52730/index.html?fresh=v0.3.9-final`，在 756px 宽度扫描月历、倒班、记录、报表、设置 5 个主页面均无页面级横向溢出、无控制台错误；倒班页无“轮次/当前轮次”文案，显示“本次结束/距本次结束”；设置页能检测到 `shiftCalendar.anchorTime` 和 4 个 `reusePresetId` 复用时间选择器。
- 风险/注意：浏览器验证基于当前 in-app browser 的 756px 宽度，已覆盖窄桌面和平板类问题；更小真机宽度仍建议部署后在 iOS/Android WebView 上手动滑动检查原生时间选择器。
- 后续建议：如果后续要把倒班规则“一键生成工时记录”，需要先明确下夜班是否计薪、跨日夜班归属和休班工资处理，避免把排班展示与工资登记混在一起。

## 2026-05-15 13:28 CST - v0.3.9 发布整理与推送准备

- 触发原因：用户确认当前效果没什么问题，要求再次检测，并把所有描述文件和版本文件写好后推送到 GitHub。
- 修改文件：`package.json`、`index.html`、`src/app.js`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 应用版本从 `v0.3.7` 提升到 `v0.3.9`，`APP_VERSION`、`package.json`、入口资源参数、Service Worker 注册参数和 README 当前版本同步更新。
  - Service Worker 缓存名从 `worktimeapp-v30` 提升到 `worktimeapp-v32`，降低线上和 PWA 安装端继续读取旧资源的概率。
  - `CHANGELOG.md` 新增 `v0.3.9` 条目，`RELEASE_NOTES.md` 改为本次窄桌面溢出修复和倒班稳定版发布说明。
  - `changelog.html` 时间轴新增 `v0.3.9` 条目，并重新编号时间线索引。
- 验证结果：`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/serve.mjs` 均通过；`npm test` 49 项通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地浏览器在 756px 宽度复测月历、报表、记录、设置和倒班页，页面版本均显示 `v0.3.9`，未发现页面级横向溢出。
- 风险/注意：这是在 `v0.3.7` 倒班功能和本轮溢出修复基础上的发布整理；推送前需要确认本地 `main` 与 `origin/main` 没有分叉。
- 后续建议：推送后在 GitHub Release 使用 `v0.3.9` 标签和 `RELEASE_NOTES.md` 内容；ESA Pages 若仍显示旧版本，需要检查缓存刷新和 Pages 输出目录 `dist`。

## 2026-05-15 13:05 CST - 窄桌面溢出修复

- 触发原因：用户反馈电脑版横向空间稍微缩小后很多地方会溢出，特别是报表数字、日期填写和整体表单区域，需要全面检查并修好。
- 修改文件：`styles.css`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 720-1120px 的窄桌面/平板宽度提前切换为更稳的单列主布局，报表、记录、倒班和设置页不再等到 720px 以下才收敛。
  - 本月指标卡从固定 4 列改为响应式列宽，并缩小窄桌面数字字号；金额、工时和目标数字增加 `tabular-nums`、换行和溢出保护。
  - 年度总结条、薪资拆分、饼图图例、记录筛选日期框、工资规则行、倒班周期设置、云备份卡片和管理员看板增加 `min-width: 0`、省略和折行规则，避免表单/数字撑破容器。
  - 页面切换入场动画从横向位移改为轻微纵向位移，避免切页瞬间产生横向滚动条闪动。
  - 隐藏的文件导入 input 收敛到按钮尺寸，避免设置页被不可见控件撑宽。
- 验证结果：`npm test` 49 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地浏览器在 756px 宽度扫描月历、报表、记录、设置和倒班页，`documentElement.scrollWidth` 均等于 `clientWidth`，未发现页面级横向溢出。
- 风险/注意：当前自动浏览器宽度为 756px，已覆盖用户反馈的窄桌面症状；更宽的 900-1100px 主要依赖同一 `@media (max-width: 1120px)` 规则，后续如果能接入可控 viewport 的端到端工具，可以补固定宽度截图回归。
- 后续建议：下次 UI 迭代优先补一个响应式回归脚本，覆盖 390px、756px、900px、1120px 和 1280px 的主页面 `scrollWidth` 检查。

## 2026-05-15 12:14 CST - 倒班功能开关与手机端收敛

- 触发原因：用户反馈倒班应该由用户决定是否开启；不开启时要把倒班整体隐藏，并要求班次设置贴近倒班助手的白班、上夜班、下夜班、休班模型，同时继续优化手机访问质量。
- 修改文件：`src/calculations.js`、`src/app.js`、`styles.css`、`tests/calculations.test.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 设置页新增“功能开关”分组；倒班未开启时只显示总开关，主导航、底部导航、倒班页面和倒班详细设置全部隐藏。
  - 倒班默认周期改为白班、上夜班、下夜班、休班四段；类型选择收敛为这四类，但每一段班次名称仍可由用户自行填写。
  - 下夜班默认不要求填写上下班时间，展示为“夜班后休息”，避免把下夜班误当成新的工作时段。
  - 手机端倒班日历进一步压缩日期格，隐藏小号时间文本，底部导航改成自适应网格，减少 5 个入口时的挤压。
- 验证结果：`npm test` 49 项通过；`node --check src/app.js`、`src/calculations.js`、`scripts/serve.mjs` 通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地浏览器验证倒班未开启时导航隐藏、开启后显示 4 天周期、倒班页无横向溢出，点击倒班日期不会弹出工时登记抽屉。
- 风险/注意：倒班仍只负责排班展示，不自动生成工资记录；如后续做“一键按倒班补登工时”，需要明确下夜班是否计薪和跨日归属。
- 后续建议：可以继续补两班倒、三班倒、上二休二等模板按钮，让用户不用手动增加周期行。

## 2026-05-15 11:44 CST - 本地预览端口可配置

- 触发原因：用户要求重新开一个预览，并把端口写开一点，避免和之前的 `4173` 预览冲突。
- 修改文件：`scripts/serve.mjs`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：`scripts/serve.mjs` 从固定 `4173` 改为读取 `PORT` 环境变量；默认仍是 `4173`，需要避开旧端口时可运行 `PORT=52730 npm run serve`。
- 验证结果：旧预览会话已停止，后续使用新端口启动并访问验证。
- 风险/注意：这是本地开发体验改动，不影响生产构建、ESA 函数入口或云同步接口。
- 后续建议：如果后续经常多开预览，可在 README 的运行说明里补充常用备用端口。

## 2026-05-15 11:20 CST - v0.3.7 倒班日历与轮班周期

- 触发原因：用户提供“倒班助手”截图，要求基于样例增加独立倒班日历，支持按需开启/关闭、轮班规则、当前周期计数和多功能协同。
- 修改文件：`src/calculations.js`、`src/app.js`、`styles.css`、`tests/calculations.test.js`、`package.json`、`sw.js`、`index.html`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 新增 `shiftCalendar` 设置，默认关闭；开启后主导航出现“倒班”，关闭后隐藏，避免打扰普通工时用户。
  - 新增倒班周期计算：按周期第 1 天日期作为锚点，自动推算任意日期的班次、周期第几天、当前第几轮和下个休班。
  - 设置页新增“倒班日历”分组，可编辑日历名称、班组名称、锚点日期、周期每一天的班次名称、类型和时间。
  - 新增独立倒班页，展示今日班次、本轮进度、下个休班、月历格子和当月班次统计；手机端点击日期只查看班次，不再误弹出工时登记抽屉。
  - 倒班规则与工时登记模板分离：倒班页负责排班展示，月历页仍负责工资与工时登记，降低概念混乱。
  - 版本提升到 `v0.3.7`，Service Worker 缓存名提升到 `worktimeapp-v30`。
- 验证结果：新增倒班计算测试；当前 `npm test` 47 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地浏览器验证桌面倒班页、手机 390px 倒班页和点击倒班日期不弹出工时登记抽屉。
- 风险/注意：倒班日历当前只做排班推算与展示，尚未自动把倒班规则转换成工资登记；如果后续要“一键按班次登记”，需要明确夜班跨日工资归属。
- 后续建议：用真机检查倒班设置的原生时间选择器和下拉选择器；后续可增加规则模板（两班倒、三班倒、上四休二等）和按班次快捷登记。

## 2026-05-14 18:00 CST - v0.3.6 日历翻页滑动动画

- 触发原因：用户反馈日历翻页没有动画，体验生硬。
- 修改文件：`src/app.js`、`styles.css`、版本配置文件、日志文件。
- 行为变化：
  - 在 `src/app.js` 中为月份切换逻辑添加了 `ui.calendarTransition` 状态管理，区分左滑与右滑方向。
  - 在 `styles.css` 中新增了 `slide-left` 和 `slide-right` 关键帧动画及对应类名。
  - 给日历视图容器绑定了动态动画类，实现翻页时的平滑切入效果。
  - 提升版本号到 `v0.3.6`，Service Worker 缓存到 `worktimeapp-v29`。
- 验证结果：通过 `npm test`，日历按钮点击及移动端手势翻页均能触发平滑动画。
- 风险/注意：动画时长定为 0.25s，使用 `cubic-bezier` 缓动以保持 iOS 的原生顺滑感。
- 后续建议：如果以后增加更多视图切换，可以考虑抽象出一套通用的切换动画指令。

## 2026-05-14 17:30 CST - v0.3.5 UX/UI 组件布局与细节优化

- 触发原因：全面排查了各处视图中的按钮位置和不合理的使用模式，进行统一打磨。
- 修改文件：`src/app.js`、`styles.css`。
- 行为变化：
  - **日历工时底板（Entry Sheet）**：给编辑模式新增了内联的“删除”按钮，并排放在保存按钮左侧，避免了过去必须先关闭弹窗再点击列表叉号的不合理交互。
  - **移动端设置菜单（Settings Detail）**：调整了二级设置页的保存按钮位置。废除了原先只能在长表单底部（`.settings-detail-save`）点击保存的方式；现在采用纯正的 iOS 设计模式，将保存按钮直接上提至顶部标题栏（`.settings-detail-header`）的右侧，方便单手拇指一键保存。
  - **云同步备份区**：精简了“导入备份”与“导出本地备份”按钮的 DOM 嵌套结构，使其排列更紧凑原生。
- 验证结果：自动化测试通过，移动端交互预览效果顺滑，顶部保存按钮表现优雅。
- 风险/注意：无。
- 后续建议：日后若增加长表单页面，需保持将核心提交动作放在视口可见区域的交互规范。

## 2026-05-14 17:00 CST - v0.3.5 修复线上 ESA KV 调用超限报错

- 触发原因：用户反馈线上 `time.yuan6.cn/api/cloud` 接口 POST 请求持续报 500 错误。
- 修改文件：`functions/index.js`、版本配置文件、日志文件。
- 行为变化：
  - 移除了原有的 `checkRateLimit` KV 读写操作，转而使用 worker 生命周期内的内存 Map (`rateLimitMap`) 进行防刷计数，彻底省去单次请求的 2 次 KV 调用。
  - 为 `readPasswordKeyMaterial` (`RSA_key`) 添加了基于作用域变量的全局内存缓存 `cachedPasswordKeyMaterial`，热启动下节省 1 次 KV 读取。
  - 删除了被废弃的 `userMetaKey(userId)` 功能及写入逻辑（后台看板无需该元数据）。
  - 修复了 `touchUser` 在处理 `push` 时的二次重复写表问题。
- 验证结果：通过 `npm test`，所有功能包括云同步模拟测试全部跑通。上述修改让注册流程的 KV 调用次数从原本超标的 10 次稳定下降至 6 次左右，成功突破了阿里云 ESA 的防线限制（单次请求最大调用 KV 限制为 8 次）。
- 风险/注意：防刷策略（Rate Limit）目前退化为了单节点单实例内存级别，不能跨节点共享，但对于防止纯机器人的轻量防御和省下 KV 额度来说是完全值得的妥协。
- 后续建议：ESA 环境内存状态不长久，建议长期依然不把频繁修改的变量存储在 KV，可考虑外部 Redis 集群。

## 2026-05-14 16:30 CST - v0.3.4 本地联调 API 与版本发布

- 触发原因：用户发现本地启动的服务器无法测试云备份接口（返回 404），要求修复并在修复后更新日志和版本号推送。
- 修改文件：`scripts/serve.mjs`（新增）、`package.json`、`index.html`、`sw.js`、`src/app.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 编写了 Node.js 原生的代理服务器 `scripts/serve.mjs`，拦截 `/api/` 路由并直接转发给 `functions/index.js`。
  - 使用本地 `.local-kv.json` 模拟实现了云端的 ESA KV 数据库。
  - 将 `package.json` 中的 `serve` 脚本替换为 `node scripts/serve.mjs`。
  - 提升版本号到 `v0.3.4`，更新 Service Worker 缓存到 `worktimeapp-v27`，更新各个文件的入口引用参数，同步修改 `CHANGELOG.md` 等更新日志。
- 验证结果：重新启动 `npm run serve` 后，访问 127.0.0.1:4173 能够正常使用本地环境联调完整的云端账号注册、登录与同步逻辑，404 问题已解决。
- 风险/注意：本地 mock KV 没有实现过期的逻辑控制，但测试云备份和登录功能足够使用。
- 后续建议：如果线上增加更复杂的 ESA API 逻辑，可能也需要同步扩充 `serve.mjs` 中的 Mock 实现。

## 2026-05-14 15:40 CST - v0.3.3 UX/UI 细节打磨与 Bug 修复

- 触发原因：作为 PM 角色审计整体效果，发现 iOS Blue 风格实现存在一些不优雅的细节和组件 Bug，并发现与 `DESIGN.md` 设计规范不一致。
- 修改文件：`styles.css`、`DESIGN.md`。
- 行为变化：
  - 修复了 `styles.css` 中 `.notice` 在桌面暗色模式下被错误施加 `bottom: 130px;` 的 bug，将其移入 `max-width: 720px` 的移动端专属块。
  - 将表单输入框的 `focus` 状态边框阴影由生硬的 `2px var(--accent)` 柔化为分层阴影 `1px var(--accent), 3px var(--accent-soft)`。
  - 将 `.is-today` 僵硬的 2px 边框替换为仅高亮数字（`color: var(--accent); font-weight: 800;`），更加原生优雅。
  - 重写了 `DESIGN.md` 的色彩系统部分，使其与实际落地的 `#007AFF` iOS Blue 风格对齐，而不是之前废弃的深绿主题。
- 验证结果：`npm test` 45 项全部通过，构建成功。暗色模式和移动端视图正常。
- 风险/注意：UI 调整较轻微，不影响功能逻辑。
- 后续建议：保持对 UI 细节的关注，持续优化交互体验。

## 2026-05-14 03:00 CST - v0.3.3 版本发布

- 触发原因：用户要求纯 iOS HIG 风格彻底重构、月份切换下沉到拇指区、暗色模式全面修复、选中日期空白问题。
- 修改文件：`index.html`、`styles.css`、`src/app.js`、`functions/index.js`。
- 行为变化：
  - 全面替换为 iOS 原生风格：`#F2F2F7` 浅灰底 + `#FFFFFF` 白卡片，暗色 `#000000` 纯黑底，`#007AFF` 经典蓝 accent。删除所有玻璃拟态、毛玻璃、弥散光背景。
  - 全局微交互：`button:active { transform: scale(0.96) }` 物理收缩感，`cubic-bezier(0.25, 1, 0.5, 1)` 弹簧缓动。
  - 手机版四宫格（税前 | 距目标 / 总上班 X天 Xh | 总加班 Xh），休息倒计时独立长条框。
  - 月份切换「‹ 回到今天 ›」移至日历顶部，移除底部 thumb-zone。
  - 左右滑动翻页手势（`touchstart` + `touchend`，±60px 触发）。
  - 修复明暗切换：新增 `[data-theme="dark"]` 和 `[data-theme="light"]` CSS 变量块，SVG 图标 `color: var(--ink)` 正确继承，`pointer-events` 修复。
  - 修复选中日期空白：`.is-selected` 移至 `.has-data`/`.has-work` 之后，末尾追加 `!important` 胜利规则，保证选中背景在所有状态下可见。
  - 云备份新增密码修改功能（验证旧密码 + 新密码加密，ESA KV 更新）。
  - API 安全加固：每 IP 限 10 次/分钟 POST，请求体 ≤500KB，过滤意外字段，密码 ≤128 字符。
  - 全局 `*` 重置移除 `margin:0;padding:0`，button/input 重置移除 `border:none;background:transparent`。
  - `--accent` 变量定义于 `:root`（`#007AFF`）、`:root[data-theme="dark"]`（`#0A84FF`）、`:root[data-theme="light"]`，`@media` 使用 `:not([data-theme="light"])` 兜底。
- 验证结果：`node --check` 全通过；`npm test` 45 项通过；`npm run build` 成功；浏览器实测选中日期浅色 `bg=#007AFF`、暗色 `bg=#0A84FF`，白字可见。
- 风险/注意：`is-selected` 胜利规则使用 `!important`，后续若新增状态类需确保不产生冲突。左右滑动仅在日历页生效，且 entrySheet 打开时不触发。
- 后续建议：可考虑将 `mcal-cell` 状态规则统一定义在文件末尾以简化级联管理。

## 2026-05-13 23:59 CST - v0.3.2 手机日历布局重构与暗色模式颜色修复

- 触发原因：用户要求手机月历页重新布局（工资+工时+目标+放假四宫格、月份切换独立一行）、暗色模式下提示框白底白字等颜色问题修复、冗余文案清理。
- 修改文件：`src/app.js`、`styles.css`、`index.html`、`admin.html`、`package.json`、`sw.js`、`PROJECT.md`、`MEMORY_UPDATES.md`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`.gitignore`。
- 行为变化：
  - 手机月历页顶部重构为四宫格（税前 / 总工时↔总加班 / 目标 / 放假↔本月上班），右上角明暗切换按钮；月份切换（‹ 今天 ›）独占一行。
  - 总工时/总加班按钮点击切换（含休息日和节假日加班）。
  - 放假提醒/本月上班天数按钮点击切换。
  - 月历支持压缩到本周（收起/展开全部），折叠状态下跨月时自动回退到第一周。
  - 新增 `.mobile-cal-topbar`、`.mobile-month-nav`、`.metric-clickable`、`.mcal-expand-btn`、`.mcal-collapse-btn` 等移动端组件。
  - 手机版日历格子整体缩小（`min-height` 48→40px、字号 14→12px/9→8px 等），metric 卡片收紧，`main` 外边距缩减，整月可一屏看完。
  - 暗色模式全面修复：新增 `--accent-ring`、`--warn-ring`、`--holiday-ring`、`--muted-ring`、`--notice-bg`/`--notice-color` 等主题变量，替换全部硬编码 rgba 边框，`.notice` 白底白字问题修正，`--text` 补定义，`.sidebar-release-link`→`.sidebar-account-card` 重命名。
  - 补全 `.chart-legend`、`.report-empty-state`、`.settings-desktop-save`、`.cloud-session-row`、`.cloud-task-grid`、`.mobile-login-state` 等 7 个缺失样式。
  - 桌面端工资规则卡仅出现在设置页，休息提醒仅出现在月历页，总工资仅出现在月历和报表页。
  - 多处文案精简（引导页、helper、按钮描述等），去掉 AI 风格措辞。
  - 版本更新到 v0.3.2，Service Worker 缓存名 `worktimeapp-v25`。
- 验证结果：`node --check` 全部通过；`npm test` 45 项通过；`npm run build` 成功；三 agent 并行审查修复了 `.mobile-cal-topbar` 对齐、按钮 `min-height` 覆盖、month-nav 样式继承、dead code 等 7 个问题。
- 风险/注意：`ui.calendarExpanded` 未持久化，刷新后重置为展开；`renderCalendarRestReminder` 桌面端调用 `calculateMonthlyPayroll` 与 `renderTopbar` 重复但开销极小。
- 后续建议：可考虑将 mcal-* 样式移入 720px 媒体查询块以保持一致性。

## 2026-05-13 23:00 CST - v0.3.2 界面减负与用语优化

- 触发原因：用户要求工资规则卡只在设置页出现，休息提醒只在月历页出现，总工资只在月历和报表页出现，并检查其他冗余、AI 风格用语。
- 修改文件：`src/app.js`、`styles.css`、`index.html`、`admin.html`、`package.json`、`sw.js`、`PROJECT.md`、`MEMORY_UPDATES.md`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`。
- 行为变化：
  - `render()` 中 `renderReadiness()` 仅当 `ui.view === "settings"` 时渲染；新增 `renderCalendarRestReminder()` 仅当月历视图渲染。
  - `renderTopbar()` 中 metric strip（税前/税后/工时/距目标）仅当月历或报表视图渲染。
  - `renderReadiness()` 移除休息倒计时行和 restReminder 依赖，只保留工资规则和完整性检查；设置页上的"规则"按钮不再出现。
  - 新增 `.rest-reminder-bar` CSS 样式（桌面和移动端），用于月历页的休息提醒状态条。
  - 多处文案精简：引导页标题、helper 提示、字段标签、登记按钮描述、批量说明、节假日说明等，去掉"一键""花 1 分钟""自动套用""勾选后不需要每天手动登记"等冗余/AI 风格措辞。
  - 版本更新到 v0.3.2，Service Worker 缓存名更新到 `worktimeapp-v25`。
- 验证结果：`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`tests/functions.test.js`、`sw.js` 均通过；`npm test` 45 项通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过。
- 风险/注意：工资规则卡移出非设置页后，用户若在月历/记录/报表页遇到配置缺失，不会看到明确提示；缺失配置的警告只在设置页可见。
- 后续建议：如果用户在非设置页频繁遇到配置问题，可考虑在月历页顶部加一条可关闭的简短提示条。

## 2026-05-13 16:56 CST - v0.3.1 版本线整理与侧边栏版本胶囊

- 触发原因：用户要求当前版本写为 `v0.3.1`，后续补丁号到 9 后进入下一小版本，并把之前的 `v0.2.10` 改写为 `v0.3.0`；同时要求桌面侧边栏版本号放在“明薪工时”右边，只显示版本号并保留胶囊链接效果。
- 修改文件：`src/app.js`、`index.html`、`admin.html`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 应用版本、入口资源参数、模块导入参数和 Service Worker 注册参数统一为 `0.3.1` / `v0.3.1`。
  - Service Worker 缓存名更新到 `worktimeapp-v24`，降低发布后继续读取旧资源的概率。
  - 历史版本 `v0.2.10` 改写为 `v0.3.0`；发布文档补充“补丁号到 9 后进入下一小版本”的版本规则。
  - 桌面侧边栏品牌名右侧保留只写版本号的胶囊链接，点击进入 `changelog.html`。
- 验证结果：`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`tests/functions.test.js`、`sw.js` 均通过；`npm test` 45 项通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地 `4173` 被占用后改用 `4174` 启动静态服务，`curl -I http://127.0.0.1:4174/index.html` 返回 200。
- 风险/注意：版本重命名会影响 Git 标签和 GitHub Release 命名；如果线上已经存在 `v0.2.10` / `v0.2.11` 标签，需要发布侧同步改为 `v0.3.0` / `v0.3.1` 或保留旧标签作为历史别名。
- 后续建议：发布前确认线上入口 HTML、`src/app.js` 和 `sw.js` 都带 `v=0.3.1`，并在 GitHub Release 使用 `v0.3.1`。

## 2026-05-13 17:15 CST - v0.3.1 报表说明与规则卡收口

- 触发原因：用户指出上一轮 6 个修改点没有完全写完，特别是工资规则卡右侧“当前规则”多余、年度总结进度条颜色未说明、当前年份未来月份不应显示 0 元工资信息。
- 修改文件：`src/app.js`、`styles.css`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 顶部工资规则卡在规则齐全时右侧只显示“规则”按钮，不再显示“当前规则”文字。
  - 报表年度总结新增图例：绿色代表税后收入，黄色代表总工时。
  - 当前年份中尚未到来的月份从年度总结条形列表中隐藏；如果用户切到未来月份，薪资拆分区显示空状态，不再展示 0 元工资拆分。
  - 文档同步记录桌面版本胶囊、移动端底部登录态/版权、报表颜色说明和未来月份隐藏规则。
- 验证结果：`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`tests/functions.test.js`、`sw.js` 均通过；`npm test` 45 项通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地预览 `http://127.0.0.1:4174/src/app.js?v=0.3.1` 确认包含版本胶囊、报表颜色说明和未来月份过滤逻辑，且不再包含“当前规则”。
- 风险/注意：隐藏未来月份只影响报表展示，不删除用户手动录入的未来记录；如果用户需要规划未来工资，可后续单独增加“计划模式”。
- 后续建议：用桌面和手机视口分别检查报表年度总结图例、未来月份空状态、规则卡右侧按钮和底部登录态展示。

## 2026-05-13 17:29 CST - v0.3.1 云备份登录入口修复

- 触发原因：用户反馈云备份部分点击“去登录”无效，要求修复并继续检查是否还有其他问题。
- 修改文件：`src/app.js`、`styles.css`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 桌面侧边栏底部云备份状态卡从不可点击的 `div` 改为按钮，点击会打开设置页并展开“数据管理”云备份区。
  - 手机底部云备份登录状态从不可点击的 `span` 改为按钮，点击会进入设置二级页的“数据管理”。
  - 新增 `openCloudSettings()` 统一处理入口跳转，关闭登记抽屉、保留当前登录态、保存 activeView，并在渲染后滚动到云备份卡片。
  - 桌面设置页会根据 `ui.settingsSheetOpen === "data"` 自动展开数据管理分组。
- 验证结果：`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`tests/functions.test.js`、`sw.js` 均通过；`npm test` 45 项通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；本地预览 `http://127.0.0.1:4174/src/app.js?v=0.3.1` 确认包含 `open-cloud-settings` 事件、桌面/手机按钮和数据管理自动展开逻辑。
- 风险/注意：这个修复只改变入口跳转，不改变云备份登录、加密、上传或恢复逻辑。
- 后续建议：浏览器里分别点击桌面侧边栏底部状态卡和手机底部登录态，确认都能进入云备份登录区。

## 2026-05-13 22:10 CST - v0.3.1 云同步与移动端设置修复

- 触发原因：用户反馈设置二级页切换主页面后不会回到设置主菜单、所有下拉框点击后闪现消失、云备份遇到云端已有数据会失败、登录状态不应每次丢失，并要求继续检查各端体验。
- 修改文件：`src/app.js`、`src/storage.js`、`styles.css`、`functions/index.js`、`tests/functions.test.js`、`index.html`、`admin.html`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 主导航切换会重置 `ui.settingsSheetOpen`，从设置二级页去月历/记录/报表后，再回设置会展示设置主菜单。
  - 移动端设置详情容器改为不裁剪原生下拉层，`select` 显式使用系统原生选择框，降低 WebView 中下拉闪现关闭的问题。
  - 云备份界面拆成登录区和备份区；未登录只显示账号、密码、登录、创建账号并上传，登录后显示上传本机到云端、从云端恢复到本机、退出登录。
  - 用户登录后保存 7 天服务端签名 session token；上传和恢复可使用 token，不再每次要求输入密码；退出登录会清除 token，但不会保存密码。
  - 云端已有更新时，上传本机会提示是否覆盖，用户确认后才带 `force` 覆盖云端旧备份。
  - ESA 函数新增用户会话签发与校验，token 中的用户 ID 必须和请求用户一致，避免跨账号读取或写入。
  - 桌面设置页增加固定保存区，减少改完设置后找不到保存按钮的问题。
  - 版本更新到 v0.3.1，Service Worker 缓存名更新到 `worktimeapp-v23`。
- 验证结果：`npm test` 45 项通过（新增用户云会话与冲突覆盖测试 2 项）；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`tests/functions.test.js`、`sw.js` 均通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；浏览器回归确认本地页面显示 `v0.3.1`、云备份未登录界面只显示登录/创建、下拉框可正常选择且无控制台错误。
- 风险/注意：用户 session token 依赖 `RSA_key` 派生 HMAC 签名密钥，线上更换 `RSA_key` 会让旧登录状态失效，需要重新登录；这是预期安全行为。
- 后续建议：发布后用真机检查设置页下拉框、云备份登录后恢复/上传、覆盖确认和 7 天登录状态；如果 ESA 有旧缓存，先确认入口 HTML 和 `sw.js` 都更新到 `v=0.3.1`。

## 2026-05-13 21:20 CST - v0.3.0 手机端交互与登录修复

- 触发原因：用户要求读取当前迭代记录、更新记忆，并集中修复手机版点击闪现、操作不舒服和无法登录等问题，同时召唤不同 agent 做测试流程。
- 修改文件：`src/app.js`、`styles.css`、`functions/index.js`、`tests/functions.test.js`、`index.html`、`admin.html`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 移动端整页入场动画只在主页面切换时触发；点击日历日期、打开/关闭登记抽屉、切换设置二级页不再反复整页闪现。
  - 登记抽屉改为两阶段打开/关闭，并在打开时锁住页面背景滚动。
  - 手机设置页保留底部四个主入口，二级设置使用页内返回；云备份按钮会读取当前二级页表单，手机端登录/备份/恢复不再读不到密码。
  - 设置保存重构为 `settingsFromForm()`，取消勾选 `autoFillWorkday`、自动补扣或工作日时能正确保存；移动端切换薪资方式会保留当前草稿并刷新字段。
  - 批量处理新增草稿保留，切换批量添加/批量删除不再重置日期范围、加班小时、删除范围和确认状态；`bulk-form` 支持 Enter 提交。
  - 管理员后端兼容 KV 中 `admin_name` 前后空格、`admin_passwd` 标准 PBKDF2、`salt/hash` 简写、明文字符串和常见 `{ value/password/plain }` 包装；`RSA_key` 和密码配置兼容误复制的三反引号代码围栏。
  - 坏密文会返回友好的登录信息错误，不再暴露 `Failed to decode base64` 等底层异常。
  - 版本更新到 v0.3.0，Service Worker 缓存名更新到 `worktimeapp-v22`。
- 验证结果：`npm test` 43 项通过（新增 ESA 单入口管理员登录测试 2 项）；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`tests/functions.test.js`、`sw.js` 均通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过；浏览器手机宽度冒烟通过日期抽屉打开/关闭、隐藏抽屉 `aria-hidden`、手机设置数据管理页云同步表单读取、批量处理切换保留日期范围和版本显示 `v0.3.0`。
- 风险/注意：移动端设置详情页现在由状态驱动渲染，若后续继续增加设置分组，需要确保分组表单包含的 checkbox 字段能被 `settingsFromForm()` 识别。
- 后续建议：发布后用真机在 `time.yuan6.cn` 检查手机日历日期点击、云同步登录、批量处理切换和管理员后台登录；如果仍登录失败，优先核对 KV 中 `admin_name` 与 `admin_passwd` 的实际值。

## 2026-05-13 19:00 CST - v0.2.9 bug 修复：班次切换和设置保存

- 触发原因：用户反馈班次管理无法切换上班方式、设置详情页操作异常。
- 修改文件：`src/app.js`、`index.html`、`package.json`、`sw.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`README.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - workType change handler 的 `settingsForm` 选择器改为同时匹配 `#settings-form` 和 `.settings-detail-form`。
  - workType 切换改用 `updatePresetEditor()` 局部更新，不再调用 `render()`。
  - `saveSettings` 只在表单实际包含对应字段时才重置 workweek/presets/autoFill/autoAdjustment。
  - `saveSettings` 保存后重置 `ui.settingsSheetOpen` 回到列表视图。
  - 薪资模式切换仅桌面端调用 `render()`。
- 验证结果：`npm test` 41 项通过；所有语法检查通过；`npm run build` 成功。
- 风险/注意：无。
- 后续建议：后续 bug 修复版本使用最小版本号（如 v0.3.0、v0.3.1）。

## 2026-05-13 18:00 CST - v0.2.8 发布：批量添加修复、自动工时、手机二级页面

- 触发原因：用户反馈批量添加仍然报错"Form submission canceled"、班次管理加班班次丢失、设置页不是二级页面、版本日志需要完善后发布到 GitHub。
- 修改文件：`src/app.js`、`src/calculations.js`、`styles.css`、`tests/calculations.test.js`、`index.html`、`package.json`、`sw.js`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`README.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 批量添加彻底放弃 form submit 方案，改用 `data-action="bulk-add"` click 事件处理器直接读取表单数据，彻底避免表单断开问题。
  - 班次管理修复：所有班次模板（含休息日加班）保留在表单中，仅视觉隐藏；恢复"默认班次"选择器；新增 `detectWorkType()` 函数自动识别当前上班方式。
  - 移动端设置页改为真正的二级页面：点击分组进入独立详情页，顶部有返回箭头按钮。
  - 版本更新到 v0.2.8，Service Worker 缓存名更新到 `worktimeapp-v20`。
  - CHANGELOG.md、RELEASE_NOTES.md、README.md 补充完整 v0.2.8 发布说明。
- 验证结果：`npm test` 41 项全部通过；所有 JS 文件语法检查通过；`npm run build` 成功；`git diff --check` 通过。
- 风险/注意：批量添加从 form submit 改为 click 事件，如果后续有其他表单交互问题需要检查事件处理器。
- 后续建议：发布后用真机检查批量添加、班次管理、设置二级页面的完整流程。

## 2026-05-13 15:30 CST - v0.2.8 五项修复：侧边栏溢出、批量补登、登录错误、默认工时、手机列表

- 触发原因：用户反馈侧边栏版本文字错乱、批量补全工时无反应、登录缺少具体错误提示、工资计算需要手动添加每天8小时、手机日历需要横向滚动不方便。
- 修改文件：`src/app.js`、`src/calculations.js`、`styles.css`、`tests/calculations.test.js`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 侧边栏底部版本信息区域增加 `overflow: hidden`、`flex-shrink: 0`、`text-overflow: ellipsis`，防止文字溢出重叠。
  - 批量补全工时增加验证失败计数反馈，`bulkConfigFromForm` 增加 `addKind` 合法性校验和日期默认值兜底，避免静默跳过。
  - 云备份登录/注册/备份/恢复的错误处理改为解析服务端具体错误码和消息，区分账号不存在、密码错误、账号已停用、数据冲突、服务不可用等场景。
  - 新增 `autoFillWorkday` 设置（默认开启）：无记录的工作日自动算作 8 小时正班，`calculateMonthlyPayroll` 在计算时自动合并虚拟条目；设置页新增开关；日历格子对自动补登的天数显示"默认"标记和虚线边框；小时计算模式下自动跳过。
  - 手机端（≤720px）日历从 7 列网格改为按天列表视图，每行显示日期/星期/日期类型/工时/工资，点击选中日期并打开底部登记抽屉。
  - 现有测试用例补加 `autoFillWorkday: false` 以保持原有断言不变；新增 5 个测试覆盖 `getAutoFilledEntries` 和 `autoFillWorkday` 开关。
- 验证结果：`npm test` 41 项全部通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/build.mjs` 均通过；`npm run build` 成功输出 `dist/`；`git diff --check` 通过。
- 风险/注意：`autoFillWorkday` 默认开启会改变现有用户的月度工资显示（无记录工作日自动计入 8 小时），首次加载时用户可能看到工资变化；可在设置中关闭。手机端列表视图不再显示周合计行，后续可考虑在列表底部添加月合计。
- 后续建议：发布后用真机检查列表视图的点击和抽屉交互、自动补登标记的显示效果；确认 `autoFillWorkday` 开关对各薪资模式的计算影响。

## 2026-05-13 09:10 CST - v0.2.7 旧缓存导致版本不生效修复

- 触发原因：用户反馈 GitHub Release 已发布但线上仍显示 `v0.2.5`，要求检查是不是哪里没生效。
- 修改文件：`index.html`、`admin.html`、`src/app.js`、`sw.js`、`changelog.html`、`package.json`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - `index.html` 的 `manifest.webmanifest`、`styles.css`、`src/app.js` 加入 `v=0.2.7` 参数，强制浏览器请求新版入口资源。
  - `src/app.js` 的 `calculations.js`、`storage.js`、`export.js` 模块导入加入 `v=0.2.7`，避免主模块更新而依赖模块继续走旧缓存。
  - Service Worker 注册改为 `./sw.js?v=0.2.7` 并设置 `updateViaCache: "none"`；`sw.js` 缓存名更新到 `worktimeapp-v19`。
  - Service Worker 对 `/api/` 请求直接放行，不再进入离线缓存逻辑。
  - `changelog.html` 补齐 v0.2.5、v0.2.6、v0.2.7 时间轴内容。
- 验证结果：`npm test` 36 项通过；`npm run build` 成功输出 `dist/`；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`admin.html` 内联脚本解析通过；`git diff --check` 通过；本地与 `dist/` 均确认入口引用 `src/app.js?v=0.2.7`、样式引用 `styles.css?v=0.2.7`、Service Worker 注册 `sw.js?v=0.2.7`，缓存名为 `worktimeapp-v19`。
- 风险/注意：如果用户设备已经由旧 Service Worker 控制，首次打开可能仍需刷新一次；但新版入口资源带版本参数后，后续更新会更稳定。
- 后续建议：发布后用 `curl https://time.yuan6.cn/` 检查入口是否含 `src/app.js?v=0.2.7`，用 `curl https://time.yuan6.cn/src/app.js?v=0.2.7` 检查 `APP_VERSION = "v0.2.7"`。

## 2026-05-13 08:55 CST - v0.2.6 批量登记与移动端抽屉修复

- 触发原因：用户反馈批量处理无法批量添加工时，期望每月自动登记基础工作日 8 小时、只有加班才额外登记；同时指出侧边栏底部溢出、移动端无页脚、管理员登录页页脚奇怪、移动日历压缩严重、手机版日期登记不够像 App，并要求检查已部署的 `time.yuan6.cn`。
- 修改文件：`src/app.js`、`src/calculations.js`、`styles.css`、`admin.html`、`tests/calculations.test.js`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 批量添加拆为“补齐基础工时 8h”“批量登记加班”“按班次模板添加”；正班+加班、底薪+加班默认补齐基础工作日，综合工时制和小时计算默认登记每天加班。
  - 已有同日加班记录时，补齐基础工时不再被跳过；勾选覆盖时只替换基础工时或同来源批量加班，不误删另一类记录。
  - 批量删除的“仅批量生成”可识别 `bulk-base`、`bulk-overtime`，仅加班删除不再误删带加班的主班次。
  - 移动端点击日历日期会打开底部登记抽屉，保存后自动收起；日历改为横向保留完整 7 列宽度，节假日、休息、调休和工资信息更可读。
  - 侧边栏底部更新日志和友情链接改为不溢出的网格布局，并允许侧边栏纵向滚动；移动端底部导航新增紧凑页脚。
  - 管理员登录页移除 GitHub、博客和版权页脚，只保留返回应用入口。
  - `APP_VERSION` 更新为 `v0.2.6`，`sw.js` 缓存名更新到 `worktimeapp-v18`。
- 验证结果：`npm test` 36 项通过；`npm run build` 成功输出 `dist/`；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`admin.html` 内联脚本解析通过；`git diff --check` 通过；线上 `https://time.yuan6.cn/api/cloud/key` GET 可返回 RSA 公钥，`/` 与 `/admin` 可访问，但静态资源仍是发布前的 `v0.2.5`。
- 风险/注意：移动端登记抽屉复用现有日记录表单，后续可继续做更完整的二级页面/手势体验；线上 ESA 当前 `/` 可访问但疑似仍是旧构建壳，发布后需要确认 Pages 缓存刷新。
- 后续建议：发布后用真机检查日期抽屉、底部导航、日历横向滚动和批量补齐基础工时；若 ESA 继续返回旧文件，检查 Pages 输出目录是否为 `dist`、缓存刷新以及是否绑定到最新 GitHub 提交。

## 2026-05-13 00:55 CST - v0.2.5 GitHub 发布整理

- 触发原因：用户要求把当前改动推送到 GitHub，写好版本描述文件、README、提交日志，并发布新的版本。
- 修改文件：`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - `RELEASE_NOTES.md` 从小补丁说明改为完整 v0.2.5 发布说明，覆盖日常登记、批量操作、排班休息、工资个税、云同步、独立后台、安全加密、侧边栏底部和部署路径。
  - `PROJECT.md` 将当前发布状态从“待提交/待发布”改为 `v0.2.5` 发布口径，并补充该版本的整体发布范围。
  - 本条记录用于说明本轮 GitHub push、tag 和 release 前的文档整理。
- 验证结果：`npm test` 34 项通过；`npm run build` 成功输出 `dist/`；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`admin.html` 内联脚本解析通过；`git diff --check` 通过。
- 风险/注意：GitHub Release 应使用 `v0.2.5` 标签，并以 `RELEASE_NOTES.md` 作为发布描述来源。
- 后续建议：发布完成后用远端仓库页面核对 README、Release Notes 和 tag 是否正常展示。

## 2026-05-13 00:25 CST - v0.2.5 侧边栏底部、RSA_key 与构建输出

- 触发原因：用户澄清版权、日志、GitHub、博客友情链接都要放在侧边栏底部并可分两行展示，其他底部提示不需要；要求把私钥 KV 名改为 `RSA_key`，提供生成自己管理员密码的方法，并说明 ESA Pages/函数部署方式、构建命令、输出目录和函数入口。
- 修改文件：`src/app.js`、`styles.css`、`functions/index.js`、`scripts/build.mjs`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 版权、动态日志、GitHub、yuan6.cn 博客友情链接统一移动到侧边栏底部，两行展示；移除主内容区页脚和原侧边栏提示。
  - RSA 私钥 KV 键名从旧名改为 `RSA_key`；`README.md`、`PROJECT.md`、`CHANGELOG.md` 同步改名。
  - 新增 `scripts/build.mjs` 和 `npm run build`，构建输出目录为 `dist/`。
  - `README.md` 补充 ESA Pages 设置：构建命令 `npm run build`，输出目录 `dist`，函数入口文件 `functions/index.js`，入口对象为默认导出的 `fetch(request, env)`。
  - `README.md` 保留 `RSA_key` 生成命令，并提供交互式 `admin_passwd` PBKDF2 哈希生成命令，用户可输入自己的管理员密码生成 KV 值。
  - `sw.js` 缓存名更新到 `worktimeapp-v17`。
- 验证结果：`npm test` 34 项通过；`npm run build` 成功输出 `dist/`；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js`、`scripts/build.mjs` 均通过；`admin.html` 内联脚本解析通过；Node REPL 内存 KV 冒烟测试通过 `RSA_key` 公钥获取、用户加密注册/恢复、管理员加密登录和看板读取；`git diff --check` 通过。
- 风险/注意：部署到 ESA 后，静态 Pages 与函数路由需要在同一域名或同一站点路由下，否则前端访问 `/api/cloud/key`、`/api/cloud`、`/api/admin/login` 会跨域或 404。
- 后续建议：部署前先在 KV 写入 `RSA_key`、`admin_name`、`admin_passwd`；部署后用 HTTPS 域名验证云备份注册/登录和 `admin.html` 管理员登录。

## 2026-05-12 23:58 CST - v0.2.4 底部日志与版权外链

- 触发原因：用户要求把日志缩小到底部，底部标记 yuan 版权所有，增加 GitHub 和博客友情链接图标，并参考个人作品集底部访问统计风格做动态日志入口；同时要求说明密码加密方式。
- 修改文件：`src/app.js`、`styles.css`、`admin.html`、`assets/social-icons.svg`、`sw.js`、`package.json`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`changelog.html`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 主应用移除“日志”主导航和移动底部导航项，保留月历、记录、报表、设置四个高频入口。
  - 页面底部新增动态日志链接，显示当前版本 `v0.2.4` 和更新次数，交互参考 portfolio 底部访问统计入口。
  - 底部新增 `© yuan 版权所有`、GitHub 仓库图标和 yuan6.cn 博客友情链接图标。
  - 新增 `assets/social-icons.svg`，从 myblog 的 `icons.svg` 提取 GitHub 和文档/博客图标并改为 `currentColor`，以适配明暗主题。
  - `admin.html` 登录页和后台侧栏补齐版权与外链图标。
  - `README.md` 新增 `RSA_key` 和 `admin_passwd` 本地生成命令，说明密码传输加密与服务端哈希保存方式。
  - `sw.js` 缓存名更新到 `worktimeapp-v16`，并缓存 `assets/social-icons.svg`。
- 验证结果：`npm test` 34 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`admin.html` 内联脚本解析通过；`git diff --check` 通过；`curl -I http://127.0.0.1:4174/index.html`、`/admin.html`、`/changelog.html`、`/assets/social-icons.svg` 均返回 200。
- 风险/注意：底部图标使用外部 SVG symbol 文件，PWA 离线缓存必须包含 `assets/social-icons.svg`，否则离线时图标会缺失。
- 后续建议：实际浏览器检查底部动态日志入口、图标颜色、移动端底部导航和深色模式。

## 2026-05-12 23:38 CST - v0.2.3 独立后台与安全云备份

- 触发原因：用户要求把管理员部分全部移到独立后台页面，必须管理员登录才能使用；普通用户界面不展示接口信息；用户密码使用非对称加密，私钥放在 KV `RSA_key`；同时更新界面文案并把更新日志作为侧边栏选项显示在右侧。
- 修改文件：`src/app.js`、`src/storage.js`、`styles.css`、`functions/index.js`、`admin.html`、`changelog.html`、`sw.js`、`package.json`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 主应用移除后台入口、管理员令牌表单和云同步接口输入，用户侧只显示云备份账号、密码、备份和恢复。
  - 新增独立 `admin.html`，管理员账号密码登录后查看用户看板，支持刷新、退出、改密、停用/启用和备注。
  - `functions/index.js` 改为使用 KV `admin_name`、`admin_passwd`、`RSA_key`；管理员登录发放服务端签名短期会话。
  - 用户云备份登录、注册、备份、恢复，以及管理员改密/登录，都会先获取公钥并使用 RSA-OAEP 加密密码；服务端解密后只保存或校验 PBKDF2-SHA256 加盐哈希。
  - 主应用新增“日志”导航，右侧展示时间轴更新日志；`changelog.html` 保留独立访问并新增 v0.2.3。
  - `sw.js` 缓存名更新到 `worktimeapp-v15`，并加入 `admin.html`。
- 验证结果：`npm test` 34 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`admin.html` 内联脚本解析通过；Node REPL 内存 KV 冒烟测试通过公钥获取、用户加密注册/恢复、管理员加密登录和看板读取；`git diff --check` 通过；`curl -I http://127.0.0.1:4174/index.html`、`/admin.html`、`/changelog.html` 均返回 200。
- 风险/注意：ESA 真实环境还需要写入 `RSA_key` RSA-OAEP-256 私钥 JWK、`admin_name` 和 `admin_passwd` 后联调；如果 `admin_passwd` 使用明文字符串可工作，但上线更建议改为 PBKDF2 记录。
- 后续建议：部署到 ESA 后用 HTTPS 域名实际验证 `/api/cloud/key`、用户注册/登录/备份/恢复、`admin.html` 登录和管理员改密；再用移动端检查主应用“日志”和深色模式。

## 2026-05-12 21:18 CST - v0.2.2 输入、主题与时间轴更新日志

- 触发原因：用户反馈金额输入不应被固定步长限制、引导页看不到默认班次每日工时、深色模式白底输入框和低对比文字难用，并希望整体风格参考 `me.yuan6.cn`/portfolio 经历部分，新增可访问的时间轴更新日志页和明暗切换能力。
- 修改文件：`src/app.js`、`src/calculations.js`、`styles.css`、`changelog.html`、`sw.js`、`package.json`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 金额类输入新增 `moneyField` / `moneyFieldWithClass`，工资、时薪、补扣、个税金额等字段使用 `step=any` 且不再加 `min=0`，允许用户按实际情况填写任意数字。
  - 首次使用向导新增 `setup-time-preview`，根据上班、下班、午休实时显示每天总工时、正班和加班。
  - 设置新增 `themeMode`，支持 `system`、`light`、`dark`；主界面顶部可一键循环切换，设置页可保存偏好。
  - 深色模式改为主题变量体系，统一表单、日历、记录、设置、后台看板、底部导航、提示和预览模块的背景与文字对比。
  - 新增 `changelog.html`，采用左侧说明 + 右侧线性版本时间轴，风格参考 portfolio 的经历区，支持单独访问和自身明暗切换。
  - `sw.js` 缓存名更新到 `worktimeapp-v14`，并将 `changelog.html` 加入离线缓存。
- 验证结果：`npm test` 34 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`src/export.js`、`functions/index.js`、`sw.js` 均通过；`git diff --check` 通过；`curl -I http://127.0.0.1:4174/index.html` 和 `/changelog.html` 均返回 200。
- 风险/注意：金额输入允许任意数字后，计算层仍会按工资估算口径处理负值/异常值；如果用户需要负工资或负补扣参与计算，后续需单独定义业务含义。
- 后续建议：用浏览器实际检查浅色、深色、跟随系统三种主题下的日历、记录、设置、后台和 `changelog.html`。

## 2026-05-12 20:43 CST - v0.2.1 自定义排班、云同步与后台

- 触发原因：用户要求接手 `/Users/yuanhuang/code/worktimeapp`，继续迭代休假方式、自定义周起始日，并为阿里云 ESA Pages/函数 + `worktimeapp` KV 增加云备份和管理员后台。
- 修改文件：`src/calculations.js`、`src/app.js`、`src/storage.js`、`styles.css`、`functions/index.js`、`tests/calculations.test.js`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 用户可选择每周从周几开始；月历表头、日历补位、周合计和周工时趋势同步使用该设置。
  - 休假方式新增每周双休、每周单休、自定义周休、上六休一、上十四休一和自定义连续周期。
  - 放假提醒支持从手填的上一次休息日或历史 `rest-day` 记录推算下一次休假。
  - 设置页数据管理新增云同步表单，支持注册、登录、上传本机、拉取覆盖本机。
  - 新增 ESA 单函数入口 `functions/index.js`，同一入口分发 `/api/cloud` 与 `/api/admin`，使用 `worktimeapp` KV。
  - 云端用户记录保存 PBKDF2-SHA256 加盐密码哈希、设置、工时、补扣和备份快照，不保存明文密码。
  - 新增后台页，可查看用户总数、启用用户、同步/登录次数、IP 网段分布、使用事件和近 30 日使用趋势；支持改密、停用/启用、备注。
- 验证结果：`npm test` 34 项通过；`node --check src/app.js`、`src/calculations.js`、`src/storage.js`、`functions/index.js`、`sw.js` 均通过。
- 风险/注意：后台真实可用性还需要在阿里云 ESA 绑定 `worktimeapp` KV 并写入 `admin_token` 后联调；2027 年节假日当前是预估表，国务院正式通知发布后需更新。
- 后续建议：优先做 ESA 真实环境 curl 验证、后台权限细化、云同步冲突合并和端到端加密备份。

## 2026-05-12 19:00 CST - v0.2.0 数据可视化与深色模式

- 触发原因：用户要求继续优化 PROJECT.md 后续方向——数据可视化图表和移动端体验。
- 修改文件：`src/app.js`、`styles.css`、`CHANGELOG.md`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 报表页新增薪资构成饼图（conic-gradient），可视化正班/加班/底薪/补贴/扣款/个税比例。
  - 报表页新增周工时趋势柱状图，按周汇总当月工时对比。
  - 记录页新增搜索栏（按备注/日期/分类关键词）和日期范围筛选（起止日期）。
  - 日历视图每行底部新增周工时小计（小时数 + 工资）。
  - 新增深色模式，自动跟随系统 `prefers-color-scheme` 偏好。
  - 移动端适配：饼图、趋势图、搜索栏在小屏幕下自动调整布局。
- 验证结果：`npm test` 31 项通过；`node --check src/app.js` 通过；`git diff --check` 通过。
- 风险/注意：饼图和趋势图仅在有数据时显示；深色模式完全基于 CSS 媒体查询，无需手动切换。
- 后续建议：可继续优化 2027 年节假日支持、更多端到端交互验证、数据导出 PDF 格式。

## 2026-05-12 18:42 CST - 新增移动端未补登列表

- 触发原因：用户要求继续优化 PROJECT.md 中列出的后续方向之一——移动端未补登列表。
- 修改文件：`src/calculations.js`、`src/app.js`、`styles.css`、`tests/calculations.test.js`、`PROJECT.md`、`MEMORY_UPDATES.md`。
- 行为变化：
  - 新增 `getUnloggedDays()` 函数，扫描当月未登记的工作日（截至今天，不含未来日期）。
  - 日历视图顶部新增未补登面板，显示缺失记录的工作日数量和日期列表。
  - 点击未补登日期可直接跳转到该日进行登记。
  - 面板采用水平滚动列表，移动端友好。
  - 新增 1 个测试用例（getUnloggedDays），测试总数从 30 增加到 31。
- 验证结果：`npm test` 31 项通过；`node --check src/app.js` 通过；`git diff --check` 通过。
- 风险/注意：面板仅在有未补登工作日时显示；休息日和节假日自动排除。
- 后续建议：可继续优化更多实际工资场景测试、增加数据可视化图表。

## 2026-05-12 16:30 CST - v0.1.7 设置页分组折叠与首次使用向导

- 触发原因：用户要求接手项目并迭代优化，优先实现 PROJECT.md 中列出的后续优化方向。
- 修改文件：`src/app.js`、`styles.css`、`tests/calculations.test.js`、`CHANGELOG.md`、`PROJECT.md`。
- 行为变化：
  - 新增首次使用向导，新用户打开应用时引导配置薪资方式、底薪和班次。
  - 设置页改为 `<details>` 分组折叠，每个分组显示当前配置摘要。
  - 新增 6 个测试用例（请假计薪、混合月度工资、加班边界、百分比扣除、综合工时、小时工），测试总数从 24 增加到 30。
- 验证结果：`npm test` 30 项通过；`node --check src/app.js` 通过；`git diff --check` 通过。
- 风险/注意：向导通过 `_wizardDone` 标记控制，老用户升级不会看到向导。
- 后续建议：可继续优化移动端体验、增加数据可视化图表、支持更多年份节假日。

## 2026-05-12 12:18 CST - 建立项目交接与记忆登记机制

- 触发原因：用户要求生成项目说明文件和记忆修改文件，方便转交给其他 AI，并要求以后每次修改都登记这两个文件。
- 修改文件：新增 `PROJECT.md`、新增 `MEMORY_UPDATES.md`。
- 行为变化：仓库现在有固定交接文件，明确后续 AI 每次修改都要同步更新项目说明和记忆登记。
- 验证结果：文档变更，无业务逻辑改动；`git diff --check` 通过。
- 风险/注意：如果后续修改代码但漏更新这两个文件，会破坏用户明确要求的交接流程。
- 后续建议：下一次功能或发布修改时，在本文件新增一条登记，并在 `PROJECT.md` 更新版本、状态或规范变化。

## 2026-05-12 12:05 CST - v0.1.6 日常登记交互优化

- 触发原因：用户多次反馈填写复杂、不好用，需要更人性化，且要继续完善 PWA 工时记录应用。
- 修改文件：`src/app.js`、`styles.css`、`package.json`、`sw.js`、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`。
- 行为变化：新增下班快捷调整、请假快捷时长、本条工资与本月税后预览；批量添加和批量删除拆成两个模式；同日主记录保存会替换，避免重复叠加工时；请假和休息按真实状态显示。
- 验证结果：`npm test` 24 项通过；`node --check src/app.js`、`src/calculations.js`、`src/export.js`、`sw.js` 通过；`git diff --check` 通过；本地 `http://127.0.0.1:4173/index.html` 返回 200。
- 风险/注意：这轮主要是交互和渲染层，尚未做真实浏览器点击自动化；Playwright 依赖此前不可用。
- 后续建议：优先补首次班次配置向导、移动端未补登列表、设置页折叠分组，并增加更多端到端交互验证。
