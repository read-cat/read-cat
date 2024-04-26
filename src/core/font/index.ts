import { useSettingsStore } from '../../store/settings';

export type FontData = {
  family: string
  fullName: string
}

export class Font {
  constructor() {

  }

  static get default(): FontData {
    return {
      family: 'HarmonyOS Sans SC',
      fullName: 'HarmonyOS Sans SC'
    };
  }

  public static use(font: FontData) {
    useSettingsStore().setFont(font);
  }
  public static unused() {
    useSettingsStore().setFont(Font.default);
  }

  public static async getSystemFonts() {
    const fonts = (await queryLocalFonts()).map<FontData>(({ family, fullName }) => ({ family, fullName }));
    const arr = fonts.filter(f => f.family === f.fullName);
    for (const font of fonts) {
      if (arr.find(v => v.family === font.family)) {
        continue;
      }
      arr.push(font);
    }
    return arr;
  }
}