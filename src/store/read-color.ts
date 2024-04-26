import { defineStore } from 'pinia';
import { DefaultReadColor, ReadColor } from '../core/window/default-read-style';
import { cloneByJSON, errorHandler, isHexColor, newError, replaceInvisibleStr } from '../core/utils';
import { useSettingsStore } from './settings';

export type CustomReadColor = ReadColor & {
  builtIn?: boolean
}

export const useReadColorStore = defineStore('ReadColor', {
  state: () => {
    return {
      customReadColor: [] as CustomReadColor[]
    }
  },
  getters: {
    readColors(): CustomReadColor[] {
      return [...DefaultReadColor.getAll().map<CustomReadColor>(v => {
        return {
          ...v,
          builtIn: true
        }
      }), ...this.customReadColor];
    }
  },
  actions: {
    async put(color: ReadColor): Promise<void> {
      try {
        const _color = replaceInvisibleStr(cloneByJSON(color));
        if (!_color.id) {
          throw newError('id为空');
        }
        if (!_color.name) {
          throw newError('name为空');
        }
        if (!_color.backgroundColor) {
          throw newError('backgroundColor为空');
        }
        if (!isHexColor(_color.backgroundColor)) {
          throw newError('backgroundColor不是十六进制颜色值');
        }
        if (!_color.textColor) {
          throw newError('textColor为空');
        }
        if (!isHexColor(_color.textColor)) {
          throw newError('textColor不是十六进制颜色值');
        }
        if (!_color.bookmarkColor.odd) {
          throw newError('bookmarkColorOdd为空');
        }
        if (!isHexColor(_color.bookmarkColor.odd)) {
          throw newError('bookmarkColorOdd不是十六进制颜色值');
        }
        if (!_color.bookmarkColor.even) {
          throw newError('bookmarkColorEven为空');
        }
        if (!isHexColor(_color.bookmarkColor.even)) {
          throw newError('bookmarkColorEven不是十六进制颜色值');
        }
        if (!_color.readAloudColor) {
          throw newError('readAloudColor为空');
        }
        if (!isHexColor(_color.readAloudColor)) {
          throw newError('readAloudColor不是十六进制颜色值');
        }
        await GLOBAL_DB.store.readColorStore.put(color);
        const { readStyle } = useSettingsStore();
        if (readStyle.color.id === _color.id) {
          readStyle.color = _color;
        }
        const i = this.customReadColor.findIndex(v => v.id === color.id);
        if (i > -1) {
          this.customReadColor[i] = _color;
        } else {
          this.customReadColor.push(_color);
        }
      } catch (e: any) {
        return errorHandler(e);
      }
    },
    async remove(id: string) {
      try {
        const { readStyle } = useSettingsStore();
        if (readStyle.color.id === id) {
          throw newError('当前颜色正在使用');
        }
        const i = this.customReadColor.findIndex(v => v.id === id);
        if (i > -1) {
          this.customReadColor.splice(i, 1);
        }
        await GLOBAL_DB.store.readColorStore.remove(id);
      } catch (e: any) {
        return errorHandler(e);
      }
    }
  }
});