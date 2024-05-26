import { ref, watch, watchEffect } from 'vue';
import { WindowProps } from '../index.vue';
import { isNumber, isUndefined } from '../../../core/is';
import { useSettingsStore } from '../../../store/settings';
import { handlerVueProp } from '../../../core/utils';
import { useWindowStore } from '../../../store/window';

export const useHandlerProps = (props: WindowProps) => {
  const _top = ref('');
  const _left = ref('');
  const _width = ref('');
  const _height = ref('');
  const _backgroundColor = ref('');
  const _className = ref('');
  const _toBody = ref(isUndefined(props.toBody) ? true : props.toBody);
  const _centerX = ref(Boolean(props.centerX));
  const _centerY = ref(Boolean(props.centerY));

  const { options, window } = useSettingsStore();
  const win = useWindowStore();

  const handlerLeft = (left?: number | string) => {
    if (isUndefined(left)) {
      return '';
    }
    if (isNumber(left)) {
      return left >= 0 ? `${left}px` : '';
    }
    return handlerVueProp(left, '');
  }

  watch(() => props, newVal => {
    const { top, left, width, height, className } = newVal;
    _width.value = handlerVueProp(width, '400px');
    _height.value = handlerVueProp(height, '500px');
    _top.value = _centerY.value ? `calc((100% - ${_height.value}) / 2)` : handlerVueProp(top, '5px');
    _left.value = _centerX.value ? `calc((100% - ${_width.value}) / 2)` : handlerLeft(left);
    _className.value = isUndefined(className) ? '' : className;
    _toBody.value = !!newVal.toBody;
  }, {
    immediate: true,
    deep: true
  });
  watchEffect(() => {
    if (!options.enableBlur || props.disableBlur || (win.transparentWindow && window.opacity < 1)) {
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
    _left,
    _width,
    _height,
    _toBody,
    _backgroundColor,
    _className,
    _centerX,
    _centerY
  }
}