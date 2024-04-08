import { onMounted, onUnmounted, ref } from 'vue';
import { WindowProps } from '../index.vue';

export const useShowWindow = (id: string, props: WindowProps) => {
  const showWindow = ref(false);
  const onMousedown = (e: MouseEvent) => {
    if (!props.clickHide) {
      return;
    }
    let p = <HTMLElement | null>e.target;
    if (!p) {
      return;
    }
    do {
      if (p.id === id) {
        return;
      }
      p = p.parentElement;
    } while (p);
    showWindow.value = false;
  }
  onMounted(() => {
    document.addEventListener('mousedown', onMousedown);
  });
  onUnmounted(() => {
    document.removeEventListener('mousedown', onMousedown);
  });

  return {
    showWindow
  }
}