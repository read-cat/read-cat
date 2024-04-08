import { defineStore } from 'pinia';
import { PagePath } from '../core/window';



export const useScrollTopStore = defineStore('ScrollTop', {
  state: () => {
    return {
      value: {
        '/home': 0,
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
    mainElement(): HTMLElement | null {
      return document.getElementById('main');
    }
  },
  actions: {
    setScrollTop(path: PagePath, value: number) {
      this.value[path] = value;
    },
    scrollTop(value: number) {
      this.mainElement && (this.mainElement.scrollTop = value);
    },
    pageScrollTop(path: PagePath) {
      this.mainElement && (this.mainElement.scrollTop = this.value[path]);
    }
  }
});