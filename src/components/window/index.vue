<script setup lang="ts">
import { nanoid } from 'nanoid';
import { useSettingsStore } from '../../store/settings';
import { useShowWindow } from './hooks/show';
import { useHandlerProps } from './hooks/handler-props.ts';
import { useDelayHide } from '../../hooks/delay-hide';
export interface WindowEvent {
  show: () => void
  hide: () => void
  isShow: () => boolean
}
export type WindowSize = {
  width: string,
  height: string
}

export type WindowProps = {
  top?: number | string,
  left?: number | string,
  width?: number | string,
  height?: number | string,
  backgroundColor?: string,
  className?: string,
  toBody?: boolean,
  centerX?: boolean,
  centerY?: boolean,
  clickHide?: boolean,
  zIndex?: number,
  destroyOnClose?: boolean,
  disableBlur?: boolean,
  isLoading?: boolean,
}

const emits = defineEmits<{
  event: [winEvent: WindowEvent]
}>();

const id = `window-${nanoid(10)}`;

const props = withDefaults(defineProps<WindowProps>(), {
  top: 5,
  left: -1,
  width: 400,
  height: 500,
  destroyOnClose: false,
  toBody: true,
  centerX: false,
  centerY: false,
  clickHide: true,
  zIndex: 999,
  disableBlur: false,
  isLoading: false
});
const { options } = useSettingsStore();
const {
  _top,
  _left,
  _width,
  _height,
  _backgroundColor,
  _className,
  _toBody,
} = useHandlerProps(props);

const { showWindow } = useShowWindow(id, props);

emits('event', {
  show: () => showWindow.value = true,
  hide: () => showWindow.value = false,
  isShow: () => showWindow.value
});


const { delayShow, stop } = useDelayHide(showWindow);
if (!props.destroyOnClose) {
  stop();
}
</script>
<script lang="ts">
export default {
  name: 'Window'
}
</script>
<template>
  <Teleport to="body" :disabled="!_toBody">
    <Transition :enter-active-class="options.enableTransition ? 'animate__animated animate__bounceIn' : void 0"
      :leave-active-class="options.enableTransition ? 'animate__animated animate__zoomOutDown' : void 0">
      <div v-loading="isLoading" v-show="showWindow" :id="id" :class="[
        'window',
        'app-no-drag',
        _className,
        !disableBlur && options.enableBlur ? 'app-blur' : ''
      ]">
        <template v-if="destroyOnClose">
          <slot v-if="delayShow" />
        </template>
        <template v-else>
          <slot />
        </template>
      </div>
    </Transition>
  </Teleport>

</template>
<style scoped lang="scss">
.window {
  position: absolute;
  top: v-bind(_top);
  left: v-bind(_left);
  width: v-bind(_width);
  height: v-bind(_height);
  border-radius: 10px;
  background-color: v-bind(_backgroundColor);
  box-shadow: var(--rc-window-box-shadow);
  z-index: v-bind(zIndex);
  overflow: hidden;
  --animate-duration: 0.5s;
  --animate-delay: 0.3s;
  --animate-repeat: 0.5;
}
</style>