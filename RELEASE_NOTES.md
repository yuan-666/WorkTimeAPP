# Release Notes - v0.2.5

发布日期：2026-05-13

## 概览

`v0.2.5` 是一次完整的可用性、安全和部署整理版本。它把日常登记流程收敛到“正常上班 / 有加班 / 休息 / 请假”，补上批量添加与批量删除、自定义周起始日、轮班休息提醒、实时工时预览、明暗主题、独立更新日志、云备份和管理员后台。

本版本保持原生 PWA 架构，不引入前端框架或运行时依赖。静态站点可通过 `npm run build` 输出到 `dist/`，阿里云 ESA 函数入口统一为 `functions/index.js`。

## 重点改进

- 日常登记更直接：工作日默认有班，支持按白班/夜班套用班次；用户只需要选择今天是上班、加班、休息还是请假。
- 填写时即时反馈：上下班时间、休息时间、请假小时会实时计算当天总工时、正班、加班和预计工资。
- 记录管理更顺手：新增批量添加和批量删除，删除前显示影响并要求确认；同日主记录保存会替换，避免重复叠加工时。
- 排班更贴近真实场景：支持自定义每周开始日、双休、单休、自定义周休、上六休一、上十四休一和自定义周期休息提醒。
- 工资与个税更清楚：金额输入允许按实际情况填写任意数字；个税扣除支持固定金额或工资比例二选一，并按累计预扣法估算。
- 云同步更安全：用户密码先在浏览器端用 RSA-OAEP 公钥加密，服务端用 KV 中的 `RSA_key` 解密后只保存 PBKDF2-SHA256 加盐哈希。
- 后台独立访问：管理员后台移动到 `admin.html`，使用 KV 中的 `admin_name`、`admin_passwd` 登录后才能查看用户看板和执行管理操作。
- 用户界面更干净：普通用户侧不展示 API、KV、令牌等接口配置；版权、动态日志、GitHub 和博客友情链接统一放在侧边栏底部。
- 部署路径明确：`npm run build` 输出 `dist/`，ESA 函数入口文件是 `functions/index.js`，入口对象是默认导出的 `fetch(request, env)`。

## 部署提示

- Pages 构建命令：`npm run build`
- Pages 输出目录：`dist`
- ESA 函数入口：`functions/index.js`
- KV 绑定名称：`worktimeapp`
- 必需 KV 键：`RSA_key`、`admin_name`、`admin_passwd`

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

## Git 标签

发布标签：`v0.2.5`
