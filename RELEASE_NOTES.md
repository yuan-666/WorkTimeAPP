# Release Notes - v0.3.2

发布日期：2026-05-13

## 概览

`v0.3.2` 是一次手机端日历重构和暗色模式全面修复版本。手机月历页改为四宫格布局（税前/工时/目标/放假），支持点击切换数据维度；暗色模式下全部边框、提示框、聚焦环使用主题变量，解决了白底白字等问题。

## 手机日历重构

- 顶部四宫格：税前工资 / 总工时（点击切换总加班含休息日和节假日加班） / 收入目标 / 放假提醒（点击切换本月上班天数）。
- 月份切换（‹ 今天 ›）独立一行；右上角明暗切换按钮。
- 月历支持压缩到本周（收起/展开全部），折叠跨月时自动回退到第一周。
- 日历格子、metric 卡片、topbar 整体缩小，适配一屏展示。
- 新增压缩/展开按钮、月份导航栏、可点击 metric 等移动端组件。

## 暗色模式修复

- 新增 `--accent-ring`、`--warn-ring`、`--holiday-ring`、`--muted-ring`、`--notice-bg`/`--notice-color` 等主题变量，覆盖浅色/深色/系统三档。
- 替换全部硬编码 rgba 边框色为 CSS 变量，暗色模式下不再出现不可见的边框和聚焦环。
- `.notice` 提示框白底白字修复；`--text` 变量补定义。
- `.sidebar-release-link` 重命名为 `.sidebar-account-card`。

## 界面减负

- 工资规则卡只出现在设置页；休息提醒只出现在月历页；总工资只出现在月历和报表页。
- 精简引导页、设置 helper、登记按钮、批量说明等多处 AI 风格和冗余文案。

## 补全缺失样式

- `.chart-legend`、`.report-empty-state`、`.settings-desktop-save`、`.cloud-session-row`、`.cloud-task-grid`、`.mobile-login-state` 等 7 个组件样式。

## 技术

- 版本 `v0.3.2`，Service Worker 缓存名 `worktimeapp-v25`。
- 三 agent 并行审查修复了 `.mobile-cal-topbar` 对齐、按钮高度覆盖、month-nav 样式继承、dead code 等 7 个问题。

## 测试

- 45 项测试全部通过。
