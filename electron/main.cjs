const { app, BrowserWindow, Menu, shell, session } = require("electron");
const path = require("node:path");

const isMac = process.platform === "darwin";
const appRoot = path.join(__dirname, "..");
const indexPath = path.join(appRoot, "dist", "index.html");

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 390,
    minHeight: 680,
    backgroundColor: "#F2F2F7",
    title: "明薪记",
    titleBarStyle: isMac ? "hiddenInset" : "default",
    trafficLightPosition: isMac ? { x: 18, y: 18 } : undefined,
    vibrancy: isMac ? "sidebar" : undefined,
    visualEffectState: isMac ? "active" : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  win.loadFile(indexPath);

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\/(github\.com|yuan6\.cn|time\.yuan6\.cn)\b/.test(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://")) return;
    event.preventDefault();
    if (/^https:\/\/(github\.com|yuan6\.cn|time\.yuan6\.cn)\b/.test(url)) {
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders || {};
    headers["Content-Security-Policy"] = [
      "default-src 'self'; connect-src 'self' https://time.yuan6.cn; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"
    ];
    headers["X-Content-Type-Options"] = ["nosniff"];
    callback({ responseHeaders: headers });
  });
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (!isMac) app.quit();
});
