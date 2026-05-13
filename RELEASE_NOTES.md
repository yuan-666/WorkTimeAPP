# Release Notes - v0.2.6

发布日期：2026-05-13

## 概览

`v0.2.6` 重点修复批量登记和移动端体验。批量处理现在能按月补齐基础工作日 8 小时，也能只批量登记每天加班；移动端点击日期会打开底部登记抽屉，日历不再被压到看不清节假日和休息标记。

## 重点改进

- 批量添加新增三种方式：补齐基础工时 8h、批量登记加班、按班次模板添加。
- 正班+加班、底薪+加班默认补齐本月基础工作日；已有加班记录不会阻止补基础工时。
- 综合工时制和小时计算默认批量登记每天加班小时。
- 批量删除现在能识别 `bulk-base`、`bulk-overtime`，并避免误删带加班的主班次。
- 移动端日期点击后弹出登记抽屉，登记保存后自动收起。
- 移动端日历保持完整 7 列宽度并横向滚动，节假日、休息日、调休和工资信息更清晰。
- 侧边栏底部更新日志和友情链接不再溢出；移动端底部也补上版权、日志、GitHub 和博客入口。
- 管理员登录页移除页脚外链，只保留“返回应用”。

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

推荐标签：`v0.2.6`
