export type ShellLoadMode = 'local' | 'remote';

export interface WorkTimeShellConfig {
  readonly appId: string;
  readonly appName: string;
  readonly kvName: string;
  readonly versionName: string;
  readonly shellName: string;
  readonly platform: string;
  readonly loadMode: ShellLoadMode;
  readonly localUrl: Resource;
  readonly productionUrl: string;
}

export const WORKTIME_SHELL_CONFIG: WorkTimeShellConfig = {
  appId: 'cn.yuanhuang.worktimeapp',
  appName: '明薪记',
  kvName: 'worktimeapp',
  versionName: '0.4.4',
  shellName: 'harmony-arkweb',
  platform: 'harmonyos',
  loadMode: 'local',
  localUrl: $rawfile('worktimeapp/index.html'),
  productionUrl: 'https://time.yuan6.cn/'
};
