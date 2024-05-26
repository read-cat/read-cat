import { isUndefined } from '../is';
import { cloneByJSON } from '../utils';

export type BookmarkColor = {
  odd: string
  even: string
}
export enum BackgroundSize {
  COVER = 'cover',
  CONTAIN = 'contain',
  STRETCH = '100% 100%'
}
export type BackgroundBlur = 'light' | 'dark';
export type BackgroundImage = {
  size: BackgroundSize
  /**图片Base64值 */
  image: string
  blur?: BackgroundBlur
}

export type ReadBackground = {
  id: string,
  name: string,
  backgroundColor: string,
  textColor: string,
  bookmarkColor: BookmarkColor,
  readAloudColor: string,
  backgroundImage?: BackgroundImage,
  isDev?: boolean
}
export class DefaultReadColor {
  static readonly GREEN_QINGCAO: ReadBackground = {
    id: 'VzeCYARdfw_V4STDOPqaN',
    name: '青草绿',
    backgroundColor: '#E3EDCD',
    textColor: '#324F00',
    bookmarkColor: {
      odd: '#00912C',
      even: 'currentColor'
    },
    readAloudColor: '#009966'
  }
  static readonly GREEN_HUYAN: ReadBackground = {
    id: 'q5ASQqYHRHE8ZfmrqTd2t',
    name: '护眼绿',
    backgroundColor: '#5A8F60',
    textColor: '#2D2D2D',
    bookmarkColor: {
      odd: '#1C1649',
      even: 'currentColor'
    },
    readAloudColor: '#0F3970'
  }
  static readonly YELLOW_XINGREN: ReadBackground = {
    id: 'WwQheXytBQkPmVrPZyNMB',
    name: '杏仁黄',
    backgroundColor: '#FAF9DE',
    textColor: '#2D2D2D',
    bookmarkColor: {
      odd: '#C8B82E',
      even: 'currentColor'
    },
    readAloudColor: '#6D9C00'
  }
  static readonly BROWN_QIUYE: ReadBackground = {
    id: 'TPBuWNSxY_PjjzD4OvJtW',
    name: '秋叶褐',
    backgroundColor: '#FFF2E2',
    textColor: '#2D2D2D',
    bookmarkColor: {
      odd: '#EF5A1A',
      even: 'currentColor'
    },
    readAloudColor: '#E34D9D'
  }
  static readonly RED_YANZHI: ReadBackground = {
    id: 'LddTKBJk0BpYZLeKZJqQQ',
    name: '胭脂红',
    backgroundColor: '#FDE6E0',
    textColor: '#2D2D2D',
    bookmarkColor: {
      odd: '#DE640D',
      even: 'currentColor'
    },
    readAloudColor: '#704DB5'
  }
  static readonly BLUE_HAITIAN: ReadBackground = {
    id: '97PsnTgv1awCwZZQbFilS',
    name: '海天蓝',
    backgroundColor: '#DCE2F1',
    textColor: '#2D2D2D',
    bookmarkColor: {
      odd: '#44B0DA',
      even: 'currentColor'
    },
    readAloudColor: '#43A3EF'
  }
  static readonly PURPLE_GEJIN: ReadBackground = {
    id: 'zaREtZXt1reKcxD6Wp3Ld',
    name: '葛巾紫',
    backgroundColor: '#E9EBFE',
    textColor: '#2D2D2D',
    bookmarkColor: {
      odd: '#8784E3',
      even: 'currentColor'
    },
    readAloudColor: '#DA70D6',
  }
  static readonly INK: ReadBackground = {
    id: 'RXwQ-iNXNG4HTYArytsVa',
    name: '水墨色',
    backgroundColor: '#BFC7CA',
    textColor: '#2C2A2F',
    bookmarkColor: {
      odd: '#B1600A',
      even: '#476B86'
    },
    readAloudColor: '#226A94'
  }

  private static readonly MAP = new Map<string, ReadBackground>();
  static {
    for (const key in DefaultReadColor) {
      const {
        id,
        name,
        textColor,
        backgroundColor,
        bookmarkColor,
        readAloudColor,
        backgroundImage,
        isDev,
      } = (<any>DefaultReadColor)[key];
      if (
        isUndefined(id) ||
        isUndefined(name) ||
        isUndefined(textColor) ||
        isUndefined(backgroundColor) ||
        isUndefined(bookmarkColor) ||
        isUndefined(readAloudColor)
      ) {
        break;
      }
      DefaultReadColor.MAP.set(id, {
        id,
        name,
        textColor,
        backgroundColor,
        bookmarkColor: structuredClone(bookmarkColor),
        readAloudColor,
        backgroundImage: backgroundImage ? cloneByJSON(backgroundImage) : void 0,
        isDev,
      });
    }
  }

  static get(id: string) {
    return DefaultReadColor.MAP.get(id);
  }
  static getAll() {
    return [...DefaultReadColor.MAP.values()];
  }
}