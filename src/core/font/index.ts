import { nanoid } from 'nanoid';
import { readFileSync } from 'fs';
import path from 'path';
import { errorHandler, newError } from '../utils';
import { isNull } from '../is';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../store/settings';

export class FontFamily {
  public readonly id: string;
  public readonly name: string;
  public readonly type: string;
  public readonly data: Uint8Array;

  constructor(name: string, type: string, data: Uint8Array, id?: string) {
    this.id = id ? id : nanoid();
    this.name = name;
    this.type = type;
    this.data = data;
  }

  toString() {
    if (this.data.byteLength <= 0) {
      throw newError('The data property has bytes length zero');
    }
    const base64 = `data:application/octet-stream;base64,${Buffer.from(this.data).toString('base64')}`;
    return `@font-face{font-family:'${this.id}';font-style:normal;font-display:auto;src:url('${base64}');}`;
  }
  toCSSBase64() {
    return Buffer.from(this.toString()).toString('base64');
  }
}

export class Font {
  public static readonly DEFAULT_FONT = 'HarmonyOS Sans SC';
  private readonly pool = new Map<string, string>();
  private useFontElement: HTMLStyleElement | null = null;
  private readStyle;

  constructor() {
    this.readStyle = storeToRefs(useSettingsStore()).readStyle;
  }

  public async use(id: string): Promise<void> {
    try {
      const font = await GLOBAL_DB.store.fontsStore.getById(id);
      if (isNull(font)) {
        throw newError('Getting a font by id is null');
      }
      const fontFamily = new FontFamily(font.name, font.type, font.data, font.id);
      const style = document.createElement('style');
      style.appendChild(document.createTextNode(`${fontFamily.toString()}`))
      document.head.appendChild(style);
      this.readStyle.value.fontFamily = font.id;
      this.unused();
      this.useFontElement = style;
    } catch (e) {
      GLOBAL_LOG.error(`Font use id:${id}`, e);
      return errorHandler(e);
    }
  }
  public unused() {
    if (!isNull(this.useFontElement)) {
      this.readStyle.value.fontFamily = '';
      this.useFontElement.remove();
      this.useFontElement = null;
    }
  }

  public async importPool(): Promise<void> {
    try {
      const all = await GLOBAL_DB.store.fontsStore.getAll();
      if (isNull(all)) {
        GLOBAL_LOG.warn('Font importPool all:', all);
        return;
      }
      for (const { id, name } of all) {
        this.pool.set(id, name);
      }
    } catch (e) {
      return errorHandler(e);
    }
  }

  public async importFontFile(filePath: string, fontName?: string): Promise<void> {
    try {
      const buf = readFileSync(filePath);
      !fontName && (fontName = path.basename(filePath));
      const id = nanoid();
      const type = path.extname(fontName);
      const name = fontName.replace(type, '');
      await GLOBAL_DB.store.fontsStore.put({
        id,
        name,
        type,
        data: new Uint8Array(buf)
      });
      this.pool.set(id, name);
    } catch (e) {
      GLOBAL_LOG.error(`Font importFontFile path:${filePath}, name:${fontName}`, e);
      return errorHandler(e);
    }
  }
}