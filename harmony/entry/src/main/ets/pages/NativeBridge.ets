import { WORKTIME_SHELL_CONFIG } from './ShellConfig';

export type HandednessPreference = 'auto' | 'left' | 'right';

export class NativeBridge {
  private handedness: HandednessPreference = 'auto';

  getPlatform(): string {
    return WORKTIME_SHELL_CONFIG.platform;
  }

  getShellInfo(): string {
    return JSON.stringify({
      appId: WORKTIME_SHELL_CONFIG.appId,
      appName: WORKTIME_SHELL_CONFIG.appName,
      kvName: WORKTIME_SHELL_CONFIG.kvName,
      versionName: WORKTIME_SHELL_CONFIG.versionName,
      shellName: WORKTIME_SHELL_CONFIG.shellName,
      platform: WORKTIME_SHELL_CONFIG.platform,
      handedness: this.handedness
    });
  }

  setHandedness(value: string): string {
    if (value === 'left' || value === 'right' || value === 'auto') {
      this.handedness = value;
    }
    return this.handedness;
  }

  notifyReady(): string {
    return this.getShellInfo();
  }

  getHandedness(): HandednessPreference {
    return this.handedness;
  }
}
