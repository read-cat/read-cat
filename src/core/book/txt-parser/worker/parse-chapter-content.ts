import { chunkArray } from '../../../utils';

const escape = (str: string) => {
  return str.replaceAll('\\', '\\\\')
    .replaceAll('^', '\\^')
    .replaceAll('$', '\\$')
    .replaceAll('*', '\\*')
    .replaceAll('+', '\\+')
    .replaceAll('?', '\\?')
    .replaceAll('.', '\\.')
    .replaceAll('|', '\\|')
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
    .replaceAll('-', '\\-')
    ;
}
self.onmessage = e => {
  try {
    let content: string = e.data.content.replaceAll('\r', '');
    const maxLines: number = e.data.maxLines || 300;
    const chapterTitleList: string[] = e.data.chapterTitleList;
    const arr = [];
    let count = 1;
    //未匹配到章节目录，以最大行数分割
    if (chapterTitleList.length === 1 && chapterTitleList[0] === 'guIDQ99PelX2-XTHD1eo6') {
      const contents = content.split('\n').map(c => c.trim()).filter(c => c);
      for (const item of chunkArray(contents, maxLines)) {
        arr.push({
          title: `第${count++}章`,
          contents: item
        });
      }
    } else {
      for (let i = 0; i < chapterTitleList.length; i++) {
        let start, end;
        const startRegExp = new RegExp(`(${escape(chapterTitleList[i])}.*)\n`, 'gm');
        const startExec = (startRegExp).exec(content);
        start = startExec ? startExec[1].length + startExec.index : -1;
        if (i + 1 === chapterTitleList.length) {
          end = void 0;
        } else {
          const nextRegExp = new RegExp(`${escape(chapterTitleList[i + 1])}.*\n`, 'gm');
          end = content.search(nextRegExp);
          end = end >= 0 ? end : void 0;
        }
        const contents = content.substring(start, end).split('\n').map(c => c.trim()).filter(c => c);
        content = content.slice(start);
        if (contents.length > maxLines) {
          const chunks = chunkArray(contents, maxLines);
          for (let j = 0; j < chunks.length; j++) {
            let title: string = (j === 0 && chapterTitleList[i].trim()) ? chapterTitleList[i].trim() : `第${arr.length + 1}章`;
            arr.push({
              title,
              contents: chunks[j]
            });
          }
        } else {
          arr.push({
            title: chapterTitleList[i].trim(),
            contents
          });
        }
      }
    }
    self.postMessage({
      result: arr
    });
  } catch (e: any) {
    self.postMessage({
      error: e.message
    });
  }
}