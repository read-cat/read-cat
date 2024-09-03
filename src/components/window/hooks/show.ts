import { onUnmounted, ref, watch } from 'vue';
import { WindowProps } from '../index.vue';
import { isNull } from '../../../core/is';

export const useShowWindow = (id: string, props: WindowProps) => {
  const showWindow = ref(false);
  const onMousedown = (e: MouseEvent) => {
    if (!showWindow.value) {
      return;
    }
    let p = <HTMLElement | null>e.target;
    if (!p) {
      return;
    }
    do {
      const attr = p.getAttribute('disable-click-hide');
      const disable = isNull(attr) ? false : attr.trim() === '' ? true : Boolean(attr);
      if (p.id === id || disable) {
        return;
      }
      p = p.parentElement;
    } while (p);
    showWindow.value = false;
  }
  watch(() => props.clickHide, newVal => {
    if (newVal) {
      document.addEventListener('mousedown', onMousedown);
    } else {
      document.removeEventListener('mousedown', onMousedown);
    }
  }, { immediate: true });
  onUnmounted(() => {
    props.clickHide && document.removeEventListener('mousedown', onMousedown);
  });

  return {
    showWindow
  }
}