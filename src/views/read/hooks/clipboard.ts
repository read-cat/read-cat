import { isNull } from '../../../core/is';
import { useMessage } from '../../../hooks/message';

export const useClipboard = () => {
  const message = useMessage();

  const copyText = () => {
    const selection = getSelection();
    if (isNull(selection)) {
      message.error('selection is null');
      return;
    }
    if (selection.type !== 'Range') {
      message.warning('未选中文字');
      return;
    }
    const range = selection.getRangeAt(0);
    let text = '';
    for (const node of Array.from(range.cloneContents().childNodes.values())) {
      text += isNull(node.textContent) ? '\r\n' : `${node.textContent}\r\n`;
    }
    writeText(text.slice(0, -2));
  }

  /**
   * 文本写入剪贴板
   * @param data 需写入文本
   * @param tips 写入成功时所显示的文本，可空
   */
  const writeText = (data: string, tips: string = '') => {
    navigator.clipboard.writeText(data).then(() => {
      tips?.trim() && message.info(tips.trim());
    }).catch(() => {
      message.error('复制失败');
    });
  }



  return {
    copyText,
    writeText
  }
}