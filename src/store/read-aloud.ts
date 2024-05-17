import { defineStore, storeToRefs } from 'pinia';
import { useTextContentStore } from './text-content';
import { useMessage } from '../hooks/message';
import { isNull } from '../core/is';
import { useScrollTopStore } from './scrolltop';
import { useTextContent } from '../views/read/hooks/text-content';
import { useSettingsStore } from './settings';
import { errorHandler, newError, sanitizeHTML } from '../core/utils';
import MuteMP3 from '../assets/mute.mp3';
import { AudioChunk, TextToSpeechEngine } from '../core/plugins/defined/ttsengine';

export type AudioBlob = {
  chunks: AudioChunk[]
  index: number
}

export const useReadAloudStore = defineStore('ReadAloud', {
  state: () => {
    return {
      playerStatus: 'pause' as 'play' | 'pause' | 'wait',
      readAloudRef: null as HTMLAudioElement | null,
      audios: [] as AudioBlob[],
      currentPlayIndex: -1,
      currentChunkIndex: -1,
      abortController: null as AbortController | null,
      chapterUrl: null as string | null,
      playerConfig: {
        playbackRate: 1
      },
      transformStatus: '' as 'start' | 'end' | '',
      isSelectPlay: false,
    }
  },
  getters: {

  },
  actions: {
    addReadAloudClass() {
      const section = document.querySelector<HTMLElement>(`#text-content > div[data-index="${this.currentPlayIndex}"]`);
      if (!section) {
        return;
      }
      section.previousElementSibling?.classList.remove('current-read-aloud');
      section.classList.add('current-read-aloud');
      if (this.currentPlayIndex === 0) {
        return;
      }
      const { scrollTop } = useScrollTopStore();
      const { options } = useSettingsStore();
      let height = 0;
      if (options.enableScrollToggleChapter) {
        height = document.querySelector<HTMLElement>('.scroll-top-to-prev-chapter')?.clientHeight || 0;
      }
      scrollTop(section.offsetTop - (window.screen.height - height) / 3);
    },
    removeReadAloudClass() {
      const section = document.querySelectorAll<HTMLElement>(`#text-content > div[data-index]`);
      section.forEach(e => {
        e.classList.remove('current-read-aloud');
      });
    },
    audioPlay() {
      if (!this.readAloudRef) {
        return;
      }
      const audio = this.audios[this.currentPlayIndex <= -1 ? 0 : this.currentPlayIndex];
      if (audio) {
        const chunk = audio.chunks[this.currentChunkIndex <= -1 ? 0 : this.currentChunkIndex];
        const old = this.readAloudRef.src;
        this.readAloudRef.src = '';
        URL.revokeObjectURL(old);
        this.readAloudRef.src = URL.createObjectURL(chunk.blob);
        this.readAloudRef.play();
        this.playerStatus = 'play';
        this.currentPlayIndex = audio.index;

        // 为正在朗读的段落添加class
        this.addReadAloudClass();
      }
    },
    async play(start = 0, voice?: string) {
      const {
        isRunningGetTextContent,
        textContent,
        currentChapter
      } = storeToRefs(useTextContentStore());
      const { nextChapter } = useTextContent();
      const { options, readAloud } = useSettingsStore();
      const message = useMessage();
      if (isRunningGetTextContent.value) {
        message.warning('正在获取正文');
        return;
      }
      if (isNull(textContent.value) || textContent.value.contents.length <= 0) {
        message.error('无法获取正文');
        return;
      }
      if (isNull(currentChapter.value)) {
        message.error('无法获取章节信息');
        return;
      }
      if (isNull(this.readAloudRef)) {
        message.error('无法获取AudioRef');
        return;
      }
      const engine = GLOBAL_PLUGINS.getPluginInstanceById<TextToSpeechEngine>(readAloud.use);
      if (!engine) {
        message.error(`未能获取到TTS插件, 插件不存在或未启用, ID: ${readAloud.use}`);
        return;
      }

      if (this.chapterUrl === currentChapter.value.url) {
        this.readAloudRef.play();
        this.addReadAloudClass();
        return;
      }
      if (this.abortController) {
        this.abortController.abort();
      }
      this.chapterUrl = currentChapter.value.url;
      this.currentPlayIndex = -1;
      this.currentChunkIndex = 0;
      this.audios = [];
      this.abortController = null;
      this.transformStatus = 'start';
      this.playerStatus = 'wait';
      this.abortController = new AbortController();
      let first = true;

      this.readAloudRef.oncanplay = () => {
        if (!this.readAloudRef) {
          return;
        }
        this.readAloudRef.playbackRate = this.playerConfig.playbackRate;
      }
      this.readAloudRef.onended = () => {
        this.playerStatus = 'wait';
        this.currentChunkIndex += 1;
        if (this.currentChunkIndex >= this.audios[this.currentPlayIndex]?.chunks.length) {
          this.currentPlayIndex += 1;
          this.currentChunkIndex = 0;
        }
        if (!isNull(textContent.value) && this.currentPlayIndex >= textContent.value.contents.length) {
          this.currentPlayIndex = -1;
          first = true;
          this.audios = [];
          if (options.enableAutoReadAloudNextChapter) {
            message.info('朗读结束, 准备朗读下一章节');
            setTimeout(() => {
              nextChapter().then(() => {
                this.play(0);
              });
            }, 1000);
          } else {
            message.info('朗读结束');
            this.abortController?.abort();
            this.abortController = null;
            this.chapterUrl = null;
            this.currentPlayIndex = -1;
            this.currentChunkIndex = 0;
            this.audios = [];
          }
        } else {
          this.audioPlay();
        }
      }
      this.readAloudRef.onpause = () => {
        this.playerStatus = 'pause';
      }
      this.readAloudRef.onplay = () => {
        this.playerStatus = 'play';
      }
      const contents = textContent.value.contents.map(t => sanitizeHTML(t, true));
      await engine.transform(contents, {
        start,
        maxLineWordCount: readAloud.maxLineWordCount,
        signal: this.abortController.signal,
        rate: 0.1,
        volume: 0.5,
        voice
      }, (chunk, index) => {
        let blob = chunk.blob;
        if (blob.size <= 0) {
          GLOBAL_LOG.warn('readAloud transform content', textContent.value?.contents[index], index, 'blob size:', blob.size);
          blob = new Blob([MuteMP3], { type: 'audio/mp3' });
        }
        if (first) {
          this.audios = [];
          const chunks: AudioChunk[] = [];
          chunks[chunk.index] = {
            blob,
            index: chunk.index,
          };
          this.audios[index] = {
            chunks,
            index
          };
          this.currentPlayIndex = index;
          this.currentChunkIndex = 0;
          this.audioPlay();
          first = false;
        } else {
          if (this.audios[index]) {
            this.audios[index].chunks[chunk.index] = chunk;
          } else {
            const chunks = [];
            chunks[chunk.index] = chunk;
            this.audios[index] = {
              chunks,
              index
            }
          }
          if (this.playerStatus === 'wait' && this.transformStatus && this.transformStatus !== 'end') {
            GLOBAL_LOG.debug('readAloud next play');
            this.audioPlay();
          }
        }
      }, () => {
        GLOBAL_LOG.debug('transform end');
        this.transformStatus = 'end';
      });
    },
    pause() {
      this.readAloudRef?.pause();
    },
    stop() {
      this.abortController?.abort();
      this.abortController = null;
      if (this.readAloudRef) {
        this.readAloudRef.pause();
        const old = this.readAloudRef.src;
        this.readAloudRef.src = '';
        URL.revokeObjectURL(old);
      }
      this.playerStatus = 'pause';
      this.removeReadAloudClass();
      this.chapterUrl = null;
      this.currentPlayIndex = -1;
      this.currentChunkIndex = 0;
      this.audios = [];
      this.transformStatus = '';
    },
    /**设置播放速率 */
    setPlaybackRate(rate: number) {
      this.playerConfig.playbackRate = rate;
      this.readAloudRef && (this.readAloudRef.playbackRate = rate);
    },
    /**快进 */
    fastForward() {
      if (!this.readAloudRef || this.playerStatus !== 'play') {
        return;
      }
      this.readAloudRef.currentTime += 5;
    },
    /**快退 */
    fastRewind() {
      if (!this.readAloudRef || this.playerStatus !== 'play') {
        return;
      }
      this.readAloudRef.currentTime -= 5;
      if (this.readAloudRef.currentTime !== 0) {
        return;
      }
      if (this.currentChunkIndex > 0) {
        this.currentChunkIndex -= 1;
      } else {
        if (!this.audios[this.currentPlayIndex - 1]) {
          return;
        }
        this.currentChunkIndex = 0;
        this.currentPlayIndex -= 1;
      }
      this.removeReadAloudClass();
      this.audioPlay();
    },
    async getVoices() {
      try {
        const { readAloud } = useSettingsStore();
        const id = readAloud.use;
        const engine = GLOBAL_PLUGINS.getPluginInstanceById<TextToSpeechEngine>(id);
        if (!engine) {
          throw newError(`朗读引擎不存在或未启用, 插件ID:${id}`);
        }
        return await engine.getVoiceList();
      } catch (e) {
        GLOBAL_LOG.error('readAloud getVoices', e);
        return errorHandler(e);
      }
    },
  }
});