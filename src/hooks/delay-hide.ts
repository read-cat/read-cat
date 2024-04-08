import { isRef, Ref, ref, watchEffect } from 'vue';

export const useDelayHide = (show: Ref<boolean> | (() => boolean)) => {
  const delayShow = ref(false);
  let timeout: NodeJS.Timeout;

  let onbeforehide: (() => void) | undefined = void 0;
  let onshowed: (() => void) | undefined = void 0;

  const onBeforeHide = (callback: () => void) => {
    onbeforehide = callback;
  }
  const onShowed = (callback: () => void) => {
    onshowed = callback;
  }

  const w = watchEffect(() => {
    clearTimeout(timeout);
    const isShow = isRef(show) ? show.value : show();
    if (isShow) {
      delayShow.value = isShow;
      onshowed && onshowed();
      return;
    }
    timeout = setTimeout(() => {
      onbeforehide && onbeforehide();
      delayShow.value = isShow;
    }, 350);
  });

  const stop = () => {
    clearTimeout(timeout);
    w();
  }
  return {
    delayShow,
    onBeforeHide,
    onShowed,
    stop
  }
}