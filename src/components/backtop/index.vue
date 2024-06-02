<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { handlerVueProp, newError } from '../../core/utils';
import { useSettingsStore } from '../../store/settings';
import { useScrollTopStore } from '../../store/scrolltop';
import { storeToRefs } from 'pinia';
import { useWindowStore } from '../../store/window';
import { PagePath } from '../../core/window';
import IconTriangle from '../../assets/svg/icon-triangle.svg';

const props = withDefaults(defineProps<{
  target: string
  visibilityHeight?: number
  right?: number | string
  bottom?: number | string
}>(), {
  visibilityHeight: 500,
  right: 50,
  bottom: 50
});

const { options } = useSettingsStore();

const _right = computed(() => handlerVueProp(props.right, '50px'));
const _bottom = computed(() => handlerVueProp(props.bottom, '50px'));
const _backgroundColor = computed(() => {
  if (!options.enableBlur) {
    return 'var(--rc-window-box-bgcolor)';
  }
  return 'var(--rc-window-box-blur-bgcolor)';
});

const show = ref(false);

const scroll = (e: Event) => {
  const target = <HTMLElement>e.target;
  const height = document.querySelector('.scroll-top-to-prev-chapter')?.clientHeight || 0;
  if (target.scrollTop - height >= props.visibilityHeight) {
    show.value = true;
  } else {
    show.value = false;
  }
}

onMounted(() => {
  const target = document.querySelector<HTMLElement>(props.target);
  if (!target) {
    throw newError(`No elements found, selector:${props.target}`);
  }
  target.addEventListener('scroll', scroll);
});
onUnmounted(() => {
  const target = document.querySelector<HTMLElement>(props.target);
  target?.removeEventListener('scroll', scroll);
});

const { scrollToTextContent } = useScrollTopStore();
const { currentPath } = storeToRefs(useWindowStore());
const scrollTop = () => {
  const target = document.querySelector<HTMLElement>(props.target);
  if (!target) {
    throw newError(`No elements found, selector:${props.target}`);
  }
  if (currentPath.value === PagePath.READ) {
    scrollToTextContent(target, void 0, true);
  } else {
    target.scrollTop = 0;
  }
}

</script>
<script lang="ts">
export default {
  name: 'Backtop'
}
</script>

<template>
  <Teleport to="body">
    <Transition :enter-active-class="options.enableTransition ? 'animate__animated animate__fadeIn' : void 0"
      :leave-active-class="options.enableTransition ? 'animate__animated animate__fadeOut' : void 0">
      <div v-show="show" :class="[
        'backtop',
        options.enableBlur ? 'app-blur' : ''
      ]" @click="scrollTop" title="回到顶部">
          <IconTriangle />
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.backtop {
  position: absolute;
  right: v-bind(_right);
  bottom: v-bind(_bottom);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: v-bind(_backgroundColor);
  color: var(--rc-theme-color);
  border-radius: 100%;
  cursor: pointer;
  box-shadow: var(--el-box-shadow-light);
  --animate-duration: 0.3s;
  --animate-delay: 0.3s;
  --animate-repeat: 0.3;
  transition: all 0.3s ease;

  svg {
    transition: all .3s ease;
  }
  &:hover {
    svg {
      transform: scale(1.15);
    }
  }
  &:active {
    transform: scale(0.95);
  }
}
</style>