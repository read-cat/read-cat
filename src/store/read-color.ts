import { defineStore } from 'pinia';
import { DefaultReadColor, ReadBackground } from '../core/window/default-read-style';
import { cloneByJSON, errorHandler, isHexColor, newError, replaceInvisibleStr } from '../core/utils';
import { useSettingsStore } from './settings';
import { Core } from '../core';
import { base64ToBlob } from '../core/utils';
import { createHash } from 'crypto';

export type CustomReadColor = ReadBackground & {
  builtIn?: boolean
}

export const useReadColorStore = defineStore('ReadColor', {
  state: () => {
    return {
      customReadColor: [] as CustomReadColor[],
      imageMap: new Map<string, { md5: string, url: string, element: HTMLImageElement }>(),
    }
  },
  getters: {
    readColors(): CustomReadColor[] {
      return [...DefaultReadColor.getAll().map<CustomReadColor>(v => {
        return {
          ...v,
          builtIn: true
        }
      }).filter(v => {
        if (!v.isDev) {
          return true;
        }
        return Core.isDev;
      }), ...this.customReadColor];
    }
  },
  actions: {
    async put(color: ReadBackground): Promise<void> {
      try {
        if (this.customReadColor.length > 20) {
          throw newError('自定义样式已超过20个');
        }
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
        if (readStyle.background.id === _color.id) {
          readStyle.background = _color;
        }
        const i = this.customReadColor.findIndex(v => v.id === color.id);
        if (i > -1) {
          this.customReadColor[i] = _color;
        } else {
          this.customReadColor.push(_color);
        }
        if (!color.backgroundImage?.image) {
          return;
        }
        const old = this.imageMap.get(color.id);
        const md5 = createHash('md5').update(color.backgroundImage.image).digest('hex');
        if (old && old.md5 === md5) {
          return;
        }
        old && URL.revokeObjectURL(old.url);
        const url = URL.createObjectURL(base64ToBlob(color.backgroundImage.image));
        const element = new Image();
        element.src = url;
        this.imageMap.set(color.id, {
          md5,
          url,
          element
        });
      } catch (e: any) {
        return errorHandler(e);
      }
    },
    async remove(id: string) {
      try {
        const { readStyle } = useSettingsStore();
        if (readStyle.background.id === id) {
          throw newError('当前颜色正在使用');
        }
        const i = this.customReadColor.findIndex(v => v.id === id);
        if (i > -1) {
          this.customReadColor.splice(i, 1);
        }
        const img = this.imageMap.get(id);
        if (img) {
          URL.revokeObjectURL(img.md5);
          this.imageMap.delete(id);
        }
        await GLOBAL_DB.store.readColorStore.remove(id);
      } catch (e: any) {
        return errorHandler(e);
      }
    }
  }
});