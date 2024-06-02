import { nextTick, reactive, ref, watch } from 'vue';
import { WindowEvent } from '../../window/index.vue';
import { useReadAloudStore } from '../../../store/read-aloud';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../store/window';
import { useTextContentStore } from '../../../store/text-content';
import { useMessage } from '../../../hooks/message';
import { Voice } from '../../../core/plugins/defined/ttsengine';
import { useSettingsStore } from '../../../store/settings';
import { PagePath } from '../../../core/window';

export const useReadAloud = () => {
  const { setPlaybackRate, play, pause, stop, fastForward, fastRewind: fastRewind, getVoices } = useReadAloudStore();
  const { playerStatus, readAloudRef, transformStatus, isSelectPlay, currentPlayIndex, currentVoice } = storeToRefs(useReadAloudStore());
  const win = useWindowStore();
  const { readAloud } = useSettingsStore();
  const textContentStore = useTextContentStore();
  const { currentChapter } = storeToRefs(textContentStore);
  const readAloudPlayerWindow = ref<WindowEvent>();
  const readAloudPlayerWindowConfig = reactive({
    x: 0,
    y: 0,
    width: 270,
    height: 40
  });
  const readAloudPlaybackRates = [0.5, 0.7, 1, 1.2, 1.5, 1.7, 2, 3, 4, 8, 16];
  const readAloudPlaybackRate = ref(1);
  const readAloudVoices = ref<[string, Voice[]]>(['', []]);
  const readAloudVoicesWindow = ref<WindowEvent>();
  const isPin = ref(false);
  const isRefreshReadAloudVoices = ref(false);
  const message = useMessage();

  const showReadAloudPlayerWindow = (e: MouseEvent) => {
    const { offsetLeft, offsetTop, clientWidth, clientHeight } = <HTMLButtonElement>e.currentTarget;
    let x = offsetLeft - ((readAloudPlayerWindowConfig.width - clientWidth) / 2);
    let y = offsetTop + clientHeight;
    if (x + readAloudPlayerWindowConfig.width >= window.innerWidth) {
      x = window.innerWidth - readAloudPlayerWindowConfig.width - 10;
    }
    readAloudPlayerWindowConfig.x = x;
    readAloudPlayerWindowConfig.y = y + 10;
    readAloudPlayerWindow.value?.show();
  }

  watch(() => [win.currentPath, currentChapter.value], () => {
    pause();
  });

  const readAloudPlaybackRateChange = () => {
    setPlaybackRate(readAloudPlaybackRate.value);
  }

  const readAloudPlay = (start?: number) => {
    cancelSelectPlay();
    play(start).catch(e => message.error(e.message));
  }

  const contentLineClick = (e: MouseEvent) => {
    cancelSelectPlay();
    let target = <HTMLElement>(e.currentTarget);
    if (playerStatus.value !== 'pause') {
      return;
    }
    const { index } = target.dataset;
    if (!index) {
      return;
    }
    stop();
    readAloudPlay(Number(index));
  }

  const selectPlay = () => {
    if (playerStatus.value !== 'pause') {
      message.warning('正在朗读中, 请暂停或停止后重新尝试');
      return;
    }
    if (isSelectPlay.value) {
      cancelSelectPlay();
      return;
    }
    isSelectPlay.value = true;
    document.querySelectorAll<HTMLElement>('#text-content div[data-index]')
      .forEach(e => e.addEventListener('click', contentLineClick));
  }
  const cancelSelectPlay = () => {
    isSelectPlay.value = false;
    document.querySelectorAll<HTMLElement>('#text-content div[data-index]')
      .forEach(e => e.removeEventListener('click', contentLineClick));
  }

  textContentStore.on('chapterchange', () => {
    if (!isSelectPlay.value) {
      return;
    }
    document.querySelectorAll<HTMLElement>('#text-content div[data-index]')
      .forEach(e => e.addEventListener('click', contentLineClick));
  });

  watch(() => readAloudPlayerWindow.value?.isShow(), is => {
    if (is) {
      if (readAloud.use === readAloudVoices.value[0] && readAloudVoices.value[1].length > 0) {
        return;
      }
      refreshReadAloudVoices(true).finally(() => {
        const voice = readAloudVoices.value[1][0];
        voice && (currentVoice.value = voice);
      });
    } else {
      setTimeout(cancelSelectPlay, 300);
    }
  });

  win.addEventListener('inited', () => {
    watch(() => readAloud.use, () => {
      currentVoice.value = void 0;
      refreshReadAloudVoices(true).finally(() => {
        const voice = readAloudVoices.value[1][0];
        voice && (currentVoice.value = voice);
      });
    });
  });

  const refreshReadAloudVoices = async (ignoreError = false) => {
    if (isRefreshReadAloudVoices.value) {
      return;
    }
    try {
      isRefreshReadAloudVoices.value = true;
      const voices = await getVoices();
      if (voices.length > 0) {
        readAloudVoices.value[0] = readAloud.use;
        readAloudVoices.value[1] = voices;
      }
    } catch (e: any) {
      !ignoreError && message.error(e.message);
    } finally {
      isRefreshReadAloudVoices.value = false;
    }
  }

  const showReadAloudVoicesWindow = () => {
    readAloudVoicesWindow.value?.show();
    nextTick(() => {
      const ul = readAloudVoicesWindow.value?.el()?.querySelector<HTMLElement>('ul');
      const li = ul?.querySelector<HTMLElement>('li.select-voice');
      if (!ul || !li) {
        return;
      }
      ul.scrollTop = li.offsetTop - li.clientHeight;
    });
  }

  const selectReadAloudVoice = (voice: Voice) => {
    if (currentVoice.value?.name === voice.name) {
      return;
    }
    currentVoice.value = voice;
    if (playerStatus.value === 'pause') {
      stop();
      return;
    }
    const start = currentPlayIndex.value < 0 ? 0 : currentPlayIndex.value;
    stop();
    readAloudPlay(start);
  }

  watch(() => win.currentPath, newVal => {
    if (newVal !== PagePath.READ) {
      isPin.value = false;
      readAloudPlayerWindow.value?.hide();
    }
  });

  return {
    readAloudPlayerWindow,
    showReadAloudPlayerWindow,
    readAloudPlayerWindowConfig,
    readAloudPlaybackRates,
    readAloudPlaybackRate,
    readAloudPlaybackRateChange,
    readAloudStatus: playerStatus,
    readAloudRef,
    readAloudPlay,
    readAloudPause: pause,
    readAloudStop: stop,
    readAloudFastForward: fastForward,
    readAloudFastRewind: fastRewind,
    readAloudTransformStatus: transformStatus,
    readAloudSelectPlay: selectPlay,
    readAloudIsSelectPlay: isSelectPlay,
    readAloudCurrentVoice: currentVoice,
    refreshReadAloudVoices,
    readAloudVoicesWindow,
    showReadAloudVoicesWindow,
    readAloudVoices,
    selectReadAloudVoice,
    readAloudIsPin: isPin,
    isRefreshReadAloudVoices
  }
}