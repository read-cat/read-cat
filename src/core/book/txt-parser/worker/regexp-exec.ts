self.onmessage = e => {
  try {
    const content: string = e.data.content;
    const pattern: RegExp = e.data.pattern;
    self.postMessage({
      result: pattern.exec(content)
    });
  } catch (e: any) {
    self.postMessage({
      error: e.message
    });
  }
}