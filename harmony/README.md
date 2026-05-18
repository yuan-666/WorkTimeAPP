# HarmonyOS ArkTS Shell

This directory is an initial DevEco Studio skeleton for the WorkTimeAPP HarmonyOS native shell. It is intentionally independent from the existing Android, iOS, Electron, CSS and PWA source directories.

## Goals

- Keep the existing identity unchanged:
  - bundle/package id: `cn.yuanhuang.worktimeapp`
  - app display name: `明薪记`
  - cloud KV binding/name: `worktimeapp`
- Host the existing PWA inside ArkWeb.
- Prefer local packaged PWA files, with a production URL fallback.
- Reserve a JS bridge for platform, native shell and handedness data.
- Let Web history and in-app secondary layers consume back events before the native shell exits.

## DevEco Studio Handoff

Open this `harmony/` folder in DevEco Studio as a HarmonyOS project.

The shell entry is:

```text
entry/src/main/ets/pages/Index.ets
```

Current load modes are configured in:

```text
entry/src/main/ets/pages/ShellConfig.ets
```

By default the shell loads the local placeholder:

```text
entry/src/main/resources/rawfile/worktimeapp/index.html
```

For a real local package, run the root project build first, then copy the generated PWA files from `dist/` into `harmony/entry/src/main/resources/rawfile/worktimeapp/` and keep `index.html` at that directory root.

To test the production site instead, change `loadMode` in `ShellConfig.ets` to `remote`; the preset URL is `https://time.yuan6.cn/`.

## Bridge Contract

The native shell exposes `window.WorkTimeNative` to ArkWeb:

```js
WorkTimeNative.getPlatform()
WorkTimeNative.getShellInfo()
WorkTimeNative.setHandedness("left" | "right" | "auto")
WorkTimeNative.notifyReady()
```

On page finish the shell also injects:

- `document.documentElement.dataset.platform = "harmonyos"`
- `document.documentElement.dataset.nativeShell = "harmony"`
- a `worktime:handedness` event for the existing web-side `WorkTimeAppBridge.setHandedness()` listener

The web app already keeps the user-facing setting and bridge fallback in `src/app.js`; this native shell only provides the HarmonyOS side of that contract.

## Back Behavior

The back flow is:

1. Ask the Web app to close an active secondary layer through `window.WorkTimeHarmonyShell.consumeBack()`, if the page defines it later.
2. Fall back to `window.history.back()` if Web history exists.
3. Exit the page only when no web layer or history can handle the event.

This matches the current PWA behavior where entry sheets, settings drill-in pages, cloud password panels and shift details use Web history before the app should leave.

## Notes

- This skeleton is not wired into root npm scripts yet.
- No signing profile or distribution certificate is included.
- The rawfile placeholder is only a handoff stub; production packaging should replace it with root `dist/` output.
