import DOMPurify from 'dompurify';

const domParser = new DOMParser();
export const removeHTMLTags = (html: string, type: DOMParserSupportedType = 'text/html') => {
  return domParser.parseFromString(html, type).body.textContent || '';
}

/**
 * 对HTML字符串消毒
 * @param removeTags 是否移除HTML标签
 */
export const sanitizeHTML = (() => {
  const divContainer = document.createElement('div');
  return (html: string, removeTags = false) => {
    let str = DOMPurify.sanitize(html, {
      ALLOWED_ATTR: ['style', 'src']
    });
    if (removeTags) {
      divContainer.innerHTML = str;
      divContainer.children
      str = divContainer.innerText;
      divContainer.innerHTML = '';
    }
    return str.trim();
  }
})();

/**
 * 对字符串转义
 * 如&转义为 & amp;
 */
export const escapeHTML = (() => {
  const divContainer = document.createElement('div');
  return (text: string) => {
    const node = document.createTextNode(text);
    divContainer.appendChild(node);
    const val = divContainer.innerHTML;
    divContainer.removeChild(node);
    return val;
  }
})();

export const uuid = (noDash = true) => {
  let id = window.crypto.randomUUID().toUpperCase();
  if (noDash) {
    id = id.replaceAll('-', '');
  }
  return id;
}