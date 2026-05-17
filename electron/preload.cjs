const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("WORKTIME_API_BASE", "https://time.yuan6.cn/api/cloud");
contextBridge.exposeInMainWorld("WORKTIME_DESKTOP", {
  platform: process.platform,
  shell: "electron"
});
