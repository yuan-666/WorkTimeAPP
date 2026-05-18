import { webview } from '@kit.ArkWeb';
import { NativeBridge } from './NativeBridge';
import { WORKTIME_SHELL_CONFIG } from './ShellConfig';

@Entry
@Component
struct Index {
  private readonly controller: webview.WebviewController = new webview.WebviewController();
  private readonly bridge: NativeBridge = new NativeBridge();
  @State private canGoBack: boolean = false;
  @State private startUrl: ResourceStr = WORKTIME_SHELL_CONFIG.localUrl;

  aboutToAppear(): void {
    const startUrl = AppStorage.get<string>('shellStartUrl') ?? '';
    if (startUrl.startsWith('https://')) {
      this.startUrl = startUrl;
      return;
    }

    this.startUrl = WORKTIME_SHELL_CONFIG.loadMode === 'remote'
      ? WORKTIME_SHELL_CONFIG.productionUrl
      : WORKTIME_SHELL_CONFIG.localUrl;
  }

  build() {
    Column() {
      Web({ src: this.startUrl, controller: this.controller })
        .width('100%')
        .height('100%')
        .javaScriptAccess(true)
        .domStorageAccess(true)
        .databaseAccess(true)
        .onlineImageAccess(true)
        .javaScriptProxy({
          object: this.bridge,
          name: 'WorkTimeNative',
          methodList: ['getPlatform', 'getShellInfo', 'setHandedness', 'notifyReady'],
          controller: this.controller
        })
        .onPageEnd(() => {
          this.refreshBackState();
          this.injectShellState();
        })
        .onProgressChange(() => {
          this.refreshBackState();
        })
    }
    .width('100%')
    .height('100%')
    .backgroundColor('#F2F2F7')
    .onBackPress((): boolean => {
      return this.handleBackPress();
    })
  }

  private refreshBackState(): void {
    try {
      this.canGoBack = this.controller.accessBackward();
    } catch (_err) {
      this.canGoBack = false;
    }
  }

  private injectShellState(): void {
    const handedness = this.bridge.getHandedness();
    const script = `
      (() => {
        const root = document.documentElement;
        root.dataset.platform = 'harmonyos';
        root.dataset.nativeShell = 'harmony';
        root.dataset.nativeShellVersion = '${WORKTIME_SHELL_CONFIG.versionName}';
        root.dataset.handedness = '${handedness}';
        window.WorkTimeHarmonyShell = window.WorkTimeHarmonyShell || {};
        window.WorkTimeHarmonyShell.info = ${this.bridge.getShellInfo()};
        if (window.WorkTimeAppBridge && typeof window.WorkTimeAppBridge.setHandedness === 'function') {
          window.WorkTimeAppBridge.setHandedness('${handedness}');
        } else {
          window.dispatchEvent(new CustomEvent('worktime:handedness', { detail: { handedness: '${handedness}' } }));
        }
        true;
      })();
    `;
    this.controller.runJavaScript(script);
  }

  private handleBackPress(): boolean {
    this.refreshBackState();
    if (!this.canGoBack) {
      return false;
    }

    const consumeScript = `
      (() => {
        if (window.WorkTimeHarmonyShell && typeof window.WorkTimeHarmonyShell.consumeBack === 'function') {
          return window.WorkTimeHarmonyShell.consumeBack() === true;
        }
        if (window.history && window.history.length > 1) {
          window.history.back();
          return true;
        }
        return false;
      })();
    `;

    this.controller.runJavaScript(consumeScript);
    return true;
  }
}
