import { computed } from 'vue';
import { WindowProps } from '../index.vue';
import { isNumber, isUndefined } from '../../../core/is';
import { useSettingsStore } from '../../../store/settings';
import { handlerVueProp } from '../../../core/utils';
import { useWindowStore } from '../../../store/window';

export const useHandlerProps = (props: WindowProps) => {
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

  const _width = computed(() => handlerVueProp(props.width, '400px'));
  const _height = computed(() => handlerVueProp(props.height, '500px'));
  const _top = computed(() => props.centerY ? `calc((100% - ${_height.value}) / 2)` : handlerVueProp(props.top, '5px'));
  const _left = computed(() => props.centerX ? `calc((100% - ${_width.value}) / 2)` : handlerLeft(props.left));
  const _className = computed(() => props.className || '');
  const _toBody = computed(() => !!props.toBody);
  const _backgroundColor = computed(() => {
    if (!options.enableBlur || props.disableBlur || (win.transparentWindow && window.opacity < 1)) {
      return 'var(--rc-window-box-bgcolor)';
    }
    if (props.backgroundColor) {
      return props.backgroundColor;
    }
    return 'var(--rc-window-box-blur-bgcolor)';
  });
  const _centerX = computed(() => !!props.centerX);
  const _centerY = computed(() => !!props.centerY);

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