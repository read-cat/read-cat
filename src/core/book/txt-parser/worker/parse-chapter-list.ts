self.onmessage = e => {
  try {
    const pattern: RegExp = e.data.pattern;
    const content: string = e.data.content;
    self.postMessage({
      result: content.match(pattern) || []
    });
  } catch (e: any) {
    self.postMessage({
      error: e.message
    });
  }
}