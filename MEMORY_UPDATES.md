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
