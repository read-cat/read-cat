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
    for (const node of range.cloneContents().childNodes.values().toArray()) {
      text += isNull(node.textContent) ? '\r\n' : `${node.textContent}\r\n`;
    }
    navigator.clipboard.writeText(text.slice(0, -2)).catch(() => {
      message.error('复制失败');
    });
  }



  return {
    copyText
  }
}