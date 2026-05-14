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
