import { Ref, reactive, ref, watch, watchEffect } from 'vue';
import { useWindowStore } from '../../../store/window';
import { storeToRefs } from 'pinia';
import { useSettingsStore } from '../../../store/settings';
import { colorIsLight, getColorRGB } from '../../../core/utils';
import { PagePath } from '../../../core/window';
import { useSearchStore } from '../../../store/search';

export type SearchHeaderStyle = {
  borderColor: string,
  backgroundColor: string,
  color: string,
  boxBackgroundColor: string,
}

export const useSetSearchStyle = (searchkey: Ref<string>, progress: Ref<number>) => {
  const win = useWindowStore();
  const { options } = useSettingsStore();
  const { backgroundColor, textColor } = storeToRefs(useSettingsStore());
  const { isRunningSearch } = storeToRefs(useSearchStore());
  const searchStyle = reactive<SearchHeaderStyle>({
    borderColor: '',
    backgroundColor: '',
    color: '',
    boxBackgroundColor: '',
  });
  const key = ref('');
  const setSearchBoxBackgroundColor = (isDark: boolean) => {
    const root = document.querySelector<HTMLElement>(':root');
    let bgcolor = isDark ? '#1A1C1D' : '#FFFFFF';
    if (root) {
      bgcolor = getComputedStyle(root).getPropertyValue(`--rc-window-box-bgcolor-${isDark ? 'dark' : 'light'}`);
    }
    const brgb = getColorRGB(win.backgroundColor ? win.backgroundColor : bgcolor);
    if (options.enableBlur) {
      searchStyle.boxBackgroundColor = `rgba(${brgb[0]}, ${brgb[1]}, ${brgb[2]}, 0.6)`;
    } else {
      searchStyle.boxBackgroundColor = `rgb(${brgb[0]}, ${brgb[1]}, ${brgb[2]})`;
    }
  }
  const setColor = (rgb?: [number, number, number]) => {
    if (rgb) {
      const [r, g, b] = rgb;
      searchStyle.borderColor = `rgba(${r}, ${g}, ${b}, 0.3)`;
      searchStyle.backgroundColor = `rgba(${r}, ${g}, ${b}, 0.08)`;
      searchStyle.color = `rgb(${r}, ${g}, ${b})`;
      win.backgroundColor = backgroundColor.value;
      win.textColor = `rgb(${r}, ${g}, ${b})`;
    } else {
      searchStyle.borderColor = '';
      searchStyle.backgroundColor = '';
      searchStyle.color = '';
      searchStyle.boxBackgroundColor = '';
      win.backgroundColor = '';
      win.textColor = '';
    }
    setSearchBoxBackgroundColor(win.isDark);
  }
  const setBorderColor = (autoTextColor: boolean, backgroundColor: string) => {
    let r = 0, g = 0, b = 0;
    if (autoTextColor) {
      [r, g, b] = getColorRGB(backgroundColor);
      // 是否为浅色系
      const light = colorIsLight(r, g, b);

      const val = light ? 128 : (-128);
      r -= val;
      r = r < 0 ? 0 : (r > 255 ? 255 : r);
      g -= val;
      g = g < 0 ? 0 : (g > 255 ? 255 : g);
      b -= val;
      b = b < 0 ? 0 : (b > 255 ? 255 : b);
    } else {
      [r, g, b] = getColorRGB(textColor.value);
    }
    setColor([r, g, b]);
  }
  watch(() => searchkey.value, (newVal, _) => {
    const keys = newVal.split('&');
    key.value = keys[0].trim();
  });
  watch(() => win.currentPath, (newVal, _) => {
    if (newVal !== PagePath.READ) {
      setColor();
      return;
    }
    if (!win.isDark) {
      setBorderColor(options.enableAutoTextColor, backgroundColor.value);
    }
  }, {
    immediate: true
  });
  watchEffect(() => {
    if (win.currentPath !== PagePath.SEARCH) {
      win.searchBoxHeaderText = '搜索';
      return;
    }
    if (isRunningSearch.value) {
      progress.value = progress.value >= 1 ? 0 : progress.value;
      win.searchBoxHeaderText = `正在搜索(${progress.value * 100}%) ${key.value}`;
      return;
    }
    win.searchBoxHeaderText = key.value;
  });

  watch(() => win.isDark, (newVal, _) => {
    if (win.currentPath !== PagePath.READ || newVal) {
      setColor();
    } else {
      setBorderColor(options.enableAutoTextColor, backgroundColor.value);
    }
  }, {
    immediate: true
  });
  watchEffect(() => {
    if (win.currentPath === PagePath.READ && !win.isDark) {
      setBorderColor(options.enableAutoTextColor, backgroundColor.value);
    }
  });

  watch(() => options.enableBlur, () => {
    setSearchBoxBackgroundColor(win.isDark);
  });
  return {
    searchStyle
  }
}