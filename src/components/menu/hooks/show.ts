import { onMounted, onUnmounted, ref } from 'vue';
import { isNull } from '../../../core/is';
import { MenuProps } from '../index.vue';

export const useShowMenu = (id: string, props: MenuProps) => {
  const showMenu = ref(false);
  let mouseEvent: MouseEvent | null = null;
  const onEnter = (menu: Element) => {
    const currentTarget = <HTMLElement | null | undefined>mouseEvent?.currentTarget;
    if (isNull(mouseEvent) || !currentTarget) {
      return;
    }
    const { x, y } = mouseEvent;
    const tempX = currentTarget.clientWidth - (x + menu.clientWidth);
    const tempY = currentTarget.clientHeight - (y + menu.clientHeight);
    let left = tempX < 0 ? (x - menu.clientWidth) : x;
    let top = tempY < 0 ? (y - menu.clientHeight) : y;
    left = left < 10 ? 10 : left;
    top = top < 10 ? 10 : top;
    (<HTMLElement>menu).style.left = `${left}px`;
    (<HTMLElement>menu).style.top = `${top}px`;
  }

  const onContextmenu = (e: MouseEvent) => {
    if (props.disabled) {
      return;
    }
    mouseEvent = e;
    showMenu.value = true;
  }

  const onMousedown = (e: MouseEvent) => {
    let p = <HTMLElement | null>e.target;
    if (!p) {
      return;
    }
    
    //循环判断点击目标是否为本体
    do {
      //是本体, 取消隐藏
      if (p.id === id) {
        return;
      }
      p = p.parentElement;
    } while (p);
    showMenu.value = false;
  }

  const hide = () => {
    showMenu.value = false;
  }

  const addEventListener = () => {
    const triggerEle = document.querySelector<HTMLElement>(props.trigger);
    if (!triggerEle) {
      return;
    }
    triggerEle.addEventListener('contextmenu', onContextmenu);
    document.addEventListener('mousedown', onMousedown);
    //添加点击菜单项隐藏菜单事件
    document.querySelectorAll<HTMLElement>(`#${id} .menu-item`).forEach(e => {
      e.addEventListener('click', hide);
    });
  }
  const removeEventListener = () => {
    const triggerEle = document.querySelector<HTMLElement>(props.trigger);
    if (!triggerEle) {
      return;
    }
    triggerEle.removeEventListener('contextmenu', onContextmenu);
    document.removeEventListener('mousedown', onMousedown);
    document.querySelectorAll<HTMLElement>(`#${id} > .menu-item`).forEach(e => {
      e.removeEventListener('click', hide);
    });
  }
  onMounted(() => {
    addEventListener();
  });
  onUnmounted(() => {
    removeEventListener();
  });

  return {
    onEnter,
    showMenu,
    hide,
    addEventListener,
    removeEventListener
  }
}