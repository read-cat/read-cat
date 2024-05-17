export class EventCode {
  /**
   * 关闭窗口
   */
  static ASYNC_CLOSE_WINDOW: string
  /**
   * 窗口是否最大化
   */
  static ASYNC_WINDOW_IS_MAXIMIZE: string
  /**
   * 窗口最小化
   */
  static ASYNC_SET_WINDOW_MINIMIZE: string
  /**
   * 窗口最大化或退出最大化
   */
  static ASYNC_SET_WINDOW_MAXIMIZE_OR_RESTORE: string
  /**设置titleBarOverlay */
  static ASYNC_SET_TITLE_BAR_STYLE: string
  /**
   * 是否全屏
   */
  static ASYNC_WINDOW_IS_FULLSCREEN: string
  /**
   * 设置全屏
   */
  static ASYNC_WINDOW_SET_FULLSCREEN: string
  /**打开控制台 */
  static ASYNC_OPEN_DEVTOOLS: string
  /**缩放窗口 */
  static ASYNC_ZOOM_WINDOW: string
  /**注册全局快捷键 */
  static ASYNC_REGISTER_SHORTCUT_KEY: string
  /**卸载全局快捷键 */
  static ASYNC_UNREGISTER_SHORTCUT_KEY: string
  /**初始化全局快捷键 */
  static ASYNC_INIT_GLOBAL_SHORTCUT_KEY: string
  /**全局快捷键被触发 */
  static ASYNC_TRIGGER_GLOBAL_SHORTCUT_KEY: string

  /**插件开发窗口被关闭 */
  static ASYNC_PLUGIN_WINDOW_CLOSED: string

  /**获取缓存大小 */
  static ASYNC_GET_CACHE_SIZE: string
  /**清除缓存 */
  static ASYNC_CLEAR_CACHE: string

  /**重新启动程序 */
  static ASYNC_REBOOT_APPLICATION: string

  /**设置窗口背景颜色 */
  static ASYNC_SET_WINDOW_BACKGROUND_COLOR: string
  /**是否为透明窗口 */
  static ASYNC_WINDOW_IS_TRANSPARENT: string

  /**
   * 开发环境
   */
  static SYNC_IS_DEV: string
  /**
   * 获取用户目录路径
   */
  static SYNC_GET_USER_DATA_PATH: string

  static {
    Object.keys(EventCode).forEach(key => {
      Object.defineProperty(EventCode, key, {
        get() {
          return `EVENT_CODE_${key}`;
        },
        set() {
          return;
        },
      });
    });
  }
}