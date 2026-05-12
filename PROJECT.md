# 明薪工时项目说明

更新时间：2026-05-12 12:18 CST
当前版本：v0.1.6

## 项目定位

明薪工时是一个离线优先的跨平台 PWA，用来记录工时、加班、请假、补贴扣款、目标、薪资报表和个税估算。目标平台包括 Windows、macOS、iOS、Android、鸿蒙浏览器和 WebView 场景。

核心产品方向是：少填、少猜、少误操作。用户每天打开应用后，应能快速判断今天是上班、加班、休息还是请假，并在保存前看到本条工资和本月收入变化。

## 当前状态

- 技术栈：原生 HTML/CSS/JavaScript PWA，无前端框架，无运行时依赖。
- 数据存储：浏览器 `localStorage`，支持 JSON 备份导入导出。
- 远端仓库：`https://github.com/yuan-666/WorkTimeAPP.git`
- Git 用户邮箱：`2991077067@qq.com`
- 最新功能发布提交：`9ffbb58 feat: refine daily entry interactions`
- 最新发布：`https://github.com/yuan-666/WorkTimeAPP/releases/tag/v0.1.6`
- 本地预览：`npm run serve` 后打开 `http://127.0.0.1:4173/index.html`

## 主要文件

- `index.html`：PWA 入口。
- `styles.css`：响应式界面、表单、日历、记录、报表、设置页样式。
- `src/app.js`：页面渲染、交互事件、表单保存、批量操作、设置保存。
- `src/calculations.js`：工时、薪资、个税、节假日、休息周期等核心计算。
- `src/storage.js`：本地存储、备份、导入导出。
- `src/export.js`：CSV、Excel、分享摘要。
- `sw.js`：Service Worker 离线缓存。
- `tests/calculations.test.js`：核心计算测试。
- `README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`：用户说明、版本历史和发布说明。
- `PROJECT.md`：本文件，记录项目说明和交接规则。
- `MEMORY_UPDATES.md`：每次修改登记和给后续 AI 的记忆更新。

## 核心能力

- 月历视图按周一开周，展示工时、工资、节假日、休息日、调休上班。
- 每日登记支持正常上班、有加班、休息、请假。
- 工作日默认有班，自动套用白班/夜班等班次。
- 时间记录会自动拆分正班和加班；下班时间支持准点、加 1/2/3 小时快捷调整。
- 请假支持年假、事假、病假、调休、带薪、不计薪、扣工资、按倍数计薪、全天/半天/2 小时/自定义时长。
- 批量处理拆成批量添加和批量删除两个模式，删除前必须确认并显示影响。
- 薪资模式支持正班+加班、底薪+加班、综合工时制、小时计算。
- 默认加班倍率是工作日 1.5 倍、休息日 2 倍、法定节假日 3 倍，但允许按实际工资规则调整。
- 内置 2026 年国务院节假日和调休安排。
- 支持上六休一、上十四休一、自定义周期等非周末休息提醒。
- 个税按居民工资薪金累计预扣法估算，扣除项支持固定金额或工资比例。

## 开发规范

1. 每次修改代码、样式、文档、配置或发布信息，都必须同步更新 `PROJECT.md` 和 `MEMORY_UPDATES.md`。
2. `PROJECT.md` 记录当前项目事实、结构、规则和交接状态；不要写流水账。
3. `MEMORY_UPDATES.md` 记录本次修改的原因、文件、验证、风险和交给后续 AI 的注意事项。
4. 发布版本时同步更新 `package.json`、`sw.js` 缓存名、`README.md`、`CHANGELOG.md`、`RELEASE_NOTES.md`。
5. 计算逻辑改动必须补或更新 `tests/calculations.test.js`。
6. UI 改动要优先减少用户认知负担，避免把高级字段直接铺满首屏。
7. 不要恢复劳动法合规弹窗；保留数据合理性校验和可配置倍率。
8. 不要引入框架或依赖，除非用户明确同意并同步修改运行说明。
9. Git 操作应优先使用正常快进推送，不要强推，不要重置用户改动。

## 验证命令

常规验证：

```bash
npm test
node --check src/app.js
node --check src/calculations.js
node --check src/export.js
node --check sw.js
git diff --check
```

本地服务验证：

```bash
npm run serve
curl -I http://127.0.0.1:4173/index.html
```

## 最近交接重点

- `v0.1.6` 已发布并推送到 GitHub。
- 本地 `main` 应保持与 `origin/main` 对齐；交接前用 `git status --short --branch` 复核。
- 本地预览服务可能仍在 4173 端口运行。
- 后续优先优化方向：首次班次配置向导、移动端未补登列表、设置页分组折叠、更多实际工资场景测试。
