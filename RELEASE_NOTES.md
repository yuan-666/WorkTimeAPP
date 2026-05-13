# Release Notes - v0.2.7

发布日期：2026-05-13

## 概览

`v0.2.7` 专门修复“发布后仍显示旧版本”的问题。线上主脚本已经是新版，但旧 PWA/浏览器缓存仍可能继续加载 `v0.2.5` 的无版本号资源。本版本给入口脚本、样式、模块导入和 Service Worker 注册都加上版本参数，让浏览器必须请求新资源。

## 重点改进

- `index.html` 中的 `styles.css` 和 `src/app.js` 加入 `v=0.2.7`。
- `src/app.js` 的模块导入加入版本参数，避免主脚本新版但依赖模块仍走旧缓存。
- Service Worker 注册改为 `./sw.js?v=0.2.7`，并设置 `updateViaCache: "none"`。
- Service Worker 缓存名更新为 `worktimeapp-v19`，缓存版本化静态资源。
- Service Worker 跳过 `/api/` 请求，云同步和后台接口不再进入离线缓存逻辑。
- 独立时间轴 `changelog.html` 补齐 v0.2.5、v0.2.6 和 v0.2.7。

## 验证

- `npm test`
- `npm run build`
- `node --check src/app.js`
- `node --check src/calculations.js`
- `node --check src/storage.js`
- `node --check src/export.js`
- `node --check functions/index.js`
- `node --check sw.js`
- `admin.html` 内联脚本解析
- `git diff --check`
- 线上 `https://time.yuan6.cn/src/app.js`、`https://time.yuan6.cn/sw.js` 版本核对

## Git 标签

推荐标签：`v0.2.7`
