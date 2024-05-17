self.onmessage = e => {
  const chunkArray = <T>(array: T[], size = 1) => {
    size = Math.max(Math.ceil(Number(size)), 0);
    const length = array == null ? 0 : array.length;
    if (!length || size < 1) {
      return [];
    }
    let index = 0;
    let resIndex = 0;
    const result = new Array<T[]>(Math.ceil(length / size));
  
    while (index < length) {
      result[resIndex++] = array.slice(index, (index += size));
    }
    return result;
  }
  try {
    const content: string = e.data.content.replaceAll('\r', '');
    const maxLines: number = e.data.maxLines || 300;
    const chapterTitleList: string[] = e.data.chapterTitleList;
    const arr = [];
    let pos = 0;
    let count = 1;
    for (let i = 0; i < chapterTitleList.length; i++) {
      const start = content.indexOf(chapterTitleList[i] + '\n', pos) + chapterTitleList[i].length;
      pos = start;
      const end = i + 1 === chapterTitleList.length ? void 0 : content.indexOf(chapterTitleList[i + 1] + '\n');
      const contents = content.substring(start, end).split('\n').map(c => c.trim()).filter(c => c);
      if (contents.length > maxLines) {
        for (const item of chunkArray(contents, maxLines)) {
          arr.push({
            title: `第${count++}章`,
            contents: item
          });
        }
      } else {
        arr.push({
          title: chapterTitleList[i].trim(),
          contents
        });
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