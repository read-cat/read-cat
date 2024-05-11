import { reactive, ref, watch } from 'vue';
import { WindowEvent } from '../../window/index.vue';
import { useReadAloudStore } from '../../../store/read-aloud';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../../store/window';
import { useTextContentStore } from '../../../store/text-content';

export const useReadAloud = () => {
  const { setPlaybackRate, play, pause, stop, fastForward, fastReverse } = useReadAloudStore();
  const { isPlay, readAloudRef } = storeToRefs(useReadAloudStore());
  const win = useWindowStore();
  const { currentChapter } = storeToRefs(useTextContentStore());
  const readAloudPlayerWindow = ref<WindowEvent>();
  const readAloudPlayerWindowConfig = reactive({
    x: 0,
    y: 0,
    width: 200,
    height: 35
  });
  const readAloudPlaybackRates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 3, 4, 8, 16];
  const readAloudPlaybackRate = ref(1);

  const showReadAloudPlayerWindow = (e: MouseEvent) => {
    const { offsetLeft, offsetTop, clientWidth, clientHeight } = <HTMLButtonElement>e.currentTarget;
    const x = offsetLeft - ((readAloudPlayerWindowConfig.width - clientWidth) / 2);
    const y = offsetTop + clientHeight;
    readAloudPlayerWindowConfig.x = x;
    readAloudPlayerWindowConfig.y = y + 10;
    readAloudPlayerWindow.value?.show();
  }

  const readAloudPlaybackRateChange = () => {
    setPlaybackRate(readAloudPlaybackRate.value);
  }

  watch(() => [win.currentPath, currentChapter.value], () => {
    pause();
  });

  return {
    readAloudPlayerWindow,
    showReadAloudPlayerWindow,
    readAloudPlayerWindowConfig,
    readAloudPlaybackRates,
    readAloudPlaybackRate,
    readAloudPlaybackRateChange,
    readAloudIsPlay: isPlay,
    readAloudRef,
    readAloudPlay: play,
    readAloudPause: pause,
    readAloudStop: stop,
    readAloudFastForward: fastForward,
    readAloudFastReverse: fastReverse,
  }
}