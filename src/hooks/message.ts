import { ElMessage, MessageOptionsWithType } from 'element-plus'
import { isString, isUndefined } from '../core/is';
import { useSettingsStore } from '../store/settings';
import IconLoadingPlay from '../assets/svg/icon-loading-play.svg';

type MessageType = 'error' | 'success' | 'warning' | 'info';
export const useMessage = () => {
  const settings = useSettingsStore();
  const grouping = true;
  const showMessage = (options: MessageOptionsWithType | string, type: MessageType) => {
    const offset = window.innerHeight - 100;
    let opts: MessageOptionsWithType = {
      offset,
      grouping
    }
    let msg = '';
    if (isString(options)) {
      msg = options;
    } else if (isUndefined(options?.message)) {
      msg = String(options);
    } else {
      msg = options.message.toString();
      opts = {
        ...opts,
        ...options
      }
    }
    return ElMessage({
      type,
      ...opts,
      showClose: settings.options.enableShowTipCloseButton,
      message: msg.length > 100 ? `${msg.slice(0, 100)}...` : msg
    });
  }
  const error = (options: MessageOptionsWithType | string) => {
    return showMessage(options, 'error');
  }
  const success = (options: MessageOptionsWithType | string) => {
    return showMessage(options, 'success');
  }
  const warning = (options: MessageOptionsWithType | string) => {
    return showMessage(options, 'warning');
  }
  const info = (options: MessageOptionsWithType | string) => {
    return showMessage(options, 'info');
  }
  const loading = (message: string) => {
    return showMessage({
      icon: IconLoadingPlay,
      message,
      duration: 0
    }, 'info');
  }

  return {
    success,
    error,
    warning,
    info,
    loading
  }
}