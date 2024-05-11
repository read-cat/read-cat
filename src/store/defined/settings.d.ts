import { ReadColor } from '../../core/window/default-read-style'
import { RequestProxy } from '../../core/request/defined/request';
import { UpdateSource } from '../../core/updater/updater';
import { FontData } from '../../core/font';

export type Texture =
  'none' |
  'matte-texture' |
  'white-texture' |
  'wood-texture'
  ;

export type SettingsOptions = {
  /**开启模糊效果 */
  enableBlur: boolean
  /**开启文本颜色自适应, 仅在阅读模式生效 */
  enableAutoTextColor: boolean
  /**开启网络代理, 仅在插件生效 */
  enableProxy: boolean
  /**开启阅读界面回到顶部功能 */
  enableReadBacktop: boolean
  /**显示消息提示框关闭按钮 */
  enableShowTipCloseButton: boolean,
  /**开启书签高亮 */
  enableBookmarkHighlight: boolean,
  /**程序启动时检查更新 */
  enableAppStartedFindNewVersion: boolean,
  /**开启过渡动画 */
  enableTransition: boolean,
  /**当前章节朗读结束时，自动朗读下一章节 */
  enableAutoReadAloudNextChapter: boolean
  /**滚动至底部切换下一章节 */
  enableScrollBottomToNextChapter: boolean
}
export type SettingsReadStyle = {
  /**阅读颜色 */
  color: ReadColor
  /**字体大小 */
  fontSize: number
  /**字体粗细 */
  fontWeight: 'normal' | 'bold'
  /**文本间距 */
  letterSpacing: number
  /**字体 */
  font: FontData
  /**段落间距 */
  sectionSpacing: number
  /**行间距 */
  lineSpacing: number
  /**宽度 */
  width: number
  /**纹理 */
  texture: Texture
}
export type SettingsPluginDevtools = {
  /**插件开发工具包资源路径 */
  resourcePath?: string
  /**端口号 */
  port: number
}

export type ShortcutKey = {
  /**下一章节 */
  nextChapter: string
  /**上一章节 */
  prevChapter: string
  /**向上滚动 */
  scrollUp: string
  /**向下滚动 */
  scrollDown: string
  /**上一页 */
  prevPage: string
  /**下一页 */
  nextPage: string
  /**打开控制台 */
  openDevTools: string
  /**放大窗口 */
  zoomInWindow: string
  /**缩小窗口 */
  zoomOutWindow: string
  /**缩放重置 */
  zoomRestWindow: string
  /**全屏 */
  fullScreen: string
} & GlobalShortcutKey
export type GlobalShortcutKey = {
  /**老板键 */
  globalBossKey: string
}

export type SettingsTheme = 'os' | 'light' | 'dark';

export type Settings = {
  /**设置配置ID */
  id: string
  /**选项 */
  options: SettingsOptions
  /**阅读样式 */
  readStyle: SettingsReadStyle
  /**代理 */
  proxy: RequestProxy
  /**任务执行线程数 */
  threadsNumber: number
  /**最大缓存章节数 */
  maxCacheChapterNumber: number
  /**开发者工具 */
  pluginDevtools: SettingsPluginDevtools
  /**快捷键 */
  shortcutKey: ShortcutKey
  /**主题 */
  theme: SettingsTheme
  /**更新源 */
  updateSource: UpdateSource
  /**缩放系数 */
  zoomFactor: number
  /**快捷键滚动步进值 */
  scrollbarStepValue: number
}

