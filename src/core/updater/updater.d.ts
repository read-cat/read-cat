export type UpdateSource = 'Github' | 'Gitee';
export type Version = {
  /**更新日志 */
  body: string
  /**安装包下载链接 */
  downloadUrl?: string
  /**安装包sha256 txt文件下载链接 */
  hashDownloadUrl?: string
  /**新版本号 */
  newVersion: string
  /**发布地址 */
  htmlUrl: string
}
export interface Updater {
  getNewVersion(branch: 'dev' | 'release'): Promise<Version | null>;
  getUpdateLog(tag: string): Promise<Version | null>;
}