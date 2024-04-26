export type UpdateSource = 'Github' | 'Gitee';
export type Version = {
  body: string
  downloadUrl?: string
  newVersion: string
  htmlUrl: string
}
export interface Updater {
  getNewVersion(versionCode: number, branch: 'dev' | 'release'): Promise<Version | null>;
}