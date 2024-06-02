import { computed, Ref, ref } from 'vue';
import { Font, FontData } from '../../../../../core/font';
import { WindowEvent } from '../../../../window/index.vue';
import { useMessage } from '../../../../../hooks/message';
import { isUndefined } from '../../../../../core/is';

export const useFonts = (win: Ref<WindowEvent | undefined>, query: Ref<string>) => {
  const systemFonts = ref<FontData[]>([]);
  const isLoading = ref(false);
  const isPinFontWindow = ref(false);
  const message = useMessage();

  const showValue = computed(() => {
    if (!query.value.trim()) {
      return [...systemFonts.value, Font.default].sort((a, b) => {
        return a.family[0].toLowerCase().charCodeAt(0) - b.family[0].toLowerCase().charCodeAt(0);
      });
    }
    return [...systemFonts.value, Font.default].filter(v => {
      return (
        v.family.toLowerCase().includes(query.value.toLowerCase().trim()) ||
        v.fullName.toLowerCase().includes(query.value.toLowerCase().trim())
      );
    }).sort((a, b) => {
      return a.family[0].toLowerCase().charCodeAt(0) - b.family[0].toLowerCase().charCodeAt(0);
    });
  });

  const openFontSelectWindow = () => {
    if (win.value?.isShow()) {
      return;
    }
    win.value?.show();
    if (isLoading.value) {
      return;
    }
    isLoading.value = true;
    Font.getSystemFonts()
      .then(fonts => systemFonts.value = fonts)
      .catch(e => {
        message.error(e.message);
      })
      .finally(() => {
        isLoading.value = false;
        const el = win.value?.el();
        if (!el) {
          return;
        }
        const oTop = el.querySelector<HTMLElement>('.select-font')?.offsetTop;
        if (isUndefined(oTop)) {
          return;
        }
        const list = el.querySelector<HTMLElement>('.fonts-list');
        list && (list.scrollTop = oTop - list.clientHeight / 3);
      });
  }

  const use = (font: FontData) => {
    Font.use(font);
    !isPinFontWindow.value && win.value?.hide();
  }

  return {
    showValue,
    isLoading,
    openFontSelectWindow,
    use,
    isPinFontWindow
  }
}