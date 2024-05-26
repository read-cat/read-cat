export type UpdateSource = 'Github' | 'Gitee';
export type Version = {
  body: string
  downloadUrl?: string
  newVersion: string
  htmlUrl: string
}
export interface Updater {
  getNewVersion(branch: 'dev' | 'release'): Promise<Version | null>;
  getUpdateLog(version: string): Promise<Version | null>;
}