<script setup lang="ts">
import { useSettingsStore } from '../../store/settings';
import { nanoid } from 'nanoid';
import { useShowMenu } from './hooks/show';
import { useWindowStore } from '../../store/window';
import { storeToRefs } from 'pinia';

export type MenuProps = {
  /**触发元素CSS选择器, 在哪个元素右击显示菜单则填写这个元素CSS选择器 */
  trigger: string
  /**禁止 */
  disabled: boolean
  className?: string
}
const { options } = useSettingsStore();
const props = defineProps<MenuProps>();

const id = `menu-${nanoid(10)}`;

const { showMenu, onEnter } = useShowMenu(id, props);

const { transparentWindow } = storeToRefs(useWindowStore());
</script>
<script lang="ts">
export default {
  name: 'Menu'
}
</script>

<template>
  <Teleport to="body">
    <Transition @enter="onEnter"
      :enter-active-class="options.enableTransition ? 'animate__animated animate__bounceIn' : void 0"
      :leave-active-class="options.enableTransition ? 'animate__animated animate__zoomOutDown' : void 0">
      <div v-memo="[showMenu]" v-show="showMenu" :id="id" :class="[
        'menu-container',
        'app-no-drag',
        options.enableBlur ? 'app-blur' : '',
        className ? className : ''
      ]" :style="{
        backgroundColor: options.enableBlur && !transparentWindow ? 'var(--rc-menu-window-box-blur-bgcolor)' : 'var(--rc-window-box-bgcolor)'
      }">
        <div :class="['rc-scrollbar', options.enableTransition ? 'rc-scrollbar-behavior' : '']">
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.menu-container {
  position: absolute;
  padding: 5px 0 5px 5px;
  border-radius: 8px;
  box-shadow: var(--rc-window-box-shadow);
  z-index: 998;
  --animate-duration: 0.4s;
  --animate-delay: 0.4s;
  --animate-repeat: 0.5;

  div {
    padding-right: 5px;
    max-height: 550px;
  }
}
</style>