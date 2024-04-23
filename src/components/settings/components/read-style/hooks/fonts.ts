import { Ref, ref, watchEffect } from 'vue';
import { Font, FontData } from '../../../../../core/font';
import { WindowEvent } from '../../../../window/index.vue';
import { useMessage } from '../../../../../hooks/message';

export const useFonts = (win: Ref<WindowEvent | undefined>, query: Ref<string>) => {
  const systemFonts = ref<FontData[]>([]);
  const showValue = ref<FontData[]>([]);
  const isLoading = ref(false);
  const message = useMessage();

  watchEffect(() => {
    if (!query.value.trim()) {
      showValue.value = [...systemFonts.value, Font.default].sort((a, b) => {
        return a.family[0].toLowerCase().charCodeAt(0) - b.family[0].toLowerCase().charCodeAt(0);
      });
      return;
    }
    showValue.value = [...systemFonts.value, Font.default].filter(v => {
      return (
        v.family.toLowerCase().includes(query.value.toLowerCase().trim()) ||
        v.fullName.toLowerCase().includes(query.value.toLowerCase().trim())
      );
    }).sort((a, b) => {
      return a.family[0].toLowerCase().charCodeAt(0) - b.family[0].toLowerCase().charCodeAt(0);
    });
  });

  const openFontSelectWindow = () => {
    !win.value?.isShow() && win.value?.show();
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
      });
  }

  const use = (font: FontData) => {
    Font.use(font);
    win.value?.hide();
  }

  return {
    showValue,
    isLoading,
    openFontSelectWindow,
    use
  }
}