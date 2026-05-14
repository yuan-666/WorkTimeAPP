# 明薪工时

明薪工时是一个离线优先的跨平台工时、加班、薪资和个税记录 PWA。Windows、macOS、iOS、Android、鸿蒙都可以通过现代浏览器运行，移动端可添加到主屏幕。

当前版本：`v0.3.3`

## 功能

- 日历视图记录每日工时、加班、目标和备注
- 支持时间记录与工时记录
- 支持正班+加班、底薪+加班、综合工时制、小时计算
- 工作日默认有班，自动套用白班/夜班等工作班次；白班夜班时间不一致时会提示先选今日班次
- 支持正常上班、有加班、休息、请假四种登记入口，请假可选择年假、事假、病假、调休、是否扣工资、计薪倍数和请假小时
- 首次引导页会实时计算默认班次的每日工时、正班和加班时长
- 下班时间支持准点、加 1/2/3 小时快捷调整；请假支持全天、半天、2 小时和自定义快捷时长
- 支持复制昨天、更多设置折叠和批量处理，详细日期类型/小时字段默认不打扰
- 支持实时工时预览：填写上班、下班、休息时间时即时显示当天工时、正班/加班和预计工资
- 保存前会显示本条工资和保存后的本月税后预估，减少记完以后还要去报表页核对
- 日历支持自定义每周开始日，月历表头、周合计和周趋势会一起跟随设置变化
- 支持 2026 年国务院节假日安排识别；2027 年先保留预估表，待国务院正式通知后应更新
- 日历直接展示 `法定`、`休`、`班` 标记，选择日期后自动带出当天工资倍率
- 登记区支持班次工资预览、当天状态判断、醒目的“保存今日记录”按钮，减少反复填写
- 支持合理工时校验：单条、当天、加班、休息时间均有上限，异常记录会提示
- 加班倍率默认使用 1.5 / 2 / 3，但允许按实际工资规则调整，不再弹合规风险提醒
- 支持每周双休、每周单休、自定义周休、上六休一、上十四休一或自定义休息周期，并可从历史休息记录反推下一次休息倒计时
- 复制昨天和休息标记会保护当天主记录，避免无意叠加工时
- 支持批量添加与批量删除：可一键补齐整月基础工作日 8 小时，也可批量登记每天加班；删除前显示影响并要求确认
- 支持底薪和月标准小时自动推算正班时薪、底薪时薪和加班基数
- 支持补贴、扣款、月度薪资拆分、年度统计
- 支持日补扣自动记录
- 支持居民工资薪金累计预扣法个税估算，扣除项可按固定金额或工资比例二选一
- 支持 CSV、Excel、分享摘要、本地 JSON 备份与导入
- 报表年度总结中绿色条代表税后收入，黄色细条代表总工时；当前年份尚未到来的月份会隐藏，不用 0 元数据干扰判断
- 支持阿里云 ESA + KV 云备份：用户界面只显示登录和同步操作，不暴露接口配置；手机设置二级页也可直接登录和同步。支持密码修改（验证旧密码后更新）。
- 手机版月历页四宫格：税前 / 距目标 / 总上班（X天 Xh）/ 总加班（Xh），休息倒计时独立长条。月份切换支持左右滑动翻页。
- 支持浅色、深色、跟随系统三档主题，iOS 原生 HIG 设计风格，全局微交互 `scale(0.96)` 物理收缩感。
- 云备份密码加密传输（RSA-OAEP），服务端 PBKDF2-SHA256 加盐哈希；7 天签名会话，不保存密码。API 限流 10 次/分钟，请求体 ≤500KB。
- 移动端底部只保留云备份登录状态和 `yuan 版权所有`，点击登录状态可进入云备份设置
- 顶部工资规则卡只展示已计算出的正班时薪、工作日/休息日/节假日加班时薪和休息倒计时，表单操作留在登记区与设置区
- 移动端点击日历日期会弹出登记抽屉，轻操作不再反复触发整页入场动画，日历标记更容易读
- 批量处理会保留当前日期范围、添加方式和删除确认状态，切换批量添加/删除不会清空刚填的内容
- 入口脚本、样式和 Service Worker 使用版本参数，减少 PWA 旧缓存导致发布后仍显示旧版本的问题
- PWA 离线缓存，数据默认保存在本机浏览器 `localStorage`

## 运行

```bash
npm test
npm run build
npm run serve
```

然后打开 `http://localhost:4173`。

## 使用流程

1. 在 `设置` 中选择薪资方式，填写底薪、月标准小时、倍率、个税扣除和默认班次。
2. 回到 `月历`，点击日期后选择 `正常上班`、`有加班`、`休息` 或 `请假`，系统会自动拆分工时和工资。
3. 工作日默认有班，通常只要确认白班/夜班和上下班时间；可用准点、加 1/2/3 小时快速改下班时间。
4. 如果当天没上班，点 `请假` 选择假别、是否扣工资和全天/半天等时长。
5. 日历会自动识别周末、国务院节假日和调休上班；也可以用放假提醒处理不按周末休息的排班。
6. 在 `记录` 中使用 `批量处理` 添加或删除记录，也可录入补贴和扣款。
7. 在 `报表` 中查看年度趋势、本月工资拆分，并导出 CSV 或 Excel。
8. 在 `设置` 的数据管理中可使用云同步；登录后可选择 `上传本机到云端` 或 `从云端恢复到本机`。如果没有部署后端，仍可定期使用本地备份导出 JSON。

## 目录

```text
index.html              应用入口
styles.css              响应式界面样式
src/app.js              PWA 交互与页面渲染
src/calculations.js     工时、薪资、个税核心计算
src/storage.js          本地存储、备份导入导出
src/export.js           CSV、Excel、分享
functions/index.js      阿里云 ESA 单入口函数：云备份与后台 API
admin.html              独立管理员后台页面
changelog.html          时间轴样式更新日志页面
sw.js                   离线缓存
manifest.webmanifest    PWA 安装清单
CHANGELOG.md            版本变更记录
RELEASE_NOTES.md        当前版本发布说明
tests/                  核心计算测试
```

## 计算口径

加班倍率默认使用工作日 1.5 倍、休息日 2 倍、节假日 3 倍。设置中的倍率可按你的实际工资规则调整，系统不再弹出劳动法合规提醒。

月薪折算小时工资默认使用 `月工资 ÷ 21.75 ÷ 8`，即 `月工资 ÷ 174`。综合工时制默认月标准工时使用 `20.67 × 8 = 165.36` 小时；超出目标小时的部分按设置里的综合超时倍率估算。

为避免误点或导入错误造成工资失真，应用默认限制单条记录最多 16 小时、当天合计最多 20 小时、单条加班最多 12 小时。超过边界的记录不会保存；历史重复记录会尽量按同日同类记录自动合并，并在顶部提示仍需手动检查的异常日期。

节假日识别当前内置 2026 年国务院办公厅关于部分节假日安排的通知；2027 年为预估表，需在正式通知发布后复核。应用会区分法定节假日、放假休息日和调休上班日；未内置年份会回落到设置里的每周工作日规则。若你的休息日不在周末，可在设置里选择双休、单休、自定义周休、上六休一、上十四休一或自定义周期，并通过上一次休息日或历史休息记录生成放假倒计时。

个税默认使用居民个人工资薪金累计预扣法：累计收入减累计减除费用、专项扣除、专项附加扣除等后，套用 3% 至 45% 的累计预扣率表。默认累计减除费用按 5000 元/月计算。其他扣除、社保公积金可选择固定金额或按工资比例计算。参考国家税务总局政策解读：<https://www.chinatax.gov.cn/chinatax/n810341/n810760/c3959585/content.html>

本应用提供工资与个税估算，不构成劳动法、税务或财务意见。具体发薪、社保、公积金、补休和税务申报请以合同、当地政策与单位规则为准。

资料来源：

- 人社部发〔2025〕2号《人力资源社会保障部关于职工全年月平均工作时间和工资折算问题的通知》：<https://www.gov.cn/zhengce/zhengceku/202501/content_6995777.htm>
- 国务院办公厅关于 2026 年部分节假日安排的通知：<https://www.gov.cn/zhengce/zhengceku/202511/content_7047091.htm>
- 国家税务总局个税累计预扣法政策解读：<https://www.chinatax.gov.cn/chinatax/n810341/n810760/c3959585/content.html>

## 云备份与后台

阿里云 ESA 只需要指定一个函数入口：`functions/index.js`。用户侧不会展示接口地址；部署时由同一个 `export default { async fetch(request, env) { ... } }` 在服务端分发：

- `/api/cloud`：用户注册、登录、恢复、备份。用户数据写入 `worktimeapp` KV 的 `user:{userId}`；密码由浏览器使用公钥加密后提交，服务端用私钥解密并保存 PBKDF2-SHA256 加盐哈希。登录后返回 7 天签名会话，后续上传/恢复必须匹配同一个用户 ID。
- `/api/cloud/key`：返回从私钥派生出的 RSA-OAEP 公钥，供浏览器加密密码。
- `/api/admin/login`：管理员登录。管理员密码同样先加密后提交，登录成功后返回短期会话。
- `/api/admin/summary`、`/api/admin/user`：管理员摘要和用户操作，必须携带服务端签名的管理员会话。

需要在 `worktimeapp` KV 中准备：

- `RSA_key`：RSA-OAEP-256 私钥 JWK JSON，用来解密浏览器提交的密码密文，并派生管理员会话签名密钥。
- `admin_name`：管理员账号。
- `admin_passwd`：管理员密码；可以是字符串，也可以是 `{ "passwordSalt": "...", "passwordHash": "..." }` 形式的 PBKDF2 记录。函数也兼容 `{ "salt": "...", "hash": "..." }`、`{ "password": "..." }`、`{ "value": "..." }` 等常见 KV 包装，但更推荐使用下方命令生成的标准 JSON。

后台看板独立访问 `admin.html`。看板包含用户总数、启用/停用状态、同步次数、登录次数、IP 网段分布、使用事件和近 30 日使用趋势；用户操作支持修改密码、停用/启用和备注。后台不会读取或展示用户的工时明细数据。

### 生成云端密钥

生成 `RSA_key`，把输出的整段 JSON 存进 `worktimeapp` KV：

```bash
node --input-type=module -e 'const kp=await crypto.subtle.generateKey({name:"RSA-OAEP",modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["encrypt","decrypt"]); console.log(JSON.stringify(await crypto.subtle.exportKey("jwk",kp.privateKey)))'
```

生成推荐的 `admin_passwd` 哈希记录，把输出 JSON 存进 `admin_passwd`。命令会提示输入管理员密码：

```bash
node --input-type=module -e 'import{createInterface}from"node:readline/promises";import{stdin as input,stdout as output}from"node:process";const rl=createInterface({input,output});const password=await rl.question("Admin password: ");rl.close();const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);const b64=(arr)=>Buffer.from(arr).toString("base64url");const salt=b64(bytes);const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:new TextEncoder().encode(salt),iterations:120000},key,256);console.log(JSON.stringify({passwordSalt:salt,passwordHash:b64(new Uint8Array(bits)),passwordAlgorithm:"PBKDF2-SHA256:120000"}))'
```

`admin_name` 直接存管理员账号字符串即可。密码在浏览器到函数之间用 RSA-OAEP 加密传输；服务端解密后只用来做 PBKDF2 校验或生成哈希，不把明文密码写入 KV。

复制到 KV 时只放输出内容本身，不要带 Markdown 代码围栏、说明文字或多余引号。`v0.3.1` 起服务端会自动去掉前后空格，并兼容误复制的三反引号代码围栏，但仍建议保持 KV 值干净。

## 部署到阿里云 ESA

可以使用 `npm run build`。本项目是原生 PWA，没有打包器，构建脚本会把静态文件复制到 `dist/`。

Pages 静态站点设置：

- 构建命令：`npm run build`
- 输出目录：`dist`
- Node 版本：建议 20 或更高

ESA 函数设置：

- 函数入口文件：`functions/index.js`
- 入口对象：默认导出的 `fetch(request, env)`
- KV 绑定名称：`worktimeapp`

部署前在 `worktimeapp` KV 写入 `RSA_key`、`admin_name`、`admin_passwd`。静态站点和函数需要在同一域名或同一站点路由下工作，让前端能访问 `/api/cloud/key`、`/api/cloud` 和 `/api/admin/login`。

## 后续扩展

- 端到端加密备份、多人/多岗位配置
- 节假日自动更新与跨零点拆分
- 综合工时制按审批周期统计
- 原生壳封装：Tauri、Capacitor、uni-app 或 ArkUI；当前优先保持 PWA，覆盖 Windows、macOS、iOS、Android 和鸿蒙浏览器/ WebView 场景

## 发布

当前发布说明见 [RELEASE_NOTES.md](./RELEASE_NOTES.md)，版本变更见 [CHANGELOG.md](./CHANGELOG.md)，可视化时间轴见 [changelog.html](./changelog.html)。
