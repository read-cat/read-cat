import { defineStore } from 'pinia';
import { PagePath } from '../core/window';
import { isUndefined } from '../core/is';
import { nextTick } from 'vue';
import { useDetailStore } from './detail';
import { useTextContentStore } from './text-content';



export const useScrollTopStore = defineStore('ScrollTop', {
  state: () => {
    return {
      value: {
        '/bookshelf': 0,
        '/bookstore': 0,
        '/read': 0,
        '/history': 0,
        '/settings': 0,
        '/detail': 0
      } as Record<string, number>,
    }
  },
  getters: {
    mainElement(): HTMLElement {
      return <HTMLElement>document.getElementById('main');
    }
  },
  actions: {
    setScrollTop(path: PagePath, value: number) {
      this.value[path] = value;
    },
    scrollTop(value: number, behavior?: ScrollBehavior) {
      this.mainElement.scrollTo({
        top: value,
        behavior
      });
    },
    pageScrollTop(path: PagePath) {
      this.mainElement.scrollTop = this.value[path];
    },
    textContentOffsetTop() {
      const e = document.querySelector<HTMLElement>('#text-content');
      return isUndefined(e?.offsetTop) ? 0 : e.offsetTop;
    },
    scrollToTextContent(target?: HTMLElement, behavior?: ScrollBehavior, toTop = false) {
      nextTick(() => {
        const { currentReadScrollTop } = useDetailStore();
        const { currentChapter } = useTextContentStore();
        let top = this.textContentOffsetTop();
        if (!toTop && currentReadScrollTop.chapterIndex === currentChapter?.index) {
          currentReadScrollTop.scrollTop > 0 && (top = currentReadScrollTop.scrollTop);
        }
        const ele = target || this.mainElement;
        ele.scrollTo({
          top,
          behavior
        });
      });
    }
  }
});