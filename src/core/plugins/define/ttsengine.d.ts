export type Voice = {
  name: string,
  value: string
}

export type NextCallback = (blob: Blob, index: number) => void;
export type EndCallback = () => void;
export type TTSOptions = {
  /**朗读角色 */
  voice?: string,
  /**
   * 朗读速率 (0~1)
   * @default 0
   */
  rate?: number,
  /**
   * 音量 (0~1)
   * @default 1
   */
  volume?: number,
  /**
   * 起始段落
   * 参数texts的索引
  */
  start?: number,
  /**
   * 中止信号
   */
  signal: AbortSignal
}
export interface TextToSpeechEngine {
  /**
   * 参数
   */
  arguments: Record<string, string | boolean | number>
  /**
   * 转换为音频
   */
  transform: (texts: string[], options: TTSOptions, next: NextCallback, end: EndCallback) => Promise<void>
  getVoiceList: () => Promise<Voice[]>
}