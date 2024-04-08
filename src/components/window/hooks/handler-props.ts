import { ref, watch, watchEffect } from 'vue';
import { WindowProps } from '../index.vue';
import { isNumber, isString, isUndefined } from '../../../core/is';
import { useSettingsStore } from '../../../store/settings';

export const useHandlerProps = (props: WindowProps) => {
  const _top = ref('');
  const _width = ref('');
  const _height = ref('');
  const _backgroundColor = ref('');
  const _className = ref('');
  const _toBody = ref(isUndefined(props.toBody) ? true : props.toBody);
  const _center = ref(Boolean(props.center));

  const { options } = useSettingsStore();
  const handler = (val: any, defaultVal: string) => {
    if (isNumber(val)) {
      return `${val}px`;
    }
    if (isString(val)) {
      return /\d$/.test(val) ? `${val}px` : val;
    }
    return defaultVal;
  }

  watch(() => props, newVal => {
    const { top, width, height, className } = newVal;
    _width.value = handler(width, '400px');
    _height.value = handler(height, '500px');
    _top.value = _center.value ? `calc((100% - ${_height.value}) / 2)` : handler(top, '5px');
    _className.value = isUndefined(className) ? '' : className;
  }, {
    immediate: true,
    deep: true
  });
  watchEffect(() => {
    if (!options.enableBlur || props.disableBlur) {
      _backgroundColor.value = 'var(--rc-window-box-bgcolor)';
      return;
    }
    if (props.backgroundColor) {
      _backgroundColor.value = props.backgroundColor;
      return;
    }
    _backgroundColor.value = 'var(--rc-window-box-blur-bgcolor)';
  });

  return {
    _top,
    _width,
    _height,
    _toBody,
    _backgroundColor,
    _className,
    _center
  }
}